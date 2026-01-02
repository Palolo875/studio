import { z } from "zod";

import { getAllTasks, getTaskHistoryForTaskIds } from "@/lib/database";
import type { EnergyState as EngineEnergyState, Task as EngineTask, TaskPlaylist as EngineTaskPlaylist } from "@/lib/taskEngine/types";
import { generateTaskPlaylist } from "@/lib/taskEngine";
import { dbTaskToEngineTask } from "@/lib/taskEngine/dbTaskMapping";
import type { BrainDecision, BrainInput } from "@/lib/taskEngine/brainContracts";
import { logBrainDecision } from "@/lib/taskEngine/decisionLogger";
import { generateDecisionExplanation } from '@/lib/taskEngine/decisionExplanation';

type DailyRitualsLike = {
  playlistShuffledCount: number;
  completedTaskCount: number;
  completedTasks: Array<{ id: string }>;
};

type TaskLike = {
  id: string;
  name: string;
  completed: boolean;
  subtasks: Array<unknown>;
  lastAccessed: string;
  completionRate: number;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  energyRequired?: 'low' | 'medium' | 'high';
  estimatedDuration?: number;
  tags?: string[];
  completedAt?: string;
  scheduledDate?: string;
  effort?: 'S' | 'M' | 'L';
};

export type PlaylistItem = {
  task: TaskLike;
  score: number;
  reason: string;
  reasonDetails?: string[];
};

function engineTaskToLegacyTask(task: EngineTask): TaskLike {
  return {
    id: task.id,
    name: task.title,
    completed: task.status === "done",
    subtasks: [],
    lastAccessed: (task.lastActivated ?? new Date()).toISOString(),
    completionRate: task.status === "done" ? 100 : 0,
    description: task.description,
    priority: task.urgency === "urgent" ? "high" : (task.urgency as TaskLike["priority"]),
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
  energyStability: z.enum(["stable", "volatile"]).optional(),
  intention: z.enum(["focus", "learning", "creativity", "planning"]).optional(),
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
      energyStability: formData.get("energyStability"),
      intention: formData.get("intention"),
    });

    if (!validatedFields.success) {
      return {
        message: "Invalid form data.",
        errors: validatedFields.error.flatten().fieldErrors as Record<string, string[]>,
        tasks: [],
      };
    }

    const { dailyRituals: dailyRitualsString, energyLevel, energyStability } = validatedFields.data;

    const dailyRituals: DailyRitualsLike = JSON.parse(dailyRitualsString);

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
      stability: energyStability ?? "stable",
    };

    const playlist: EngineTaskPlaylist = generateTaskPlaylist(engineTasks, energyState, 5, now, {
      sessionDurationMinutes: 120,
    });

    try {
      const decisionId = `phase1_playlist_${Date.now()}`;
      const input: BrainInput = {
        tasks: engineTasks,
        userState: {
          energy: energyState.level,
          stability: energyState.stability,
          linguisticFatigue: false,
        },
        temporal: {
          currentTime: now,
          availableTime: 120,
          timeOfDay: now.getHours() < 12 ? 'morning' : now.getHours() < 18 ? 'afternoon' : 'evening',
        },
        budget: {
          daily: {
            maxLoad: 100,
            usedLoad: 0,
            remaining: 100,
            lockThreshold: 10,
          },
          session: {
            maxDuration: 120,
            maxTasks: 5,
            maxComplexity: 10,
          },
        },
        constraints: [],
        history: [],
        decisionPolicy: {
          level: 'ASSISTED',
          userConsent: true,
          overrideCostVisible: true,
        },
      };

      const allowedIds = new Set(playlist.tasks.map((t) => t.id));
      const rejectedTasks = engineTasks.filter((t) => !allowedIds.has(t.id));

      const decision: BrainDecision = {
        id: decisionId,
        timestamp: now,
        brainVersion: {
          id: 'phase1-playlist-v1',
          algorithmVersion: '1.0.0',
          rulesHash: 'phase1-selector',
          modelId: 'taskEngine.generateTaskPlaylist',
          releasedAt: now,
        },
        decisionType: 'TASK_SELECTION',
        inputs: input,
        outputs: {
          session: {
            allowedTasks: playlist.tasks,
            maxTasks: 5,
            estimatedDuration: playlist.tasks.reduce((sum, t) => sum + (t.duration ?? 0), 0),
            budgetConsumed: 0,
          },
          rejected: {
            tasks: rejectedTasks,
            reasons: new Map(),
          },
          mode: {
            current: 'NORMAL',
            reason: playlist.explanation ?? 'Phase 1 playlist generation',
          },
          warnings: (playlist.warnings ?? []).map((message) => ({
            type: 'overload_risk' as const,
            message,
            severity: 'medium' as const,
          })),
          explanations: {
            summary: playlist.explanation ?? 'Phase 1 playlist generation',
            perTask: new Map(),
          },
          guarantees: {
            usedAIdecision: false,
            inferredUserIntent: false,
            optimizedForPerformance: false,
            overrodeUserChoice: false,
            forcedEngagement: false,
            coachIsSubordinate: true,
          },
          metadata: {
            decisionId,
            timestamp: now,
            brainVersion: 'phase1-playlist-v1',
            policy: input.decisionPolicy,
            overrideEvents: [],
          },
        },
        invariantsChecked: [
          'Phase 1 - maxTasks',
          'Phase 1 - quickWin',
          'Phase 1 - totalLoad',
          'Phase 1 - energyMismatch',
          'Phase 1 - completionRate',
        ],
        explanationId: '',
      };

      const explanation = generateDecisionExplanation(decision);
      decision.explanationId = explanation.id;

      await logBrainDecision(decision);
    } catch {
      // ignore
    }

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
    const tasks: TaskLike[] = JSON.parse(tasksString);

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
