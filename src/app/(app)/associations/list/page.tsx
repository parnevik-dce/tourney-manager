import { Fragment } from "react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/profile";
import { updateAssociation, deleteAssociation } from "../actions";
import { CollapsibleDetails } from "@/components/collapsible-details";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { AssociationsSubNav } from "@/components/associations-sub-nav";

export default async function AssociationsListPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error: errorMessage } = await searchParams;
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  const isDirector = profile?.role === "director";

  const { data: associations } = await supabase
    .from("associations")
    .select("*, association_contacts(*), teams(id)")
    .order("name");

  return (
    <div className="flex-1 px-8 py-8">
      <h1 className="font-display text-2xl font-bold text-slate-900">
        Associations & Teams
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        All associations on record, across every tournament year.
      </p>

      <AssociationsSubNav />

      {errorMessage && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage}
        </p>
      )}

      <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200 bg-white">
        {associations?.length ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-5 py-2 font-medium">Association</th>
                <th className="px-5 py-2 font-medium">Mascot</th>
                <th className="px-5 py-2 font-medium">Primary Contact</th>
                <th className="px-5 py-2 font-medium">Teams</th>
              </tr>
            </thead>
            <tbody>
              {associations.map((assoc) => {
                const primaryContact = assoc.association_contacts?.[0];
                const teamCount = assoc.teams?.length ?? 0;
                return (
                  <Fragment key={assoc.id}>
                    <tr className="border-b border-slate-50 last:border-0">
                      <td className="px-5 py-3 font-medium text-slate-900">
                        {assoc.name}
                      </td>
                      <td className="px-5 py-3 text-slate-500">
                        {assoc.mascot ?? "—"}
                      </td>
                      <td className="px-5 py-3 text-slate-500">
                        {primaryContact ? (
                          <>
                            {primaryContact.name}
                            {primaryContact.email &&
                              ` · ${primaryContact.email}`}
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-5 py-3 text-slate-500">
                        {teamCount}
                      </td>
                    </tr>
                    {isDirector && (
                      <tr className="border-b border-slate-50 last:border-0">
                        <td colSpan={4} className="px-5 pb-3">
                          <CollapsibleDetails
                            summary="Edit"
                            summaryClassName="cursor-pointer text-xs font-medium text-blue-600"
                          >
                            <div className="mt-3 grid grid-cols-2 gap-4">
                              <form
                                key={`${assoc.name}-${assoc.mascot}`}
                                action={updateAssociation.bind(
                                  null,
                                  assoc.id,
                                )}
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
                                <button
                                  type="submit"
                                  className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
                                >
                                  Save
                                </button>
                              </form>
                              <form
                                action={deleteAssociation.bind(
                                  null,
                                  assoc.id,
                                )}
                                className="flex items-start"
                              >
                                <ConfirmSubmitButton
                                  confirmText={`Delete ${assoc.name}? This can't be undone.`}
                                  className="text-sm text-red-600 hover:underline"
                                >
                                  Delete Association
                                </ConfirmSubmitButton>
                              </form>
                            </div>
                          </CollapsibleDetails>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p className="px-5 py-6 text-center text-sm text-slate-500">
            No associations yet.
          </p>
        )}
      </div>
    </div>
  );
}
