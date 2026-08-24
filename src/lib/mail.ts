import nodemailer from "nodemailer";

function getTransporter() {
  const user = process.env.GMAIL_ADDRESS;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) {
    throw new Error(
      "Gmail is not connected — set GMAIL_ADDRESS and GMAIL_APP_PASSWORD.",
    );
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
}

export function isGmailConnected() {
  return Boolean(process.env.GMAIL_ADDRESS && process.env.GMAIL_APP_PASSWORD);
}

export async function sendBulkBccEmail({
  bcc,
  subject,
  text,
}: {
  bcc: string[];
  subject: string;
  text: string;
}) {
  const from = process.env.GMAIL_ADDRESS;
  if (!from) {
    throw new Error(
      "Gmail is not connected — set GMAIL_ADDRESS and GMAIL_APP_PASSWORD.",
    );
  }
  if (!bcc.length) {
    throw new Error("No recipients selected.");
  }

  const transporter = getTransporter();
  await transporter.sendMail({
    from,
    to: from,
    bcc,
    subject,
    text,
  });
}
