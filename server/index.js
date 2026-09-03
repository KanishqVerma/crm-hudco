// import express from "express";
// import cors from "cors";
// import authRoutes from "./routes/auth.js";
// import { requireAuth } from "./middleware/auth.js";
// import taskRoutes from './routes/tasks.js';
// import todoRoutes from './routes/todos.js';
// import calendarRoutes from './routes/calendar.js';
// const app = express();
// app.use(cors());
// app.use(express.json());
// app.use("/api/auth", authRoutes);
// app.use('/api/tasks', taskRoutes);
// app.use('/api/todos', todoRoutes);
// app.use('/api/calendar', calendarRoutes);
// app.get("/api/health", (req, res) => {
//   res.json({ message: "Server is alive!" });
// });
// const PORT = 5000;
// app.listen(PORT, () => {
//   console.log(`Server running on http://localhost:${PORT}`);
// });
// app.get("/api/protected", requireAuth, (req, res) => {
//   res.json({ message: "You are logged in!", user: req.user });
// });

import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import authRoutes from "./routes/auth.js";
import taskRoutes from "./routes/tasks.js";
import todoRoutes from "./routes/todos.js";
import calendarRoutes from "./routes/calendar.js";
import chatRoutes from "./routes/chat.js";
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });
app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/todos", todoRoutes);
app.use("/api/calendar", calendarRoutes);
app.use("/api/chat", chatRoutes);
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
  socket.on("joinConversation", (conversationId) => {
    socket.join(`conversation_${conversationId}`);
  });
  socket.on("sendMessage", async ({ conversationId, content }) => {
    const prisma = (await import("./prisma/client.js")).default;
    const message = await prisma.message.create({
      data: {
        conversationId: parseInt(conversationId),
        senderId: socket.userId,
        content,
      },
      include: { sender: { select: { id: true, name: true } } },
    });
    io.to(`conversation_${conversationId}`).emit("newMessage", message);
  });
  socket.on("disconnect", () => {
    console.log(`User ${socket.userId} disconnected`);
  });
});
const PORT = 5000;
httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
