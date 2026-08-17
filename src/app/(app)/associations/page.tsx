import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/profile";
import { getCurrentTournament } from "@/lib/tournament";
import { createAssociation, createTeam, updateTeamStatus } from "./actions";
import { StatusSelect } from "@/components/status-select";

export default async function AssociationsPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  const tournament = await getCurrentTournament();
  const isDirector = profile?.role === "director";

  const { data: associations } = await supabase
    .from("associations")
    .select("*, association_contacts(*)")
    .order("name");

  const [{ data: rawTeams }, { data: rawDivisions }] = tournament
    ? await Promise.all([
        supabase
          .from("teams")
          .select("*, team_contacts(*), divisions(name)")
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

  const teamsByAssociation = new Map<string, typeof teams>();
  for (const team of teams) {
    const list = teamsByAssociation.get(team.association_id) ?? [];
    list.push(team);
    teamsByAssociation.set(team.association_id, list);
  }

  return (
    <div className="flex-1 px-8 py-8">
      <h1 className="text-xl font-semibold text-slate-900">
        Associations & Teams
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Registration status tracked here; official registration lives in
        SportsEngine.
      </p>

      {!tournament && (
        <p className="mt-6 text-sm text-amber-700">
          No active tournament — create one in Tournaments before adding
          teams.
        </p>
      )}

      <div className="mt-6 space-y-4">
        {associations?.map((assoc) => {
          const assocTeams = teamsByAssociation.get(assoc.id) ?? [];
          const primaryContact = assoc.association_contacts?.[0];
          const registeredCount = assocTeams.filter(
            (t) => t.registration_status === "registered",
          ).length;

          return (
            <div
              key={assoc.id}
              className="rounded-lg border border-slate-200 bg-white"
            >
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div>
                  <p className="font-semibold text-slate-900">{assoc.name}</p>
                  {primaryContact && (
                    <p className="text-sm text-slate-500">
                      {primaryContact.name}
                      {primaryContact.phone && ` · ${primaryContact.phone}`}
                      {primaryContact.email && ` · ${primaryContact.email}`}
                    </p>
                  )}
                </div>
                {tournament && (
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                    {registeredCount}/{assocTeams.length} registered
                  </span>
                )}
              </div>

              {assocTeams.length > 0 && (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                      <th className="px-5 py-2 font-medium">Team</th>
                      <th className="px-5 py-2 font-medium">Team Contact</th>
                      <th className="px-5 py-2 font-medium">Division</th>
                      <th className="px-5 py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assocTeams.map((team) => {
                      const contact = team.team_contacts?.[0];
                      return (
                        <tr
                          key={team.id}
                          className="border-b border-slate-50 last:border-0"
                        >
                          <td className="px-5 py-3 font-medium text-slate-900">
                            {team.name}
                          </td>
                          <td className="px-5 py-3 text-slate-500">
                            {contact
                              ? `${contact.name}${contact.role ? ` (${contact.role})` : ""}`
                              : "Same as association"}
                          </td>
                          <td className="px-5 py-3 text-slate-500">
                            {team.divisions?.name ?? "—"}
                          </td>
                          <td className="px-5 py-3">
                            {isDirector ? (
                              <StatusSelect
                                status={team.registration_status}
                                action={updateTeamStatus.bind(null, team.id)}
                              />
                            ) : (
                              <span className="capitalize">
                                {team.registration_status}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}

              {isDirector && tournament && (
                <details className="border-t border-slate-100 px-5 py-3">
                  <summary className="cursor-pointer text-sm font-medium text-blue-600">
                    + Add Team
                  </summary>
                  <form
                    action={createTeam}
                    className="mt-3 grid grid-cols-2 gap-3"
                  >
                    <input type="hidden" name="association_id" value={assoc.id} />
                    <label className="col-span-2 text-sm text-slate-700">
                      Team name
                      <input
                        name="name"
                        required
                        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                      />
                    </label>
                    <label className="text-sm text-slate-700">
                      Division
                      <select
                        name="division_id"
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
                    <label className="text-sm text-slate-700">
                      Status
                      <select
                        name="registration_status"
                        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                      >
                        <option value="pending">Pending</option>
                        <option value="registered">Registered</option>
                      </select>
                    </label>
                    <p className="col-span-2 text-xs text-slate-400">
                      Team contact — leave blank to use the association&apos;s
                      contact
                    </p>
                    <input
                      name="contact_name"
                      placeholder="Name"
                      className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                    />
                    <input
                      name="contact_role"
                      placeholder="Role (Manager, Coach)"
                      className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                    />
                    <input
                      name="contact_phone"
                      placeholder="Phone"
                      className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                    />
                    <input
                      name="contact_email"
                      placeholder="Email"
                      className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                    />
                    <button
                      type="submit"
                      className="col-span-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                    >
                      Add team
                    </button>
                  </form>
                </details>
              )}
            </div>
          );
        })}

        {!associations?.length && (
          <p className="text-sm text-slate-500">No associations yet.</p>
        )}
      </div>

      {isDirector && (
        <details className="mt-6 rounded-lg border border-slate-200 bg-white px-5 py-4">
          <summary className="cursor-pointer text-sm font-semibold text-slate-900">
            + Add Association
          </summary>
          <form action={createAssociation} className="mt-4 grid grid-cols-2 gap-3">
            <label className="col-span-2 text-sm text-slate-700">
              Association name
              <input
                name="name"
                required
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
              />
            </label>
            <input
              name="contact_name"
              placeholder="Contact name"
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
            />
            <input
              name="contact_phone"
              placeholder="Contact phone"
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
            />
            <input
              name="contact_email"
              placeholder="Contact email"
              className="col-span-2 rounded-md border border-slate-300 px-3 py-1.5 text-sm"
            />
            <button
              type="submit"
              className="col-span-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Add association
            </button>
          </form>
        </details>
      )}
    </div>
  );
}
