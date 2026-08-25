"use client";

import { useState } from "react";

export function DueDateFields({
  defaultDueDate,
}: {
  defaultDueDate?: string | null;
}) {
  const [mode, setMode] = useState<"specific" | "before_tournament">(
    "specific",
  );

  return (
    <div className="space-y-1.5">
      <p className="text-sm text-slate-700">Due date</p>
      <div className="flex items-center gap-4 text-sm text-slate-600">
        <label className="flex items-center gap-1.5">
          <input
            type="radio"
            name="due_date_mode"
            value="specific"
            checked={mode === "specific"}
            onChange={() => setMode("specific")}
          />
          Specific date
        </label>
        <label className="flex items-center gap-1.5">
          <input
            type="radio"
            name="due_date_mode"
            value="before_tournament"
            checked={mode === "before_tournament"}
            onChange={() => setMode("before_tournament")}
          />
          Days before tournament
        </label>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input
          name="due_date"
          type="date"
          defaultValue={defaultDueDate ?? ""}
          required={mode === "specific"}
          disabled={mode !== "specific"}
          className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm disabled:bg-slate-100 disabled:text-slate-400"
        />
        <input
          name="due_days_before"
          type="number"
          min="0"
          placeholder="e.g. 30"
          required={mode === "before_tournament"}
          disabled={mode !== "before_tournament"}
          className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm disabled:bg-slate-100 disabled:text-slate-400"
        />
      </div>
    </div>
  );
}
