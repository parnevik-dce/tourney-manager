import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/profile";
import { getCurrentTournament } from "@/lib/tournament";
import {
  createAssociation,
  updateAssociation,
  updateAssociationContact,
  addAssociationContact,
  deleteAssociationContact,
  deleteAssociation,
  createTeam,
  updateTeamStatus,
  addPlayer,
  addTeamContact,
  updateTeamContact,
  deleteTeamContact,
  deleteTeam,
  uploadRoster,
} from "./actions";
import { StatusSelect } from "@/components/status-select";
import { CollapsibleDetails } from "@/components/collapsible-details";
import { TextLink } from "@/components/text-link";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";

type Player = {
  id: string;
  full_name: string;
  waivers: { id: string } | null;
};

type Contact = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  role?: string | null;
};

export default async function AssociationsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error: errorMessage } = await searchParams;
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
          .select(
            "*, team_contacts(*), divisions(name), players(id, full_name, waivers(id))",
          )
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

      {errorMessage && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage}
        </p>
      )}

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
                  <p className="font-semibold text-slate-900">
                    {assoc.name}
                    {assoc.mascot && (
                      <span className="font-normal text-slate-500"> — {assoc.mascot}</span>
                    )}
                  </p>
                  {assoc.association_contacts?.map((c: Contact) => (
                    <p key={c.id} className="text-sm text-slate-500">
                      {c.name}
                      {c.role && ` (${c.role})`}
                      {c.phone && ` · ${c.phone}`}
                      {c.email && ` · ${c.email}`}
                      {c.phone && (
                        <>
                          {" · "}
                          <TextLink phone={c.phone} />
                        </>
                      )}
                    </p>
                  ))}
                </div>
                {tournament && (
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                    {registeredCount}/{assocTeams.length} registered
                  </span>
                )}
              </div>

              {isDirector && (
                <CollapsibleDetails
                  className="border-b border-slate-100 px-5 py-3"
                  summary="Edit Association"
                >
                  <div className="mt-3 grid grid-cols-2 gap-4">
                    <form
                      action={updateAssociation.bind(null, assoc.id)}
                      className="space-y-2"
                    >
                      <label className="block text-sm text-slate-700">
                        Association name
                        <input
                          name="name"
                          defaultValue={assoc.name}
                          required
                          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                        />
                      </label>
                      <label className="block text-sm text-slate-700">
                        Mascot
                        <input
                          name="mascot"
                          defaultValue={assoc.mascot ?? ""}
                          placeholder="Rebels"
                          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                        />
                      </label>
                      <div className="flex items-center gap-3">
                        <button
                          type="submit"
                          className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
                        >
                          Save name
                        </button>
                      </div>
                    </form>
                    <form action={deleteAssociation.bind(null, assoc.id)}>
                      <ConfirmSubmitButton
                        confirmText={`Delete ${assoc.name}? This can't be undone.`}
                        className="text-sm text-red-600 hover:underline"
                      >
                        Delete Association
                      </ConfirmSubmitButton>
                    </form>
                    <div className="col-span-2 space-y-4">
                      {assoc.association_contacts?.map((c: Contact) => (
                        <div
                          key={c.id}
                          className="border-b border-slate-100 pb-4 last:border-0 last:pb-0"
                        >
                          <form
                            action={updateAssociationContact.bind(null, c.id)}
                            className="space-y-2"
                          >
                            <label className="block text-sm text-slate-700">
                              Contact name
                              <input
                                name="name"
                                defaultValue={c.name}
                                required
                                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                              />
                            </label>
                            <label className="block text-sm text-slate-700">
                              Contact role
                              <input
                                name="role"
                                defaultValue={c.role ?? ""}
                                placeholder="President, Registrar"
                                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                              />
                            </label>
                            <label className="block text-sm text-slate-700">
                              Contact phone
                              <input
                                name="phone"
                                defaultValue={c.phone ?? ""}
                                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                              />
                            </label>
                            <label className="block text-sm text-slate-700">
                              Contact email
                              <input
                                name="email"
                                defaultValue={c.email ?? ""}
                                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                              />
                            </label>
                            <div className="flex items-center gap-3">
                              <button
                                type="submit"
                                className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
                              >
                                Save contact
                              </button>
                            </div>
                          </form>
                          <form
                            action={deleteAssociationContact.bind(null, c.id)}
                            className="mt-2"
                          >
                            <ConfirmSubmitButton
                              confirmText={`Delete contact ${c.name}?`}
                              className="text-xs text-red-600 hover:underline"
                            >
                              Delete contact
                            </ConfirmSubmitButton>
                          </form>
                        </div>
                      ))}
                      {!assoc.association_contacts?.length && (
                        <p className="text-sm text-slate-500">
                          No contacts yet.
                        </p>
                      )}
                      <CollapsibleDetails summary="+ Add Contact">
                        <form
                          action={addAssociationContact.bind(null, assoc.id)}
                          className="mt-2 space-y-2"
                        >
                          <label className="block text-sm text-slate-700">
                            Name
                            <input
                              name="name"
                              required
                              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                            />
                          </label>
                          <label className="block text-sm text-slate-700">
                            Role
                            <input
                              name="role"
                              placeholder="President, Registrar"
                              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                            />
                          </label>
                          <label className="block text-sm text-slate-700">
                            Phone
                            <input
                              name="phone"
                              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                            />
                          </label>
                          <label className="block text-sm text-slate-700">
                            Email
                            <input
                              name="email"
                              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                            />
                          </label>
                          <button
                            type="submit"
                            className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
                          >
                            Add contact
                          </button>
                        </form>
                      </CollapsibleDetails>
                    </div>
                  </div>
                </CollapsibleDetails>
              )}

              {assocTeams.length > 0 && (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                      <th className="px-5 py-2 font-medium">Team</th>
                      <th className="px-5 py-2 font-medium">Team Contact</th>
                      <th className="px-5 py-2 font-medium">Division</th>
                      <th className="px-5 py-2 font-medium">Status</th>
                      <th className="px-5 py-2 font-medium">Roster</th>
                      <th className="px-5 py-2 font-medium">Waivers</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assocTeams.map((team) => {
                      const contacts: Contact[] = team.team_contacts ?? [];
                      return (
                        <tr
                          key={team.id}
                          className="border-b border-slate-50 last:border-0"
                        >
                          <td className="px-5 py-3 font-medium text-slate-900">
                            {team.name}
                            {isDirector && (
                              <form action={deleteTeam.bind(null, team.id)}>
                                <ConfirmSubmitButton
                                  confirmText={`Delete ${team.name}? This can't be undone.`}
                                  className="mt-0.5 block text-xs font-normal text-red-600 hover:underline"
                                >
                                  Delete
                                </ConfirmSubmitButton>
                              </form>
                            )}
                          </td>
                          <td className="px-5 py-3 text-slate-500">
                            {contacts.length ? (
                              contacts.map((contact) => (
                                <div key={contact.id}>
                                  {contact.name}
                                  {contact.role && ` (${contact.role})`}
                                  {contact.phone && (
                                    <>
                                      {" · "}
                                      <TextLink phone={contact.phone} />
                                    </>
                                  )}
                                  {contact.email && ` · ${contact.email}`}
                                  {isDirector && (
                                    <>
                                      {" · "}
                                      <form
                                        action={deleteTeamContact.bind(
                                          null,
                                          contact.id,
                                        )}
                                        className="inline"
                                      >
                                        <ConfirmSubmitButton
                                          confirmText={`Delete contact ${contact.name}?`}
                                          className="text-xs text-red-600 hover:underline"
                                        >
                                          Delete
                                        </ConfirmSubmitButton>
                                      </form>
                                      <CollapsibleDetails
                                        className="inline"
                                        summary="Edit"
                                        summaryClassName="ml-1.5 cursor-pointer text-xs text-blue-600"
                                      >
                                        <form
                                          action={updateTeamContact.bind(
                                            null,
                                            contact.id,
                                          )}
                                          className="mt-1 space-y-1"
                                        >
                                          <input
                                            name="name"
                                            defaultValue={contact.name}
                                            aria-label="Contact name"
                                            placeholder="Name"
                                            required
                                            className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
                                          />
                                          <input
                                            name="role"
                                            defaultValue={contact.role ?? ""}
                                            aria-label="Contact role"
                                            placeholder="Role"
                                            className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
                                          />
                                          <input
                                            name="phone"
                                            defaultValue={contact.phone ?? ""}
                                            aria-label="Contact phone"
                                            placeholder="Phone"
                                            className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
                                          />
                                          <input
                                            name="email"
                                            defaultValue={contact.email ?? ""}
                                            aria-label="Contact email"
                                            placeholder="Email"
                                            className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
                                          />
                                          <button
                                            type="submit"
                                            className="text-xs text-blue-600 hover:underline"
                                          >
                                            Save
                                          </button>
                                        </form>
                                      </CollapsibleDetails>
                                    </>
                                  )}
                                </div>
                              ))
                            ) : (
                              <p>
                                Same as association
                                {primaryContact?.phone && (
                                  <>
                                    {" · "}
                                    <TextLink phone={primaryContact.phone} />
                                  </>
                                )}
                              </p>
                            )}
                            {isDirector && (
                              <CollapsibleDetails
                                className="mt-1"
                                summary="+ Add contact"
                                summaryClassName="cursor-pointer text-xs text-blue-600"
                              >
                                <form
                                  action={addTeamContact.bind(null, team.id)}
                                  className="mt-1 space-y-1"
                                >
                                  <input
                                    name="name"
                                    aria-label="Contact name"
                                    placeholder="Name"
                                    className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
                                  />
                                  <input
                                    name="role"
                                    aria-label="Contact role"
                                    placeholder="Role"
                                    className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
                                  />
                                  <input
                                    name="phone"
                                    aria-label="Contact phone"
                                    placeholder="Phone"
                                    className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
                                  />
                                  <input
                                    name="email"
                                    aria-label="Contact email"
                                    placeholder="Email"
                                    className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
                                  />
                                  <button
                                    type="submit"
                                    className="text-xs text-blue-600 hover:underline"
                                  >
                                    Add
                                  </button>
                                </form>
                              </CollapsibleDetails>
                            )}
                          </td>
                          <td className="px-5 py-3 text-slate-500">
                            {team.divisions?.name ?? "—"}
                          </td>
                          <td className="px-5 py-3">
                            {isDirector ? (
                              <StatusSelect
                                status={team.registration_status}
                                action={updateTeamStatus.bind(null, team.id)}
                                options={[
                                  { value: "pending", label: "Pending" },
                                  { value: "registered", label: "Registered" },
                                ]}
                              />
                            ) : (
                              <span className="capitalize">
                                {team.registration_status}
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3">
                            {team.roster_uploaded_at ? (
                              <a
                                href={`/associations/roster/${team.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-medium text-green-700 hover:underline"
                              >
                                Uploaded
                              </a>
                            ) : (
                              <span className="font-medium text-amber-700">
                                Not Uploaded
                              </span>
                            )}
                            {isDirector && (
                              <form
                                action={uploadRoster.bind(null, team.id)}
                                className="mt-1 flex items-center gap-1"
                              >
                                <input
                                  type="file"
                                  name="roster_file"
                                  className="w-28 text-xs"
                                />
                                <button
                                  type="submit"
                                  className="text-xs text-blue-600 hover:underline"
                                >
                                  Upload
                                </button>
                              </form>
                            )}
                          </td>
                          <td className="px-5 py-3">
                            <CollapsibleDetails
                              summary={
                                <>
                                  {
                                    team.players.filter(
                                      (p: Player) => p.waivers,
                                    ).length
                                  }
                                  /{team.players.length}
                                </>
                              }
                              summaryClassName="cursor-pointer text-slate-700"
                            >
                              <ul className="mt-2 space-y-1 text-xs">
                                {team.players.map((p: Player) => (
                                  <li
                                    key={p.id}
                                    className="flex items-center justify-between gap-3"
                                  >
                                    <span className="text-slate-600">
                                      {p.full_name}
                                    </span>
                                    <span
                                      className={
                                        p.waivers
                                          ? "text-green-600"
                                          : "text-slate-400"
                                      }
                                    >
                                      {p.waivers
                                        ? "Submitted"
                                        : "Not submitted"}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                              {isDirector && (
                                <form
                                  action={addPlayer.bind(null, team.id)}
                                  className="mt-2 flex items-center gap-1"
                                >
                                  <input
                                    name="full_name"
                                    aria-label="Player name"
                                    placeholder="Player name"
                                    className="w-28 rounded-md border border-slate-300 px-2 py-1 text-xs"
                                  />
                                  <button
                                    type="submit"
                                    className="text-xs text-blue-600 hover:underline"
                                  >
                                    Add
                                  </button>
                                </form>
                              )}
                            </CollapsibleDetails>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}

              {isDirector && tournament && (
                <CollapsibleDetails
                  className="border-t border-slate-100 px-5 py-3"
                  summary="+ Add Team"
                >
                  <form
                    action={createTeam}
                    className="mt-3 grid grid-cols-2 gap-3"
                  >
                    <input type="hidden" name="association_id" value={assoc.id} />
                    <label className="col-span-2 text-sm text-slate-700">
                      Team name
                      <input
                        name="name"
                        defaultValue={assoc.name}
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
              )}
            </div>
          );
        })}

        {!associations?.length && (
          <p className="text-sm text-slate-500">No associations yet.</p>
        )}
      </div>

      {isDirector && (
        <CollapsibleDetails
          className="mt-6 rounded-lg border border-slate-200 bg-white px-5 py-4"
          summary="+ Add Association"
          summaryClassName="cursor-pointer text-sm font-semibold text-slate-900"
        >
          <form action={createAssociation} className="mt-4 grid grid-cols-2 gap-3">
            <label className="col-span-2 text-sm text-slate-700">
              Association name
              <input
                name="name"
                required
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
              />
            </label>
            <label className="col-span-2 text-sm text-slate-700">
              Mascot
              <input
                name="mascot"
                placeholder="Rebels"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
              />
            </label>
            <label className="text-sm text-slate-700">
              Contact name
              <input
                name="contact_name"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
              />
            </label>
            <label className="text-sm text-slate-700">
              Contact role
              <input
                name="contact_role"
                placeholder="President, Registrar"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
              />
            </label>
            <label className="text-sm text-slate-700">
              Contact phone
              <input
                name="contact_phone"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
              />
            </label>
            <label className="col-span-2 text-sm text-slate-700">
              Contact email
              <input
                name="contact_email"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
              />
            </label>
            <button
              type="submit"
              className="col-span-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Add association
            </button>
          </form>
        </CollapsibleDetails>
      )}
    </div>
  );
}
