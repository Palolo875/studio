"use server";

import { generateDailyPlaylist } from "@/ai/flows/daily-playlist-generation";
import { personalizedTaskRecommendations } from "@/ai/flows/personalized-task-recommendations";
import { analyzeCapture, type AnalyzeCaptureOutput } from "@/ai/flows/analyze-capture-flow";
import type { DailyRituals, Task } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { generateMagicalPlaylist, type TaskScore } from "@/lib/magical-playlist-algorithm";

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

    // Utiliser l'algorithme de playlist magique au lieu de l'IA
    // Utiliser les tâches existantes du système au lieu de simuler des tâches
    // Dans une vraie application, ces tâches viendraient d'une base de données
    // Pour cet exemple, nous utilisons un ensemble de tâches plus réaliste
    
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
    
    // Simuler un ensemble de tâches plus réaliste
    // Dans une vraie application, ces tâches viendraient de la base de données utilisateur
    const sampleTasks: Task[] = [
      {
        id: "task-1",
        name: "Finaliser le prototype de l'interface utilisateur",
        completed: false,
        subtasks: [],
        lastAccessed: new Date(Date.now() - 86400000 * 2).toISOString(), // Il y a 2 jours
        completionRate: 75,
        priority: "high",
        energyRequired: "high",
        tags: ["Development", "UI/UX", "Frontend"],
        scheduledDate: new Date(Date.now() + 86400000 * 3).toISOString(), // Dans 3 jours
        effort: "M", // 15 min - 2 heures
        deadlineDisplay: "Dans 3 jours"
      },
      {
        id: "task-2",
        name: "Préparer la présentation trimestrielle",
        completed: false,
        subtasks: [],
        lastAccessed: new Date(Date.now() - 86400000 * 1).toISOString(), // Hier
        completionRate: 40,
        priority: "high",
        energyRequired: "medium",
        tags: ["Presentation", "Communication", "Reporting"],
        scheduledDate: new Date(Date.now() + 86400000 * 1).toISOString(), // Demain
        effort: "L", // > 2 heures
        deadlineDisplay: "Demain"
      },
      {
        id: "task-3",
        name: "Lire le nouveau livre sur l'innovation",
        completed: false,
        subtasks: [],
        lastAccessed: new Date(Date.now() - 86400000 * 10).toISOString(), // Il y a 10 jours
        completionRate: 90,
        priority: "medium",
        energyRequired: "low",
        tags: ["Learning", "Reading", "Innovation"],
        scheduledDate: new Date(Date.now() + 86400000 * 7).toISOString(), // Dans 1 semaine
        effort: "S", // < 15 minutes
        deadlineDisplay: "Dans 1 semaine"
      },
      {
        id: "task-4",
        name: "Planifier les congés d'été",
        completed: false,
        subtasks: [],
        lastAccessed: new Date(Date.now() - 86400000 * 30).toISOString(), // Il y a 1 mois
        completionRate: 20,
        priority: "low",
        energyRequired: "low",
        tags: ["Personal", "Planning", "Schedule"],
        scheduledDate: new Date(Date.now() + 86400000 * 60).toISOString(), // Dans 2 mois
        effort: "S", // < 15 minutes
        deadlineDisplay: "Dans 2 mois"
      },
      {
        id: "task-5",
        name: "Session de brainstorming pour le nouveau produit",
        completed: false,
        subtasks: [],
        lastAccessed: new Date(Date.now() - 86400000 * 5).toISOString(), // Il y a 5 jours
        completionRate: 85,
        priority: "medium",
        energyRequired: "high",
        tags: ["Creativity", "Ideation", "Product"],
        scheduledDate: new Date(Date.now() + 86400000 * 2).toISOString(), // Dans 2 jours
        effort: "M", // 15 min - 2 heures
        deadlineDisplay: "Dans 2 jours"
      },
      {
        id: "task-6",
        name: "Mettre à jour la documentation technique",
        completed: false,
        subtasks: [],
        lastAccessed: new Date(Date.now() - 86400000 * 7).toISOString(), // Il y a 1 semaine
        completionRate: 60,
        priority: "medium",
        energyRequired: "medium",
        tags: ["Documentation", "Technical", "Writing"],
        scheduledDate: new Date(Date.now() + 86400000 * 5).toISOString(), // Dans 5 jours
        effort: "M", // 15 min - 2 heures
        deadlineDisplay: "Dans 5 jours"
      },
      {
        id: "task-7",
        name: "Répondre aux emails importants",
        completed: false,
        subtasks: [],
        lastAccessed: new Date().toISOString(), // Aujourd'hui
        completionRate: 95,
        priority: "high",
        energyRequired: "low",
        tags: ["Communication", "Email", "Administration"],
        scheduledDate: new Date(Date.now() + 86400000 * 1).toISOString(), // Demain
        effort: "S", // < 15 minutes
        deadlineDisplay: "Demain"
      }
    ];

    // Générer la playlist magique
    const magicalPlaylist: TaskScore[] = generateMagicalPlaylist(sampleTasks, {
      energyLevel,
      intention,
      currentTime: new Date()
    });

    // Convertir les résultats en tâches avec les raisons
    const tasks: Task[] = magicalPlaylist.map((scoredTask: TaskScore, index: number) => ({
      ...scoredTask.task,
      id: `magical-${scoredTask.task.id}-${Date.now()}-${index}`,
      selectionReason: scoredTask.reason
    }));

    return {
      message: "Playlist magique générée avec succès.",
      errors: null,
      tasks,
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
    
    const result = await personalizedTaskRecommendations({
      energyLevel,
      intention,
      focus,
      timeOfDay,
      tasks: tasks.map(t => ({...t, subtasks: t.subtasks.length, lastAccessed: t.lastAccessed.toString(), completionRate: t.completionRate / 100})),
    });
    
    return { recommendations: result.recommendedTasks, error: null };
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
