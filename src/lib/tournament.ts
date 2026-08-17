import { createClient } from "@/lib/supabase/server";

export async function getCurrentTournament() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tournaments")
    .select("*")
    .eq("status", "active")
    .order("year", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data;
}
