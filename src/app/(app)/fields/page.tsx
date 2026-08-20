import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/profile";
import { getCurrentTournament } from "@/lib/tournament";
import { CollapsibleDetails } from "@/components/collapsible-details";
import {
  createDivision,
  deleteDivision,
  createField,
  deleteField,
} from "./actions";

export default async function FieldsPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  const tournament = await getCurrentTournament();
  const isDirector = profile?.role === "director";

  const [{ data: rawDivisions }, { data: rawFields }, { data: rawTeams }] =
    tournament
      ? await Promise.all([
          supabase
            .from("divisions")
            .select("*")
            .eq("tournament_id", tournament.id)
            .order("sort_order")
            .order("name"),
          supabase
            .from("fields")
            .select("*, field_divisions(division_id)")
            .eq("tournament_id", tournament.id)
            .order("sort_order")
            .order("name"),
          supabase
            .from("teams")
            .select("division_id, registration_status")
            .eq("tournament_id", tournament.id),
        ])
      : [{ data: null }, { data: null }, { data: null }];

  const divisions = rawDivisions ?? [];
  const fields = rawFields ?? [];
  const teams = rawTeams ?? [];
  const divisionById = new Map(divisions.map((d) => [d.id, d]));

  function poolGuidance(count: number) {
    if (count === 0) return "No teams registered yet";
    if (count === 1) return "Only 1 team registered — not enough for pool play yet";
    if (count <= 4) return "single round-robin pool";
    if (count <= 8) return "two pools, playoff bracket to follow";
    return "multiple pools recommended — consider splitting by seeding";
  }

  return (
    <div className="flex-1 px-8 py-8">
      <h1 className="text-xl font-semibold text-slate-900">
        Fields & Divisions
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Set up available fields and which divisions can play on each.
        Guidance only — schedules are built in Tourney Machine.
      </p>

      {!tournament && (
        <p className="mt-6 text-sm text-amber-700">
          No active tournament — create one in Tournaments first.
        </p>
      )}

      {tournament && (
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-white">
            <h2 className="border-b border-slate-100 px-5 py-3 text-sm font-semibold text-slate-900">
              Fields
            </h2>
            <ul className="divide-y divide-slate-100">
              {fields.map((field) => {
                const names = field.field_divisions
                  .map((fd: { division_id: string }) => divisionById.get(fd.division_id)?.name)
                  .filter(Boolean)
                  .join(", ");
                return (
                  <li
                    key={field.id}
                    className="flex items-center justify-between px-5 py-3 text-sm"
                  >
                    <span className="font-medium text-slate-900">
                      {field.name}
                    </span>
                    <span className="flex items-center gap-3 text-slate-500">
                      {names || "No divisions assigned"}
                      {isDirector && (
                        <form
                          action={async () => {
                            "use server";
                            await deleteField(field.id);
                          }}
                        >
                          <button
                            type="submit"
                            className="text-xs text-red-600 hover:underline"
                          >
                            Remove
                          </button>
                        </form>
                      )}
                    </span>
                  </li>
                );
              })}
              {!fields.length && (
                <li className="px-5 py-6 text-center text-sm text-slate-500">
                  No fields yet.
                </li>
              )}
            </ul>

            {isDirector && (
              <CollapsibleDetails
                className="border-t border-slate-100 px-5 py-3"
                summary="+ Add Field"
              >
                <form action={createField} className="mt-3 space-y-3">
                  <label className="block text-sm text-slate-700">
                    Field name
                    <input
                      name="name"
                      required
                      placeholder="Field 1 (Main)"
                      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                    />
                  </label>
                  {divisions.length > 0 && (
                    <div>
                      <p className="text-sm text-slate-700">
                        Eligible divisions
                      </p>
                      <div className="mt-1 flex flex-wrap gap-3">
                        {divisions.map((d) => (
                          <label
                            key={d.id}
                            className="flex items-center gap-1.5 text-sm text-slate-600"
                          >
                            <input
                              type="checkbox"
                              name="division_ids"
                              value={d.id}
                            />
                            {d.name}
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                  <button
                    type="submit"
                    className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                  >
                    Add field
                  </button>
                </form>
              </CollapsibleDetails>
            )}
          </div>

          <div className="rounded-lg border border-slate-200 bg-white">
            <h2 className="border-b border-slate-100 px-5 py-3 text-sm font-semibold text-slate-900">
              Divisions
            </h2>
            <ul className="divide-y divide-slate-100">
              {divisions.map((d) => (
                <li
                  key={d.id}
                  className="flex items-center justify-between px-5 py-3 text-sm"
                >
                  <span className="font-medium text-slate-900">
                    {d.name}
                  </span>
                  <span className="flex items-center gap-3 text-slate-500">
                    {d.skill_split ? "Upper / Lower" : "No split"}
                    {isDirector && (
                      <form
                        action={async () => {
                          "use server";
                          await deleteDivision(d.id);
                        }}
                      >
                        <button
                          type="submit"
                          className="text-xs text-red-600 hover:underline"
                        >
                          Remove
                        </button>
                      </form>
                    )}
                  </span>
                </li>
              ))}
              {!divisions.length && (
                <li className="px-5 py-6 text-center text-sm text-slate-500">
                  No divisions yet.
                </li>
              )}
            </ul>

            {isDirector && (
              <CollapsibleDetails
                className="border-t border-slate-100 px-5 py-3"
                summary="+ Add Division"
              >
                <form action={createDivision} className="mt-3 space-y-3">
                  <label className="block text-sm text-slate-700">
                    Division name
                    <input
                      name="name"
                      required
                      placeholder="8U"
                      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                    />
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input type="checkbox" name="skill_split" />
                    Skill-level split (Upper/Lower)
                  </label>
                  <button
                    type="submit"
                    className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                  >
                    Add division
                  </button>
                </form>
              </CollapsibleDetails>
            )}
          </div>
        </div>
      )}

      {tournament && divisions.length > 0 && (
        <div className="mt-4 rounded-lg border border-slate-200 bg-white">
          <h2 className="border-b border-slate-100 px-5 py-3 text-sm font-semibold text-slate-900">
            Pool / Bracket Guidance
          </h2>
          <p className="px-5 pt-3 text-xs text-slate-400">
            Advisory only — build the actual schedule in Tourney Machine.
          </p>
          <ul className="divide-y divide-slate-100">
            {divisions.map((d) => {
              const count = teams.filter(
                (t) =>
                  t.division_id === d.id &&
                  t.registration_status === "registered",
              ).length;
              return (
                <li
                  key={d.id}
                  className="flex items-center justify-between px-5 py-3 text-sm"
                >
                  <span className="font-medium text-slate-900">
                    {d.name}
                  </span>
                  <span className="text-slate-500">
                    {count} {count === 1 ? "team" : "teams"} registered —{" "}
                    {poolGuidance(count)}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
