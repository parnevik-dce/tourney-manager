"use client";

export function StatusSelect({
  status,
  action,
  options,
}: {
  status: string;
  action: (formData: FormData) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <form action={action}>
      <select
        key={status}
        name="status"
        defaultValue={status}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-700"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </form>
  );
}
