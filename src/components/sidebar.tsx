"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/components/sign-out-button";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard" },
  { href: "/associations", label: "Associations & Teams" },
  { href: "/vendors", label: "Vendor Tracker" },
  { href: "/budget", label: "Budget" },
  { href: "/tasks", label: "Task Board" },
  { href: "/fields", label: "Fields & Divisions" },
];

type Tournament = {
  id: string;
  name: string;
  status: string;
} | null;

type Profile = {
  full_name: string | null;
  email: string;
  role: string;
} | null;

export function Sidebar({
  tournament,
  profile,
}: {
  tournament: Tournament;
  profile: Profile;
}) {
  const pathname = usePathname();

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-5 py-5">
        <p className="text-sm font-bold tracking-tight text-slate-900">
          ICE BREAKER
        </p>
        <p className="text-xs font-medium text-slate-400">
          TOURNAMENT MANAGER
        </p>
      </div>

      <Link
        href="/tournaments"
        className="flex items-center justify-between border-b border-slate-200 px-5 py-4 hover:bg-slate-50"
      >
        <span className="text-sm font-semibold text-slate-900">
          {tournament ? tournament.name : "No active tournament"}
        </span>
        {tournament && (
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-green-700">
            {tournament.status.toUpperCase()}
          </span>
        )}
      </Link>

      <nav className="flex-1 space-y-0.5 px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-md px-3 py-2 text-sm font-medium ${
                active
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-200 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
            {(profile?.full_name ?? profile?.email ?? "?")
              .split(" ")
              .map((p) => p[0])
              .slice(0, 2)
              .join("")
              .toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-900">
              {profile?.full_name ?? profile?.email}
            </p>
            <p className="text-xs capitalize text-slate-500">
              {profile?.role === "director"
                ? "Tournament Director"
                : "Board Member"}
            </p>
          </div>
        </div>
        <div className="mt-3">
          <SignOutButton />
        </div>
      </div>
    </aside>
  );
}
