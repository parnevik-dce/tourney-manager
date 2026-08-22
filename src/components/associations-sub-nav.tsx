"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/associations", label: "Overview" },
  { href: "/associations/list", label: "Associations" },
  { href: "/associations/teams", label: "Teams" },
  { href: "/associations/contacts", label: "Contacts" },
  { href: "/associations/rosters", label: "Rosters" },
];

export function AssociationsSubNav() {
  const pathname = usePathname();

  return (
    <nav className="mt-4 flex gap-1 border-b border-slate-200">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-3 py-2 text-sm font-medium ${
              active
                ? "border-b-2 border-blue-600 text-blue-700"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
