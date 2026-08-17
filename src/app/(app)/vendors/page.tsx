import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/profile";
import { getCurrentTournament } from "@/lib/tournament";
import { createVendor, updateVendorStatus } from "./actions";
import { StatusSelect } from "@/components/status-select";

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

export default async function VendorsPage() {
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
                  <tr
                    key={vendor.id}
                    className="border-b border-slate-50 last:border-0"
                  >
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
              Add vendor
            </button>
          </form>
        </details>
      )}
    </div>
  );
}
