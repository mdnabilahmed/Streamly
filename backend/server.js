require('module-alias/register');
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

//Connect to database
require("./db");

const mainRouter = require("@routes/mainRouter");

const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const Video = require('./models/Video'); // Import Video model

const io = new Server(server, {
  cors: {
    origin: "*", // allow all for now, tighten for prod
    methods: ["GET", "POST"]
  }
});

// Make io available in routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use(cors());
app.use(bodyParser.json());

app.get("/", (req, res) => {
    res.send("Welcome to Streamly Backend Server");
});
app.use("/", mainRouter);

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  
  // Join a room based on userId if provided
  socket.on('join-room', (userId) => {
    socket.join(`user-${userId}`);
    console.log(`User ${userId} joined room user-${userId}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });

  // Handle analysis events from Python script
  socket.on('analysis-progress', (data) => {
     // data: { videoId, userId, percentage }
     const { userId, videoId, percentage } = data;
     if (userId) {
         io.to(`user-${userId}`).emit('video-progress', { videoId, percentage });
     }
  });

  socket.on('analysis-complete', async (data) => {
      // data: { videoId, userId, result: { status, reasons, metrics } }
      const { videoId, userId, result } = data;
      console.log(`Analysis complete for ${videoId}:`, result);
      
      try {
          await Video.findByIdAndUpdate(videoId, {
              status: result.status,
              analysisResult: result
          });
          
          if (userId) {
            io.to(`user-${userId}`).emit('video-analysis-complete', { 
                videoId, 
                result 
            });
          }
      } catch (err) {
          console.error('Error updating video result:', err);
      }
  });
});

server.listen(8080, () => {
    console.log("Server is running on port 8080");
});