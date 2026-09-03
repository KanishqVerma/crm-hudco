import express from "express";
import prisma from "../prisma/client.js";
import { requireAuth } from "../middleware/auth.js";
const router = express.Router();

// GET my conversations (with the other participant's name and last message preview)
router.get("/conversations", requireAuth, async (req, res) => {
  try {
    const conversations = await prisma.conversation.findMany({
      where: { participants: { some: { userId: req.user.userId } } },
      include: {
        participants: {
          include: { user: { select: { id: true, name: true } } },
        },
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });
    res.json(conversations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// START a new conversation with another user (or return the existing one if it already exists)
router.post("/conversations", requireAuth, async (req, res) => {
  try {
    const { otherUserId } = req.body;
    if (!otherUserId) {
      return res.status(400).json({ error: "otherUserId is required" });
    }
    const existing = await prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { userId: req.user.userId } } },
          { participants: { some: { userId: otherUserId } } },
        ],
      },
    });
    if (existing) {
      return res.json(existing);
    }
    const conversation = await prisma.conversation.create({
      data: {
        participants: {
          create: [{ userId: req.user.userId }, { userId: otherUserId }],
        },
      },
      include: { participants: true },
    });
    res.status(201).json(conversation);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// GET message history for a specific conversation
router.get("/conversations/:id/messages", requireAuth, async (req, res) => {
  try {
    const conversationId = parseInt(req.params.id);
    const isParticipant = await prisma.conversationParticipant.findFirst({
      where: { conversationId, userId: req.user.userId },
    });
    if (!isParticipant) {
      return res
        .status(403)
        .json({ error: "You are not part of this conversation" });
    }
    const messages = await prisma.message.findMany({
      where: { conversationId },
      include: { sender: { select: { id: true, name: true } } },
      orderBy: { createdAt: "asc" },
    });
    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});
export default router;
