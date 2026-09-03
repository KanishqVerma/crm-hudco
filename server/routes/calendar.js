import express from "express";
import prisma from "../prisma/client.js";
import { requireAuth } from "../middleware/auth.js";
const router = express.Router();
// GET calendar events for the logged-in employee (their assigned task deadlines)
router.get("/mine", requireAuth, async (req, res) => {
  try {
    const tasks = await prisma.task.findMany({
      where: {
        assignees: { some: { userId: req.user.userId } },
        deadline: { not: null },
      },
      select: { id: true, title: true, deadline: true, status: true },
      orderBy: { deadline: "asc" },
    });
    res.json(tasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});
// GET all task deadlines across the team (admin only, for the team-wide calendar view)
router.get("/team", requireAuth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }
    const tasks = await prisma.task.findMany({
      where: { deadline: { not: null } },
      select: {
        id: true,
        title: true,
        deadline: true,
        status: true,
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
export default router;
