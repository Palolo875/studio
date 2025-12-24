// Page de test pour l'algorithme de playlist SOTA
'use client';
import { generatePlaylist } from './playlistGenerator';
import type { Task } from "@/lib/types";

export function runPlaylistAlgorithmTest() {
  // Tâches de test
  const tasks: Task[] = [
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
  ];

  // Options pour la génération de la playlist
  const options = {
    energyLevel: 'high' as const,
    currentTime: new Date(),
    maxTasks: 5,
    workdayHours: 8
  };

  // Générer la playlist
  return generatePlaylist(tasks, options);
}
