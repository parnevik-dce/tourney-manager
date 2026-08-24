import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/profile";
import { getCurrentTournament } from "@/lib/tournament";
import {
  createTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
  copyMasterTasks,
} from "./actions";
import { StatusSelect } from "@/components/status-select";
import { CollapsibleDetails } from "@/components/collapsible-details";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { TasksFilterBar } from "@/components/tasks-filter-bar";
import { CopyMasterTasksModal } from "@/components/copy-master-tasks-modal";

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

function DueDateFields({
  defaultDueDate,
}: {
  defaultDueDate?: string | null;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-sm text-slate-700">Due date</p>
      <div className="flex items-center gap-4 text-sm text-slate-600">
        <label className="flex items-center gap-1.5">
          <input
            type="radio"
            name="due_date_mode"
            value="specific"
            defaultChecked
          />
          Specific date
        </label>
        <label className="flex items-center gap-1.5">
          <input type="radio" name="due_date_mode" value="before_tournament" />
          Days before tournament
        </label>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input
          name="due_date"
          type="date"
          defaultValue={defaultDueDate ?? ""}
          className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
        />
        <input
          name="due_days_before"
          type="number"
          min="0"
          placeholder="e.g. 30"
          className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
        />
      </div>
    </div>
  );
}

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: statusFilter = "" } = await searchParams;
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  const tournament = await getCurrentTournament();
  const isDirector = profile?.role === "director";

  const [{ data: rawTasks }, { data: rawProfiles }] = tournament
    ? await Promise.all([
        supabase
          .from("tasks")
          .select("*, profiles(full_name, email)")
          .eq("tournament_id", tournament.id),
        supabase.from("profiles").select("id, full_name, email"),
      ])
    : [{ data: null }, { data: null }];

  const allTasks = rawTasks ?? [];
  const profiles = rawProfiles ?? [];

  let masterTaskSources: { id: string; year: number; name: string }[] = [];
  if (isDirector && tournament && allTasks.length === 0) {
    const { data: masterTaskRows } = await supabase
      .from("tasks")
      .select("tournament_id")
      .eq("is_master_task", true)
      .neq("tournament_id", tournament.id);

    const sourceIds = [
      ...new Set((masterTaskRows ?? []).map((t) => t.tournament_id)),
    ];

    if (sourceIds.length) {
      const { data: sourceTournaments } = await supabase
        .from("tournaments")
        .select("id, year, name")
        .in("id", sourceIds)
        .order("year", { ascending: false });
      masterTaskSources = sourceTournaments ?? [];
    }
  }

  const sortedTasks = [...allTasks].sort((a, b) => {
    if (!a.due_date && !b.due_date) return 0;
    if (!a.due_date) return 1;
    if (!b.due_date) return -1;
    return a.due_date.localeCompare(b.due_date);
  });

  const existingStatuses = [...new Set(allTasks.map((t) => t.status))].map(
    (value) => ({
      value,
      label: COLUMNS.find((c) => c.value === value)?.label ?? value,
    }),
  );

  const tasks = sortedTasks.filter(
    (t) => !statusFilter || t.status === statusFilter,
  );

  return (
    <div className="flex-1 px-8 py-8">
      <h1 className="font-display text-2xl font-bold text-slate-900">Task Board</h1>
      <p className="mt-1 text-sm text-slate-500">
        Based on the Ice Breaker planning timeline.
      </p>

      {!tournament && (
        <p className="mt-6 text-sm text-amber-700">
          No active tournament — create one in Tournaments first.
        </p>
      )}

      {isDirector && tournament && (
        <CollapsibleDetails
          className="mt-6 rounded-lg border border-slate-200 bg-white px-5 py-4"
          summary="+ Add Task"
          summaryClassName="cursor-pointer text-sm font-semibold text-slate-900"
        >
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
            <div className="col-span-2">
              <DueDateFields />
            </div>
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
            <label className="col-span-2 flex items-center gap-1.5 text-sm text-slate-700">
              <input type="checkbox" name="is_master_task" />
              Master Task (reusable in future tournaments)
            </label>
            <button
              type="submit"
              className="col-span-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Add task
            </button>
          </form>
        </CollapsibleDetails>
      )}

      {isDirector && tournament && !allTasks.length && (
        <div className="mt-4">
          <CopyMasterTasksModal
            tournaments={masterTaskSources}
            action={copyMasterTasks}
          />
        </div>
      )}

      {tournament && (
        <>
          <TasksFilterBar statuses={existingStatuses} status={statusFilter} />
          {statusFilter && (
            <p className="mt-3 text-sm text-slate-500">
              {tasks.length} {tasks.length === 1 ? "task matches" : "tasks match"}{" "}
              the selected filters.
            </p>
          )}
        </>
      )}

      {tournament && (
        <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200 bg-white">
          {tasks.length ? (
            <div className="min-w-[720px] text-sm">
              <div className="grid grid-cols-[3fr_1fr_1fr_1fr_1fr_auto] gap-3 border-b border-slate-100 px-5 py-2 text-left text-xs uppercase tracking-wide text-slate-400">
                <span>Task</span>
                <span>Phase</span>
                <span>Assignee</span>
                <span>Due Date</span>
                <span>Status</span>
                <span />
              </div>
              <div className="divide-y divide-slate-50">
                {tasks.map((task) => {
                  const canEdit = isDirector;
                  const canChangeStatus =
                    isDirector || task.assignee_id === profile?.id;
                  const assigneeName = task.profiles
                    ? (task.profiles.full_name ?? task.profiles.email)
                    : "—";
                  return (
                    <CollapsibleDetails
                      key={task.id}
                      summaryClassName="grid grid-cols-[3fr_1fr_1fr_1fr_1fr_auto] items-center gap-3 px-5 py-3 cursor-pointer hover:bg-slate-50"
                      summary={
                        <>
                          {canEdit ? (
                            <span className="font-medium text-slate-900 hover:text-blue-600 hover:underline">
                              {task.title}
                              {task.is_master_task && (
                                <span className="ml-2 rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">
                                  Master
                                </span>
                              )}
                            </span>
                          ) : (
                            <span className="font-medium text-slate-900">
                              {task.title}
                              {task.is_master_task && (
                                <span className="ml-2 rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">
                                  Master
                                </span>
                              )}
                            </span>
                          )}
                          <span className="text-slate-500">
                            {PHASE_LABELS[task.phase] ?? task.phase}
                          </span>
                          <span className="text-slate-500">
                            {assigneeName}
                          </span>
                          <span className="text-slate-500">
                            {task.due_date ?? "—"}
                          </span>
                          {canChangeStatus ? (
                            <StatusSelect
                              status={task.status}
                              action={updateTaskStatus.bind(null, task.id)}
                              options={COLUMNS}
                            />
                          ) : (
                            <span className="text-slate-500">
                              {COLUMNS.find((c) => c.value === task.status)
                                ?.label ?? task.status}
                            </span>
                          )}
                          <span />
                        </>
                      }
                    >
                      {canEdit && (
                        <div className="grid grid-cols-2 gap-4 border-t border-slate-100 px-5 py-4">
                          <form
                            key={`${task.title}-${task.phase}-${task.due_date}-${task.assignee_id}-${task.is_master_task}`}
                            action={updateTask.bind(null, task.id)}
                            className="space-y-2"
                          >
                            <label className="block text-sm text-slate-700">
                              Title
                              <input
                                name="title"
                                defaultValue={task.title}
                                required
                                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                              />
                            </label>
                            <label className="block text-sm text-slate-700">
                              Phase
                              <select
                                name="phase"
                                defaultValue={task.phase}
                                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                              >
                                {Object.entries(PHASE_LABELS).map(
                                  ([value, label]) => (
                                    <option key={value} value={value}>
                                      {label}
                                    </option>
                                  ),
                                )}
                              </select>
                            </label>
                            <DueDateFields defaultDueDate={task.due_date} />
                            <label className="block text-sm text-slate-700">
                              Assignee
                              <select
                                name="assignee_id"
                                defaultValue={task.assignee_id ?? ""}
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
                            <label className="flex items-center gap-1.5 text-sm text-slate-700">
                              <input
                                type="checkbox"
                                name="is_master_task"
                                defaultChecked={task.is_master_task}
                              />
                              Master Task
                            </label>
                            <button
                              type="submit"
                              className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
                            >
                              Save
                            </button>
                          </form>
                          <form action={deleteTask.bind(null, task.id)}>
                            <ConfirmSubmitButton
                              confirmText={`Delete task "${task.title}"?`}
                              className="text-xs text-red-600 hover:underline"
                            >
                              Delete
                            </ConfirmSubmitButton>
                          </form>
                        </div>
                      )}
                    </CollapsibleDetails>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="px-5 py-6 text-center text-sm text-slate-500">
              {statusFilter ? "No tasks match." : "No tasks yet."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
