import prisma from "../prisma/client.js";
import { notifyUnreadMessage } from "./notifications.js";
export const messageInclude = {
  sender: { select: { id: true, name: true } },
  attachment: {
    select: { id: true, fileName: true, mimeType: true, size: true },
  },
};
export async function createAndBroadcastMessage(
  io,
  { conversationId, senderId, content, file },
) {
  const participants = await prisma.conversationParticipant.findMany({
    where: { conversationId },
  });
  // Only members of a conversation may post in it
  if (!participants.some((p) => p.userId === senderId)) return null;
  const message = await prisma.message.create({
    data: {
      conversationId,
      senderId,
      content: content || "",
      ...(file && {
        attachment: {
          create: {
            fileName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            data: file.buffer,
          },
        },
      }),
    },
    include: messageInclude,
  });
  participants.forEach((p) => {
    io.to(`user_${p.userId}`).emit("newMessage", message);
  });
  // Email people who are offline (runs in the background, never delays delivery)
  notifyUnreadMessage(io, message, participants).catch(console.error);
  return message;
}
