import { createClient } from "@/lib/supabase/server";
import { getCurrentTournament } from "@/lib/tournament";
import { TextLink } from "@/components/text-link";
import { AssociationsFilterBar } from "@/components/associations-filter-bar";
import { AssociationsSubNav } from "@/components/associations-sub-nav";

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
  const tournament = await getCurrentTournament();

  const { data: associations } = await supabase
    .from("associations")
    .select("*, association_contacts(*)")
    .order("name");

  const [{ data: rawTeams }, { data: rawDivisions }] = tournament
    ? await Promise.all([
        supabase
          .from("teams")
          .select(
            "*, team_contacts(*), divisions(name), players(id), waivers(id)",
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

  const hasTeamFilter = Boolean(divisionFilter || statusFilter);
  const visibleAssociations = (associations ?? [])
    .filter((a) => !associationFilter || a.id === associationFilter)
    .map((assoc) => {
      let assocTeams = teamsByAssociation.get(assoc.id) ?? [];
      if (divisionFilter) {
        assocTeams = assocTeams.filter((t) => t.division_id === divisionFilter);
      }
      if (statusFilter) {
        assocTeams = assocTeams.filter(
          (t) => t.registration_status === statusFilter,
        );
      }
      return { assoc, assocTeams };
    })
    .filter(({ assocTeams }) => !hasTeamFilter || assocTeams.length > 0);

  const filteredTeamCount = visibleAssociations.reduce(
    (sum, { assocTeams }) => sum + assocTeams.length,
    0,
  );

  return (
    <div className="flex-1 px-8 py-8">
      <h1 className="font-display text-2xl font-bold text-slate-900">
        Associations & Teams
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Registration status tracked here; official registration lives in
        SportsEngine.
      </p>

      <AssociationsSubNav />

      {!tournament && (
        <p className="mt-6 text-sm text-amber-700">
          No active tournament — create one in Tournaments to see teams
          here.
        </p>
      )}

      {tournament && (
        <>
          <AssociationsFilterBar
            associations={(associations ?? []).map((a) => ({
              id: a.id,
              name: a.name,
            }))}
            divisions={divisions.map((d) => ({ id: d.id, name: d.name }))}
            association={associationFilter}
            division={divisionFilter}
            status={statusFilter}
          />
          {(associationFilter || divisionFilter || statusFilter) && (
            <p className="mt-3 text-sm text-slate-500">
              {filteredTeamCount}{" "}
              {filteredTeamCount === 1 ? "team matches" : "teams match"} the
              selected filters.
            </p>
          )}
        </>
      )}

      <div className="mt-6 space-y-4">
        {visibleAssociations.map(({ assoc, assocTeams }) => {
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
                  {!assoc.association_contacts?.length && (
                    <p className="text-sm text-slate-400">No contacts yet.</p>
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
                      <th className="px-5 py-2 font-medium">Players</th>
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
                                </div>
                              ))
                            ) : (
                              <p>Same as association</p>
                            )}
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
                            {team.players?.length ?? 0}
                          </td>
                          <td className="px-5 py-3 text-slate-500">
                            {team.waivers?.length ?? 0}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          );
        })}

        {!associations?.length && (
          <p className="text-sm text-slate-500">No associations yet.</p>
        )}
      </div>
    </div>
  );
}
