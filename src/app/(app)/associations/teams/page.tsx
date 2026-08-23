import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/profile";
import { getCurrentTournament } from "@/lib/tournament";
import {
  createTeam,
  updateTeam,
  deleteTeam,
  updateTeamContact,
  addTeamContact,
  deleteTeamContact,
} from "../actions";
import { CollapsibleDetails } from "@/components/collapsible-details";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { AssociationsSubNav } from "@/components/associations-sub-nav";
import { TeamsFilterBar } from "@/components/teams-filter-bar";
import { teamAssociationLabel } from "@/lib/team-name";

type Contact = {
  id: string;
  name: string;
  role: string | null;
  phone: string | null;
  email: string | null;
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  registered: "Registered",
  dropped: "Dropped",
};

export default async function TeamsListPage({
  searchParams,
}: {
  searchParams: Promise<{
    association?: string;
    division?: string;
    status?: string;
  }>;
}) {
  const {
    association: associationFilter = "",
    division: divisionFilter = "",
    status: statusFilter = "",
  } = await searchParams;
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  const tournament = await getCurrentTournament();
  const isDirector = profile?.role === "director";

  const [{ data: rawTeams }, { data: rawDivisions }, { data: rawAssociations }] =
    tournament
      ? await Promise.all([
          supabase
            .from("teams")
            .select(
              "*, associations(name), divisions(name), players(id), waivers(id), team_contacts(*)",
            )
            .eq("tournament_id", tournament.id)
            .order("name"),
          supabase
            .from("divisions")
            .select("*")
            .eq("tournament_id", tournament.id)
            .order("sort_order"),
          supabase.from("associations").select("id, name").order("name"),
        ])
      : [{ data: null }, { data: null }, { data: null }];

  const allTeams = rawTeams ?? [];
  const divisions = rawDivisions ?? [];
  const associations = rawAssociations ?? [];

  const existingAssociations = associations.filter((a) =>
    allTeams.some((t) => t.association_id === a.id),
  );
  const existingDivisions = divisions.filter((d) =>
    allTeams.some((t) => t.division_id === d.id),
  );
  const existingStatuses = [
    ...new Set(allTeams.map((t) => t.registration_status)),
  ].map((value) => ({ value, label: STATUS_LABELS[value] ?? value }));

  const teams = allTeams.filter(
    (t) =>
      (!associationFilter || t.association_id === associationFilter) &&
      (!divisionFilter || t.division_id === divisionFilter) &&
      (!statusFilter || t.registration_status === statusFilter),
  );

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

      {isDirector && tournament && (
        <div className="mt-6 rounded-lg border border-slate-200 bg-white px-5 py-4">
          <CollapsibleDetails
            summary="+ Add Team"
            summaryClassName="cursor-pointer text-sm font-semibold text-slate-900"
          >
            <form action={createTeam} className="mt-4 grid grid-cols-2 gap-3">
              <label className="col-span-2 text-sm text-slate-700">
                Association
                <select
                  name="association_id"
                  required
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                >
                  <option value="">Select association…</option>
                  {associations.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="col-span-2 text-sm text-slate-700">
                Team name (optional — only needed if this association has
                multiple teams in the same division)
                <input
                  name="name"
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
                  <option value="dropped">Dropped</option>
                </select>
              </label>
              <p className="col-span-2 text-xs text-slate-400">
                Team contact — leave blank to use the association&apos;s
                contact
              </p>
              <label className="text-sm text-slate-700">
                Name
                <input
                  name="contact_name"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                />
              </label>
              <label className="text-sm text-slate-700">
                Role
                <input
                  name="contact_role"
                  placeholder="Manager, Coach"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                />
              </label>
              <label className="text-sm text-slate-700">
                Phone
                <input
                  name="contact_phone"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                />
              </label>
              <label className="text-sm text-slate-700">
                Email
                <input
                  name="contact_email"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                />
              </label>
              <button
                type="submit"
                className="col-span-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                Add team
              </button>
            </form>
          </CollapsibleDetails>
        </div>
      )}

      {tournament && (
        <>
          <TeamsFilterBar
            associations={existingAssociations}
            divisions={existingDivisions}
            statuses={existingStatuses}
            association={associationFilter}
            division={divisionFilter}
            status={statusFilter}
          />
          {(associationFilter || divisionFilter || statusFilter) && (
            <p className="mt-3 text-sm text-slate-500">
              {teams.length} {teams.length === 1 ? "team matches" : "teams match"}{" "}
              the selected filters.
            </p>
          )}
        </>
      )}

      {tournament && (
        <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200 bg-white">
          {teams.length ? (
            <div className="min-w-[640px] text-sm">
              <div className="grid grid-cols-[3fr_1fr_1fr_1fr_1fr_auto] gap-3 border-b border-slate-100 px-5 py-2 text-left text-xs uppercase tracking-wide text-slate-400">
                <span>Team</span>
                <span>Division</span>
                <span>Status</span>
                <span>Players</span>
                <span>Waivers</span>
                <span />
              </div>
              <div className="divide-y divide-slate-50">
                {teams.map((team) => {
                  const contacts: Contact[] = team.team_contacts ?? [];
                  const displayName = teamAssociationLabel(
                    team.name,
                    team.associations?.name ?? "Unassociated",
                  );
                  return (
                    <CollapsibleDetails
                      key={team.id}
                      summaryClassName="grid grid-cols-[3fr_1fr_1fr_1fr_1fr_auto] items-center gap-3 px-5 py-3 cursor-pointer hover:bg-slate-50"
                      summary={
                        <>
                          <span className="font-medium text-slate-900 hover:text-blue-600 hover:underline">
                            {displayName}
                          </span>
                          <span className="text-slate-500">
                            {team.divisions?.name ?? "—"}
                          </span>
                          <span className="capitalize text-slate-700">
                            {STATUS_LABELS[team.registration_status] ??
                              team.registration_status}
                          </span>
                          <span className="text-slate-500">
                            {team.players?.length ?? 0}
                          </span>
                          <span className="text-slate-500">
                            {team.waivers?.length ?? 0}
                          </span>
                          {isDirector ? (
                            <form action={deleteTeam.bind(null, team.id)}>
                              <ConfirmSubmitButton
                                confirmText={`Delete ${displayName}? This can't be undone.`}
                                className="text-xs text-red-600 hover:underline"
                              >
                                Delete
                              </ConfirmSubmitButton>
                            </form>
                          ) : (
                            <span />
                          )}
                        </>
                      }
                    >
                      {isDirector && (
                        <div className="grid grid-cols-2 gap-4 border-t border-slate-100 px-5 py-4">
                          <form
                            key={`${team.name}-${team.division_id}-${team.registration_status}`}
                            action={updateTeam.bind(null, team.id)}
                            className="space-y-2"
                          >
                            <label className="block text-sm text-slate-700">
                              Team name (optional — only needed if this
                              association has multiple teams in the same
                              division)
                              <input
                                name="name"
                                defaultValue={team.name ?? ""}
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
                                <option value="dropped">Dropped</option>
                              </select>
                            </label>
                            <button
                              type="submit"
                              className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
                            >
                              Save
                            </button>
                          </form>

                          <div className="col-span-2 space-y-3 border-t border-slate-100 pt-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                              Contacts
                            </p>
                            {contacts.map((c) => (
                              <div
                                key={c.id}
                                className="flex items-end gap-2"
                              >
                                <form
                                  action={updateTeamContact.bind(
                                    null,
                                    c.id,
                                  )}
                                  className="grid flex-1 grid-cols-4 gap-2"
                                >
                                  <input
                                    name="name"
                                    defaultValue={c.name}
                                    aria-label="Contact name"
                                    placeholder="Name"
                                    required
                                    className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                                  />
                                  <input
                                    name="role"
                                    defaultValue={c.role ?? ""}
                                    aria-label="Contact role"
                                    placeholder="Role"
                                    className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                                  />
                                  <input
                                    name="phone"
                                    defaultValue={c.phone ?? ""}
                                    aria-label="Contact phone"
                                    placeholder="Phone"
                                    className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                                  />
                                  <input
                                    name="email"
                                    defaultValue={c.email ?? ""}
                                    aria-label="Contact email"
                                    placeholder="Email"
                                    className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                                  />
                                  <button
                                    type="submit"
                                    className="col-span-4 justify-self-start text-xs text-blue-600 hover:underline"
                                  >
                                    Save
                                  </button>
                                </form>
                                <form
                                  action={deleteTeamContact.bind(
                                    null,
                                    c.id,
                                  )}
                                >
                                  <ConfirmSubmitButton
                                    confirmText={`Delete contact ${c.name}?`}
                                    className="text-xs text-red-600 hover:underline"
                                  >
                                    Delete
                                  </ConfirmSubmitButton>
                                </form>
                              </div>
                            ))}
                            <form
                              action={addTeamContact.bind(null, team.id)}
                              className="grid grid-cols-5 items-end gap-2"
                            >
                              <input
                                name="name"
                                aria-label="New contact name"
                                placeholder="Name"
                                className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                              />
                              <input
                                name="role"
                                aria-label="New contact role"
                                placeholder="Role"
                                className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                              />
                              <input
                                name="phone"
                                aria-label="New contact phone"
                                placeholder="Phone"
                                className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                              />
                              <input
                                name="email"
                                aria-label="New contact email"
                                placeholder="Email"
                                className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                              />
                              <button
                                type="submit"
                                className="text-xs text-blue-600 hover:underline"
                              >
                                + Add contact
                              </button>
                            </form>
                          </div>
                        </div>
                      )}
                    </CollapsibleDetails>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="px-5 py-6 text-center text-sm text-slate-500">
              {associationFilter || divisionFilter || statusFilter
                ? "No teams match."
                : "No teams yet."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
