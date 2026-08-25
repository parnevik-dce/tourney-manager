"use client";

import { useRef, useState } from "react";

export function EmailAddressLink({
  email,
  action,
}: {
  email: string;
  action: (formData: FormData) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [confirming, setConfirming] = useState(false);
  const [sent, setSent] = useState(false);

  function close() {
    dialogRef.current?.close();
    setConfirming(false);
    setSent(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          dialogRef.current?.showModal();
        }}
        className="text-blue-600 hover:underline"
      >
        {email}
      </button>
      <dialog
        ref={dialogRef}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-lg border border-slate-200 p-0 shadow-lg backdrop:bg-slate-900/40"
      >
        <div className="px-5 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">
              Email {email}
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
              Email sent to {email}.
            </div>
          ) : (
            <form
              action={(formData) => {
                action(formData);
                setSent(true);
              }}
              className="mt-4 space-y-3"
            >
              <input type="hidden" name="recipients" value={email} />
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
                  onClick={() => setConfirming(true)}
                  className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                >
                  Review &amp; Send
                </button>
              ) : (
                <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
                  <p className="text-sm text-amber-800">
                    Send this email to {email}? This can&apos;t be undone.
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
          )}
        </div>
      </dialog>
    </>
  );
}
