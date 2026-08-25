export default function Loading() {
  return (
    <div className="flex flex-1 items-center justify-center py-24">
      <div className="flex flex-col items-center gap-4">
        <svg
          width="72"
          height="72"
          viewBox="0 0 64 64"
          className="animate-[ice-spin_2.2s_linear_infinite]"
        >
          <circle
            cx="32"
            cy="32"
            r="26"
            fill="none"
            stroke="#dbeafe"
            strokeWidth="6"
          />
          <circle
            cx="32"
            cy="32"
            r="26"
            fill="none"
            stroke="#2563eb"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray="163"
            className="animate-[ice-crack_1.6s_ease-in-out_infinite]"
          />
        </svg>
        <p className="font-display text-xs font-semibold uppercase tracking-wide text-slate-400">
          Loading
        </p>
      </div>
    </div>
  );
}
