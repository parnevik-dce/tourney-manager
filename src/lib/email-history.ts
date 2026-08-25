import { createAdminClient } from "@/lib/supabase/admin";

export type RecipientTag = {
  kind: string;
  entityId: string;
  entityName: string;
  email: string;
};

export async function recordEmailSend({
  subject,
  body,
  sentBy,
  tournamentId,
  recipients,
}: {
  subject: string;
  body: string;
  sentBy: string | null;
  tournamentId: string | null;
  recipients: RecipientTag[];
}) {
  const admin = createAdminClient();

  const { data: send, error } = await admin
    .from("email_sends")
    .insert({ subject, body, sent_by: sentBy, tournament_id: tournamentId })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  if (!recipients.length) return;

  const { error: recipientsError } = await admin.from("email_recipients").insert(
    recipients.map((r) => ({
      send_id: send.id,
      entity_kind: r.kind,
      entity_id: r.entityId,
      entity_name: r.entityName,
      email: r.email,
    })),
  );

  if (recipientsError) throw new Error(recipientsError.message);
}

export async function getEmailSends(tournamentId: string | null) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("email_sends")
    .select("*, email_recipients(*), profiles(full_name, email)")
    .eq("tournament_id", tournamentId ?? "")
    .order("sent_at", { ascending: false });

  return data ?? [];
}

export type EntityEmailHistoryRow = {
  email: string;
  email_sends: {
    id: string;
    subject: string;
    body: string;
    sent_at: string;
    tournament_id: string | null;
  } | null;
};

export async function getEntityEmailHistory(
  kind: string,
  entityId: string,
  tournamentId: string | null,
) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("email_recipients")
    .select("email, email_sends(id, subject, body, sent_at, tournament_id)")
    .eq("entity_kind", kind)
    .eq("entity_id", entityId);

  const rows = (data ?? []) as unknown as EntityEmailHistoryRow[];

  return rows
    .filter((r) => r.email_sends && r.email_sends.tournament_id === tournamentId)
    .sort(
      (a, b) =>
        new Date(b.email_sends!.sent_at).getTime() -
        new Date(a.email_sends!.sent_at).getTime(),
    );
}
