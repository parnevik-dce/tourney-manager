import { createAdminClient } from "@/lib/supabase/admin";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-slate-50">
      <div className="mx-auto w-full max-w-2xl px-4 py-16">{children}</div>
    </div>
  );
}

export default async function PublicSitePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = createAdminClient();

  const { data: tournament } = await supabase
    .from("tournaments")
    .select("*")
    .eq("public_slug", slug)
    .maybeSingle();

  if (!tournament) {
    return (
      <Shell>
        <p className="text-center text-sm text-slate-600">
          We couldn&apos;t find a tournament for this link.
        </p>
      </Shell>
    );
  }

  const { data: siteSettings } = await supabase
    .from("site_settings")
    .select("*")
    .eq("tournament_id", tournament.id)
    .maybeSingle();

  if (!siteSettings?.published) {
    return (
      <Shell>
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
          <h1 className="text-xl font-semibold text-slate-900">
            {tournament.name}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            This site isn&apos;t live yet — check back soon.
          </p>
        </div>
      </Shell>
    );
  }

  if (siteSettings.maintenance_mode) {
    return (
      <Shell>
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
          <h1 className="text-xl font-semibold text-slate-900">
            {tournament.name}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            We&apos;re making some updates — back soon.
          </p>
        </div>
      </Shell>
    );
  }

  const [{ data: divisions }, { data: teams }, { data: updates }] =
    await Promise.all([
      supabase
        .from("divisions")
        .select("id, name")
        .eq("tournament_id", tournament.id)
        .order("sort_order"),
      supabase
        .from("teams")
        .select("id, name, division_id, registration_status")
        .eq("tournament_id", tournament.id),
      supabase
        .from("site_updates")
        .select("*")
        .eq("tournament_id", tournament.id)
        .eq("status", "published")
        .order("published_at", { ascending: false }),
    ]);

  return (
    <Shell>
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
        {tournament.logo_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={tournament.logo_url}
            alt=""
            className="mx-auto h-16 w-16 rounded object-contain"
          />
        )}
        <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Ice Breaker Tournament Manager
        </p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">
          {siteSettings.hero_title || tournament.name}
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          {siteSettings.hero_subtitle || tournament.location}
        </p>
        {tournament.start_date && tournament.end_date && (
          <p className="mt-1 text-sm font-medium text-blue-700">
            {tournament.start_date} – {tournament.end_date}
          </p>
        )}
        <a
          href={siteSettings.waiver_form_url || `/waiver/${slug}`}
          className="mt-6 inline-block rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
        >
          Submit Waiver Form
        </a>
      </div>

      {divisions && divisions.length > 0 && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-slate-900">
            Registration Status by Division
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-4">
            {divisions.map((d) => {
              const divTeams = (teams ?? []).filter(
                (t) => t.division_id === d.id,
              );
              const registered = divTeams.filter(
                (t) => t.registration_status === "registered",
              ).length;
              return (
                <div
                  key={d.id}
                  className="rounded-lg border border-slate-100 p-3"
                >
                  <p className="text-sm font-semibold text-slate-900">
                    {d.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {registered} of {divTeams.length} teams registered
                  </p>
                  {divTeams.length > 0 && (
                    <ul className="mt-2 space-y-0.5 text-xs text-slate-500">
                      {divTeams.map((t) => (
                        <li key={t.id}>{t.name}</li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {updates && updates.length > 0 && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-slate-900">
            Tournament Updates
          </h2>
          <ul className="mt-4 space-y-4">
            {updates.map((u) => (
              <li key={u.id}>
                <p className="text-sm font-medium text-slate-900">
                  {u.title}
                </p>
                {u.body && (
                  <p className="mt-0.5 text-sm text-slate-500">{u.body}</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Shell>
  );
}
