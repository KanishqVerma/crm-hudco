import express from "express";
import prisma from "../prisma/client.js";
import { requireAuth } from "../middleware/auth.js";
const router = express.Router();

// GET my todos
router.get("/", requireAuth, async (req, res) => {
  try {
    const todos = await prisma.todo.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: "desc" },
    });
    res.json(todos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// CREATE a todo
router.post("/", requireAuth, async (req, res) => {
  try {
    const { title, dueDate } = req.body;
    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }
    const todo = await prisma.todo.create({
      data: {
        title,
        dueDate: dueDate ? new Date(dueDate) : null,
        userId: req.user.userId,
      },
    });
    res.status(201).json(todo);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// UPDATE a todo (status or title)
router.patch("/:id", requireAuth, async (req, res) => {
  try {
    const todoId = parseInt(req.params.id);
    const todo = await prisma.todo.findUnique({ where: { id: todoId } });
    if (!todo) {
      return res.status(404).json({ error: "Todo not found" });
    }
    if (todo.userId !== req.user.userId) {
      return res
        .status(403)
        .json({ error: "You can only update your own todos" });
    }
    const updated = await prisma.todo.update({
      where: { id: todoId },
      data: req.body,
    });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// DELETE a todo
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const todoId = parseInt(req.params.id);
    const todo = await prisma.todo.findUnique({ where: { id: todoId } });
    if (!todo) {
      return res.status(404).json({ error: "Todo not found" });
    }
    if (todo.userId !== req.user.userId) {
      return res
        .status(403)
        .json({ error: "You can only delete your own todos" });
    }
    await prisma.todo.delete({ where: { id: todoId } });
    res.json({ message: "Todo deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});
export default router;
