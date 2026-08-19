import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/profile";
import { getCurrentTournament } from "@/lib/tournament";
import { Sidebar } from "@/components/sidebar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [profile, tournament] = await Promise.all([
    getCurrentProfile(),
    getCurrentTournament(),
  ]);

  const { data: siteSettings } = tournament
    ? await supabase
        .from("site_settings")
        .select("published, maintenance_mode, waiver_form_url")
        .eq("tournament_id", tournament.id)
        .maybeSingle()
    : { data: null };

  return (
    <div className="flex min-h-screen w-full flex-1">
      <Sidebar
        tournament={tournament}
        profile={profile}
        siteSettings={siteSettings}
      />
      <main className="flex flex-1 flex-col bg-slate-50">{children}</main>
    </div>
  );
}
