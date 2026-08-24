import nodemailer from "nodemailer";
import { createAdminClient } from "@/lib/supabase/admin";

async function getGmailConnection() {
  const admin = createAdminClient();
  const { data } = await admin
    .from("gmail_connection")
    .select("email, app_password")
    .order("connected_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data;
}

export async function isGmailConnected() {
  const connection = await getGmailConnection();
  return Boolean(connection);
}

export async function getConnectedGmailAddress() {
  const connection = await getGmailConnection();
  return connection?.email ?? null;
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
  const connection = await getGmailConnection();
  if (!connection) {
    throw new Error(
      "Gmail is not connected — connect an account on the Settings page.",
    );
  }
  if (!bcc.length) {
    throw new Error("No recipients selected.");
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: connection.email, pass: connection.app_password },
  });

  await transporter.sendMail({
    from: connection.email,
    to: connection.email,
    bcc,
    subject,
    text,
  });
}
