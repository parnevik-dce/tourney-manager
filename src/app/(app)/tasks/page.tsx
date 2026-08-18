import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/profile";
import { getCurrentTournament } from "@/lib/tournament";
import { createTask, updateTaskStatus, loadStarterTasks } from "./actions";
import { StatusSelect } from "@/components/status-select";

const PHASE_LABELS: Record<string, string> = {
  pre_season: "Pre-Season",
  "60_days_out": "60 Days Out",
  "30_days_out": "30 Days Out",
  tournament_week: "Tournament Week",
};

const COLUMNS = [
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "done", label: "Done" },
];

export default async function TasksPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  const tournament = await getCurrentTournament();
  const isDirector = profile?.role === "director";

  const [{ data: rawTasks }, { data: rawProfiles }] = tournament
    ? await Promise.all([
        supabase
          .from("tasks")
          .select("*, profiles(full_name, email)")
          .eq("tournament_id", tournament.id)
          .order("sort_order")
          .order("created_at"),
        supabase.from("profiles").select("id, full_name, email"),
      ])
    : [{ data: null }, { data: null }];

  const tasks = rawTasks ?? [];
  const profiles = rawProfiles ?? [];

  const tasksByStatus = new Map<string, typeof tasks>();
  for (const task of tasks) {
    const list = tasksByStatus.get(task.status) ?? [];
    list.push(task);
    tasksByStatus.set(task.status, list);
  }

  return (
    <div className="flex-1 px-8 py-8">
      <h1 className="text-xl font-semibold text-slate-900">Task Board</h1>
      <p className="mt-1 text-sm text-slate-500">
        Based on the Ice Breaker planning timeline.
      </p>

      {!tournament && (
        <p className="mt-6 text-sm text-amber-700">
          No active tournament — create one in Tournaments first.
        </p>
      )}

      {tournament && (
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          {COLUMNS.map((col) => {
            const colTasks = tasksByStatus.get(col.value) ?? [];
            return (
              <div key={col.value} className="rounded-lg border border-slate-200 bg-white">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                    {col.label}
                  </h2>
                  <span className="text-xs text-slate-400">{colTasks.length}</span>
                </div>
                <div className="space-y-3 p-4">
                  {colTasks.map((task) => (
                    <div
                      key={task.id}
                      className="rounded-lg border border-slate-200 p-3"
                    >
                      <p className="text-sm font-medium text-slate-900">
                        {task.title}
                      </p>
                      <span className="mt-2 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                        {PHASE_LABELS[task.phase] ?? task.phase}
                      </span>
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          {task.profiles && (
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-[10px] font-semibold text-white">
                              {(task.profiles.full_name ?? task.profiles.email)
                                .split(" ")
                                .map((p: string) => p[0])
                                .slice(0, 2)
                                .join("")
                                .toUpperCase()}
                            </span>
                          )}
                          {task.due_date && (
                            <span className="text-xs text-slate-400">
                              {task.due_date}
                            </span>
                          )}
                        </div>
                        {isDirector || task.assignee_id === profile?.id ? (
                          <StatusSelect
                            status={task.status}
                            action={updateTaskStatus.bind(null, task.id)}
                            options={COLUMNS}
                          />
                        ) : null}
                      </div>
                    </div>
                  ))}
                  {!colTasks.length && (
                    <p className="py-4 text-center text-xs text-slate-400">
                      No tasks
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isDirector && tournament && !tasks.length && (
        <form action={loadStarterTasks} className="mt-6">
          <button
            type="submit"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Load starter tasks
          </button>
        </form>
      )}

      {isDirector && tournament && (
        <details className="mt-6 rounded-lg border border-slate-200 bg-white px-5 py-4">
          <summary className="cursor-pointer text-sm font-semibold text-slate-900">
            + Add Task
          </summary>
          <form action={createTask} className="mt-4 grid grid-cols-2 gap-3">
            <label className="col-span-2 text-sm text-slate-700">
              Title
              <input
                name="title"
                required
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
              />
            </label>
            <label className="text-sm text-slate-700">
              Phase
              <select
                name="phase"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
              >
                {Object.entries(PHASE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm text-slate-700">
              Due date
              <input
                name="due_date"
                type="date"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
              />
            </label>
            <label className="col-span-2 text-sm text-slate-700">
              Assignee
              <select
                name="assignee_id"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
              >
                <option value="">Unassigned</option>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name ?? p.email}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              className="col-span-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Add task
            </button>
          </form>
        </details>
      )}
    </div>
  );
}
