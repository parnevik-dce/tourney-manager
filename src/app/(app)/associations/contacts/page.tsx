import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/profile";
import { getCurrentTournament } from "@/lib/tournament";
import {
  createContact,
  updateAssociationContact,
  deleteAssociationContact,
  updateTeamContact,
  deleteTeamContact,
} from "../actions";
import { CollapsibleDetails } from "@/components/collapsible-details";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { TextLink } from "@/components/text-link";
import { AssociationsSubNav } from "@/components/associations-sub-nav";
import { ContactsFilterBar } from "@/components/contacts-filter-bar";

type UnifiedContact = {
  id: string;
  kind: "association" | "team";
  name: string;
  role: string | null;
  phone: string | null;
  email: string | null;
  belongsTo: string;
  associationId: string;
};

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ association?: string; type?: string; q?: string }>;
}) {
  const {
    association: associationFilter = "",
    type: typeFilter = "",
    q = "",
  } = await searchParams;
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  const tournament = await getCurrentTournament();
  const isDirector = profile?.role === "director";

  const { data: associations } = await supabase
    .from("associations")
    .select("id, name")
    .order("name");

  const [{ data: associationContacts }, { data: teams }] = tournament
    ? await Promise.all([
        supabase
          .from("association_contacts")
          .select("*"),
        supabase
          .from("teams")
          .select("id, name, association_id, team_contacts(*)")
          .eq("tournament_id", tournament.id),
      ])
    : [{ data: null }, { data: null }];

  const associationById = new Map((associations ?? []).map((a) => [a.id, a]));

  const unified: UnifiedContact[] = [];

  for (const c of associationContacts ?? []) {
    const assoc = associationById.get(c.association_id);
    unified.push({
      id: c.id,
      kind: "association",
      name: c.name,
      role: c.role,
      phone: c.phone,
      email: c.email,
      belongsTo: assoc?.name ?? "—",
      associationId: c.association_id,
    });
  }

  for (const team of teams ?? []) {
    const assoc = associationById.get(team.association_id);
    for (const c of team.team_contacts ?? []) {
      unified.push({
        id: c.id,
        kind: "team",
        name: c.name,
        role: c.role,
        phone: c.phone,
        email: c.email,
        belongsTo: `${team.name} (${assoc?.name ?? "—"})`,
        associationId: team.association_id,
      });
    }
  }

  const q_lower = q.trim().toLowerCase();
  const filtered = unified
    .filter((c) => !associationFilter || c.associationId === associationFilter)
    .filter((c) => !typeFilter || c.kind === typeFilter)
    .filter(
      (c) =>
        !q_lower ||
        c.name.toLowerCase().includes(q_lower) ||
        (c.role ?? "").toLowerCase().includes(q_lower),
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  const teamOptions = (teams ?? []).map((t) => ({
    id: t.id,
    label: `${t.name} (${associationById.get(t.association_id)?.name ?? "—"})`,
  }));

  return (
    <div className="flex-1 px-8 py-8">
      <h1 className="font-display text-2xl font-bold text-slate-900">
        Associations & Teams
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        All association and team contacts in one place.
      </p>

      <AssociationsSubNav />

      {!tournament && (
        <p className="mt-6 text-sm text-amber-700">
          No active tournament — create one in Tournaments first.
        </p>
      )}

      <ContactsFilterBar
        associations={associations ?? []}
        association={associationFilter}
        type={typeFilter}
        q={q}
      />

      <p className="mt-3 text-sm text-slate-500">
        {filtered.length} {filtered.length === 1 ? "contact" : "contacts"}
        {associationFilter || typeFilter || q ? " match the selected filters" : ""}.
      </p>

      <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200 bg-white">
        {filtered.length ? (
          <div className="min-w-[800px] text-sm">
            <div className="grid grid-cols-[1.5fr_1fr_1fr_1.5fr_1.5fr_0.75fr_auto] gap-3 border-b border-slate-100 px-5 py-2 text-left text-xs uppercase tracking-wide text-slate-400">
              <span>Name</span>
              <span>Role</span>
              <span>Phone</span>
              <span>Email</span>
              <span>Belongs To</span>
              <span>Type</span>
              <span />
            </div>
            <div className="divide-y divide-slate-50">
              {filtered.map((c) => (
                <CollapsibleDetails
                  key={`${c.kind}-${c.id}`}
                  summaryClassName="grid grid-cols-[1.5fr_1fr_1fr_1.5fr_1.5fr_0.75fr_auto] items-center gap-3 px-5 py-3 cursor-pointer hover:bg-slate-50"
                  summary={
                    <>
                      <span className="font-medium text-slate-900 hover:text-blue-600 hover:underline">
                        {c.name}
                      </span>
                      <span className="text-slate-500">{c.role ?? "—"}</span>
                      <span className="text-slate-500">
                        {c.phone ? <TextLink phone={c.phone} /> : "—"}
                      </span>
                      <span className="text-slate-500">
                        {c.email ?? "—"}
                      </span>
                      <span className="text-slate-500">{c.belongsTo}</span>
                      <span className="text-slate-500 capitalize">
                        {c.kind}
                      </span>
                      {isDirector ? (
                        <form
                          action={(
                            c.kind === "team"
                              ? deleteTeamContact
                              : deleteAssociationContact
                          ).bind(null, c.id)}
                        >
                          <ConfirmSubmitButton
                            confirmText={`Delete contact ${c.name}?`}
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
                    <div className="border-t border-slate-100 px-5 py-4">
                      <form
                        key={`${c.name}-${c.role}-${c.phone}-${c.email}`}
                        action={(
                          c.kind === "team"
                            ? updateTeamContact
                            : updateAssociationContact
                        ).bind(null, c.id)}
                        className="grid max-w-md grid-cols-2 gap-3"
                      >
                        <label className="col-span-2 block text-sm text-slate-700">
                          Name
                          <input
                            name="name"
                            defaultValue={c.name}
                            required
                            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                          />
                        </label>
                        <label className="block text-sm text-slate-700">
                          Role
                          <input
                            name="role"
                            defaultValue={c.role ?? ""}
                            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                          />
                        </label>
                        <label className="block text-sm text-slate-700">
                          Phone
                          <input
                            name="phone"
                            defaultValue={c.phone ?? ""}
                            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                          />
                        </label>
                        <label className="col-span-2 block text-sm text-slate-700">
                          Email
                          <input
                            name="email"
                            defaultValue={c.email ?? ""}
                            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                          />
                        </label>
                        <button
                          type="submit"
                          className="col-span-2 w-fit rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
                        >
                          Save
                        </button>
                      </form>
                    </div>
                  )}
                </CollapsibleDetails>
              ))}
            </div>
          </div>
        ) : (
          <p className="px-5 py-6 text-center text-sm text-slate-500">
            No contacts match.
          </p>
        )}
      </div>

      {isDirector && (
        <div className="mt-6 rounded-lg border border-slate-200 bg-white px-5 py-4">
          <CollapsibleDetails
            summary="+ Add Contact"
            summaryClassName="cursor-pointer text-sm font-semibold text-slate-900"
          >
            <form
              action={createContact}
              className="mt-4 grid grid-cols-2 gap-3"
            >
              <label className="col-span-2 text-sm text-slate-700">
                Belongs to
                <select
                  name="target"
                  required
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                >
                  <option value="">Select association or team…</option>
                  <optgroup label="Associations">
                    {(associations ?? []).map((a) => (
                      <option key={a.id} value={`association:${a.id}`}>
                        {a.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Teams">
                    {teamOptions.map((t) => (
                      <option key={t.id} value={`team:${t.id}`}>
                        {t.label}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </label>
              <label className="text-sm text-slate-700">
                Name
                <input
                  name="name"
                  required
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                />
              </label>
              <label className="text-sm text-slate-700">
                Role
                <input
                  name="role"
                  placeholder="President, Manager, Coach"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                />
              </label>
              <label className="text-sm text-slate-700">
                Phone
                <input
                  name="phone"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                />
              </label>
              <label className="text-sm text-slate-700">
                Email
                <input
                  name="email"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                />
              </label>
              <button
                type="submit"
                className="col-span-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                Add contact
              </button>
            </form>
          </CollapsibleDetails>
        </div>
      )}
    </div>
  );
}
