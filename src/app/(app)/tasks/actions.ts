"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentTournament } from "@/lib/tournament";

export async function createTask(formData: FormData) {
  const supabase = await createClient();
  const tournament = await getCurrentTournament();
  if (!tournament) throw new Error("No active tournament");

  const title = String(formData.get("title") ?? "");
  const phase = String(formData.get("phase") || "pre_season");
  const due_date = String(formData.get("due_date") || "") || null;
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
