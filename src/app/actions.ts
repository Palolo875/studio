
"use server";

import { generateDailyPlaylist } from "@/ai/flows/daily-playlist-generation";
import { personalizedTaskRecommendations } from "@/ai/flows/personalized-task-recommendations";
import type { DailyRituals, Task } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

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

    const result = await generateDailyPlaylist({ goals, priorities });
    const taskNames = result.playlist
      .split("\n")
      .map((line) => line.replace(/^- \s*/, "").trim())
      .filter((name) => name.length > 0);

    const tasks: Task[] = taskNames.map((name, index) => ({
      id: `task-${Date.now()}-${index}`,
      name,
      completed: false,
      subtasks: Math.floor(Math.random() * 4), // Randomness factor
      lastAccessed: new Date().toISOString(),
      completionRate: Math.floor(Math.random() * 30) + 20, // Randomness factor (20-50)
    }));

    return {
      message: "Playlist generated successfully.",
      errors: null,
      tasks,
      playlistShuffledCount: dailyRituals.playlistShuffledCount + 1,
    };
  } catch (error) {
    console.error(error);
    return {
      message: "An unexpected error occurred.",
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
      tasks,
    });
    
    return { recommendations: result.recommendedTasks, error: null };
  } catch (error) {
    console.error(error);
    return { recommendations: [], error: "Failed to get recommendations." };
  }
}
