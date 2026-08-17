import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ teamId: string }> },
) {
  const { teamId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", _request.url));
  }

  const { data: team } = await supabase
    .from("teams")
    .select("roster_file_url")
    .eq("id", teamId)
    .single();

  if (!team?.roster_file_url) {
    return NextResponse.json({ error: "No roster uploaded" }, { status: 404 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from("rosters")
    .createSignedUrl(team.roster_file_url, 300);

  if (error || !data) {
    return NextResponse.json({ error: "Could not generate link" }, { status: 500 });
  }

  return NextResponse.redirect(data.signedUrl);
}
