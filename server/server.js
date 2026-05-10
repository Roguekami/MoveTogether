const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

// Make io accessible to routes/controllers
app.set('io', io);

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

const tripRoutes = require('./routes/tripRoutes');
app.use('/api/trips', tripRoutes);

const messageRoutes = require('./routes/messageRoutes');
app.use('/api/messages', messageRoutes);

const notificationRoutes = require('./routes/notificationRoutes');
app.use('/api/notifications', notificationRoutes);

const ratingRoutes = require('./routes/ratingRoutes');
app.use('/api/ratings', ratingRoutes);

const reportRoutes = require('./routes/reportRoutes');
app.use('/api/reports', reportRoutes);

const adminRoutes = require('./routes/adminRoutes');
app.use('/api/admin', adminRoutes);

const authMiddleware = require('./middleware/authMiddleware');
app.get('/api/protected', authMiddleware, (req, res) => {
    res.json({
        message: "You accessed a protected route",
        user: req.user
    });
});

// Test route
app.get('/', (req, res) => {
    res.send('MoveTogether API is running...');
});

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('🔌 User connected:', socket.id);

    // Join personal user room for notifications
    socket.on('join-user', (userId) => {
        socket.join(userId);
    });

    // Join a trip chat room
    socket.on('join-trip', (tripId) => {
        socket.join(`trip-${tripId}`);
        console.log(`Socket ${socket.id} joined trip-${tripId}`);
    });

    // Leave a trip chat room
    socket.on('leave-trip', (tripId) => {
        socket.leave(`trip-${tripId}`);
        console.log(`Socket ${socket.id} left trip-${tripId}`);
    });

    socket.on('disconnect', () => {
        console.log('🔌 User disconnected:', socket.id);
    });
});

// Connect DB then start server
const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB Connected');
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('MongoDB Connection Error:', err.message);
    process.exit(1);
  });