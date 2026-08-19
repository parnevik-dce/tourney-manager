"use client";

export function AmountInput({
  defaultValue,
  action,
}: {
  defaultValue: number | null;
  action: (formData: FormData) => void;
}) {
  return (
    <form action={action}>
      <input
        key={String(defaultValue)}
        type="number"
        step="0.01"
        name="actual_amount"
        defaultValue={defaultValue ?? ""}
        placeholder="—"
        onBlur={(e) => e.currentTarget.form?.requestSubmit()}
        className="w-24 rounded-md border border-slate-300 px-2 py-1 text-right text-sm"
      />
    </form>
  );
}
