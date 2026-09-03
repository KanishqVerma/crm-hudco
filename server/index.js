import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import { requireAuth } from "./middleware/auth.js";
import taskRoutes from './routes/tasks.js';
import todoRoutes from './routes/todos.js';
import calendarRoutes from './routes/calendar.js';
const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use('/api/tasks', taskRoutes); 
app.use('/api/todos', todoRoutes);
app.use('/api/calendar', calendarRoutes);
app.get("/api/health", (req, res) => {
  res.json({ message: "Server is alive!" });
});
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
app.get("/api/protected", requireAuth, (req, res) => {
  res.json({ message: "You are logged in!", user: req.user });
});
