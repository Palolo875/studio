import { z } from "zod";

import type { DailyRituals, Task } from "@/lib/types";
import { generateMagicalPlaylist } from "@/lib/magical-playlist-algorithm";
import { getAllTasks, type DBTask } from "@/lib/database";

function toLegacyPriority(urgency: DBTask["urgency"]): Task["priority"] {
  if (urgency === "urgent" || urgency === "high") return "high";
  if (urgency === "medium") return "medium";
  return "low";
}

function toLegacyEnergy(effort: DBTask["effort"]): Task["energyRequired"] {
  if (effort === "high") return "high";
  if (effort === "medium") return "medium";
  return "low";
}

function dbTaskToLegacyTask(t: DBTask): Task {
  return {
    id: t.id,
    name: t.title,
    completed: t.status === "done",
    subtasks: [],
    lastAccessed: (t.lastActivated ?? t.updatedAt ?? new Date()).toISOString(),
    completionRate: t.completedAt ? 100 : 0,
    priority: toLegacyPriority(t.urgency),
    energyRequired: toLegacyEnergy(t.effort),
    estimatedDuration: t.duration,
    tags: t.tags,
    scheduledDate: t.deadline?.toISOString(),
    description: t.description,
    completedAt: t.completedAt?.toISOString(),
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
  tasks: ReturnType<typeof generateMagicalPlaylist>;
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

    const { dailyRituals: dailyRitualsString, energyLevel, intention } = validatedFields.data;

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
    const tasks = dbTasks.map(dbTaskToLegacyTask);

    const scored = generateMagicalPlaylist(tasks, {
      energyLevel,
      intention,
      currentTime: new Date(),
    });

    return {
      message: "Playlist magique générée avec succès.",
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
