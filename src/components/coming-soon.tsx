export function ComingSoon({
  title,
  description,
  issue,
}: {
  title: string;
  description: string;
  issue: number;
}) {
  return (
    <div className="flex-1 px-8 py-8">
      <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
      <div className="mt-6 rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
        <p className="text-sm text-slate-600">{description}</p>
        <p className="mt-2 text-xs text-slate-400">
          Tracked in{" "}
          <a
            href={`https://github.com/parnevik-dce/tourney-manager/issues/${issue}`}
            className="text-blue-600 hover:underline"
          >
            issue #{issue}
          </a>
        </p>
      </div>
    </div>
  );
}
