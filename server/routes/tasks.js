import express from "express";
import prisma from "../prisma/client.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
const router = express.Router();

// CREATE a task (admin only) — assign to multiple employees, with optional subtasks
router.post("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { title, description, deadline, assigneeIds, subtasks } = req.body;
    if (!title || !assigneeIds || assigneeIds.length === 0) {
      return res
        .status(400)
        .json({ error: "Title and at least one assignee are required" });
    }
    const task = await prisma.task.create({
      data: {
        title,
        description,
        deadline: deadline ? new Date(deadline) : null,
        createdBy: req.user.userId,
        assignees: { create: assigneeIds.map((userId) => ({ userId })) },
        subtasks: {
          create: (subtasks || []).map((s) => ({
            title: s.title,
            assignedTo: s.assignedTo || null,
          })),
        },
      },
      include: { assignees: true, subtasks: true },
    });
    res.status(201).json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// GET tasks assigned to the logged-in employee
router.get("/mine", requireAuth, async (req, res) => {
  try {
    const tasks = await prisma.task.findMany({
      where: { assignees: { some: { userId: req.user.userId } } },
      include: {
        subtasks: true,
        assignees: { include: { user: { select: { id: true, name: true } } } },
      },
      orderBy: { deadline: "asc" },
    });
    res.json(tasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// GET all tasks (admin only)
router.get("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const tasks = await prisma.task.findMany({
      include: {
        subtasks: true,
        assignees: { include: { user: { select: { id: true, name: true } } } },
      },
      orderBy: { deadline: "asc" },
    });
    res.json(tasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// UPDATE a subtask's status (only the assigned employee can check it off)
router.patch("/subtask/:id", requireAuth, async (req, res) => {
  try {
    const subtaskId = parseInt(req.params.id);
    const { status } = req.body;
    const subtask = await prisma.subtask.findUnique({
      where: { id: subtaskId },
    });
    if (!subtask) {
      return res.status(404).json({ error: "Subtask not found" });
    }
    if (subtask.assignedTo !== req.user.userId && req.user.role !== "admin") {
      return res
        .status(403)
        .json({ error: "You can only update your own subtasks" });
    }
    const updated = await prisma.subtask.update({
      where: { id: subtaskId },
      data: { status },
    });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// DELETE a task (admin only)
router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    // Delete related subtasks and assignees first, since they reference this task
    await prisma.subtask.deleteMany({ where: { taskId } });
    await prisma.taskAssignee.deleteMany({ where: { taskId } });
    await prisma.task.delete({ where: { id: taskId } });
    res.json({ message: "Task deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});
export default router;
