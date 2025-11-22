const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files
app.use(express.static('public'));

// Handle socket connections
io.on('connection', (socket) => {
  console.log('New user connected');

  // Listen for new user joining
  socket.on('new-user', (username) => {
    socket.username = username;
    socket.broadcast.emit('user-connected', username);
  });

  // Listen for chat messages
  socket.on('send-chat-message', (message) => {
    const timestamp = new Date().toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    socket.broadcast.emit('chat-message', {
      message: message,
      name: socket.username,
      timestamp: timestamp
    });
  });

  // Listen for typing status
  socket.on('typing', () => {
    socket.broadcast.emit('user-typing', socket.username);
  });

  // Listen for stop typing status
  socket.on('stop-typing', () => {
    socket.broadcast.emit('user-stop-typing', socket.username);
  });

  // Handle user disconnect
  socket.on('disconnect', () => {
    if (socket.username) {
      socket.broadcast.emit('user-disconnected', socket.username);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});