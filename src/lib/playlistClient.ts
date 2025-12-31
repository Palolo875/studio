import { z } from "zod";

import type { DailyRituals, Task } from "@/lib/types";
import { getAllTasks, getTaskHistoryForTaskIds } from "@/lib/database";
import type { EnergyState as EngineEnergyState, TaskPlaylist as EngineTaskPlaylist } from "@/lib/taskEngine/types";
import { generateTaskPlaylist } from "@/lib/taskEngine";
import { dbTaskToEngineTask } from "@/lib/taskEngine/dbTaskMapping";

export type PlaylistItem = {
  task: Task;
  score: number;
  reason: string;
  reasonDetails?: string[];
};

function engineTaskToLegacyTask(task: import("@/lib/taskEngine/types").Task): Task {
  return {
    id: task.id,
    name: task.title,
    completed: task.status === "done",
    subtasks: [],
    lastAccessed: (task.lastActivated ?? new Date()).toISOString(),
    completionRate: task.status === "done" ? 100 : 0,
    description: task.description,
    priority: task.urgency === "urgent" ? "high" : (task.urgency as Task["priority"]),
    energyRequired: task.effort,
    estimatedDuration: task.duration,
    tags: task.category ? [task.category] : undefined,
    completedAt: task.status === "done" ? (task.completionHistory[0]?.date ?? new Date()).toISOString() : undefined,
    scheduledDate: task.deadline?.toISOString(),
  };
}

const generatePlaylistSchema = z.object({
  goals: z.string().min(3, "Goals must be at least 3 characters long."),
  priorities: z.string().min(3, "Priorities must be at least 3 characters long."),
  dailyRituals: z.string(),
  energyLevel: z.enum(["high", "medium", "low"]),
  intention: z.enum(["focus", "learning", "creativity", "planning"]),
});

export type GeneratePlaylistClientResult = {
  message: string;
  errors: Record<string, string[]> | null;
  tasks: PlaylistItem[];
  playlistShuffledCount?: number;
};

export async function generatePlaylistClient(formData: FormData): Promise<GeneratePlaylistClientResult> {
  try {
    const validatedFields = generatePlaylistSchema.safeParse({
      goals: formData.get("goals"),
      priorities: formData.get("priorities"),
      dailyRituals: formData.get("dailyRituals"),
      energyLevel: formData.get("energyLevel"),
      intention: formData.get("intention"),
    });

    if (!validatedFields.success) {
      return {
        message: "Invalid form data.",
        errors: validatedFields.error.flatten().fieldErrors as Record<string, string[]>,
        tasks: [],
      };
    }

    const { dailyRituals: dailyRitualsString, energyLevel } = validatedFields.data;

    const dailyRituals: DailyRituals = JSON.parse(dailyRitualsString);

    if (dailyRituals.playlistShuffledCount >= 2) {
      return {
        message: "Vous avez atteint votre limite de 2 régénérations par jour.",
        errors: { form: ["Limit reached"] },
        tasks: [],
        playlistShuffledCount: dailyRituals.playlistShuffledCount,
      };
    }

    const dbTasks = await getAllTasks();

    const now = new Date();
    const taskIds = dbTasks.map((t) => t.id);
    const historyByTaskId = await getTaskHistoryForTaskIds(taskIds);

    const engineTasks = dbTasks
      .filter((t) => t.status !== "cancelled" && t.status !== "done")
      .map((t) => dbTaskToEngineTask(t, historyByTaskId.get(t.id) ?? []));

    const energyState: EngineEnergyState = {
      level: energyLevel,
      stability: "stable",
    };

    const playlist: EngineTaskPlaylist = generateTaskPlaylist(engineTasks, energyState, 5, now, {
      sessionDurationMinutes: 120,
    });

    const scored: PlaylistItem[] = playlist.tasks.map((t) => ({
      task: engineTaskToLegacyTask(t),
      score: 1,
      reason: playlist.explanation ?? "Sélection du cerveau (invariants enforce).",
      reasonDetails: playlist.warnings,
    }));

    return {
      message: playlist.explanation ?? "Playlist générée avec succès.",
      errors: null,
      tasks: scored,
      playlistShuffledCount: dailyRituals.playlistShuffledCount + 1,
    };
  } catch {
    return {
      message: "Une erreur inattendue s'est produite.",
      errors: null,
      tasks: [],
    };
  }
}

const getRecommendationsSchema = z.object({
  energyLevel: z.string(),
  intention: z.string(),
  focus: z.string(),
  tasks: z.string(),
});

export async function getRecommendationsClient(
  formData: FormData
): Promise<{ recommendations: Array<{ id: string; reason: string }>; error: string | null }> {
  try {
    const validatedFields = getRecommendationsSchema.safeParse({
      energyLevel: formData.get("energyLevel"),
      intention: formData.get("intention"),
      focus: formData.get("focus"),
      tasks: formData.get("tasks"),
    });

    if (!validatedFields.success) {
      return { recommendations: [], error: "Invalid form data." };
    }

    const { tasks: tasksString } = validatedFields.data;
    const tasks: Task[] = JSON.parse(tasksString);

    if (!tasks || tasks.length === 0) {
      return { recommendations: [], error: "No tasks to recommend from." };
    }

    const recommended = tasks
      .map((t) => ({
        task: t,
        score:
          (t.priority === "high" ? 3 : t.priority === "medium" ? 2 : 1) +
          (t.completed ? -2 : 0),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(({ task }) => ({
        id: task.id,
        reason: "Recommandation locale (priorité).",
      }));

    return { recommendations: recommended, error: null };
  } catch {
    return { recommendations: [], error: "Failed to get recommendations." };
  }
}
