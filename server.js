const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

app.use(express.static('public'));

let users = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  if (users.size >= 2) {
    socket.emit('room-full');
    socket.disconnect();
    return;
  }
  
  const userNumber = users.size + 1;
  users.set(socket.id, { number: userNumber, tabActive: true });
  
  socket.emit('user-assigned', userNumber);
  io.emit('user-count', users.size);
  
  socket.on('typing', (data) => {
    socket.broadcast.emit('user-typing', data);
  });
  
  socket.on('mouse-move', (data) => {
    socket.broadcast.emit('mouse-move', data);
  });
  
  socket.on('tab-status', (isActive) => {
    const user = users.get(socket.id);
    if (user) {
      user.tabActive = isActive;
      socket.broadcast.emit('tab-status', isActive);
    }
  });
  
  socket.on('message', (message) => {
    socket.broadcast.emit('new-message', message);
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    users.delete(socket.id);
    io.emit('user-count', users.size);
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
