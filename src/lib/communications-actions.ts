"use server";

import { getCurrentProfile } from "@/lib/profile";
import { sendBulkBccEmail } from "@/lib/mail";

export async function sendBulkEmail(formData: FormData) {
  const profile = await getCurrentProfile();
  if (profile?.role !== "director") throw new Error("Not authorized");

  const subject = String(formData.get("subject") || "").trim();
  const body = String(formData.get("body") || "").trim();
  const recipientsRaw = String(formData.get("recipients") || "");
  const bcc = [
    ...new Set(
      recipientsRaw
        .split(",")
        .map((e) => e.trim())
        .filter(Boolean),
    ),
  ];

  if (!subject) throw new Error("Subject is required.");
  if (!body) throw new Error("Message body is required.");
  if (!bcc.length) throw new Error("No recipients selected.");

  await sendBulkBccEmail({ bcc, subject, text: body });
}
