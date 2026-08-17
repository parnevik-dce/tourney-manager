"use client";

export function StatusSelect({
  status,
  action,
}: {
  status: string;
  action: (formData: FormData) => void;
}) {
  return (
    <form action={action}>
      <select
        name="status"
        defaultValue={status}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="rounded-md border border-slate-300 px-2 py-1 text-sm capitalize"
      >
        <option value="pending">Pending</option>
        <option value="registered">Registered</option>
      </select>
    </form>
  );
}
