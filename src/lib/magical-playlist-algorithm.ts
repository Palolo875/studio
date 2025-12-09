import type { Task } from "@/lib/types";

/**
 * Algorithme de Playlist Magique (Instantanée)
 * 
 * Génère 3-5 tâches optimales basées sur :
 * - État énergétique du matin (40% de pondération)
 * - Deadlines et priorités
 * - Alignement avec l'intention du jour
 * - Patterns historiques de l'utilisateur
 */

export type EnergyLevel = "high" | "medium" | "low";
export type Intention = "focus" | "learning" | "creativity" | "planning";
export type Priority = "low" | "medium" | "high";

export interface MagicalPlaylistOptions {
  energyLevel: EnergyLevel;
  intention: Intention;
  currentTime: Date;
  taskHistory?: Task[];
}

export interface TaskScore {
  task: Task;
  score: number;
  reason: string;
}

/**
 * Calcule le score d'une tâche en fonction de ses attributs
 */
function calculateTaskScore(
  task: Task,
  energyLevel: EnergyLevel,
  intention: Intention,
  currentTime: Date
): TaskScore {
  let score = 0;
  const reasons: string[] = [];

  // 1. Pondération de l'énergie (40%)
  const energyMatchScore = calculateEnergyMatchScore(task, energyLevel);
  score += energyMatchScore * 0.4;
  if (energyMatchScore > 0) {
    reasons.push(`Correspondance énergie (${Math.round(energyMatchScore * 100)}%)`);
  }

  // 2. Priorité (20%)
  const priorityScore = calculatePriorityScore(task);
  score += priorityScore * 0.2;
  if (priorityScore > 0) {
    reasons.push(`Priorité élevée (${Math.round(priorityScore * 100)}%)`);
  }

  // 3. Deadline (15%)
  const deadlineScore = calculateDeadlineScore(task, currentTime);
  score += deadlineScore * 0.15;
  if (deadlineScore > 0) {
    reasons.push(`Deadline proche (${Math.round(deadlineScore * 100)}%)`);
  }

  // 4. Alignement avec l'intention (15%)
  const intentionScore = calculateIntentionAlignmentScore(task, intention);
  score += intentionScore * 0.15;
  if (intentionScore > 0) {
    reasons.push(`Alignement intention (${Math.round(intentionScore * 100)}%)`);
  }

  // 5. Historique (10%)
  const historyScore = calculateHistoryScore(task);
  score += historyScore * 0.1;
  if (historyScore > 0) {
    reasons.push(`Bon historique (${Math.round(historyScore * 100)}%)`);
  }

  return {
    task,
    score,
    reason: reasons.join(", ")
  };
}

/**
 * Calcule le score de correspondance énergétique (0-1)
 */
function calculateEnergyMatchScore(task: Task, energyLevel: EnergyLevel): number {
  // Si la tâche n'a pas d'énergie requise spécifiée, on donne un score neutre
  if (!task.energyRequired) {
    return 0.5;
  }

  // Correspondance exacte
  if (task.energyRequired === energyLevel) {
    return 1.0;
  }

  // Énergie adjacente
  if (
    (task.energyRequired === "high" && energyLevel === "medium") ||
    (task.energyRequired === "medium" && energyLevel === "high") ||
    (task.energyRequired === "medium" && energyLevel === "low") ||
    (task.energyRequired === "low" && energyLevel === "medium")
  ) {
    return 0.7;
  }

  // Énergie opposée
  return 0.3;
}

/**
 * Calcule le score de priorité (0-1)
 */
function calculatePriorityScore(task: Task): number {
  switch (task.priority) {
    case "high": return 1.0;
    case "medium": return 0.7;
    case "low": return 0.3;
    default: return 0.5;
  }
}

/**
 * Calcule le score de deadline (0-1)
 */
function calculateDeadlineScore(task: Task, currentTime: Date): number {
  // Si la tâche n'a pas de date planifiée, on donne un score neutre
  if (!task.scheduledDate) {
    return 0.5;
  }

  const scheduledDate = new Date(task.scheduledDate);
  const timeDiff = scheduledDate.getTime() - currentTime.getTime();
  const daysUntilDue = timeDiff / (1000 * 3600 * 24);

  // Si la deadline est déjà passée, score maximal
  if (daysUntilDue <= 0) return 1.0;
  
  // Plus la deadline est proche, plus le score est élevé
  if (daysUntilDue <= 1) return 1.0;
  if (daysUntilDue <= 3) return 0.8;
  if (daysUntilDue <= 7) return 0.6;
  if (daysUntilDue <= 14) return 0.4;
  if (daysUntilDue <= 30) return 0.2;
  
  // Deadline lointaine
  return 0.1;
}

/**
 * Calcule le score d'alignement avec l'intention (0-1)
 */
