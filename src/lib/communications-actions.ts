"use server";

import { getCurrentProfile } from "@/lib/profile";
import { getCurrentTournament } from "@/lib/tournament";
import { sendBulkBccEmail } from "@/lib/mail";
import { recordEmailSend, type RecipientTag } from "@/lib/email-history";

export async function sendBulkEmail(formData: FormData) {
  const profile = await getCurrentProfile();
  if (profile?.role !== "director") throw new Error("Not authorized");

  const subject = String(formData.get("subject") || "").trim();
  const body = String(formData.get("body") || "").trim();

  let recipientTags: RecipientTag[] = [];
  try {
    recipientTags = JSON.parse(String(formData.get("recipient_tags") || "[]"));
  } catch {
    recipientTags = [];
  }

  const bcc = [
    ...new Set(recipientTags.map((r) => r.email).filter(Boolean)),
  ];

  if (!subject) throw new Error("Subject is required.");
  if (!body) throw new Error("Message body is required.");
  if (!bcc.length) throw new Error("No recipients selected.");

  const tournament = await getCurrentTournament();

  await sendBulkBccEmail({ bcc, subject, text: body });
  await recordEmailSend({
    subject,
    body,
    sentBy: profile?.id ?? null,
    tournamentId: tournament?.id ?? null,
    recipients: recipientTags,
  });
}
