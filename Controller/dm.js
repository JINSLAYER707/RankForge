const express = require('express');
const dmRouter = express.Router();
const { User, Message, Group, GroupMessage } = require('../utils/db');

async function getConversations(userId) {
  const user = await User.findById(userId).populate('friends');
  const friends = user.friends;

  const conversations = await Promise.all(
    friends.map(async (friend) => {
      const lastMessage = await Message.findOne({
        $or: [
          { sender: userId, receiver: friend._id },
          { sender: friend._id, receiver: userId }
        ]
      }).sort({ timestamp: -1 });

      return {
        friendId: friend._id,
        friendName: friend.name,
        lastMessage
      };
    })
  );

  // Sort by latest message
  conversations.sort((a, b) => {
    if (!a.lastMessage) return 1;
    if (!b.lastMessage) return -1;
    return b.lastMessage.timestamp - a.lastMessage.timestamp;
  });

  return conversations;
}
async function getGroups(userId) {
  const groups = await Group.find({ members: userId }).lean();

  const groupsWithLastMessage = await Promise.all(
    groups.map(async (group) => {
      const lastMessage = await GroupMessage.findOne({ group: group._id })
        .sort({ createdAt: -1 })
        .populate('sender', 'name');

      return {
        ...group,
        lastMessage: lastMessage
          ? {
              message: lastMessage.message,
              senderName: lastMessage.sender.name,
              timestamp: lastMessage.createdAt
            }
          : null
      };
    })
  );

  groupsWithLastMessage.sort((a, b) => {
    if (!a.lastMessage) return 1;
    if (!b.lastMessage) return -1;
    return b.lastMessage.timestamp - a.lastMessage.timestamp;
  });

  return groupsWithLastMessage;
}

dmRouter.get('/message', async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) return res.status(401).send("Unauthorized");

    const [conversations, groups, user] = await Promise.all([
      getConversations(userId),
      getGroups(userId),
      User.findById(userId).populate('friends')
    ]);

    res.render('message', {
      conversations,
      groups,
      friends: user.friends, 
      messages: [],
      otherUser: null,
      groupChat: null,
      userId
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading messages");
  }
});


// ✅ Route: Specific chat
dmRouter.get('/message/:id', async (req, res) => {
  try {
    const userId = req.session.userId;
    const otherUserId = req.params.id;

    if (!userId) return res.status(401).send("Unauthorized");

    const [conversations, groups, messages, otherUser, user] =
      await Promise.all([
        getConversations(userId),
        getGroups(userId),
        Message.find({
          $or: [
            { sender: userId, receiver: otherUserId },
            { sender: otherUserId, receiver: userId }
          ]
        }).sort({ timestamp: 1 }),
        User.findById(otherUserId),
        User.findById(userId).populate('friends')
      ]);

    res.render('message', {
      conversations,
      groups,
      friends: user.friends,
      messages,
      otherUser,
      groupChat: null,
      userId
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching messages");
  }
});


// ✅ Route: Delete message
dmRouter.get('/delete/message/:id', async (req, res) => {
  try {
    const messageId = req.params.id;
    const userId = req.session.userId;

    if (!userId) return res.status(401).send("Unauthorized");

    const message = await Message.findById(messageId);

    if (!message) return res.status(404).send("Message not found");
    if (message.sender.toString() !== userId)
      return res.status(403).send("Not allowed");

    const otherUserId =
      message.sender.toString() === userId
        ? message.receiver.toString()
        : message.sender.toString();

    await Message.findByIdAndDelete(messageId);

    res.redirect(`/message/${otherUserId}`);

  } catch (err) {
    console.error(err);
    res.status(500).send("Error deleting message");
  }
});

dmRouter.get('/group/:groupId', async (req, res) => {
  try {
    const userId = req.session.userId;
    const groupId = req.params.groupId;

    if (!userId) return res.status(401).send("Unauthorized");

    const group = await Group.findById(groupId);

    // 🔥 SECURITY CHECK
    if (!group.members.includes(userId)) {
      return res.status(403).send("Not allowed");
    }

    const [conversations, groups, messages, user] = await Promise.all([
      getConversations(userId),
      getGroups(userId),
      GroupMessage.find({ group: groupId })
        .sort({ createdAt: 1 })
        .populate('sender', 'name'),
      User.findById(userId).populate('friends')
    ]);

    res.render('message', {
      conversations,
      groups,
      friends: user.friends,
      messages,
      otherUser: null,
      groupChat: group, 
      userId
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading group chat");
  }
});

dmRouter.post('/groups/create', async (req, res) => {
  try {
    const userId = req.session.userId;
    const { name, members } = req.body;

    if (!userId) return res.status(401).json({ success: false });

    const group = await Group.create({
      name,
      members: [...members, userId]
    });

    res.json({ success: true, group });

  } catch (err) {
    console.error(err);
    res.json({ success: false });
  }
});

module.exports = { dmRouter };