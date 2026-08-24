import { getCurrentProfile } from "@/lib/profile";
import { getConnectedGmailAddress } from "@/lib/mail";
import { connectGmail, disconnectGmail } from "./actions";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";

export default async function SettingsPage() {
  const profile = await getCurrentProfile();
  const isDirector = profile?.role === "director";
  const connectedEmail = await getConnectedGmailAddress();

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-8 py-8">
      <h1 className="font-display text-2xl font-bold text-slate-900">
        Settings
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        App-wide configuration.
      </p>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white px-5 py-4">
        <h2 className="text-sm font-semibold text-slate-900">
          Gmail Connection
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Used to send bulk emails to associations, teams, contacts, and
          vendors. Requires a Gmail App Password (needs 2-Step Verification
          enabled on the account) — generate one at{" "}
          <a
            href="https://myaccount.google.com/apppasswords"
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 hover:underline"
          >
            myaccount.google.com/apppasswords
          </a>
          .
        </p>

        {connectedEmail ? (
          <div className="mt-4 flex items-center justify-between rounded-md bg-green-50 px-3 py-2">
            <p className="text-sm text-green-800">
              Connected as <span className="font-medium">{connectedEmail}</span>
            </p>
            {isDirector && (
              <form action={disconnectGmail}>
                <ConfirmSubmitButton
                  confirmText="Disconnect Gmail? Bulk email sending will stop working until reconnected."
                  className="text-sm text-red-600 hover:underline"
                >
                  Disconnect
                </ConfirmSubmitButton>
              </form>
            )}
          </div>
        ) : (
          <p className="mt-4 text-sm text-amber-700">
            No Gmail account connected yet — bulk email sending is disabled.
          </p>
        )}

        {isDirector && (
          <form
            action={connectGmail}
            className="mt-4 space-y-3 border-t border-slate-100 pt-4"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              {connectedEmail ? "Replace connection" : "Connect Gmail"}
            </p>
            <label className="block text-sm text-slate-700">
              Gmail address
              <input
                name="email"
                type="email"
                required
                placeholder="tournament@gmail.com"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
              />
            </label>
            <label className="block text-sm text-slate-700">
              App password
              <input
                name="app_password"
                type="password"
                required
                placeholder="16-character app password"
                autoComplete="off"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
              />
            </label>
            <button
              type="submit"
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              {connectedEmail ? "Reconnect" : "Connect"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
