"use client";

export function TasksFilterBar({
  statuses,
  status,
}: {
  statuses: { value: string; label: string }[];
  status: string;
}) {
  return (
    <form
      method="get"
      className="mt-4 flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4"
    >
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
          {statuses.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        className="rounded-lg bg-slate-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
      >
        Filter
      </button>
      {status && (
        <a href="/tasks" className="text-sm text-blue-600 hover:underline">
          Clear filters
        </a>
      )}
    </form>
  );
}
