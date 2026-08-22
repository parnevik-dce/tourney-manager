import { Fragment } from "react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/profile";
import { getCurrentTournament } from "@/lib/tournament";
import { updateTeam, deleteTeam } from "../actions";
import { CollapsibleDetails } from "@/components/collapsible-details";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { AssociationsSubNav } from "@/components/associations-sub-nav";

export default async function TeamsListPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  const tournament = await getCurrentTournament();
  const isDirector = profile?.role === "director";

  const [{ data: rawTeams }, { data: rawDivisions }] = tournament
    ? await Promise.all([
        supabase
          .from("teams")
          .select("*, associations(name), divisions(name), waivers(id)")
          .eq("tournament_id", tournament.id)
          .order("name"),
        supabase
          .from("divisions")
          .select("*")
          .eq("tournament_id", tournament.id)
          .order("sort_order"),
      ])
    : [{ data: null }, { data: null }];

  const teams = rawTeams ?? [];
  const divisions = rawDivisions ?? [];

  return (
    <div className="flex-1 px-8 py-8">
      <h1 className="font-display text-2xl font-bold text-slate-900">
        Associations & Teams
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        All teams in the active tournament.
      </p>

      <AssociationsSubNav />

      {!tournament && (
        <p className="mt-6 text-sm text-amber-700">
          No active tournament — create one in Tournaments first.
        </p>
      )}

      {tournament && (
        <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200 bg-white">
          {teams.length ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-2 font-medium">Team</th>
                  <th className="px-5 py-2 font-medium">Association</th>
                  <th className="px-5 py-2 font-medium">Division</th>
                  <th className="px-5 py-2 font-medium">Status</th>
                  <th className="px-5 py-2 font-medium">Waivers</th>
                </tr>
              </thead>
              <tbody>
                {teams.map((team) => (
                  <Fragment key={team.id}>
                    <tr className="border-b border-slate-50 last:border-0">
                      <td className="px-5 py-3 font-medium text-slate-900">
                        {team.name}
                      </td>
                      <td className="px-5 py-3 text-slate-500">
                        {team.associations?.name ?? "—"}
                      </td>
                      <td className="px-5 py-3 text-slate-500">
                        {team.divisions?.name ?? "—"}
                      </td>
                      <td className="px-5 py-3">
                        <span className="capitalize text-slate-700">
                          {team.registration_status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-500">
                        {team.waivers?.length ?? 0}
                      </td>
                    </tr>
                    {isDirector && (
                      <tr className="border-b border-slate-50 last:border-0">
                        <td colSpan={5} className="px-5 pb-3">
                          <CollapsibleDetails
                            summary="Edit"
                            summaryClassName="cursor-pointer text-xs font-medium text-blue-600"
                          >
                            <div className="mt-3 grid grid-cols-2 gap-4">
                              <form
                                key={`${team.name}-${team.division_id}-${team.registration_status}`}
                                action={updateTeam.bind(null, team.id)}
                                className="space-y-2"
                              >
                                <label className="block text-sm text-slate-700">
                                  Team name
                                  <input
                                    name="name"
                                    defaultValue={team.name}
                                    required
                                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                                  />
                                </label>
                                <label className="block text-sm text-slate-700">
                                  Division
                                  <select
                                    name="division_id"
                                    defaultValue={team.division_id ?? ""}
                                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                                  >
                                    <option value="">Unassigned</option>
                                    {divisions.map((d) => (
                                      <option key={d.id} value={d.id}>
                                        {d.name}
                                      </option>
                                    ))}
                                  </select>
                                </label>
                                <label className="block text-sm text-slate-700">
                                  Status
                                  <select
                                    name="registration_status"
                                    defaultValue={team.registration_status}
                                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                                  >
                                    <option value="pending">Pending</option>
                                    <option value="registered">
                                      Registered
                                    </option>
                                  </select>
                                </label>
                                <button
                                  type="submit"
                                  className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
                                >
                                  Save
                                </button>
                              </form>
                              <form
                                action={deleteTeam.bind(null, team.id)}
                                className="flex items-start"
                              >
                                <ConfirmSubmitButton
                                  confirmText={`Delete ${team.name}? This can't be undone.`}
                                  className="text-sm text-red-600 hover:underline"
                                >
                                  Delete Team
                                </ConfirmSubmitButton>
                              </form>
                            </div>
                          </CollapsibleDetails>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="px-5 py-6 text-center text-sm text-slate-500">
              No teams yet.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
