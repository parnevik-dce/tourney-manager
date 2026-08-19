import { Fragment } from "react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/profile";
import { getCurrentTournament } from "@/lib/tournament";
import {
  createVendor,
  updateVendor,
  updateVendorContact,
  deleteVendor,
  updateVendorStatus,
} from "./actions";
import { StatusSelect } from "@/components/status-select";
import { TextLink } from "@/components/text-link";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";

const TYPE_LABELS: Record<string, string> = {
  emt: "EMT / Medical",
  toilets: "Portable Toilets",
  food_truck: "Food Truck",
  merch: "Merchandise",
  referees: "Referees / Assigner",
  golf_carts: "Golf Carts",
  other: "Other",
};

const STATUS_LABELS: Record<string, string> = {
  not_confirmed: "Not Confirmed",
  pending: "Pending",
  committed: "Committed",
};

const STATUS_BADGE: Record<string, string> = {
  not_confirmed: "bg-red-100 text-red-700",
  pending: "bg-amber-100 text-amber-700",
  committed: "bg-green-100 text-green-700",
};

export default async function VendorsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error: errorMessage } = await searchParams;
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  const tournament = await getCurrentTournament();
  const isDirector = profile?.role === "director";

  const { data: vendors } = await supabase
    .from("vendors")
    .select("*, vendor_contacts(*)")
    .order("name");

  const { data: rawStatuses } = tournament
    ? await supabase
        .from("vendor_tournament_status")
        .select("*")
        .eq("tournament_id", tournament.id)
    : { data: null };

  const statusByVendor = new Map(
    (rawStatuses ?? []).map((s) => [s.vendor_id, s.status]),
  );

  return (
    <div className="flex-1 px-8 py-8">
      <h1 className="text-xl font-semibold text-slate-900">Vendor Tracker</h1>
      <p className="mt-1 text-sm text-slate-500">
        EMT, toilets, food, merch, officials, and more.
      </p>

      {errorMessage && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage}
        </p>
      )}

      {!tournament && (
        <p className="mt-6 text-sm text-amber-700">
          No active tournament — commitment status is tracked per tournament
          year. Create one in Tournaments first.
        </p>
      )}

      <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200 bg-white">
        {vendors?.length ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-5 py-2 font-medium">Vendor</th>
                <th className="px-5 py-2 font-medium">Type</th>
                <th className="px-5 py-2 font-medium">Contact</th>
                <th className="px-5 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {vendors.map((vendor) => {
                const contact = vendor.vendor_contacts?.[0];
                const status = statusByVendor.get(vendor.id) ?? "not_confirmed";
                return (
                  <Fragment key={vendor.id}>
                    <tr className="border-b border-slate-50">
                      <td className="px-5 py-3 font-medium text-slate-900">
                        {vendor.name}
                      </td>
                      <td className="px-5 py-3 text-slate-500">
                        {TYPE_LABELS[vendor.type] ?? vendor.type}
                      </td>
                      <td className="px-5 py-3 text-slate-500">
                        {contact ? (
                          <>
                            {contact.name}
                            {contact.phone && ` · ${contact.phone}`}
                            {contact.email && ` · ${contact.email}`}
                            {contact.phone && (
                              <>
                                {" · "}
                                <TextLink phone={contact.phone} />
                              </>
                            )}
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-5 py-3">
                        {isDirector && tournament ? (
                          <StatusSelect
                            status={status}
                            action={updateVendorStatus.bind(null, vendor.id)}
                            options={[
                              { value: "not_confirmed", label: "Not Confirmed" },
                              { value: "pending", label: "Pending" },
                              { value: "committed", label: "Committed" },
                            ]}
                          />
                        ) : (
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[status]}`}
                          >
                            {STATUS_LABELS[status]}
                          </span>
                        )}
                      </td>
                    </tr>
                    {isDirector && (
                      <tr className="border-b border-slate-50 last:border-0">
                        <td colSpan={4} className="px-5 pb-3">
                          <details>
                            <summary className="cursor-pointer text-xs font-medium text-blue-600">
                              Edit Vendor
                            </summary>
                            <div className="mt-3 grid grid-cols-2 gap-4">
                              <form
                                action={updateVendor.bind(null, vendor.id)}
                                className="space-y-2"
                              >
                                <label className="block text-sm text-slate-700">
                                  Vendor name
                                  <input
                                    name="name"
                                    defaultValue={vendor.name}
                                    required
                                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                                  />
                                </label>
                                <label className="block text-sm text-slate-700">
                                  Type
                                  <select
                                    name="type"
                                    defaultValue={vendor.type}
                                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                                  >
                                    {Object.entries(TYPE_LABELS).map(
                                      ([value, label]) => (
                                        <option key={value} value={value}>
                                          {label}
                                        </option>
                                      ),
                                    )}
                                  </select>
                                </label>
                                <div className="flex items-center gap-3">
                                  <button
                                    type="submit"
                                    className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
                                  >
                                    Save vendor
                                  </button>
                                </div>
                              </form>
                              {contact ? (
                                <form
                                  action={updateVendorContact.bind(
                                    null,
                                    contact.id,
                                  )}
                                  className="space-y-2"
                                >
                                  <label className="block text-sm text-slate-700">
                                    Contact name
                                    <input
                                      name="name"
                                      defaultValue={contact.name}
                                      required
                                      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                                    />
                                  </label>
                                  <label className="block text-sm text-slate-700">
                                    Contact phone
                                    <input
                                      name="phone"
                                      defaultValue={contact.phone ?? ""}
                                      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                                    />
                                  </label>
                                  <label className="block text-sm text-slate-700">
                                    Contact email
                                    <input
                                      name="email"
                                      defaultValue={contact.email ?? ""}
                                      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                                    />
                                  </label>
                                  <button
                                    type="submit"
                                    className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
                                  >
                                    Save contact
                                  </button>
                                </form>
                              ) : (
                                <p className="text-sm text-slate-500">
                                  No contact yet.
                                </p>
                              )}
                            </div>
                            <form
                              action={deleteVendor.bind(null, vendor.id)}
                              className="mt-3"
                            >
                              <ConfirmSubmitButton
                                confirmText={`Delete ${vendor.name}? This can't be undone.`}
                                className="text-sm text-red-600 hover:underline"
                              >
                                Delete Vendor
                              </ConfirmSubmitButton>
                            </form>
                          </details>
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
            No vendors yet.
          </p>
        )}
      </div>

      {isDirector && (
        <details className="mt-6 rounded-lg border border-slate-200 bg-white px-5 py-4">
          <summary className="cursor-pointer text-sm font-semibold text-slate-900">
            + Add Vendor
          </summary>
          <form action={createVendor} className="mt-4 grid grid-cols-2 gap-3">
            <label className="col-span-2 text-sm text-slate-700">
              Vendor name
              <input
                name="name"
                required
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
              />
            </label>
            <label className="col-span-2 text-sm text-slate-700">
              Type
              <select
                name="type"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
              >
                {Object.entries(TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm text-slate-700">
              Contact name
              <input
                name="contact_name"
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
              Add vendor
            </button>
          </form>
        </details>
      )}
    </div>
  );
}
