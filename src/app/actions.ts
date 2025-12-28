"use server";

import { analyzeCapture, type AnalyzeCaptureOutput } from "@/ai/flows/analyze-capture-flow";
import type { DailyRituals, Task } from "@/lib/types";
import { z } from "zod";
import { generateMagicalPlaylist } from "@/lib/magical-playlist-algorithm";
import { getAllTasks, type DBTask } from "@/lib/database";

const generatePlaylistSchema = z.object({
  goals: z.string().min(3, "Goals must be at least 3 characters long."),
  priorities: z.string().min(3, "Priorities must be at least 3 characters long."),
  dailyRituals: z.string(),
});

export async function handleGeneratePlaylist(prevState: any, formData: FormData) {
  try {
    const validatedFields = generatePlaylistSchema.safeParse({
      goals: formData.get("goals"),
      priorities: formData.get("priorities"),
      dailyRituals: formData.get("dailyRituals"),
    });

    if (!validatedFields.success) {
      return {
        message: "Invalid form data.",
        errors: validatedFields.error.flatten().fieldErrors,
        tasks: [],
      };
    }
    
    const { goals, priorities, dailyRituals: dailyRitualsString } = validatedFields.data;
    const dailyRituals: DailyRituals = JSON.parse(dailyRitualsString);

    if (dailyRituals.playlistShuffledCount >= 2) {
      return {
        message: "Vous avez atteint votre limite de 2 régénérations par jour.",
        errors: { form: ["Limit reached"] },
        tasks: prevState.tasks, // Return old tasks
      };
    }

    // Obtenir les paramètres depuis formData
    const energyLevel = formData.get("energyLevel") as "high" | "medium" | "low";
    const intention = formData.get("intention") as "focus" | "learning" | "creativity" | "planning";
    
    // Vérifier que les paramètres requis sont présents
    if (!energyLevel || !intention) {
      return {
        message: "Veuillez fournir votre niveau d'énergie et votre intention du jour.",
        errors: null,
        tasks: [],
      };
    }
    
    // Récupérer les tâches réelles depuis Dexie
    const dbTasks: DBTask[] = await getAllTasks();
    const tasks: Task[] = dbTasks.map(t => ({
      id: t.id,
      name: t.title,
      completed: t.status === "done",
      subtasks: [],
      lastAccessed: (t.lastActivated ?? t.updatedAt ?? new Date()).toISOString(),
      completionRate: t.completedAt ? 100 : 0,
      priority: t.urgency as Task["priority"],
      energyRequired: t.effort,
      estimatedDuration: t.duration,
      tags: t.tags,
      scheduledDate: t.deadline?.toISOString(),
    }));

    // Appliquer l’algorithme local (deterministe) sur les données réelles
    const scored = generateMagicalPlaylist(tasks, {
      energyLevel,
      intention,
    });

    return {
      message: "Playlist magique générée avec succès.",
      errors: null,
      tasks: scored,
      playlistShuffledCount: dailyRituals.playlistShuffledCount + 1,
    };
  } catch (error) {
    console.error(error);
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

export async function handleGetRecommendations(formData: FormData) {
  try {
    const validatedFields = getRecommendationsSchema.safeParse({
      energyLevel: formData.get("energyLevel"),
      intention: formData.get("intention"),
      focus: formData.get("focus"),
      tasks: formData.get("tasks"),
    });
    
    if (!validatedFields.success) {
      return { error: "Invalid form data." };
    }
    
    const { energyLevel, intention, focus, tasks: tasksString } = validatedFields.data;
    const tasks: Task[] = JSON.parse(tasksString);

    if (!tasks || tasks.length === 0) {
      return { recommendations: [], error: "No tasks to recommend from." };
    }

    const timeOfDay = new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening";
    
    // Pas d'appel Genkit : stub local simple basé sur la priorité
    const recommended = tasks
      .map(t => ({
        ...t,
        score: (t.priority === "high" ? 3 : t.priority === "medium" ? 2 : 1) + (t.completed ? -2 : 0),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    return { recommendations: recommended, error: null };
  } catch (error) {
    console.error(error);
    return { recommendations: [], error: "Failed to get recommendations." };
  }
}

const analyzeCaptureSchema = z.object({
  text: z.string().min(1, "Le texte ne peut pas être vide."),
});

export async function handleAnalyzeCapture(prevState: any, formData: FormData): Promise<{ analysis: AnalyzeCaptureOutput | null; error: string | null }> {
  try {
    const validatedFields = analyzeCaptureSchema.safeParse({
      text: formData.get("text"),
    });

    if (!validatedFields.success) {
      return { analysis: null, error: "Données du formulaire invalides." };
    }

    const { text } = validatedFields.data;

    const result = await analyzeCapture({ text });

    return { analysis: result, error: null };
  } catch (error) {
    console.error(error);
    return { analysis: null, error: "Échec de l'analyse de la capture." };
  }
}
