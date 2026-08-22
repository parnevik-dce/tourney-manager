"use client";

export function ContactsFilterBar({
  associations,
  association,
  type,
  q,
}: {
  associations: { id: string; name: string }[];
  association: string;
  type: string;
  q: string;
}) {
  const hasFilters = Boolean(association || type || q);

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
        Type
        <select
          key={type}
          name="type"
          defaultValue={type}
          onChange={(e) => e.currentTarget.form?.requestSubmit()}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
        >
          <option value="">All types</option>
          <option value="association">Association</option>
          <option value="team">Team</option>
        </select>
      </label>
      <label className="block text-sm text-slate-700">
        Search
        <input
          name="q"
          defaultValue={q}
          placeholder="Name or role"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
        />
      </label>
      <button
        type="submit"
        className="rounded-lg bg-slate-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
      >
        Filter
      </button>
      {hasFilters && (
        <a
          href="/associations/contacts"
          className="text-sm text-blue-600 hover:underline"
        >
          Clear filters
        </a>
      )}
    </form>
  );
}
