"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/profile";
import { createAdminClient } from "@/lib/supabase/admin";

export async function connectGmail(formData: FormData) {
  const profile = await getCurrentProfile();
  if (profile?.role !== "director") throw new Error("Not authorized");

  const email = String(formData.get("email") || "").trim();
  const app_password = String(formData.get("app_password") || "")
    .replace(/\s+/g, "")
    .trim();

  if (!email) throw new Error("Email is required.");
  if (!app_password) throw new Error("App password is required.");

  const admin = createAdminClient();

  const { error: deleteError } = await admin
    .from("gmail_connection")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");
  if (deleteError) throw new Error(deleteError.message);

  const { error } = await admin.from("gmail_connection").insert({
    email,
    app_password,
    connected_by: profile.id,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/settings");
}

export async function disconnectGmail() {
  const profile = await getCurrentProfile();
  if (profile?.role !== "director") throw new Error("Not authorized");

  const admin = createAdminClient();
  const { error } = await admin
    .from("gmail_connection")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");

  if (error) throw new Error(error.message);

  revalidatePath("/settings");
}
