"use client";

export function ConfirmSubmitButton({
  confirmText,
  className,
  children,
}: {
  confirmText: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(e) => {
        // Prevent bubbling to an ancestor <summary> (e.g. when Delete sits
        // inside a CollapsibleDetails row-summary), which would otherwise
        // also toggle that row open/closed on this same click.
        e.stopPropagation();
        if (!window.confirm(confirmText)) {
          e.preventDefault();
        }
      }}
    >
      {children}
    </button>
  );
}
