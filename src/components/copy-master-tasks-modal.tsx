"use client";

import { useRef } from "react";

export function CopyMasterTasksModal({
  tournaments,
  action,
}: {
  tournaments: { id: string; year: number; name: string }[];
  action: (sourceTournamentId: string, formData: FormData) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        Copy Master Tasks from another tournament
      </button>
      <dialog
        ref={dialogRef}
        className="w-full max-w-md rounded-lg border border-slate-200 p-0 shadow-lg backdrop:bg-slate-900/40"
      >
        <div className="px-5 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">
              Copy Master Tasks
            </h2>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="text-sm text-slate-400 hover:text-slate-600"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Select a prior tournament to copy its master tasks from. Due
            dates are recalculated relative to this tournament&apos;s start
            date.
          </p>
          <ul className="mt-4 max-h-72 space-y-1 overflow-y-auto">
            {tournaments.map((t) => (
              <li key={t.id}>
                <form action={action.bind(null, t.id)}>
                  <button
                    type="submit"
                    className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <span>{t.name}</span>
                    <span className="text-slate-400">{t.year}</span>
                  </button>
                </form>
              </li>
            ))}
            {tournaments.length === 0 && (
              <li className="px-3 py-4 text-center text-sm text-slate-400">
                No other tournaments with master tasks yet.
              </li>
            )}
          </ul>
        </div>
      </dialog>
    </>
  );
}
