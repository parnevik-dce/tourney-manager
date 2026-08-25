import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/profile";
import {
  createAssociation,
  updateAssociation,
  deleteAssociation,
  updateAssociationContact,
  addAssociationContact,
  deleteAssociationContact,
  importAssociationsCsv,
} from "../actions";
import { CollapsibleDetails } from "@/components/collapsible-details";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { AssociationsSubNav } from "@/components/associations-sub-nav";
import { BulkEmailComposer } from "@/components/bulk-email-composer";
import { EmailAddressLink } from "@/components/email-address-link";
import { sendBulkEmail } from "@/lib/communications-actions";
import { isGmailConnected } from "@/lib/mail";

type Contact = {
  id: string;
  name: string;
  role: string | null;
  phone: string | null;
  email: string | null;
};

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

  const gmailConnected = await isGmailConnected();

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

      {isDirector && (
        <div className="mt-6">
          {gmailConnected ? (
            <BulkEmailComposer
              triggerLabel="Email All Associations"
              groups={(associations ?? []).map((a) => ({
                id: a.id,
                label: a.name,
                emails: (a.association_contacts ?? [])
                  .map((c: Contact) => c.email)
                  .filter((e: string | null): e is string => Boolean(e)),
              }))}
              action={sendBulkEmail}
            />
          ) : (
            <p className="text-sm text-amber-700">
              Gmail not connected —{" "}
              <a href="/settings" className="underline">
                connect an account
              </a>{" "}
              to enable bulk email.
            </p>
          )}
        </div>
      )}

      {isDirector && (
        <div className="mt-4 rounded-lg border border-slate-200 bg-white px-5 py-4">
          <CollapsibleDetails
            summary="+ Add Association"
            summaryClassName="cursor-pointer text-sm font-semibold text-slate-900"
          >
            <form
              action={createAssociation}
              className="mt-4 grid grid-cols-2 gap-3"
            >
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
        </div>
      )}

      <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200 bg-white">
        {associations?.length ? (
          <div className="min-w-[640px] text-sm">
            <div className="grid grid-cols-[2fr_1fr_2fr_1fr_auto] gap-3 border-b border-slate-100 px-5 py-2 text-left text-xs uppercase tracking-wide text-slate-400">
              <span>Association</span>
              <span>Mascot</span>
              <span>Primary Contact</span>
              <span>Teams</span>
              <span />
            </div>
            <div className="divide-y divide-slate-50">
              {associations.map((assoc) => {
                const contacts: Contact[] = assoc.association_contacts ?? [];
                const primaryContact = contacts[0];
                const teamCount = assoc.teams?.length ?? 0;
                return (
                  <CollapsibleDetails
                    key={assoc.id}
                    summaryClassName="grid grid-cols-[2fr_1fr_2fr_1fr_auto] items-center gap-3 px-5 py-3 cursor-pointer hover:bg-slate-50"
                    summary={
                      <>
                        <span className="font-medium text-slate-900 hover:text-blue-600 hover:underline">
                          {assoc.name}
                        </span>
                        <span className="text-slate-500">
                          {assoc.mascot ?? "—"}
                        </span>
                        <span className="text-slate-500">
                          {primaryContact ? (
                            <>
                              {primaryContact.name}
                              {primaryContact.email && (
                                <>
                                  {" · "}
                                  {isDirector && gmailConnected ? (
                                    <EmailAddressLink
                                      email={primaryContact.email}
                                      action={sendBulkEmail}
                                    />
                                  ) : (
                                    primaryContact.email
                                  )}
                                </>
                              )}
                            </>
                          ) : (
                            "—"
                          )}
                        </span>
                        <span className="text-slate-500">{teamCount}</span>
                        {isDirector ? (
                          <form
                            action={deleteAssociation.bind(null, assoc.id)}
                          >
                            <ConfirmSubmitButton
                              confirmText={`Delete ${assoc.name}? This can't be undone.`}
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
                          key={`${assoc.name}-${assoc.mascot}`}
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
                            <div key={c.id} className="flex items-end gap-2">
                              <form
                                action={updateAssociationContact.bind(
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
                                action={deleteAssociationContact.bind(
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
                            action={addAssociationContact.bind(
                              null,
                              assoc.id,
                            )}
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
            No associations yet.
          </p>
        )}
      </div>

      {isDirector && (
        <div className="mt-4">
          <CollapsibleDetails
            summary="Import associations from CSV"
            summaryClassName="cursor-pointer text-xs text-slate-400 hover:text-slate-600 hover:underline"
          >
            <div className="mt-3 rounded-lg border border-slate-200 bg-white px-5 py-4">
              <p className="text-sm text-slate-600">
                Bulk-import associations with their key contacts. Header row,
                in this order:
              </p>
              <div className="mt-2 overflow-x-auto rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                association_name,president_name,president_email,boys_director_name,boys_director_email,treasurer_name,treasurer_email
              </div>
              <p className="mt-2 text-xs text-slate-400">
                <code className="rounded bg-slate-100 px-1 py-0.5">
                  association_name
                </code>{" "}
                is required — rows without it are skipped. Every contact
                field is optional; leave blank if an association doesn&apos;t
                have that contact.
              </p>
              <form
                action={importAssociationsCsv}
                className="mt-4 flex items-center gap-2"
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
            </div>
          </CollapsibleDetails>
        </div>
      )}
    </div>
  );
}
