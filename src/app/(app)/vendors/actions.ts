"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentTournament } from "@/lib/tournament";

export async function createVendor(formData: FormData) {
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "");
  const type = String(formData.get("type") ?? "other");
  const contactName = String(formData.get("contact_name") || "");
  const contactEmail = String(formData.get("contact_email") || "") || null;
  const contactPhone = String(formData.get("contact_phone") || "") || null;

  const { data: vendor, error } = await supabase
    .from("vendors")
    .insert({ name, type })
    .select()
    .single();

  if (error) throw new Error(error.message);

  if (contactName) {
    const { error: contactError } = await supabase.from("vendor_contacts").insert({
      vendor_id: vendor.id,
      name: contactName,
      email: contactEmail,
      phone: contactPhone,
    });

    if (contactError) throw new Error(contactError.message);
  }

  revalidatePath("/vendors");
}

export async function updateVendor(vendorId: string, formData: FormData) {
  const supabase = await createClient();
  const name = String(formData.get("name") ?? "");
  const type = String(formData.get("type") ?? "other");

  const { error } = await supabase
    .from("vendors")
    .update({ name, type })
    .eq("id", vendorId);

  if (error) throw new Error(error.message);

  revalidatePath("/vendors");
}

export async function updateVendorContact(
  contactId: string,
  formData: FormData,
) {
  const supabase = await createClient();
  const name = String(formData.get("name") ?? "");
  const phone = String(formData.get("phone") || "") || null;
  const email = String(formData.get("email") || "") || null;

  const { error } = await supabase
    .from("vendor_contacts")
    .update({ name, phone, email })
    .eq("id", contactId);

  if (error) throw new Error(error.message);

  revalidatePath("/vendors");
}

export async function deleteVendor(vendorId: string) {
  const supabase = await createClient();

  const { count: budgetItemCount } = await supabase
    .from("budget_items")
    .select("id", { count: "exact", head: true })
    .eq("vendor_id", vendorId);

  if (budgetItemCount && budgetItemCount > 0) {
    redirect(
      `/vendors?error=${encodeURIComponent(
        `Can't delete this vendor — it's linked to ${budgetItemCount} budget item${budgetItemCount === 1 ? "" : "s"}. Unlink or delete those first.`,
      )}`,
    );
  }

  const { error } = await supabase.from("vendors").delete().eq("id", vendorId);

  if (error) throw new Error(error.message);

  revalidatePath("/vendors");
}

export async function updateVendorStatus(vendorId: string, formData: FormData) {
  const supabase = await createClient();
  const tournament = await getCurrentTournament();
  if (!tournament) throw new Error("No active tournament");

  const status = String(formData.get("status"));

  const { error } = await supabase
    .from("vendor_tournament_status")
    .upsert(
      { tournament_id: tournament.id, vendor_id: vendorId, status },
      { onConflict: "tournament_id,vendor_id" },
    );

  if (error) throw new Error(error.message);

  revalidatePath("/vendors");
}