function calculateIntentionAlignmentScore(task: Task, intention: Intention): number {
  // Si la tâche n'a pas de tags, on donne un score neutre
  if (!task.tags || task.tags.length === 0) {
    return 0.5;
  }

  // Correspondance basée sur les tags
  const intentionTags: Record<Intention, string[]> = {
    focus: ["Development", "Backend", "Engineering", "Coding", "Programming", "Technical", "Implementation"],
    learning: ["Learning", "Education", "Research", "Study", "Course", "Training", "Skill"],
    creativity: ["Design", "Creative", "Art", "Brainstorming", "Ideation", "Innovation", "Concept"],
    planning: ["Planning", "Organization", "Strategy", "Schedule", "Timeline", "Coordination", "Management"]
  };

  const matchingTags = task.tags.filter(tag => 
    intentionTags[intention].some(intentTag => 
      tag.toLowerCase().includes(intentTag.toLowerCase())
    )
  );

  // Plus il y a de tags correspondants, meilleur est le score
  const matchRatio = matchingTags.length / task.tags.length;
  return Math.min(matchRatio * 2, 1); // On double le ratio mais on cap à 1
}

/**
 * Calcule le score basé sur l'historique (0-1)
 */
function calculateHistoryScore(task: Task): number {
  // Protection contre les valeurs invalides
  if (task.completionRate == null || task.completionRate < 0 || task.completionRate > 100) {
    return 0.5; // Score neutre si donnée invalide
  }

  // Taux de complétion (0-100 -> 0-1)
  const completionScore = task.completionRate / 100;

  // Récence (plus récent = meilleur score)
  if (!task.lastAccessed) {
    return completionScore * 0.6; // Seulement le score de complétion si pas de date
  }

  const lastAccessed = new Date(task.lastAccessed);
  const now = new Date();
  const daysSinceAccess = (now.getTime() - lastAccessed.getTime()) / (1000 * 3600 * 24);

  // Plus c'est ancien, plus on veut le faire (inverse de la récence)
  let recencyScore = 1 - (daysSinceAccess / 30); // Sur une échelle de 30 jours
  recencyScore = Math.max(0, Math.min(1, recencyScore)); // Clamp entre 0 et 1

  // Combinaison des deux scores (60% complétion, 40% récence)
  return (completionScore * 0.6) + (recencyScore * 0.4);
}

/**
 * Génère la playlist magique avec 3-5 tâches optimales
 */
export function generateMagicalPlaylist(
  tasks: Task[],
  options: MagicalPlaylistOptions
): TaskScore[] {
  // Vérification des paramètres
  if (!tasks || tasks.length === 0) {
    return [];
  }

  // Filtrer les tâches déjà complétées
  const incompleteTasks = tasks.filter(task => !task.completed);

  // S'il n'y a pas de tâches incomplètes, retourner un tableau vide
  if (incompleteTasks.length === 0) {
    return [];
  }

  // Calculer les scores pour toutes les tâches
  const scoredTasks = incompleteTasks.map(task => 
    calculateTaskScore(task, options.energyLevel, options.intention, options.currentTime)
  );

  // Trier par score décroissant
  scoredTasks.sort((a, b) => {
    // Tri par score décroissant
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    
    // En cas d'égalité de score, trier par priorité
    const priorityOrder = { "high": 3, "medium": 2, "low": 1 };
    const priorityA = priorityOrder[a.task.priority || "medium"] || 2;
    const priorityB = priorityOrder[b.task.priority || "medium"] || 2;
    
    if (priorityB !== priorityA) {
      return priorityB - priorityA;
    }
    
    // En cas d'égalité de priorité, trier par date d'accès (plus ancien en premier)
    const dateA = a.task.lastAccessed ? new Date(a.task.lastAccessed).getTime() : 0;
    const dateB = b.task.lastAccessed ? new Date(b.task.lastAccessed).getTime() : 0;
    
    return dateA - dateB;
  });

  // Sélectionner 3-5 tâches
  // La taille de la playlist dépend du nombre de tâches disponibles
  let playlistSize: number;
  
  if (incompleteTasks.length <= 3) {
    // Si peu de tâches, prendre toutes celles disponibles
    playlistSize = incompleteTasks.length;
  } else if (incompleteTasks.length <= 5) {
    // Si entre 4 et 5 tâches, prendre toutes sauf une
    playlistSize = incompleteTasks.length - 1;
  } else {
    // Sinon, sélectionner entre 3 et 5 tâches selon la moitié du nombre total (plafonné à 5)
    playlistSize = Math.min(Math.max(3, Math.floor(incompleteTasks.length * 0.5)), 5);
  }

  const selectedTasks = scoredTasks.slice(0, playlistSize);

  return selectedTasks;
}