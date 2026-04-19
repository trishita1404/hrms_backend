const express = require("express");
const dotenv = require("dotenv");
const http = require("http"); 
const { Server } = require("socket.io"); 
dotenv.config();

const cors = require("cors");
const fs = require("fs");
const path = require("path");
const cookieParser = require("cookie-parser"); 
const connectDB = require("./app/config/db");
const authRoutes = require("./app/router/authRoutes");
const employeeRoutes = require("./app/router/employeeRoutes");
const leaveRoutes = require('./app/router/leaveRoutes'); 
const attendanceRoutes = require('./app/router/attendanceRoutes');
const dashboardRoutes = require('./app/router/dashboardRoutes');
const userRoutes = require('./app/router/userRoutes');
const holidayRouter = require('./app/router/holidayRouter'); 
const jobRoutes = require('./app/router/jobRoutes');
const notificationRoutes = require('./app/router/notificationRoutes');

// Connect to Database
connectDB();

const app = express();
const server = http.createServer(app); 

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }
});

// Global Phonebook: Maps User IDs to their active Socket IDs
global.activeUsers = new Map();

io.on('connection', (socket) => {
  const userId = socket.handshake.query.userId;
  
  if (userId && userId !== 'undefined') {
    global.activeUsers.set(userId, socket.id);
    console.log(`⚡ Real-time: User ${userId} connected`);
  }

  socket.on('disconnect', () => {
    if (userId) {
      global.activeUsers.delete(userId);
      console.log(`❌ Real-time: User ${userId} disconnected`);
    }
  });
});

//  io accessible globally in our controllers via req.app.get('io')
app.set('io', io);


const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// --- MIDDLEWARE ---
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use(cors({
  origin: "http://localhost:5173", 
  credentials: true, 
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
}));

app.use(cookieParser()); 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- ROUTES ---
app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes); 
app.use('/api/leaves', leaveRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', userRoutes);
app.use('/api/holidays', holidayRouter);
app.use('/api/jobs', jobRoutes);
app.use('/api/notifications', notificationRoutes);


// Root Route
app.get("/", (req, res) => {
  res.send("HR Management System API with Socket.io is running...");
});

// 4. Handle 404 Routes
app.use((req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
});

const PORT = process.env.PORT || 3001;

// CRITICAL: Listen on the 'server' instance, not 'app'
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});