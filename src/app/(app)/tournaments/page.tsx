import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/profile";
import { createTournament } from "./actions";

export default async function TournamentsPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile();

  const { data: tournaments } = await supabase
    .from("tournaments")
    .select("*")
    .order("year", { ascending: false });

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-8 py-8">
      <h1 className="text-xl font-semibold text-slate-900">Tournaments</h1>

      <ul className="mt-6 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
        {tournaments?.length ? (
          tournaments.map((t) => (
            <li
              key={t.id}
              className="flex items-center justify-between px-4 py-3"
            >
              <div>
                <p className="font-medium text-slate-900">{t.name}</p>
                <p className="text-sm text-slate-500">{t.year}</p>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                {t.status}
              </span>
            </li>
          ))
        ) : (
          <li className="px-4 py-6 text-center text-sm text-slate-500">
            No tournaments yet.
          </li>
        )}
      </ul>

      {profile?.role === "director" && (
        <form
          action={createTournament}
          className="mt-8 space-y-4 rounded-lg border border-slate-200 bg-white p-6"
        >
          <h2 className="text-sm font-semibold text-slate-900">
            Create a new tournament
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <label className="text-sm text-slate-700">
              Year
              <input
                name="year"
                type="number"
                required
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
              />
            </label>
            <label className="text-sm text-slate-700">
              Name
              <input
                name="name"
                type="text"
                required
                placeholder="2027 Ice Breaker"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
              />
            </label>
            <label className="text-sm text-slate-700">
              Start date
              <input
                name="start_date"
                type="date"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
              />
            </label>
            <label className="text-sm text-slate-700">
              End date
              <input
                name="end_date"
                type="date"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
              />
            </label>
            <label className="col-span-2 text-sm text-slate-700">
              Location
              <input
                name="location"
                type="text"
                placeholder="Kootenai County Fairgrounds · Coeur d'Alene, Idaho"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
              />
            </label>
            <label className="col-span-2 text-sm text-slate-700">
              Public URL slug
              <input
                name="public_slug"
                type="text"
                placeholder="2027"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
              />
            </label>
          </div>
          <button
            type="submit"
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Create tournament
          </button>
        </form>
      )}
    </div>
  );
}
