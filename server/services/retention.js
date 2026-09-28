import cron from "node-cron";
import prisma from "../prisma/client.js";
const months = parseInt(process.env.CHAT_RETENTION_MONTHS) || 6;
export async function purgeOldMessages() {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - months);
  // Attachments are removed automatically along with their messages
  const result = await prisma.message.deleteMany({
    where: { createdAt: { lt: cutoff } },
  });
  if (result.count > 0) {
    console.log(
      `Retention: deleted ${result.count} messages older than ${months} months`,
    );
  }
}
export function startRetentionJob() {
  // Run once at startup (covers servers that were asleep), then daily at 3 AM
  purgeOldMessages().catch(console.error);
  cron.schedule("0 3 * * *", () => {
    purgeOldMessages().catch(console.error);
  });
}
