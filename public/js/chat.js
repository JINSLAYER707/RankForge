const socket = io();

const sendBtn = document.getElementById('sendBtn');
const messageInput = document.getElementById('messageInput');
const container = document.getElementById('messagesContainer');

const isDM = otherUserId && otherUserId !== "";
const isGroup = currentGroupId && currentGroupId !== "";

if (isDM) {
  socket.emit('join_room', {
    sender: currentUserId,
    receiver: otherUserId
  });
}

if (isGroup) {
  socket.emit('join_group', {
    groupId: currentGroupId,
    userId: currentUserId
  });
}

sendBtn.onclick = sendMessage;

messageInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendMessage();
});

function sendMessage() {
  const message = messageInput.value.trim();
  if (!message) return;

  // 🔹 DM
  if (isDM) {
    socket.emit('send_message', {
      sender: currentUserId,
      receiver: otherUserId,
      message
    });
  }

  // 🔹 GROUP
  else if (isGroup) {
    socket.emit('send_group_message', {
      senderId: currentUserId,
      groupId: currentGroupId,
      message
    });
  }

  else {
    alert("Select a conversation first");
    return;
  }

  messageInput.value = '';
}

socket.on('receive_message', (msg) => {
  if (!container || !isDM) return;

  const div = document.createElement('div');
  div.classList.add("message");

  div.classList.add(
    msg.sender.toString() === currentUserId ? "sent" : "received"
  );

  div.innerHTML = `
    <p>${msg.message}</p>
    <span>${new Date(msg.timestamp).toLocaleTimeString()}</span>
  `;

  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
});

socket.on('receive_group_message', (msg) => {
  if (!container || !isGroup) return;

  const div = document.createElement('div');
  div.classList.add("message");

  const isSender = msg.sender._id
    ? msg.sender._id.toString() === currentUserId
    : msg.sender.toString() === currentUserId;

  div.classList.add(isSender ? "sent" : "received");

  div.innerHTML = `
    ${!isSender ? `<strong style="font-size:12px;">${msg.sender.name || "User"}</strong>` : ""}
    <p>${msg.message}</p>
    <span>${new Date(msg.createdAt || msg.timestamp).toLocaleTimeString()}</span>
  `;

  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
});

window.onload = () => {
  if (container) {
    container.scrollTop = container.scrollHeight;
  }
};