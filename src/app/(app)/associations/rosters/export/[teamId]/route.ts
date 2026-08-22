import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { teamDisplayName } from "@/lib/team-name";

function csvField(value: string | null): string {
  const v = value ?? "";
  if (v.includes(",") || v.includes('"') || v.includes("\n")) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}

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
    .select("*, associations(name), divisions(name)")
    .eq("id", teamId)
    .single();

  const { data: players } = await supabase
    .from("players")
    .select("*")
    .eq("team_id", teamId)
    .order("last_name")
    .order("first_name");

  const header = [
    "first_name",
    "last_name",
    "jersey_number",
    "birthdate",
    "usa_lacrosse_number",
    "email",
  ];

  const lines = [
    header.join(","),
    ...(players ?? []).map((p) => {
      const hasStructuredName = p.first_name || p.last_name;
      const [fallbackFirst, ...fallbackRest] = (p.full_name ?? "").split(" ");
      return [
        csvField(hasStructuredName ? p.first_name : fallbackFirst || null),
        csvField(
          hasStructuredName ? p.last_name : fallbackRest.join(" ") || null,
        ),
        csvField(p.jersey_number),
        csvField(p.birthdate),
        csvField(p.usa_lacrosse_number),
        csvField(p.email),
      ].join(",");
    }),
  ];

  const csv = lines.join("\n") + "\n";
  const displayName = team
    ? teamDisplayName(
        team.name,
        team.associations?.name ?? "roster",
        team.divisions?.name,
      )
    : "roster";
  const filename = `${displayName.replace(/[^a-z0-9]+/gi, "-")}-roster.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
