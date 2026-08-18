import { createAdminClient } from "@/lib/supabase/admin";
import { submitWaiver } from "./actions";

function Shell({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Ice Breaker Tournament Manager
        </p>
        <h1 className="mt-1 text-xl font-semibold text-slate-900">
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
    team?: string;
    player?: string;
    done?: string;
    error?: string;
  }>;
}) {
  const { slug } = await params;
  const {
    team: teamId,
    player: playerId,
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

  if (done) {
    return (
      <Shell title={tournament.name}>
        <p className="text-sm text-slate-600">
          Waiver submitted — thank you!
        </p>
      </Shell>
    );
  }

  const { data: teams } = await supabase
    .from("teams")
    .select("id, name")
    .eq("tournament_id", tournament.id)
    .order("name");

  if (!teamId) {
    return (
      <Shell title={tournament.name}>
        <p className="mb-4 text-sm text-slate-500">
          Select your team to submit a waiver.
        </p>
        <form method="get" className="space-y-4">
          <select
            name="team"
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Select your team…</option>
            {teams?.map((t) => (
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

  const { data: players } = await supabase
    .from("players")
    .select("id, full_name")
    .eq("team_id", teamId)
    .order("full_name");

  if (!playerId) {
    return (
      <Shell title={tournament.name}>
        <p className="mb-4 text-sm text-slate-500">Select your player.</p>
        <form method="get" className="space-y-4">
          <input type="hidden" name="team" value={teamId} />
          {players?.length ? (
            <select
              name="player"
              required
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Select player…</option>
              {players.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name}
                </option>
              ))}
            </select>
          ) : (
            <p className="text-sm text-amber-700">
              No roster has been uploaded for this team yet. Please check
              back later or ask the tournament director.
            </p>
          )}
          {players?.length ? (
            <button
              type="submit"
              className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Continue
            </button>
          ) : null}
        </form>
      </Shell>
    );
  }

  const player = players?.find((p) => p.id === playerId);

  return (
    <Shell title={tournament.name}>
      {error === "duplicate" && (
        <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          A waiver has already been submitted for this player.
        </p>
      )}
      <p className="mb-4 text-sm text-slate-500">
        Submitting waiver for <strong>{player?.full_name}</strong>.
      </p>
      <form action={submitWaiver} className="space-y-4">
        <input type="hidden" name="player_id" value={playerId} />
        <input type="hidden" name="tournament_id" value={tournament.id} />
        <input type="hidden" name="team_id" value={teamId} />
        <input type="hidden" name="slug" value={slug} />
        <label className="block text-sm text-slate-700">
          Your name (parent/guardian)
          <input
            name="signer_name"
            required
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm text-slate-700">
          Relationship to player
          <input
            name="signer_relationship"
            placeholder="Parent/Guardian"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm text-slate-700">
          Email (optional)
          <input
            name="signer_email"
            type="email"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
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
