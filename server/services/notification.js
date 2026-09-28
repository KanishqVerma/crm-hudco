import prisma from "../prisma/client.js";
import { sendMail, appUrl, emailEnabled } from "./mailer.js";
export async function notifyTaskAssigned(task, userIds, createdBy) {
  if (!emailEnabled) return;
  const ids = [...new Set(userIds.map(Number))].filter(
    (id) => id && id !== createdBy,
  );
  if (ids.length === 0) return;
  const users = await prisma.user.findMany({
    where: { id: { in: ids } },
    select: { name: true, email: true },
  });
  const due = task.deadline
    ? ` (due ${new Date(task.deadline).toISOString().slice(0, 10)})`
    : "";
  await Promise.all(
    users.map((u) =>
      sendMail({
        to: u.email,
        subject: "New tasks assigned",
        text: `Hi ${u.name},\n\nYou have been assigned a new task: "${task.title}"${due}.\n\nLog in to view it: ${appUrl}\n`,
      }),
    ),
  );
}
export async function notifyUnreadMessage(io, message, participants) {
  if (!emailEnabled) return;
  const recipients = participants.filter((p) => p.userId !== message.senderId);
  for (const p of recipients) {
    // Anyone with the app open already sees the in-app badge, so skip them
    const sockets = await io.in(`user_${p.userId}`).fetchSockets();
    if (sockets.length > 0) continue;
    // One email per unread streak: after an email, wait until they have read the chat
    const alreadyNotified =
      p.lastNotifiedAt && !(p.lastReadAt && p.lastReadAt > p.lastNotifiedAt);
    if (alreadyNotified) continue;
    // Claim the notification first, so several quick messages send only one email
    const claim = await prisma.conversationParticipant.updateMany({
      where: { id: p.id, lastNotifiedAt: p.lastNotifiedAt },
      data: { lastNotifiedAt: new Date() },
    });
    if (claim.count === 0) continue;
    const user = await prisma.user.findUnique({
      where: { id: p.userId },
      select: { name: true, email: true },
    });
    const sent = user
      ? await sendMail({
          to: user.email,
          subject: "You've got unread messages",
          text: `Hi ${user.name},\n\nYou have unread messages from ${message.sender.name}.\n\nLog in to read them: ${appUrl}\n`,
        })
      : false;
    // If the email failed, release the claim so a later message can try again
    if (!sent) {
      await prisma.conversationParticipant.updateMany({
        where: { id: p.id },
        data: { lastNotifiedAt: p.lastNotifiedAt },
      });
    }
  }
}
