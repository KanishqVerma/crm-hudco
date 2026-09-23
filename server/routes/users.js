import express from "express";
import prisma from "../prisma/client.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
const router = express.Router();
// GET all users (any logged-in user) — a lighter version for picking chat partners
router.get("/colleagues", requireAuth, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { id: { not: req.user.userId } },
      select: { id: true, name: true, role: true },
      orderBy: { name: "asc" },
    });
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// GET all users (admin only) — used for picking task assignees
router.get("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: "asc" },
    });
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});
export default router;
