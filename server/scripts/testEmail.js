import "dotenv/config";
import { sendMail, emailEnabled } from "../services/mailer.js";
const to = process.argv[2];
if (!to) {
  console.error("Usage: node scripts/testEmail.js you@example.com");
  process.exit(1);
}
if (!emailEnabled) {
  console.error("SMTP_HOST is not set in server/.env");
  process.exit(1);
}
const ok = await sendMail({
  to,
  subject: "CRM test email",
  text: "If you can read this, email notifications are working.",
});
console.log(
  ok
    ? "Sent. Check the inbox (and the spam folder)."
    : "Failed. See the error above.",
);
process.exit(0);
