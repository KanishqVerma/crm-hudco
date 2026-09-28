import express from "express";
import multer from "multer";
import prisma from "../prisma/client.js";
import { requireAuth } from "../middleware/auth.js";
import {
  createAndBroadcastMessage,
  messageInclude,
} from "../services/messageService.js";
const router = express.Router();
const ALLOWED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "application/pdf",
  "text/plain",
  "text/csv",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
];
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1024 * 1024, files: 1 },
  // 1 MB
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      return cb(new Error("FILE_TYPE_NOT_ALLOWED"));
    }
    cb(null, true);
  },
});
// GET my conversations (with unread counts)
router.get("/conversations", requireAuth, async (req, res) => {
  try {
    const conversations = await prisma.conversation.findMany({
      where: { participants: { some: { userId: req.user.userId } } },
      include: {
        participants: {
          include: { user: { select: { id: true, name: true } } },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: { attachment: { select: { fileName: true } } },
        },
      },
    });
    const withUnread = await Promise.all(
      conversations.map(async (conv) => {
        const me = conv.participants.find((p) => p.userId === req.user.userId);
        const lastReadAt = me?.lastReadAt || new Date(0);
        const unreadCount = await prisma.message.count({
          where: {
            conversationId: conv.id,
            senderId: { not: req.user.userId },
            createdAt: { gt: lastReadAt },
          },
        });
        return { ...conv, unreadCount };
      }),
    );
    res.json(withUnread);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// START (or find) a direct conversation with one other user
router.post("/conversations", requireAuth, async (req, res) => {
  try {
    const otherUserId = parseInt(req.body.otherUserId);
    if (!otherUserId || otherUserId === req.user.userId) {
      return res.status(400).json({ error: "A valid other user is required" });
    }
    const existing = await prisma.conversation.findFirst({
      where: {
        isGroup: false,
        AND: [
          { participants: { some: { userId: req.user.userId } } },
          { participants: { some: { userId: otherUserId } } },
        ],
      },
    });
    if (existing) return res.json(existing);
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
// CREATE a group chat
router.post("/groups", requireAuth, async (req, res) => {
  try {
    const { name, memberIds } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Group name is required" });
    }
    const ids = [...new Set((memberIds || []).map(Number))].filter(
      (id) => id !== req.user.userId,
    );
    if (ids.length < 2) {
      return res.status(400).json({ error: "Pick at least 2 other people" });
    }
    const found = await prisma.user.count({ where: { id: { in: ids } } });
    if (found !== ids.length) {
      return res
        .status(400)
        .json({ error: "One or more users were not found" });
    }
    const conversation = await prisma.conversation.create({
      data: {
        isGroup: true,
        name: name.trim(),
        createdBy: req.user.userId,
        participants: {
          create: [req.user.userId, ...ids].map((userId) => ({ userId })),
        },
      },
      include: {
        participants: {
          include: { user: { select: { id: true, name: true } } },
        },
      },
    });
    res.status(201).json(conversation);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});
// DELETE a group (its creator, or any admin)
router.delete("/groups/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: { participants: true },
    });
    if (!conversation || !conversation.isGroup) {
      return res.status(404).json({ error: "Group not found" });
    }
    const allowed =
      conversation.createdBy === req.user.userId || req.user.role === "admin";
    if (!allowed) {
      return res.status(403).json({
        error: "Only the group creator or an admin can delete this group",
      });
    }
    // Cascades to participants, messages, and attachments
    await prisma.conversation.delete({ where: { id } });
    const io = req.app.get("io");
    conversation.participants.forEach((p) => {
      io.to(`user_${p.userId}`).emit("conversationDeleted", {
        conversationId: id,
      });
    });
    res.json({ message: "Group deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});
// GET message history for a conversation
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
      include: messageInclude,
      orderBy: { createdAt: "asc" },
    });
    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});
// Mark a conversation as read
router.patch("/conversations/:id/read", requireAuth, async (req, res) => {
  try {
    const conversationId = parseInt(req.params.id);
    await prisma.conversationParticipant.updateMany({
      where: { conversationId, userId: req.user.userId },
      data: { lastReadAt: new Date() },
    });
    res.json({ message: "Marked as read" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});
// UPLOAD a file or image into a conversation (max 1 MB)
router.post("/conversations/:id/attachments", requireAuth, (req, res) => {
  upload.single("file")(req, res, async (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res
          .status(413)
          .json({ error: "File is too large. Maximum size is 1 MB." });
      }
      if (err.message === "FILE_TYPE_NOT_ALLOWED") {
        return res
          .status(400)
          .json({ error: "This file type is not allowed." });
      }
      return res.status(400).json({ error: "Upload failed." });
    }
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file provided." });
      }
      const message = await createAndBroadcastMessage(req.app.get("io"), {
        conversationId: parseInt(req.params.id),
        senderId: req.user.userId,
        content: "",
        file: req.file,
      });
      if (!message) {
        return res
          .status(403)
          .json({ error: "You are not part of this conversation" });
      }
      res.status(201).json(message);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Something went wrong" });
    }
  });
});
// DOWNLOAD an attachment (members of its conversation only)
router.get("/attachments/:id", requireAuth, async (req, res) => {
  try {
    const attachment = await prisma.attachment.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { message: { select: { conversationId: true } } },
    });
    if (!attachment) {
      return res.status(404).json({ error: "File not found" });
    }
    const isMember = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId: attachment.message.conversationId,
        userId: req.user.userId,
      },
    });
    if (!isMember) {
      return res
        .status(403)
        .json({ error: "You do not have access to this file" });
    }
    const isImage = attachment.mimeType.startsWith("image/");
    res.setHeader("Content-Type", attachment.mimeType);
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader(
      "Content-Disposition",
      `${isImage ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(attachment.fileName)}`,
    );
    res.send(Buffer.from(attachment.data));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});
export default router;
