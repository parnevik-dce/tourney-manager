"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentTournament } from "@/lib/tournament";
import { getCurrentProfile } from "@/lib/profile";
import { teamImportLabel } from "@/lib/team-name";

export async function createAssociation(formData: FormData) {
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "");
  const mascot = String(formData.get("mascot") || "") || null;
  const contactName = String(formData.get("contact_name") || "");
  const contactRole = String(formData.get("contact_role") || "") || null;
  const contactEmail = String(formData.get("contact_email") || "") || null;
  const contactPhone = String(formData.get("contact_phone") || "") || null;

  const { data: association, error } = await supabase
    .from("associations")
    .insert({ name, mascot })
    .select()
    .single();

  if (error) throw new Error(error.message);

  if (contactName) {
    const { error: contactError } = await supabase
      .from("association_contacts")
      .insert({
        association_id: association.id,
        name: contactName,
        role: contactRole,
        email: contactEmail,
        phone: contactPhone,
      });

    if (contactError) throw new Error(contactError.message);
  }

  revalidatePath("/associations");
  revalidatePath("/associations/list");
}

export async function updateAssociation(
  associationId: string,
  formData: FormData,
) {
  const supabase = await createClient();
  const name = String(formData.get("name") ?? "");
  const mascot = String(formData.get("mascot") || "") || null;

  const { error } = await supabase
    .from("associations")
    .update({ name, mascot })
    .eq("id", associationId);

  if (error) throw new Error(error.message);

  revalidatePath("/associations");
  revalidatePath("/associations/list");
}

export async function updateAssociationContact(
  contactId: string,
  formData: FormData,
) {
  const supabase = await createClient();
  const name = String(formData.get("name") ?? "");
  const role = String(formData.get("role") || "") || null;
  const phone = String(formData.get("phone") || "") || null;
  const email = String(formData.get("email") || "") || null;

  const { error } = await supabase
    .from("association_contacts")
    .update({ name, role, phone, email })
    .eq("id", contactId);

  if (error) throw new Error(error.message);

  revalidatePath("/associations");
  revalidatePath("/associations/contacts");
}

