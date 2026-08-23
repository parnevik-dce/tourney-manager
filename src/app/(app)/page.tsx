import Link from "next/link";
import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/profile";
import { getCurrentTournament } from "@/lib/tournament";
import { CollapsibleDetails } from "@/components/collapsible-details";
import {
  updateSiteSettings,
  createSiteUpdate,
  toggleSiteUpdatePublished,
} from "./actions";

function daysUntil(dateStr: string | null) {
  if (!dateStr) return null;
  const diffMs = new Date(dateStr).getTime() - new Date().setHours(0, 0, 0, 0);
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

const VENDOR_STATUS_LABELS: Record<string, string> = {
  not_confirmed: "Not Confirmed",
  pending: "Pending",
  committed: "Committed",
};

const VENDOR_STATUS_BADGE: Record<string, string> = {
  not_confirmed: "bg-red-100 text-red-700",
  pending: "bg-amber-100 text-amber-700",
  committed: "bg-green-100 text-green-700",
};

const TASK_BUCKETS = [
  { label: "Due in 0-30 days", min: 0, max: 30 },
  { label: "Due in 31-60 days", min: 31, max: 60 },
  { label: "Due in 90+ days", min: 90, max: Infinity },
];

export default async function DashboardPage() {
  const supabase = await createClient();
  const [profile, tournament] = await Promise.all([
    getCurrentProfile(),
    getCurrentTournament(),
  ]);
  const isDirector = profile?.role === "director";

  const days = tournament ? daysUntil(tournament.start_date) : null;
  const firstName = (profile?.full_name ?? "").split(" ")[0] || "there";

  const [
    { data: siteSettings },
    { data: rawUpdates },
    { data: rawTeams },
    { data: rawVendors },
    { data: rawVendorStatuses },
    { data: rawTasks },
  ] = tournament
    ? await Promise.all([
        supabase
          .from("site_settings")
          .select("*")
          .eq("tournament_id", tournament.id)
          .maybeSingle(),
        supabase
          .from("site_updates")
          .select("*")
          .eq("tournament_id", tournament.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("teams")
          .select("id, registration_status")
          .eq("tournament_id", tournament.id),
        supabase.from("vendors").select("id"),
        supabase
          .from("vendor_tournament_status")
          .select("*")
          .eq("tournament_id", tournament.id),
        supabase
          .from("tasks")
          .select("id, title, due_date, status")
          .eq("tournament_id", tournament.id)
          .neq("status", "done"),
      ])
    : [
        { data: null },
        { data: null },
        { data: null },
        { data: null },
        { data: null },
        { data: null },
      ];

  const siteUpdates = rawUpdates ?? [];

  const teams = rawTeams ?? [];
  const teamStatusCounts = {
    registered: teams.filter((t) => t.registration_status === "registered")
      .length,
    pending: teams.filter((t) => t.registration_status === "pending").length,
    dropped: teams.filter((t) => t.registration_status === "dropped").length,
  };

  const vendorStatusByVendor = new Map(
    (rawVendorStatuses ?? []).map((s) => [s.vendor_id, s.status]),
  );
  const vendorStatusCounts = { not_confirmed: 0, pending: 0, committed: 0 };
  for (const v of rawVendors ?? []) {
    const status = vendorStatusByVendor.get(v.id) ?? "not_confirmed";
    vendorStatusCounts[status as keyof typeof vendorStatusCounts]++;
  }

  const now = new Date();
  const todayUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const upcomingTasks = (rawTasks ?? [])
    .filter((t): t is typeof t & { due_date: string } => Boolean(t.due_date))
    .map((t) => {
      const [year, month, day] = t.due_date.split("-").map(Number);
      const dueUtc = Date.UTC(year, month - 1, day);
      return {
        ...t,
        daysUntil: Math.round((dueUtc - todayUtc) / (1000 * 60 * 60 * 24)),
      };
    })
    .sort((a, b) => a.daysUntil - b.daysUntil);

  const waiverUrl = tournament
    ? `${process.env.NEXT_PUBLIC_SITE_URL}/waiver/${tournament.public_slug}`
    : null;
  const qrSvg = waiverUrl
    ? await QRCode.toString(waiverUrl, { type: "svg", margin: 1, width: 120 })
    : null;

  return (
    <div className="flex-1 px-8 py-8">
      <h1 className="font-display text-2xl font-bold text-slate-900">Dashboard</h1>
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

      {tournament && (
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Team Registration
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {teamStatusCounts.registered} / {teams.length} registered
            </p>
            {teams.length > 0 && (
              <div className="mt-3 flex h-2 w-full overflow-hidden rounded-full bg-slate-100">
                {teamStatusCounts.registered > 0 && (
                  <div
                    className="bg-green-500"
                    style={{
                      width: `${(teamStatusCounts.registered / teams.length) * 100}%`,
                    }}
                  />
                )}
                {teamStatusCounts.pending > 0 && (
                  <div
                    className="bg-amber-400"
                    style={{
                      width: `${(teamStatusCounts.pending / teams.length) * 100}%`,
                    }}
                  />
                )}
                {teamStatusCounts.dropped > 0 && (
                  <div
                    className="bg-slate-400"
                    style={{
                      width: `${(teamStatusCounts.dropped / teams.length) * 100}%`,
                    }}
                  />
                )}
              </div>
            )}
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
              <span>{teamStatusCounts.registered} registered</span>
              <span>{teamStatusCounts.pending} pending</span>
              <span>{teamStatusCounts.dropped} dropped</span>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Vendor Snapshot
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {vendorStatusCounts.committed} /{" "}
              {vendorStatusCounts.not_confirmed +
                vendorStatusCounts.pending +
                vendorStatusCounts.committed}{" "}
              committed
            </p>
            <div className="mt-3 space-y-1.5">
              {(
                Object.entries(vendorStatusCounts) as [
                  keyof typeof vendorStatusCounts,
                  number,
                ][]
              ).map(([status, count]) => (
                <div
                  key={status}
                  className="flex items-center justify-between text-xs"
                >
                  <span
                    className={`rounded-full px-2 py-0.5 font-medium ${VENDOR_STATUS_BADGE[status]}`}
                  >
                    {VENDOR_STATUS_LABELS[status]}
                  </span>
                  <span className="text-slate-500">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Upcoming Tasks
            </p>
            <div className="mt-3 space-y-3">
              {TASK_BUCKETS.map((bucket) => {
                const bucketTasks = upcomingTasks.filter(
                  (t) => t.daysUntil >= bucket.min && t.daysUntil <= bucket.max,
                );
                return (
                  <div key={bucket.label}>
                    <p className="text-xs font-semibold text-slate-700">
                      {bucket.label}{" "}
                      <span className="font-normal text-slate-400">
                        ({bucketTasks.length})
                      </span>
                    </p>
                    {bucketTasks.length > 0 ? (
                      <ul className="mt-1 space-y-0.5">
                        {bucketTasks.map((t) => (
                          <li
                            key={t.id}
                            className="truncate text-xs text-slate-500"
                          >
                            {t.title}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-1 text-xs text-slate-300">None</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {tournament && qrSvg && (
        <div className="mt-6 flex items-center justify-between rounded-lg border border-slate-200 bg-white p-6">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              {tournament.year} Waiver Check-In QR Code
            </p>
            <p className="mt-1 max-w-md text-sm text-slate-500">
              Display this at the registration table — scanning it opens the{" "}
              {tournament.year} waiver form directly so parents can submit on
              the spot.
            </p>
            <p className="mt-2 text-xs text-slate-400">{waiverUrl}</p>
          </div>
          <div
            className="shrink-0"
            dangerouslySetInnerHTML={{ __html: qrSvg }}
          />
        </div>
      )}

      {tournament && (
        <div className="mt-6 rounded-lg border border-slate-200 bg-white">
          <h2 className="border-b border-slate-100 px-5 py-3 text-sm font-semibold text-slate-900">
            Public Site
          </h2>

          {isDirector && (
            <form
              action={updateSiteSettings}
              className="grid grid-cols-2 gap-3 border-b border-slate-100 px-5 py-4"
            >
              <label className="col-span-2 text-sm text-slate-700">
                Hero title
                <input
                  name="hero_title"
                  defaultValue={siteSettings?.hero_title ?? ""}
                  placeholder={tournament.name}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                />
              </label>
              <label className="col-span-2 text-sm text-slate-700">
                Hero subtitle
                <input
                  name="hero_subtitle"
                  defaultValue={siteSettings?.hero_subtitle ?? ""}
                  placeholder="Kootenai County Fairgrounds · Coeur d'Alene, Idaho"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                />
              </label>
              <label className="col-span-2 text-sm text-slate-700">
                Waiver / release content
                <textarea
                  name="waiver_content"
                  defaultValue={siteSettings?.waiver_content ?? ""}
                  rows={6}
                  placeholder="Paste the liability waiver / release text shown to families on the waiver form..."
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                />
                <span className="mt-1 block text-xs font-normal text-slate-400">
                  Shown above the consent checkbox on the built-in waiver
                  form.
                </span>
              </label>
              <button
                type="submit"
                className="col-span-2 w-fit rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                Save
              </button>
            </form>
          )}

          <div className="px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Updates
            </p>
            <ul className="mt-2 divide-y divide-slate-100">
              {siteUpdates.map((u) => (
                <li
                  key={u.id}
                  className="flex items-start justify-between gap-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {u.title}
                    </p>
                    {u.body && (
                      <p className="text-sm text-slate-500">{u.body}</p>
                    )}
                  </div>
                  {isDirector ? (
                    <form
                      action={toggleSiteUpdatePublished.bind(
                        null,
                        u.id,
                        u.status === "published",
                      )}
                    >
                      <button
                        type="submit"
                        className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          u.status === "published"
                            ? "bg-green-100 text-green-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {u.status === "published" ? "Published" : "Draft"}
                      </button>
                    </form>
                  ) : (
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        u.status === "published"
                          ? "bg-green-100 text-green-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {u.status === "published" ? "Published" : "Draft"}
                    </span>
                  )}
                </li>
              ))}
              {!siteUpdates.length && (
                <li className="py-4 text-center text-sm text-slate-500">
                  No updates yet.
                </li>
              )}
            </ul>

            {isDirector && (
              <CollapsibleDetails className="mt-3" summary="+ Add Update">
                <form
                  action={createSiteUpdate}
                  className="mt-3 space-y-3"
                >
                  <label className="block text-sm text-slate-700">
                    Title
                    <input
                      name="title"
                      required
                      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                    />
                  </label>
                  <label className="block text-sm text-slate-700">
                    Details (optional)
                    <textarea
                      name="body"
                      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                    />
                  </label>
                  <button
                    type="submit"
                    className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                  >
                    Add update
                  </button>
                </form>
              </CollapsibleDetails>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
