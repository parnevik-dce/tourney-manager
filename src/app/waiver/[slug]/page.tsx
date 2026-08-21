import { createAdminClient } from "@/lib/supabase/admin";
import { submitWaiver } from "./actions";

function Shell({
  title,
  logoUrl,
  children,
}: {
  title?: string;
  logoUrl?: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        {logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt=""
            className="mx-auto mb-3 h-14 w-14 rounded object-contain"
          />
        )}
        <p className="text-center text-xs font-semibold uppercase tracking-wide text-slate-400">
          Ice Breaker Tournament Manager
        </p>
        <h1 className="mt-1 text-center text-xl font-semibold text-slate-900">
          {title ?? "Waiver Form"}
        </h1>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}

export default async function WaiverPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    association?: string;
    division?: string;
    team?: string;
    done?: string;
    error?: string;
  }>;
}) {
  const { slug } = await params;
  const {
    association: associationId,
    division: divisionId,
    team: teamId,
    done,
    error,
  } = await searchParams;
  const supabase = createAdminClient();

  const { data: tournament } = await supabase
    .from("tournaments")
    .select("*")
    .eq("public_slug", slug)
    .maybeSingle();

  if (!tournament) {
    return (
      <Shell>
        <p className="text-sm text-slate-600">
          We couldn&apos;t find a tournament for this link.
        </p>
      </Shell>
    );
  }

  const logoUrl = tournament.logo_url as string | null;

  if (done) {
    return (
      <Shell title={tournament.name} logoUrl={logoUrl}>
        <p className="text-sm text-slate-600">
          Waiver submitted — thank you!
        </p>
      </Shell>
    );
  }

  const [{ data: rawTeams }, { data: rawAssociations }, { data: rawDivisions }] =
    await Promise.all([
      supabase
        .from("teams")
        .select("id, name, association_id, division_id")
        .eq("tournament_id", tournament.id)
        .eq("registration_status", "registered")
        .order("name"),
      supabase.from("associations").select("id, name").order("name"),
      supabase
        .from("divisions")
        .select("id, name")
        .eq("tournament_id", tournament.id)
        .order("sort_order"),
    ]);

  const teams = rawTeams ?? [];
  const associationsAll = rawAssociations ?? [];
  const divisionsAll = rawDivisions ?? [];

  const associationIds = new Set(teams.map((t) => t.association_id));
  const associations = associationsAll.filter((a) => associationIds.has(a.id));

  if (!associationId) {
    return (
      <Shell title={tournament.name} logoUrl={logoUrl}>
        {teams.length ? (
          <>
            <p className="mb-4 text-sm text-slate-500">
              Select your association to submit a waiver.
            </p>
            <form method="get" className="space-y-4">
              <select
                name="association"
                required
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">Select your association…</option>
                {associations.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                Continue
              </button>
            </form>
          </>
        ) : (
          <p className="text-sm text-amber-700">
            No registered teams yet. Please check back later.
          </p>
        )}
      </Shell>
    );
  }

  const assocTeams = teams.filter((t) => t.association_id === associationId);
  const divisionIds = new Set(assocTeams.map((t) => t.division_id));
  const divisions = divisionsAll.filter((d) => divisionIds.has(d.id));

  if (!divisionId) {
    return (
      <Shell title={tournament.name} logoUrl={logoUrl}>
        <p className="mb-4 text-sm text-slate-500">Select your division.</p>
        <form method="get" className="space-y-4">
          <input type="hidden" name="association" value={associationId} />
          <select
            name="division"
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Select your division…</option>
            {divisions.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Continue
          </button>
        </form>
      </Shell>
    );
  }

  const divisionTeams = assocTeams.filter((t) => t.division_id === divisionId);

  if (!teamId) {
    return (
      <Shell title={tournament.name} logoUrl={logoUrl}>
        <p className="mb-4 text-sm text-slate-500">Select your team.</p>
        <form method="get" className="space-y-4">
          <input type="hidden" name="association" value={associationId} />
          <input type="hidden" name="division" value={divisionId} />
          <select
            name="team"
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Select your team…</option>
            {divisionTeams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Continue
          </button>
        </form>
      </Shell>
    );
  }

  const team = divisionTeams.find((t) => t.id === teamId);

  const { data: siteSettings } = await supabase
    .from("site_settings")
    .select("waiver_content")
    .eq("tournament_id", tournament.id)
    .maybeSingle();

  return (
    <Shell title={tournament.name} logoUrl={logoUrl}>
      {error === "duplicate" && (
        <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          A waiver has already been submitted for this participant on this
          team.
        </p>
      )}
      {error === "consent" && (
        <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          You must consent to the waiver/release to submit.
        </p>
      )}
      <p className="mb-4 text-sm text-slate-500">
        Submitting waiver for <strong>{team?.name}</strong>.
      </p>
      <form action={submitWaiver} className="space-y-4">
        <input type="hidden" name="tournament_id" value={tournament.id} />
        <input type="hidden" name="team_id" value={teamId} />
        <input type="hidden" name="association_id" value={associationId} />
        <input type="hidden" name="division_id" value={divisionId} />
        <input type="hidden" name="slug" value={slug} />
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm text-slate-700">
            First name
            <input
              name="participant_first_name"
              required
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm text-slate-700">
            Last name
            <input
              name="participant_last_name"
              required
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
        </div>
        <label className="block text-sm text-slate-700">
          Birthdate
          <input
            name="participant_birthdate"
            type="date"
            required
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm text-slate-700">
            Guardian first name
            <input
              name="guardian_first_name"
              required
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm text-slate-700">
            Guardian last name
            <input
              name="guardian_last_name"
              required
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
        </div>

        {siteSettings?.waiver_content && (
          <div className="max-h-48 overflow-y-auto whitespace-pre-wrap rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
            {siteSettings.waiver_content}
          </div>
        )}

        <label className="flex items-start gap-2 text-sm text-slate-700">
          <input type="checkbox" name="consent" required className="mt-0.5" />
          <span>I consent to the waiver / release above.</span>
        </label>

        <button
          type="submit"
          className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Submit waiver
        </button>
      </form>
    </Shell>
  );
}
