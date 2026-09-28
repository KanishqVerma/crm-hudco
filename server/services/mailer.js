import "dotenv/config";
import nodemailer from "nodemailer";
const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, MAIL_FROM } =
  process.env;
export const emailEnabled = Boolean(SMTP_HOST);
export const appUrl = process.env.APP_URL || "http://localhost:5173";
const transporter = emailEnabled
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: parseInt(SMTP_PORT) || 587,
      secure: SMTP_SECURE === "true",
      auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
    })
  : null;
if (!emailEnabled) {
  console.log("Email notifications are disabled (SMTP_HOST is not set).");
}
// Returns true if the email was sent. Never throws, so a mail problem can't break the app.
export async function sendMail({ to, subject, text }) {
  if (!transporter || !to) return false;
  try {
    await transporter.sendMail({
      from: MAIL_FROM || SMTP_USER,
      to,
      subject,
      text,
    });
    return true;
  } catch (err) {
    console.error(`Email to ${to} failed: ${err.message}`);
    return false;
  }
}
