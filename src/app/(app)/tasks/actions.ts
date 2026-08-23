"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentTournament } from "@/lib/tournament";

function resolveDueDate(
  formData: FormData,
  tournamentStartDate: string | null,
): string | null {
  const mode = String(formData.get("due_date_mode") || "specific");

  if (mode === "before_tournament") {
    const daysBefore = Number(formData.get("due_days_before") || "");
    if (!tournamentStartDate || !Number.isFinite(daysBefore)) return null;
    const [year, month, day] = tournamentStartDate.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    date.setUTCDate(date.getUTCDate() - daysBefore);
    return date.toISOString().slice(0, 10);
  }

  return String(formData.get("due_date") || "") || null;
}

export async function createTask(formData: FormData) {
  const supabase = await createClient();
  const tournament = await getCurrentTournament();
  if (!tournament) throw new Error("No active tournament");

  const title = String(formData.get("title") ?? "");
  const phase = String(formData.get("phase") || "pre_season");
  const due_date = resolveDueDate(formData, tournament.start_date);
  const assignee_id = String(formData.get("assignee_id") || "") || null;

  const { error } = await supabase.from("tasks").insert({
    tournament_id: tournament.id,
    title,
    phase,
    due_date,
    assignee_id,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/tasks");
}

export async function updateTask(taskId: string, formData: FormData) {
  const supabase = await createClient();
  const tournament = await getCurrentTournament();

  const title = String(formData.get("title") ?? "");
  const phase = String(formData.get("phase") || "pre_season");
  const due_date = resolveDueDate(formData, tournament?.start_date ?? null);
  const assignee_id = String(formData.get("assignee_id") || "") || null;

  const { error } = await supabase
    .from("tasks")
    .update({ title, phase, due_date, assignee_id })
    .eq("id", taskId);

  if (error) throw new Error(error.message);

  revalidatePath("/tasks");
}

export async function deleteTask(taskId: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("tasks").delete().eq("id", taskId);

  if (error) throw new Error(error.message);

  revalidatePath("/tasks");
}

export async function updateTaskStatus(taskId: string, formData: FormData) {
  const supabase = await createClient();
  const status = String(formData.get("status"));

  const { error } = await supabase
    .from("tasks")
    .update({ status })
    .eq("id", taskId);

  if (error) throw new Error(error.message);

  revalidatePath("/tasks");
}

export async function loadStarterTasks() {
  const supabase = await createClient();
  const tournament = await getCurrentTournament();
  if (!tournament) throw new Error("No active tournament");

  const { data: templates, error: templatesError } = await supabase
    .from("task_templates")
    .select("*")
    .order("sort_order");

  if (templatesError) throw new Error(templatesError.message);
  if (!templates?.length) return;

  const { error } = await supabase.from("tasks").insert(
    templates.map((t) => ({
      tournament_id: tournament.id,
      title: t.title,
      phase: t.phase,
      sort_order: t.sort_order,
    })),
  );

  if (error) throw new Error(error.message);

  revalidatePath("/tasks");
}
