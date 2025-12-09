import { generateMagicalPlaylist } from "./magical-playlist-algorithm";
import type { Task } from "./types";

// Créer des tâches de test avec métadonnées
const testTasks: Task[] = [
  {
    id: "task-1",
    name: "Finaliser le prototype de l'interface utilisateur",
    completed: false,
    subtasks: 3,
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
    subtasks: 5,
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
    subtasks: 0,
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
    subtasks: 2,
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
    subtasks: 0,
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
    subtasks: 4,
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
    subtasks: 0,
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

// Test avec différents niveaux d'énergie
console.log("=== Test avec haute énergie ===");
let result = generateMagicalPlaylist(testTasks, {
  energyLevel: "high",
  intention: "focus",
  currentTime: new Date()
});

console.log("Playlist générée:");
result.forEach((taskScore, index) => {
  console.log(`${index + 1}. ${taskScore.task.name} (Score: ${taskScore.score})`);
  console.log(`   Raisons: ${taskScore.reason}`);
  console.log(`   Effort: ${taskScore.task.effort} | Deadline: ${taskScore.task.deadlineDisplay}`);
  console.log("");
});

console.log("=== Test avec énergie moyenne ===");
result = generateMagicalPlaylist(testTasks, {
  energyLevel: "medium",
  intention: "learning",
  currentTime: new Date()
});

console.log("Playlist générée:");
result.forEach((taskScore, index) => {
  console.log(`${index + 1}. ${taskScore.task.name} (Score: ${taskScore.score})`);
  console.log(`   Raisons: ${taskScore.reason}`);
  console.log(`   Effort: ${taskScore.task.effort} | Deadline: ${taskScore.task.deadlineDisplay}`);
  console.log("");
});

console.log("=== Test avec faible énergie ===");
result = generateMagicalPlaylist(testTasks, {
  energyLevel: "low",
  intention: "planning",
  currentTime: new Date()
});

console.log("Playlist générée:");
result.forEach((taskScore, index) => {
  console.log(`${index + 1}. ${taskScore.task.name} (Score: ${taskScore.score})`);
  console.log(`   Raisons: ${taskScore.reason}`);
  console.log(`   Effort: ${taskScore.task.effort} | Deadline: ${taskScore.task.deadlineDisplay}`);
  console.log("");
});