const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken'); 
require('dotenv').config();

const User = require('./models/User'); 
const authRoutes = require('./routes/auth');
const roomRoutes = require('./routes/rooms');
const socketAuth = require("./socketAuth");

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: 'http://localhost:3000', methods: ['GET', 'POST'] }
});

const rooms = new Map();

const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    
    if (!token) {
      socket.data.userName = 'Guest'; 
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findById(decoded.userId).select('name');
    
    if (user) {
      socket.data.userName = user.name; 
      socket.data.userId = decoded.userId;
      console.log(`✅ Authenticated: ${user.name} (${socket.id})`);
    } else {
      socket.data.userName = 'Guest';
    }
    
    next();
  } catch (err) {
    console.log('Socket auth error:', err.message);
    socket.data.userName = 'Guest';
    next();
  }
};

io.use(socketAuth);

io.use(authenticateSocket);

io.on('connection', (socket) => {
  console.log('User connected:', socket.id, `(${socket.data.userName})`);

  // 👈 join-room: Use MongoDB name, ignore client-sent userName
  socket.on('join-room', ({ roomId, isAdmin = false, projectName }) => {
    if (!roomId) return;

    const userName = socket.data.userName; 

    if (!rooms.has(roomId)) {
      const projectFolder = projectName || roomId;
      rooms.set(roomId, {
        files: { [`${projectFolder}/main.js`]: { code: '// Start coding...', language: 'javascript' } },
        fileTree: { 
          name: 'root', 
          type: 'folder', 
          path: 'root',
          children: [{
            name: projectFolder,
            type: 'folder',
            path: projectFolder,
            children: [{ name: 'main.js', type: 'file', path: `${projectFolder}/main.js` }]
          }]
        },
        activeFile: `${projectFolder}/main.js`,
        users: [],
        admins: [userName],
        bannedUsers: [],
        roomPassword: Math.random().toString(36).substring(2, 8),
        projectName: projectFolder
      });
    }

    const room = rooms.get(roomId);
    
    if (room.bannedUsers.includes(userName)) {
      socket.emit('banned', { message: 'You are banned from this room' });
      return;
    }

    socket.join(roomId);
    socket.isAdmin = isAdmin;

    room.users = room.users.filter(u => u.id !== socket.id);
    room.users.push({ id: socket.id, name: userName, isAdmin: socket.isAdmin });

    socket.to(roomId).emit('user-joined', { userName }); 
    io.to(roomId).emit('user-list', room.users);

    socket.emit('room-data', {
      files: room.files,
      fileTree: room.fileTree,
      activeFile: room.activeFile,
      users: room.users,
      admins: room.admins,
      roomId: roomId,
      roomPassword: room.roomPassword,
      projectName: room.projectName
    });
  });

  socket.on('user-editing', ({ roomId }) => {
    const userName = socket.data.userName; 
    socket.to(roomId).emit('user-editing', { userName }); 
  });

  socket.on('leave-room', ({ roomId }) => {
    const userName = socket.data.userName;
    socket.to(roomId).emit('user-left', { userName });
    socket.leave(roomId);
  });

  socket.on('create-folder', ({ roomId, path }) => {
    if (!rooms.has(roomId)) return;
    const room = rooms.get(roomId);
    
    const newFolder = {
      name: path,
      type: 'folder',
      path: path,
      children: []
    };
    
    if (!room.fileTree.children) room.fileTree.children = [];
    room.fileTree.children.push(newFolder);
    
    io.to(roomId).emit('files-updated', { 
      files: room.files, 
      fileTree: room.fileTree 
    });
  });

  socket.on('create-file', ({ roomId, path }) => {
    if (!rooms.has(roomId)) return;
    const room = rooms.get(roomId);
    
    if (!room.files[path]) {
      room.files[path] = { code: '// New file', language: 'javascript' };
      
      const addFileToTree = (node, fullPath) => {
        if (node.type === 'folder') {
          const thisPath = node.path || node.name || 'root';
          
          if (fullPath === thisPath || fullPath.startsWith(`${thisPath}/`)) {
            node.children = node.children || [];
            const fileName = fullPath.split('/').pop();
            node.children.push({
              name: fileName,
              type: 'file',
              path: fullPath
            });
            return true;
          }
          
          return (node.children || []).some(child => addFileToTree(child, fullPath));
        }
        return false;
      };
      
      addFileToTree(room.fileTree, path);
      
      io.to(roomId).emit('files-updated', { 
        files: room.files, 
        fileTree: room.fileTree 
      });
      
      room.activeFile = path;
      io.to(roomId).emit('active-file-changed', { activeFile: path });
    }
  });

  socket.on('switch-file', ({ roomId, path }) => {
    if (!rooms.has(roomId)) return;
    const room = rooms.get(roomId);
    room.activeFile = path;
    io.to(roomId).emit('active-file-changed', { activeFile: path });
  });

  socket.on('code-change', ({ roomId, filename, code, language }) => {
    if (!rooms.has(roomId)) return;
    const room = rooms.get(roomId);
    if (!room.files[filename]) return;
    
    room.files[filename].code = code ?? '';
    if (language) room.files[filename].language = language;
    
    socket.to(roomId).emit('code-updated', { 
      filename, 
      code: room.files[filename].code,
      language: room.files[filename].language 
    });
  });

  socket.on('chat-message', ({ roomId, message }) => {
    io.to(roomId).emit('new-message', {
      userName: socket.data.userName || 'Anonymous', 
      message: message.trim(),
      timestamp: new Date().toISOString(),
    });
  });

  socket.on('disconnect', () => {
    rooms.forEach((room, roomId) => {
      room.users = room.users.filter(u => u.id !== socket.id);
      socket.to(roomId).emit('user-left', { userName: socket.data.userName });
      io.to(roomId).emit('user-list', room.users);
    });
    console.log(`${socket.data.userName} disconnected (${socket.id})`);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
