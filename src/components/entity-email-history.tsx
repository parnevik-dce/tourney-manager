import { getEntityEmailHistory } from "@/lib/email-history";
import { CollapsibleDetails } from "@/components/collapsible-details";

export async function EntityEmailHistory({
  kind,
  entityId,
  tournamentId,
}: {
  kind: string;
  entityId: string;
  tournamentId: string | null;
}) {
  const history = await getEntityEmailHistory(kind, entityId, tournamentId);

  return (
    <div className="col-span-2 space-y-2 border-t border-slate-100 pt-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        Email History
      </p>
      {history.length ? (
        <ul className="space-y-1.5">
          {history.map((r) => {
            const send = r.email_sends;
            if (!send) return null;
            return (
              <li key={`${send.id}-${r.email}`} className="text-xs">
                <CollapsibleDetails
                  summaryClassName="cursor-pointer text-slate-600 hover:text-blue-600"
                  summary={
                    <>
                      <span className="text-slate-400">
                        {new Date(send.sent_at).toLocaleString()}
                      </span>{" "}
                      — {send.subject}{" "}
                      <span className="text-slate-400">to {r.email}</span>
                    </>
                  }
                >
                  <p className="mt-1 whitespace-pre-wrap rounded-md bg-slate-50 p-2 text-slate-600">
                    {send.body}
                  </p>
                </CollapsibleDetails>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-xs text-slate-400">No emails sent yet.</p>
      )}
    </div>
  );
}
