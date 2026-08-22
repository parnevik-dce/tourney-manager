"use client";

export function AssociationsFilterBar({
  associations,
  divisions,
  association,
  division,
  status,
}: {
  associations: { id: string; name: string }[];
  divisions: { id: string; name: string }[];
  association: string;
  division: string;
  status: string;
}) {
  const hasFilters = Boolean(association || division || status);

  return (
    <form
      method="get"
      className="mt-4 flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4"
    >
      <label className="block text-sm text-slate-700">
        Association
        <select
          key={association}
          name="association"
          defaultValue={association}
          onChange={(e) => e.currentTarget.form?.requestSubmit()}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
        >
          <option value="">All associations</option>
          {associations.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm text-slate-700">
        Division
        <select
          key={division}
          name="division"
          defaultValue={division}
          onChange={(e) => e.currentTarget.form?.requestSubmit()}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
        >
          <option value="">All divisions</option>
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
          key={status}
          name="status"
          defaultValue={status}
          onChange={(e) => e.currentTarget.form?.requestSubmit()}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="registered">Registered</option>
        </select>
      </label>
      {hasFilters && (
        <a
          href="/associations"
          className="text-sm text-blue-600 hover:underline"
        >
          Clear filters
        </a>
      )}
    </form>
  );
}