export async function addAssociationContact(
  associationId: string,
  formData: FormData,
) {
  const supabase = await createClient();
  const name = String(formData.get("name") ?? "");
  const role = String(formData.get("role") || "") || null;
  const phone = String(formData.get("phone") || "") || null;
  const email = String(formData.get("email") || "") || null;
  if (!name.trim()) return;

  const { error } = await supabase.from("association_contacts").insert({
    association_id: associationId,
    name,
    role,
    phone,
    email,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/associations");
  revalidatePath("/associations/contacts");
}

export async function createContact(formData: FormData) {
  const supabase = await createClient();
  const target = String(formData.get("target") || "");
  const [scope, targetId] = target.split(":");
  const name = String(formData.get("name") ?? "");
  const role = String(formData.get("role") || "") || null;
  const phone = String(formData.get("phone") || "") || null;
  const email = String(formData.get("email") || "") || null;
  if (!name.trim() || !targetId) return;

  const table = scope === "team" ? "team_contacts" : "association_contacts";
  const idField = scope === "team" ? "team_id" : "association_id";

  const { error } = await supabase.from(table).insert({
    [idField]: targetId,
    name,
    role,
    phone,
    email,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/associations");
  revalidatePath("/associations/contacts");
}

export async function createTeam(formData: FormData) {
  const supabase = await createClient();
  const tournament = await getCurrentTournament();
  if (!tournament) throw new Error("No active tournament");

  const association_id = String(formData.get("association_id"));
  const name = String(formData.get("name") || "").trim() || null;
  const division_id = String(formData.get("division_id") || "") || null;
  const registration_status = String(
    formData.get("registration_status") || "pending",
  );
  const contactName = String(formData.get("contact_name") || "");
  const contactEmail = String(formData.get("contact_email") || "") || null;
  const contactPhone = String(formData.get("contact_phone") || "") || null;
  const contactRole = String(formData.get("contact_role") || "") || null;

  const { data: team, error } = await supabase
    .from("teams")
    .insert({
      tournament_id: tournament.id,
      association_id,
      name,
      division_id,
      registration_status,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  if (contactName) {
    const { error: contactError } = await supabase.from("team_contacts").insert({
      team_id: team.id,
      name: contactName,
      email: contactEmail,
      phone: contactPhone,
      role: contactRole,
    });

    if (contactError) throw new Error(contactError.message);
  }

  revalidatePath("/associations");
  revalidatePath("/associations/teams");
}

export async function updateTeam(teamId: string, formData: FormData) {
  const supabase = await createClient();

  const name = String(formData.get("name") || "").trim() || null;
  const division_id = String(formData.get("division_id") || "") || null;
  const registration_status = String(
    formData.get("registration_status") || "pending",
  );

  const { error } = await supabase
    .from("teams")
    .update({ name, division_id, registration_status })
    .eq("id", teamId);

  if (error) throw new Error(error.message);

  revalidatePath("/associations");
  revalidatePath("/associations/teams");
}

export async function updateTeamStatus(teamId: string, formData: FormData) {
  const supabase = await createClient();
  const status = String(formData.get("status"));

  const { error } = await supabase
    .from("teams")
    .update({ registration_status: status })
    .eq("id", teamId);

  if (error) throw new Error(error.message);

  revalidatePath("/associations");
}

export async function updateTeamContact(
  contactId: string,
  formData: FormData,
) {
  const supabase = await createClient();
  const name = String(formData.get("name") ?? "");
  const role = String(formData.get("role") || "") || null;
  const phone = String(formData.get("phone") || "") || null;
  const email = String(formData.get("email") || "") || null;

  const { error } = await supabase
    .from("team_contacts")
    .update({ name, role, phone, email })
    .eq("id", contactId);

  if (error) throw new Error(error.message);

  revalidatePath("/associations");
  revalidatePath("/associations/contacts");
}

export async function addTeamContact(teamId: string, formData: FormData) {
  const supabase = await createClient();
  const name = String(formData.get("name") ?? "");
  const role = String(formData.get("role") || "") || null;
  const phone = String(formData.get("phone") || "") || null;
  const email = String(formData.get("email") || "") || null;
  if (!name.trim()) return;

  const { error } = await supabase.from("team_contacts").insert({
    team_id: teamId,
    name,
    role,
    phone,
    email,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/associations");
  revalidatePath("/associations/contacts");
}

export async function uploadRoster(teamId: string, formData: FormData) {
  const profile = await getCurrentProfile();
  if (profile?.role !== "director") throw new Error("Not authorized");

  const file = formData.get("roster_file");
  if (!(file instanceof File) || file.size === 0) return;

  const admin = createAdminClient();
  const path = `${teamId}/${Date.now()}-${file.name}`;

  const { error: uploadError } = await admin.storage
    .from("rosters")
    .upload(path, file, { contentType: file.type });

  if (uploadError) throw new Error(uploadError.message);

  const supabase = await createClient();
  const { error } = await supabase
    .from("teams")
    .update({ roster_file_url: path, roster_uploaded_at: new Date().toISOString() })
    .eq("id", teamId);

  if (error) throw new Error(error.message);

  revalidatePath("/associations");
}

export async function deleteAssociationContact(contactId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("association_contacts")
    .delete()
    .eq("id", contactId);

  if (error) throw new Error(error.message);

  revalidatePath("/associations");
  revalidatePath("/associations/contacts");
}

export async function deleteTeamContact(contactId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("team_contacts")
    .delete()
    .eq("id", contactId);

  if (error) throw new Error(error.message);

  revalidatePath("/associations");
  revalidatePath("/associations/contacts");
}

export async function deleteAssociation(associationId: string) {
  const supabase = await createClient();

  const { count: teamCount } = await supabase
    .from("teams")
    .select("id", { count: "exact", head: true })
    .eq("association_id", associationId);

  if (teamCount && teamCount > 0) {
    redirect(
      `/associations?error=${encodeURIComponent(
        `Can't delete this association — it has ${teamCount} team${teamCount === 1 ? "" : "s"} on record (across all tournament years). Delete those teams first.`,
      )}`,
    );
  }

  const { error } = await supabase
    .from("associations")
    .delete()
    .eq("id", associationId);

  if (error) throw new Error(error.message);

  revalidatePath("/associations");
  revalidatePath("/associations/list");
}

export async function deleteTeam(teamId: string) {
  const supabase = await createClient();

  const { count: playerCount } = await supabase
    .from("players")
    .select("id", { count: "exact", head: true })
    .eq("team_id", teamId);

  if (playerCount && playerCount > 0) {
    redirect(
      `/associations?error=${encodeURIComponent(
        `Can't delete this team — it has ${playerCount} player${playerCount === 1 ? "" : "s"} on its roster (including any submitted waivers). Remove the roster first.`,
      )}`,
    );
  }

  const { error } = await supabase.from("teams").delete().eq("id", teamId);

  if (error) throw new Error(error.message);

  revalidatePath("/associations");
  revalidatePath("/associations/teams");
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") {
      field += char;
    }
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

const ROSTER_CSV_HEADERS = [
  "first_name",
  "last_name",
  "jersey_number",
  "birthdate",
  "usa_lacrosse_number",
  "email",
] as const;

export async function importRosterCsv(teamId: string, formData: FormData) {
  const profile = await getCurrentProfile();
  if (profile?.role !== "director") throw new Error("Not authorized");

  const file = formData.get("csv_file");
  if (!(file instanceof File) || file.size === 0) return;

  const text = await file.text();
  const rows = parseCsv(text).filter((r) => r.some((c) => c.trim() !== ""));
  if (rows.length < 2) return;

  const header = rows[0].map((h) => h.trim().toLowerCase());
  const colIndex = Object.fromEntries(
    ROSTER_CSV_HEADERS.map((h) => [h, header.indexOf(h)]),
  );

  const players = rows
    .slice(1)
    .map((r) => {
      const first_name = r[colIndex.first_name]?.trim() || null;
      const last_name = r[colIndex.last_name]?.trim() || null;
      return {
        team_id: teamId,
        // Legacy required column — kept in sync for any code still reading it.
        full_name: `${first_name ?? ""} ${last_name ?? ""}`.trim(),
        first_name,
        last_name,
        jersey_number: r[colIndex.jersey_number]?.trim() || null,
        birthdate: r[colIndex.birthdate]?.trim() || null,
        usa_lacrosse_number: r[colIndex.usa_lacrosse_number]?.trim() || null,
        email: r[colIndex.email]?.trim() || null,
      };
    })
    .filter((p) => p.first_name || p.last_name);

  if (!players.length) return;

  const supabase = await createClient();
  const { error } = await supabase.from("players").insert(players);

  if (error) throw new Error(error.message);

  revalidatePath("/associations/rosters");
}

const BULK_ROSTER_CSV_HEADERS = [
  "team",
  "first_name",
  "last_name",
  "jersey_number",
  "birthdate",
  "usa_lacrosse_number",
  "email",
] as const;

export async function importRostersCsvBulk(formData: FormData) {
  const profile = await getCurrentProfile();
  if (profile?.role !== "director") throw new Error("Not authorized");

  const tournament = await getCurrentTournament();
  if (!tournament) throw new Error("No active tournament");

  const file = formData.get("csv_file");
  if (!(file instanceof File) || file.size === 0) return;

  const text = await file.text();
  const rows = parseCsv(text).filter((r) => r.some((c) => c.trim() !== ""));
  if (rows.length < 2) return;

  const header = rows[0].map((h) => h.trim().toLowerCase());
  const colIndex = Object.fromEntries(
    BULK_ROSTER_CSV_HEADERS.map((h) => [h, header.indexOf(h)]),
  );

  const supabase = await createClient();

  const { data: teams } = await supabase
    .from("teams")
    .select("*, associations(name), divisions(name)")
    .eq("tournament_id", tournament.id);

  const teamByLabel = new Map<string, string>();
  const teamsByAssociation = new Map<string, string[]>();
  for (const t of teams ?? []) {
    const assocName = t.associations?.name ?? "";
    const label = teamImportLabel(t.name, assocName, t.divisions?.name)
      .toLowerCase()
      .trim();
    teamByLabel.set(label, t.id);
    const assocKey = assocName.toLowerCase().trim();
    const list = teamsByAssociation.get(assocKey) ?? [];
    list.push(t.id);
    teamsByAssociation.set(assocKey, list);
  }

  function buildPlayer(teamId: string, r: string[]) {
    const first_name = r[colIndex.first_name]?.trim() || null;
    const last_name = r[colIndex.last_name]?.trim() || null;
    return {
      team_id: teamId,
      full_name: `${first_name ?? ""} ${last_name ?? ""}`.trim(),
      first_name,
      last_name,
      jersey_number: r[colIndex.jersey_number]?.trim() || null,
      birthdate: r[colIndex.birthdate]?.trim() || null,
      usa_lacrosse_number: r[colIndex.usa_lacrosse_number]?.trim() || null,
      email: r[colIndex.email]?.trim() || null,
    };
  }

  const playersByTeam = new Map<string, ReturnType<typeof buildPlayer>[]>();
  const unmatchedTeamValues = new Set<string>();

  for (const r of rows.slice(1)) {
    const teamValue = r[colIndex.team]?.trim();
    if (!teamValue) continue;

    const normalized = teamValue.toLowerCase();
    let teamId = teamByLabel.get(normalized);
    if (!teamId) {
      const candidates = teamsByAssociation.get(normalized);
      if (candidates?.length === 1) teamId = candidates[0];
    }

    if (!teamId) {
      unmatchedTeamValues.add(teamValue);
      continue;
    }

    const player = buildPlayer(teamId, r);
    if (!player.first_name && !player.last_name) continue;

    const list = playersByTeam.get(teamId) ?? [];
    list.push(player);
    playersByTeam.set(teamId, list);
  }

  const allPlayers = [...playersByTeam.values()].flat();
  let imported = 0;

  if (allPlayers.length) {
    const { error } = await supabase.from("players").insert(allPlayers);
    if (error) throw new Error(error.message);
    imported = allPlayers.length;
  }

  revalidatePath("/associations/rosters");

  const teamsImported = playersByTeam.size;
  const messageParts = [
    `Imported ${imported} player${imported === 1 ? "" : "s"} across ${teamsImported} team${teamsImported === 1 ? "" : "s"}.`,
  ];
  if (unmatchedTeamValues.size) {
    messageParts.push(
      `Skipped rows for unmatched team${unmatchedTeamValues.size === 1 ? "" : "s"}: ${[...unmatchedTeamValues].join(", ")}.`,
    );
  }

  redirect(
    `/associations/rosters?error=${encodeURIComponent(messageParts.join(" "))}`,
  );
}

export async function deletePlayer(playerId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("players").delete().eq("id", playerId);

  if (error) throw new Error(error.message);

  revalidatePath("/associations/rosters");
}

const ASSOCIATION_CSV_HEADERS = [
  "association_name",
  "president_name",
  "president_email",
  "boys_director_name",
  "boys_director_email",
  "treasurer_name",
  "treasurer_email",
] as const;

const ASSOCIATION_CONTACT_SLOTS = [
  { nameKey: "president_name", emailKey: "president_email", role: "President" },
  {
    nameKey: "boys_director_name",
    emailKey: "boys_director_email",
    role: "Boys Director",
  },
  { nameKey: "treasurer_name", emailKey: "treasurer_email", role: "Treasurer" },
] as const;

export async function importAssociationsCsv(formData: FormData) {
  const profile = await getCurrentProfile();
  if (profile?.role !== "director") throw new Error("Not authorized");

  const file = formData.get("csv_file");
  if (!(file instanceof File) || file.size === 0) return;

  const text = await file.text();
  const rows = parseCsv(text).filter((r) => r.some((c) => c.trim() !== ""));
  if (rows.length < 2) return;

  const header = rows[0].map((h) =>
    h.trim().toLowerCase().replace(/\s+/g, "_"),
  );
  const colIndex = Object.fromEntries(
    ASSOCIATION_CSV_HEADERS.map((h) => [h, header.indexOf(h)]),
  );

  const supabase = await createClient();

  let imported = 0;
  let skipped = 0;

  for (const r of rows.slice(1)) {
    const associationName = r[colIndex.association_name]?.trim();
    if (!associationName) {
      skipped++;
      continue;
    }

    const { data: existing } = await supabase
      .from("associations")
      .select("id")
      .ilike("name", associationName)
      .maybeSingle();

    let associationId: string | undefined = existing?.id;
    if (!associationId) {
      const { data: created, error: createError } = await supabase
        .from("associations")
        .insert({ name: associationName })
        .select("id")
        .single();
      if (createError) throw new Error(createError.message);
      associationId = created.id;
    }

    for (const slot of ASSOCIATION_CONTACT_SLOTS) {
      const name = r[colIndex[slot.nameKey]]?.trim();
      const email = r[colIndex[slot.emailKey]]?.trim() || null;
      if (!name) continue;

      const { error: contactError } = await supabase
        .from("association_contacts")
        .insert({
          association_id: associationId,
          name,
          email,
          role: slot.role,
        });
      if (contactError) throw new Error(contactError.message);
    }

    imported++;
  }

  revalidatePath("/associations");
  revalidatePath("/associations/list");

  if (skipped > 0) {
    redirect(
      `/associations/list?error=${encodeURIComponent(
        `Imported ${imported} association${imported === 1 ? "" : "s"}. Skipped ${skipped} row${skipped === 1 ? "" : "s"} missing an association name.`,
      )}`,
    );
  }
}
