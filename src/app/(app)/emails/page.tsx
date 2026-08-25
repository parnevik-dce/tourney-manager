import { getEmailSends } from "@/lib/email-history";
import { getCurrentProfile } from "@/lib/profile";
import { getCurrentTournament } from "@/lib/tournament";
import { CollapsibleDetails } from "@/components/collapsible-details";

export default async function EmailHistoryPage() {
  const profile = await getCurrentProfile();

  if (profile?.role !== "director") {
    return (
      <div className="flex-1 px-8 py-8">
        <p className="text-sm text-slate-500">
          You don&apos;t have access to this page.
        </p>
      </div>
    );
  }

  const tournament = await getCurrentTournament();
  const sends = tournament ? await getEmailSends(tournament.id) : [];

  return (
    <div className="flex-1 px-8 py-8">
      <h1 className="font-display text-2xl font-bold text-slate-900">
        Email History
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        {tournament
          ? `Every bulk and individual email sent for ${tournament.name}.`
          : "No active tournament — activate one in Tournaments to see its email history."}
      </p>

      <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200 bg-white">
        {sends.length ? (
          <div className="divide-y divide-slate-50 text-sm">
            {sends.map((send) => {
              const recipients = send.email_recipients ?? [];
              return (
                <CollapsibleDetails
                  key={send.id}
                  summaryClassName="flex items-center justify-between gap-3 px-5 py-3 cursor-pointer hover:bg-slate-50"
                  summary={
                    <>
                      <span>
                        <span className="font-medium text-slate-900">
                          {send.subject}
                        </span>{" "}
                        <span className="text-slate-400">
                          — {new Date(send.sent_at).toLocaleString()}
                        </span>
                      </span>
                      <span className="text-xs text-slate-400">
                        {recipients.length}{" "}
                        {recipients.length === 1 ? "recipient" : "recipients"}
                      </span>
                    </>
                  }
                >
                  <div className="space-y-3 border-t border-slate-100 px-5 py-4">
                    <p className="text-xs text-slate-400">
                      Sent by{" "}
                      {send.profiles?.full_name ?? send.profiles?.email ?? "—"}
                    </p>
                    <p className="whitespace-pre-wrap rounded-md bg-slate-50 p-3 text-sm text-slate-700">
                      {send.body}
                    </p>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Recipients
                      </p>
                      <ul className="mt-1 space-y-0.5 text-sm text-slate-600">
                        {recipients.map(
                          (r: {
                            id: string;
                            entity_name: string;
                            entity_kind: string;
                            email: string;
                          }) => (
                            <li key={r.id}>
                              {r.entity_name}{" "}
                              <span className="text-slate-400">
                                ({r.entity_kind})
                              </span>{" "}
                              — {r.email}
                            </li>
                          ),
                        )}
                      </ul>
                    </div>
                  </div>
                </CollapsibleDetails>
              );
            })}
          </div>
        ) : (
          <p className="px-5 py-6 text-center text-sm text-slate-500">
            No emails sent yet.
          </p>
        )}
      </div>
    </div>
  );
}
