const express = require("express");
const dotenv = require("dotenv");
const http = require("http"); 
const { Server } = require("socket.io"); 
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const cookieParser = require("cookie-parser"); 

// Load environment variables
dotenv.config();

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

// --- DYNAMIC CONFIGURATION ---
// This allows the backend to accept requests from your future Vercel URL
const frontendURL = process.env.FRONTEND_URL || "http://localhost:5173";

// Initialize Socket.io with dynamic origin
const io = new Server(server, {
  cors: {
    origin: frontendURL,
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

// Make io accessible globally in controllers via req.app.get('io')
app.set('io', io);

// Ensure uploads directory exists (Note: On Render Free Tier, these are temporary)
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// --- MIDDLEWARE ---
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use(cors({
  origin: frontendURL, 
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
  res.send("HR Management System API is live and running...");
});

// Handle 404 Routes
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

// --- SERVER START ---
const PORT = process.env.PORT || 3001;

// Listen on 0.0.0.0 for cloud deployment compatibility
server.listen(PORT, '0.0.0.0', () => {
  console.log(` Server running on port ${PORT}`);
  console.log(` Allowing requests from: ${frontendURL}`);
});