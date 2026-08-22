import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/profile";
import { getCurrentTournament } from "@/lib/tournament";
import { importRosterCsv, deletePlayer } from "../actions";
import { CollapsibleDetails } from "@/components/collapsible-details";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { AssociationsSubNav } from "@/components/associations-sub-nav";
import { CopyButton } from "@/components/copy-button";

const REFORMAT_PROMPT = `Reformat the attached youth lacrosse team roster into a CSV with exactly this header row: first_name,last_name,jersey_number,birthdate,usa_lacrosse_number,email. Output only the CSV — no extra commentary. Use YYYY-MM-DD for birthdate. Leave a field blank if it's not present in the source file. Keep jersey_number and usa_lacrosse_number as plain text exactly as they appear in the source (e.g. "TBD" stays "TBD"; don't reformat long ID numbers).`;

export default async function RostersPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  const tournament = await getCurrentTournament();
  const isDirector = profile?.role === "director";

  const { data: rawTeams } = tournament
    ? await supabase
        .from("teams")
        .select("*, associations(name), divisions(name), players(*)")
        .eq("tournament_id", tournament.id)
        .order("name")
    : { data: null };

  const teams = rawTeams ?? [];

  return (
    <div className="flex-1 px-8 py-8">
      <h1 className="font-display text-2xl font-bold text-slate-900">
        Associations & Teams
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Manage each team&apos;s roster — import a standard CSV, delete
        players, export the current roster.
      </p>

      <AssociationsSubNav />

      <div className="mt-6 rounded-lg border border-slate-200 bg-white px-5 py-4">
        <CollapsibleDetails
          summary="Roster files come in every format — reformat with AI first"
          summaryClassName="cursor-pointer text-sm font-semibold text-slate-900"
        >
          <p className="mt-3 text-sm text-slate-600">
            Association rosters arrive as CSVs, Excel files, PDFs — every
            layout imaginable. Paste this prompt into an AI tool (along with
            the roster file) to get back a CSV in the standard format this
            page can import.
          </p>
          <div className="mt-3 whitespace-pre-wrap rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
            {REFORMAT_PROMPT}
          </div>
          <div className="mt-3">
            <CopyButton text={REFORMAT_PROMPT} />
          </div>
          <p className="mt-3 text-xs text-slate-400">
            Standard format: header row{" "}
            <code className="rounded bg-slate-100 px-1 py-0.5">
              first_name,last_name,jersey_number,birthdate,usa_lacrosse_number,email
            </code>{" "}
            with birthdate as YYYY-MM-DD.
          </p>
        </CollapsibleDetails>
      </div>

      {!tournament && (
        <p className="mt-6 text-sm text-amber-700">
          No active tournament — create one in Tournaments first.
        </p>
      )}

      {tournament && (
        <div className="mt-6 space-y-4">
          {teams.length ? (
            teams.map((team) => (
              <div
                key={team.id}
                className="rounded-lg border border-slate-200 bg-white"
              >
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {team.name}
                    </p>
                    <p className="text-sm text-slate-500">
                      {team.associations?.name ?? "—"}
                      {team.divisions?.name && ` · ${team.divisions.name}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                      {team.players?.length ?? 0}{" "}
                      {team.players?.length === 1 ? "player" : "players"}
                    </span>
                    <a
                      href={`/associations/rosters/export/${team.id}`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Export CSV
                    </a>
                  </div>
                </div>

                {team.players?.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                          <th className="px-5 py-2 font-medium">Name</th>
                          <th className="px-5 py-2 font-medium">#</th>
                          <th className="px-5 py-2 font-medium">
                            Birthdate
                          </th>
                          <th className="px-5 py-2 font-medium">
                            USA Lacrosse #
                          </th>
                          <th className="px-5 py-2 font-medium">Email</th>
                          {isDirector && (
                            <th className="px-5 py-2 font-medium" />
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {team.players.map(
                          (p: {
                            id: string;
                            full_name: string | null;
                            first_name: string | null;
                            last_name: string | null;
                            jersey_number: string | null;
                            birthdate: string | null;
                            usa_lacrosse_number: string | null;
                            email: string | null;
                          }) => (
                            <tr
                              key={p.id}
                              className="border-b border-slate-50 last:border-0"
                            >
                              <td className="px-5 py-2 text-slate-900">
                                {p.first_name || p.last_name
                                  ? `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim()
                                  : (p.full_name ?? "—")}
                              </td>
                              <td className="px-5 py-2 text-slate-500">
                                {p.jersey_number ?? "—"}
                              </td>
                              <td className="px-5 py-2 text-slate-500">
                                {p.birthdate ?? "—"}
                              </td>
                              <td className="px-5 py-2 text-slate-500">
                                {p.usa_lacrosse_number ?? "—"}
                              </td>
                              <td className="px-5 py-2 text-slate-500">
                                {p.email ?? "—"}
                              </td>
                              {isDirector && (
                                <td className="px-5 py-2 text-right">
                                  <form
                                    action={deletePlayer.bind(null, p.id)}
                                  >
                                    <ConfirmSubmitButton
                                      confirmText={`Remove ${
                                        p.first_name || p.last_name
                                          ? `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim()
                                          : (p.full_name ?? "this player")
                                      } from the roster?`}
                                      className="text-xs text-red-600 hover:underline"
                                    >
                                      Remove
                                    </ConfirmSubmitButton>
                                  </form>
                                </td>
                              )}
                            </tr>
                          ),
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {isDirector && (
                  <div className="border-t border-slate-100 px-5 py-3">
                    <CollapsibleDetails summary="+ Import roster CSV">
                      <form
                        action={importRosterCsv.bind(null, team.id)}
                        className="mt-3 flex items-center gap-2"
                      >
                        <input
                          name="csv_file"
                          type="file"
                          accept=".csv,text/csv"
                          required
                          className="block text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-slate-800"
                        />
                        <button
                          type="submit"
                          className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
                        >
                          Import
                        </button>
                      </form>
                    </CollapsibleDetails>
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="rounded-lg border border-slate-200 bg-white px-5 py-6 text-center text-sm text-slate-500">
              No teams yet.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
