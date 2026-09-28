import express from "express";
import { createAndBroadcastMessage } from "./services/messageService.js";
import { startRetentionJob } from "./services/retention.js";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import authRoutes from "./routes/auth.js";
import taskRoutes from "./routes/tasks.js";
import todoRoutes from "./routes/todos.js";
import calendarRoutes from "./routes/calendar.js";
import chatRoutes from "./routes/chat.js";
import userRoutes from "./routes/users.js";
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });
app.set("io", io);
app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/todos", todoRoutes);
app.use("/api/calendar", calendarRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/users", userRoutes);
app.get("/api/health", (req, res) => {
  res.json({ message: "Server is alive!" });
});

// Socket.IO auth: verify the JWT before allowing a connection
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error("No token provided"));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    next();
  } catch (err) {
    next(new Error("Invalid token"));
  }
});
io.on("connection", (socket) => {
  console.log(`User ${socket.userId} connected`);
  // Every user gets a personal room, so messages reach them wherever they are in the app
  socket.join(`user_${socket.userId}`);
  socket.on("sendMessage", async ({ conversationId, content }) => {
    try {
      if (!content || !content.trim()) return;
      await createAndBroadcastMessage(io, {
        conversationId: parseInt(conversationId),
        senderId: socket.userId,
        content,
      });
    } catch (err) {
      console.error(err);
    }
  });
  socket.on("disconnect", () => {
    console.log(`User ${socket.userId} disconnected`);
  });
});
const PORT = 5000;
httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
startRetentionJob();
