import { generatePlaylist, updateUserPatterns } from "./playlistGenerator";
import type { Task } from "@/lib/types";

/**
 * Test de l'algorithme de génération de playlist
 */
async function testPlaylistGeneration() {
  // Exemple de tâches
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

  // Exemple de patterns utilisateur
  let userPatterns = {
    skippedTaskTypes: {
      "Administration": 3,
      "Documentation": 1
    },
    completedTaskTypes: {
      "Development": 5,
      "Learning": 2
    },
    shuffleCount: 1
  };

  console.log("=== Test 1: Playlist avec énergie élevée ===");
  let playlist = await generatePlaylist(sampleTasks, {
    energyLevel: "high",
    currentTime: new Date(),
    userPatterns,
    maxTasks: 5,
    workdayHours: 8
  });

  console.log(`Playlist générée avec ${playlist.length} tâches:`);
  playlist.forEach((item, index) => {
    console.log(`${index + 1}. ${item.task.name} (Score: ${Math.round(item.score)}) - ${item.reason}`);
  });

  console.log("\n=== Test 2: Playlist avec énergie faible ===");
  playlist = await generatePlaylist(sampleTasks, {
    energyLevel: "low",
    currentTime: new Date(),
    userPatterns,
    maxTasks: 5,
    workdayHours: 8
  });

  console.log(`Playlist générée avec ${playlist.length} tâches:`);
  playlist.forEach((item, index) => {
    console.log(`${index + 1}. ${item.task.name} (Score: ${Math.round(item.score)}) - ${item.reason}`);
  });

  console.log("\n=== Test 3: Mise à jour des patterns utilisateur ===");
  // Simuler que l'utilisateur a ignoré certaines tâches
  const skippedTasks = [sampleTasks[1], sampleTasks[5]]; // Tâches de présentation et documentation
  const completedTasks = [sampleTasks[0]]; // Tâche de développement
  
  userPatterns = updateUserPatterns(userPatterns, [], completedTasks, skippedTasks);
  console.log("Patterns utilisateur mis à jour:", userPatterns);

  console.log("\n=== Test 4: Playlist avec patterns mis à jour ===");
  playlist = await generatePlaylist(sampleTasks, {
    energyLevel: "high",
    currentTime: new Date(),
    userPatterns,
    maxTasks: 5,
    workdayHours: 8
  });

  console.log(`Playlist générée avec ${playlist.length} tâches:`);
  playlist.forEach((item, index) => {
    console.log(`${index + 1}. ${item.task.name} (Score: ${Math.round(item.score)}) - ${item.reason}`);
  });

  console.log("\n=== Test 5: Playlist avec base de données vide ===");
  playlist = await generatePlaylist([], {
    energyLevel: "high",
    currentTime: new Date(),
    userPatterns,
    maxTasks: 5,
    workdayHours: 8
  });

  console.log(`Playlist générée avec ${playlist.length} tâches:`);
  playlist.forEach((item, index) => {
    console.log(`${index + 1}. ${item.task.name} (Score: ${Math.round(item.score)}) - ${item.reason}`);
  });
}

// Exécuter le test
testPlaylistGeneration().catch(console.error);