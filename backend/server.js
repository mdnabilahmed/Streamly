require("module-alias/register");
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

require("./db");

const mainRouter = require("@routes/mainRouter");

const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const Video = require("./models/Video");

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

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

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("join-room", (userId) => {
    socket.join(`user-${userId}`);
    console.log(`User ${userId} joined room user-${userId}`);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });

  socket.on("analysis-progress", (data) => {
    const { userId, videoId, percentage } = data;
    if (userId) {
      io.to(`user-${userId}`).emit("video-progress", { videoId, percentage });
    }
  });

  socket.on("analysis-complete", async (data) => {
    const { videoId, userId, result } = data;
    console.log(`Analysis complete for ${videoId}:`, result);

    try {
      await Video.findByIdAndUpdate(videoId, {
        status: result.status,
        analysisResult: result,
      });

      if (userId) {
        io.to(`user-${userId}`).emit("video-analysis-complete", {
          videoId,
          result,
        });
      }
    } catch (err) {
      console.error("Error updating video result:", err);
    }
  });
});

server.listen(8080, () => {
  console.log("Server is running on port 8080");
});
