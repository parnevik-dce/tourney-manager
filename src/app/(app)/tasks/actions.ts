"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentTournament } from "@/lib/tournament";
import { getCurrentProfile } from "@/lib/profile";

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
  const is_master_task = formData.get("is_master_task") === "on";

  const { error } = await supabase.from("tasks").insert({
    tournament_id: tournament.id,
    title,
    phase,
    due_date,
    assignee_id,
    is_master_task,
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
  const is_master_task = formData.get("is_master_task") === "on";

  const { error } = await supabase
    .from("tasks")
    .update({ title, phase, due_date, assignee_id, is_master_task })
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

function daysBetween(dateStr: string, fromStr: string): number {
  const [y1, m1, d1] = dateStr.split("-").map(Number);
  const [y2, m2, d2] = fromStr.split("-").map(Number);
  return Math.round(
    (Date.UTC(y1, m1 - 1, d1) - Date.UTC(y2, m2 - 1, d2)) /
      (1000 * 60 * 60 * 24),
  );
}

function addDays(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export async function copyMasterTasks(sourceTournamentId: string) {
  const profile = await getCurrentProfile();
  if (profile?.role !== "director") throw new Error("Not authorized");

  const tournament = await getCurrentTournament();
  if (!tournament) throw new Error("No active tournament");
  if (tournament.id === sourceTournamentId) return;

  const supabase = await createClient();

  const [{ data: sourceTournament }, { data: masterTasks }] =
    await Promise.all([
      supabase
        .from("tournaments")
        .select("start_date")
        .eq("id", sourceTournamentId)
        .single(),
      supabase
        .from("tasks")
        .select("title, phase, due_date")
        .eq("tournament_id", sourceTournamentId)
        .eq("is_master_task", true),
    ]);

  if (!masterTasks?.length) return;

  const tasksToInsert = masterTasks.map((t) => {
    let due_date: string | null = null;
    if (t.due_date && sourceTournament?.start_date && tournament.start_date) {
      const offset = daysBetween(t.due_date, sourceTournament.start_date);
      due_date = addDays(tournament.start_date, offset);
    }
    return {
      tournament_id: tournament.id,
      title: t.title,
      phase: t.phase,
      due_date,
      is_master_task: true,
    };
  });

  const { error } = await supabase.from("tasks").insert(tasksToInsert);
  if (error) throw new Error(error.message);

  revalidatePath("/tasks");
}
