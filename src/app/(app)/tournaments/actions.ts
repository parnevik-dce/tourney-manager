"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/lib/profile";

export async function createTournament(formData: FormData) {
  const supabase = await createClient();

  const year = Number(formData.get("year"));
  const name = String(formData.get("name") ?? "");
  const start_date = String(formData.get("start_date") || "") || null;
  const end_date = String(formData.get("end_date") || "") || null;
  const location = String(formData.get("location") || "") || null;
  const public_slug = String(formData.get("public_slug") || year);

  const { data: tournament, error } = await supabase
    .from("tournaments")
    .insert({
      year,
      name,
      start_date,
      end_date,
      location,
      public_slug,
      status: "active",
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const { error: deactivateError } = await supabase
    .from("tournaments")
    .update({ status: "inactive" })
    .neq("id", tournament.id);

  if (deactivateError) {
    throw new Error(deactivateError.message);
  }

  const { error: divisionsError } = await supabase.from("divisions").insert(
    ["8U", "10U", "12U", "14U"].map((divisionName, i) => ({
      tournament_id: tournament.id,
      name: divisionName,
      sort_order: i,
    })),
  );

  if (divisionsError) {
    throw new Error(divisionsError.message);
  }

  const { error: siteSettingsError } = await supabase
    .from("site_settings")
    .insert({ tournament_id: tournament.id });

  if (siteSettingsError) {
    throw new Error(siteSettingsError.message);
  }

  redirect("/tournaments");
}

export async function updateTournament(tournamentId: string, formData: FormData) {
  const supabase = await createClient();

  const year = Number(formData.get("year"));
  const name = String(formData.get("name") ?? "");
  const start_date = String(formData.get("start_date") || "") || null;
  const end_date = String(formData.get("end_date") || "") || null;
  const location = String(formData.get("location") || "") || null;
  const public_slug = String(formData.get("public_slug") || year);
  const status = String(formData.get("status") || "active");

  const { error } = await supabase
    .from("tournaments")
    .update({
      year,
      name,
      start_date,
      end_date,
      location,
      public_slug,
      status,
    })
    .eq("id", tournamentId);

  if (error) {
    throw new Error(error.message);
  }

  if (status === "active") {
    const { error: deactivateError } = await supabase
      .from("tournaments")
      .update({ status: "inactive" })
      .neq("id", tournamentId);

    if (deactivateError) {
      throw new Error(deactivateError.message);
    }
  }

  revalidatePath("/tournaments");
  revalidatePath("/");
}

export async function uploadTournamentLogo(
  tournamentId: string,
  formData: FormData,
) {
  const profile = await getCurrentProfile();
  if (profile?.role !== "director") throw new Error("Not authorized");

  const file = formData.get("logo_file");
  if (!(file instanceof File) || file.size === 0) return;

  const admin = createAdminClient();
  const path = `${tournamentId}/${Date.now()}-${file.name}`;

  const { error: uploadError } = await admin.storage
    .from("tournament-logos")
    .upload(path, file, { contentType: file.type });

  if (uploadError) throw new Error(uploadError.message);

  const {
    data: { publicUrl },
  } = admin.storage.from("tournament-logos").getPublicUrl(path);

  const supabase = await createClient();
  const { error } = await supabase
    .from("tournaments")
    .update({ logo_url: publicUrl })
    .eq("id", tournamentId);

  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/tournaments");
  revalidatePath("/site/[slug]", "page");
}
