const express = require("express");
const ThreadRouter = express.Router();

const { Thread, ThreadReply, User } = require("../utils/db");

ThreadRouter.get("/contest/:contestId/discussions", async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) return res.status(401).send("Unauthorized");

    const { contestId } = req.params;

    const threads = await Thread.find({ contest: contestId })
      .populate("author", "name")
      .sort({ createdAt: -1 });

    res.render("contestDiscussion", {
      contestId,
      threads
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading discussions");
  }
});


ThreadRouter.get("/thread/new/:contestId", (req, res) => {
  const userId = req.session.userId;
  if (!userId) return res.status(401).send("Unauthorized");

  res.render("createThread", {
    contestId: req.params.contestId
  });
});


ThreadRouter.post("/thread/create", async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) return res.status(401).send("Unauthorized");

    const { contestId, title, content } = req.body;

    if (!title || !content) {
      return res.status(400).send("All fields required");
    }

    await Thread.create({
      contest: contestId,
      author: userId,
      title,
      content
    });

    res.redirect(`/contest/${contestId}/discussions`);

  } catch (err) {
    console.error(err);
    res.status(500).send("Error creating thread");
  }
});


ThreadRouter.get("/thread/:threadId", async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) return res.status(401).send("Unauthorized");

    const { threadId } = req.params;

    const thread = await Thread.findById(threadId)
      .populate("author", "name");

    if (!thread) return res.status(404).send("Thread not found");

    const replies = await ThreadReply.find({ thread: threadId })
      .populate("author", "name")
      .sort({ createdAt: 1 });

    res.render("thread", {
      thread,
      replies
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading thread");
  }
});


ThreadRouter.post("/reply/create", async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) return res.status(401).send("Unauthorized");

    const { threadId, content } = req.body;

    if (!content) {
      return res.status(400).send("Reply cannot be empty");
    }

    const thread = await Thread.findById(threadId);
    if (!thread) return res.status(404).send("Thread not found");

    await ThreadReply.create({
      thread: threadId,
      author: userId,
      content
    });

    res.redirect(`/thread/${threadId}`);

  } catch (err) {
    console.error(err);
    res.status(500).send("Error posting reply");
  }
});

module.exports = { ThreadRouter };