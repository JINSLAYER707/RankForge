const {Message , User , GroupMessage , Group}=require('../utils/db');


module.exports=(io)=>{
    io.on('connection' , (socket)=>{
        console.log("User connected to Socket.IO");

        socket.on('join_room' , async({sender , receiver})=>{
            if(!sender || !receiver) return;
          const roomId= [sender.toString(), receiver.toString()].sort().join('_');
            socket.join(roomId);


        } )
        socket.on('send_message' , async({sender , receiver , message})=>{
            if(!sender || !receiver || !message.trim()) return;
            const newMessage = new Message({
                sender,
                receiver,
                message
            })
            await newMessage.save();
            const roomId= [sender.toString(), receiver.toString()].sort().join('_');
            io.to(roomId).emit('receive_message',newMessage);
            
        })
        socket.on('disconnect' , ()=>{
            console.log("User disconnected from Socket.IO");
        })
         socket.on('join_group', async ({ groupId, userId }) => {
    console.log("JOIN GROUP:", groupId);

    socket.join(groupId);
  });

  socket.on('join_group', async ({ groupId, userId }) => {
    if (!groupId) return;

    const room = groupId.toString();

    console.log("JOIN GROUP:", room);

    socket.join(room);
});

socket.on('send_group_message', async ({ senderId, groupId, message }) => {
    if (!senderId || !groupId || !message.trim()) return;

    console.log("MESSAGE RECEIVED:", message);

    const msg = await GroupMessage.create({
        sender: senderId,
        group: groupId,
        message
    });

    const populatedMsg = await msg.populate('sender', 'name');

    const room = groupId.toString();

    console.log("EMITTING MESSAGE TO:", room);

    io.to(room).emit('receive_group_message', populatedMsg);
});
    })
}
