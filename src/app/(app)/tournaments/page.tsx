import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/profile";
import {
  createTournament,
  updateTournament,
  uploadTournamentLogo,
} from "./actions";
import { CollapsibleDetails } from "@/components/collapsible-details";
import { LogoUploadForm } from "@/components/logo-upload-form";

const STATUS_OPTIONS = ["active", "inactive"];

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default async function TournamentsPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile();

  const { data: tournaments } = await supabase
    .from("tournaments")
    .select("*")
    .order("year", { ascending: false });

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-8 py-8">
      <h1 className="font-display text-2xl font-bold text-slate-900">Tournaments</h1>

      <ul className="mt-6 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
        {tournaments?.length ? (
          tournaments.map((t) => (
            <li key={t.id} className="px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {t.logo_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={t.logo_url}
                      alt=""
                      className="h-10 w-10 rounded object-contain"
                    />
                  )}
                  <div>
                    <p className="font-medium text-slate-900">{t.name}</p>
                    <p className="text-sm text-slate-500">{t.year}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                    {capitalize(t.status)}
                  </span>
                  {profile?.role === "director" && (
                    <CollapsibleDetails
                      className="relative"
                      summary="Edit"
                      summaryClassName="cursor-pointer list-none text-sm text-blue-600 hover:underline"
                    >
                      <div className="absolute right-0 z-10 mt-2 w-72 space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-lg">
                        <form
                          action={updateTournament.bind(null, t.id)}
                          className="space-y-3"
                        >
                          <label className="block text-sm text-slate-700">
                            Year
                            <input
                              name="year"
                              type="number"
                              required
                              defaultValue={t.year}
                              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                            />
                          </label>
                          <label className="block text-sm text-slate-700">
                            Name
                            <input
                              name="name"
                              type="text"
                              required
                              defaultValue={t.name}
                              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                            />
                          </label>
                          <label className="block text-sm text-slate-700">
                            Start date
                            <input
                              name="start_date"
                              type="date"
                              defaultValue={t.start_date ?? ""}
                              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                            />
                          </label>
                          <label className="block text-sm text-slate-700">
                            End date
                            <input
                              name="end_date"
                              type="date"
                              defaultValue={t.end_date ?? ""}
                              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                            />
                          </label>
                          <label className="block text-sm text-slate-700">
                            Location
                            <input
                              name="location"
                              type="text"
                              defaultValue={t.location ?? ""}
                              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                            />
                          </label>
                          <label className="block text-sm text-slate-700">
                            Public URL slug
                            <input
                              name="public_slug"
                              type="text"
                              defaultValue={t.public_slug}
                              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                            />
                          </label>
                          <label className="block text-sm text-slate-700">
                            Status
                            <select
                              name="status"
                              defaultValue={t.status}
                              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                            >
                              {STATUS_OPTIONS.map((s) => (
                                <option key={s} value={s}>
                                  {capitalize(s)}
                                </option>
                              ))}
                            </select>
                          </label>
                          <button
                            type="submit"
                            className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                          >
                            Save
                          </button>
                        </form>
                        <LogoUploadForm
                          action={uploadTournamentLogo.bind(null, t.id)}
                        />
                      </div>
                    </CollapsibleDetails>
                  )}
                </div>
              </div>
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
