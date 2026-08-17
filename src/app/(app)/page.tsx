import Link from "next/link";
import { getCurrentProfile } from "@/lib/profile";
import { getCurrentTournament } from "@/lib/tournament";

function daysUntil(dateStr: string | null) {
  if (!dateStr) return null;
  const diffMs = new Date(dateStr).getTime() - new Date().setHours(0, 0, 0, 0);
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export default async function DashboardPage() {
  const [profile, tournament] = await Promise.all([
    getCurrentProfile(),
    getCurrentTournament(),
  ]);

  const days = tournament ? daysUntil(tournament.start_date) : null;
  const firstName = (profile?.full_name ?? "").split(" ")[0] || "there";

  return (
    <div className="flex-1 px-8 py-8">
      <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
      <p className="mt-1 text-sm text-slate-500">
        Welcome back, {firstName} — here&apos;s where planning stands.
      </p>

      {!tournament ? (
        <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
          <p className="text-sm text-slate-600">
            No active tournament yet.{" "}
            <Link href="/tournaments" className="font-medium text-blue-600 hover:underline">
              Create one to get started
            </Link>
            .
          </p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Days to Tournament
            </p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">
              {days ?? "—"}
            </p>
            {tournament.start_date && tournament.end_date && (
              <p className="mt-1 text-xs text-slate-500">
                {tournament.start_date} – {tournament.end_date}
              </p>
            )}
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Location
            </p>
            <p className="mt-2 text-sm font-medium text-slate-900">
              {tournament.location ?? "Not set"}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Public Slug
            </p>
            <p className="mt-2 text-sm font-medium text-slate-900">
              /{tournament.public_slug}
            </p>
          </div>
        </div>
      )}

      <div className="mt-6 rounded-lg border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
        Associations, vendors, budget, and task data will show up here as
        those sections get built out.
      </div>
    </div>
  );
}
