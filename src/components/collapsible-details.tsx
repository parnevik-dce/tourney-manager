"use client";

import { useState } from "react";

export function CollapsibleDetails({
  summary,
  children,
  className,
  summaryClassName,
}: {
  summary: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  summaryClassName?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <details
      open={open}
      onToggle={(e) => setOpen(e.currentTarget.open)}
      className={className}
    >
      <summary
        className={
          summaryClassName ?? "cursor-pointer text-sm font-medium text-blue-600"
        }
      >
        {summary}
      </summary>
      <div onSubmitCapture={() => setOpen(false)}>{children}</div>
    </details>
  );
}
