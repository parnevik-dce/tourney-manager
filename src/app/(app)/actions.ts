"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentTournament } from "@/lib/tournament";

export async function updateSiteSettings(formData: FormData) {
  const supabase = await createClient();
  const tournament = await getCurrentTournament();
  if (!tournament) throw new Error("No active tournament");

  const hero_title = String(formData.get("hero_title") || "") || null;
  const hero_subtitle = String(formData.get("hero_subtitle") || "") || null;
  const waiver_form_url =
    String(formData.get("waiver_form_url") || "") || null;

  const { error } = await supabase
    .from("site_settings")
    .update({ hero_title, hero_subtitle, waiver_form_url })
    .eq("tournament_id", tournament.id);

  if (error) throw new Error(error.message);

  revalidatePath("/");
}

export async function togglePublished() {
  const supabase = await createClient();
  const tournament = await getCurrentTournament();
  if (!tournament) throw new Error("No active tournament");

  const { data: current } = await supabase
    .from("site_settings")
    .select("published")
    .eq("tournament_id", tournament.id)
    .single();

  const { error } = await supabase
    .from("site_settings")
    .update({ published: !current?.published })
    .eq("tournament_id", tournament.id);

  if (error) throw new Error(error.message);

  revalidatePath("/");
}

export async function toggleMaintenanceMode() {
  const supabase = await createClient();
  const tournament = await getCurrentTournament();
  if (!tournament) throw new Error("No active tournament");

  const { data: current } = await supabase
    .from("site_settings")
    .select("maintenance_mode")
    .eq("tournament_id", tournament.id)
    .single();

  const { error } = await supabase
    .from("site_settings")
    .update({ maintenance_mode: !current?.maintenance_mode })
    .eq("tournament_id", tournament.id);

  if (error) throw new Error(error.message);

  revalidatePath("/");
}

export async function createSiteUpdate(formData: FormData) {
  const supabase = await createClient();
  const tournament = await getCurrentTournament();
  if (!tournament) throw new Error("No active tournament");

  const title = String(formData.get("title") ?? "");
  const body = String(formData.get("body") || "") || null;

  const { error } = await supabase.from("site_updates").insert({
    tournament_id: tournament.id,
    title,
    body,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/");
}

export async function toggleSiteUpdatePublished(
  updateId: string,
  currentlyPublished: boolean,
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("site_updates")
    .update({
      status: currentlyPublished ? "draft" : "published",
      published_at: currentlyPublished ? null : new Date().toISOString(),
    })
    .eq("id", updateId);

  if (error) throw new Error(error.message);

  revalidatePath("/");
}
