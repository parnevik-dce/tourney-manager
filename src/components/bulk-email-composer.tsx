"use client";

import { useMemo, useRef, useState } from "react";

type Group = {
  id: string;
  label: string;
  emails: string[];
};

export function BulkEmailComposer({
  triggerLabel,
  groups,
  action,
}: {
  triggerLabel: string;
  groups: Group[];
  action: (formData: FormData) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(groups.map((g) => g.id)),
  );
  const [confirming, setConfirming] = useState(false);
  const [sent, setSent] = useState(false);

  const recipientEmails = useMemo(() => {
    const set = new Set<string>();
    for (const g of groups) {
      if (selected.has(g.id)) {
        for (const e of g.emails) set.add(e);
      }
    }
    return [...set];
  }, [groups, selected]);

  const allSelected = selected.size === groups.length && groups.length > 0;

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(groups.map((g) => g.id)));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function close() {
    dialogRef.current?.close();
    setConfirming(false);
    setSent(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        {triggerLabel}
      </button>
      <dialog
        ref={dialogRef}
        className="w-full max-w-lg rounded-lg border border-slate-200 p-0 shadow-lg backdrop:bg-slate-900/40"
      >
        <div className="max-h-[85vh] overflow-y-auto px-5 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">
              {triggerLabel}
            </h2>
            <button
              type="button"
              onClick={close}
              className="text-sm text-slate-400 hover:text-slate-600"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          {sent ? (
            <div className="mt-4 rounded-md bg-green-50 px-3 py-4 text-center text-sm text-green-700">
              Email sent to {recipientEmails.length}{" "}
              {recipientEmails.length === 1 ? "recipient" : "recipients"}.
            </div>
          ) : (
            <>
              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Recipients
                  </p>
                  <button
                    type="button"
                    onClick={toggleAll}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    {allSelected ? "Deselect all" : "Select all"}
                  </button>
                </div>
                <div className="mt-2 max-h-48 space-y-1 overflow-y-auto rounded-md border border-slate-200 p-2">
                  {groups.map((g) => (
                    <label
                      key={g.id}
                      className="flex items-center gap-2 rounded px-1.5 py-1 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <input
                        type="checkbox"
                        checked={selected.has(g.id)}
                        onChange={() => toggleOne(g.id)}
                      />
                      <span className="flex-1">{g.label}</span>
                      <span className="text-xs text-slate-400">
                        {g.emails.length}
                      </span>
                    </label>
                  ))}
                  {groups.length === 0 && (
                    <p className="px-1.5 py-2 text-center text-sm text-slate-400">
                      No recipients found.
                    </p>
                  )}
                </div>
                <p className="mt-1.5 text-xs text-slate-500">
                  {recipientEmails.length}{" "}
                  {recipientEmails.length === 1
                    ? "unique email address"
                    : "unique email addresses"}{" "}
                  will be BCC&apos;d.
                </p>
              </div>

              <form
                action={(formData) => {
                  action(formData);
                  setSent(true);
                }}
                className="mt-4 space-y-3"
              >
                <input
                  type="hidden"
                  name="recipients"
                  value={recipientEmails.join(",")}
                />
                <label className="block text-sm text-slate-700">
                  Subject
                  <input
                    name="subject"
                    required
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                  />
                </label>
                <label className="block text-sm text-slate-700">
                  Message
                  <textarea
                    name="body"
                    required
                    rows={8}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                  />
                </label>

                {!confirming ? (
                  <button
                    type="button"
                    disabled={recipientEmails.length === 0}
                    onClick={() => setConfirming(true)}
                    className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    Review &amp; Send
                  </button>
                ) : (
                  <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
                    <p className="text-sm text-amber-800">
                      Send this email to {recipientEmails.length}{" "}
                      {recipientEmails.length === 1
                        ? "recipient"
                        : "recipients"}
                      ? This can&apos;t be undone.
                    </p>
                    <div className="mt-2 flex gap-2">
                      <button
                        type="submit"
                        className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
                      >
                        Confirm Send
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirming(false)}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </>
          )}
        </div>
      </dialog>
    </>
  );
}
