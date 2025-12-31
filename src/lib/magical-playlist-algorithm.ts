/**
 * Algorithme de Playlist Magique (Instantanée)
 * 
 * Génère 3-5 tâches optimales basées sur :
 * - État énergétique du matin (40%)
 * - Urgence des deadlines (30%)
 * - Priorité manuelle (20%)
 * - Patterns historiques (10%)
 * 
 * Ordre de présentation :
 * Position 1 : Quick Win (tâche facile, boost de dopamine)
 * Position 2 : Tâche urgente OU alignée avec l'énergie
 * Position 3-5 : Reste par score décroissant
 */

type TaskLike = {
  id: string;
  name: string;
  description?: string;
  tags?: string[];
  energyRequired?: 'high' | 'medium' | 'low';
  scheduledDate?: string;
  priority?: 'low' | 'medium' | 'high';
  completionRate?: number;
  completed?: boolean;
  subtasks?: unknown;
};

export type EnergyLevel = "high" | "medium" | "low";
export type Intention = "focus" | "learning" | "creativity" | "planning";
export type Priority = "low" | "medium" | "high";

export interface MagicalPlaylistOptions {
  energyLevel: EnergyLevel;
  intention: Intention;
  currentTime: Date;
  taskHistory?: TaskLike[];
}

export interface TaskScore {
  task: TaskLike;
  score: number;
  reason: string;
  reasonDetails?: string[]; // Détails pour les badges
}

/**
 * Calcule le score d'une tâche en fonction des facteurs spécifiés
 * Et retourne également les raisons détaillées pour l'explication
 */
function calculateTaskScore(
  task: TaskLike,
  energyLevel: EnergyLevel,
  intention: Intention,
  currentTime: Date
): TaskScore {
  let score = 0;
  const reasons: string[] = [];
  const reasonDetails: string[] = []; // Pour les badges détaillés

  // 1. État Énergétique (40%)
  const energyScore = calculateEnergyScore(task, energyLevel);
  score += energyScore * 0.4;
  if (energyScore > 0) {
    reasons.push(`Énergie (${Math.round(energyScore * 100)}%)`);
    if (task.energyRequired === energyLevel) {
      reasonDetails.push("Matche votre énergie");
    }
  }

  // 2. Urgence des Deadlines (30%)
  const deadlineScore = calculateDeadlineScore(task, currentTime);
  score += deadlineScore * 0.3;
  if (deadlineScore > 0) {
    reasons.push(`Deadline (${Math.round(deadlineScore * 100)}%)`);
    if (deadlineScore >= 15) { // Proche deadline
      reasonDetails.push("Deadline proche");
    }
  }

  // 3. Priorité Manuelle (20%)
  const priorityScore = calculatePriorityScore(task);
  score += priorityScore * 0.2;
  if (priorityScore > 0) {
    reasons.push(`Priorité (${Math.round(priorityScore * 100)}%)`);
    if (task.priority === "high") {
      reasonDetails.push("Haute priorité");
    }
  }

  // 4. Patterns Historiques (10%)
  const historyScore = calculateHistoryScore(task);
  score += historyScore * 0.1;
  if (historyScore !== 0) {
    const historyLabel = historyScore > 0 ? "Bonus historique" : "Pénalité historique";
    reasons.push(`${historyLabel} (${Math.round(Math.abs(historyScore) * 100)}%)`);
    if (historyScore > 0) {
      reasonDetails.push("Bon historique");
    }
  }

  // Alignement avec l'intention
  const intentionScore = calculateIntentionAlignmentScore(task, intention);
  if (intentionScore > 0.5) {
    reasonDetails.push("Aligné avec votre intention");
  }

  return {
    task,
    score,
    reason: reasons.join(", "),
    reasonDetails // Ajout des détails pour les badges
  };
}

/**
 * Calcule le score d'énergie (40%)
 * High → Tâches complexes, créatives, exigeantes
 * Medium → Tâches équilibrées
 * Low → Tâches simples, rapides, de maintenance
 */
function calculateEnergyScore(task: TaskLike, energyLevel: EnergyLevel): number {
  // Si la tâche n'a pas d'énergie requise spécifiée, on donne un score neutre
  if (!task.energyRequired) {
    return 0.5;
  }

  // Correspondance exacte
  if (task.energyRequired === energyLevel) {
    return 1.0;
  }

  // Adaptation selon le niveau d'énergie
  if (energyLevel === "high") {
    // En haute énergie, on privilégie les tâches exigeantes
    if (task.energyRequired === "high") return 1.0;
    if (task.energyRequired === "medium") return 0.7;
    return 0.3; // low energy task
  } else if (energyLevel === "medium") {
    // En énergie moyenne, on privilégie les tâches équilibrées
    if (task.energyRequired === "medium") return 1.0;
    if (task.energyRequired === "high" || task.energyRequired === "low") return 0.6;
  } else {
    // En basse énergie, on privilégie les tâches simples
    if (task.energyRequired === "low") return 1.0;
    if (task.energyRequired === "medium") return 0.6;
    return 0.3; // high energy task
  }

  return 0.5;
}

/**
 * Calcule le score de deadline (30%)
 * Deadline <24 h : Score +30
 * Deadline < 3 jours : Score +15
 * Deadline <7 jours : Score +5
 * Pas de deadline : Score 0
 */
function calculateDeadlineScore(task: TaskLike, currentTime: Date): number {
  // Si la tâche n'a pas de date planifiée, pas de bonus
  if (!task.scheduledDate) {
    return 0;
  }

  const scheduledDate = new Date(task.scheduledDate);
  const timeDiff = scheduledDate.getTime() - currentTime.getTime();
  const hoursUntilDue = timeDiff / (1000 * 3600);
  const daysUntilDue = hoursUntilDue / 24;

  // Si la deadline est déjà passée, score maximal
  if (daysUntilDue <= 0) return 30;

  // Plus la deadline est proche, plus le score est élevé
  if (daysUntilDue <= 1) return 30;
  if (daysUntilDue <= 3) return 15;
  if (daysUntilDue <= 7) return 5;
  
  // Deadline lointaine
  return 0;
}

/**
 * Calcule le score de priorité (20%)
 * Haute : Score +20
 * Moyenne : Score +10
 * Basse : Score 0
 */
function calculatePriorityScore(task: TaskLike): number {
  switch (task.priority) {
    case "high": return 20;
    case "medium": return 10;
    case "low": return 0;
    default: return 0;
  }
}

/**
 * Calcule le score basé sur l'historique (10%)
 * Tâches complétées régulièrement : Score +5
 * Tâches souvent reportées : Score -10
 * Tâches liées à intention du jour : Score +5
 */
function calculateHistoryScore(task: TaskLike): number {
  let score = 0;

  // Tâches complétées régulièrement : Score +5
  if (task.completionRate != null && task.completionRate >= 80) {
    score += 5;
  }

  // Tâches souvent reportées : Score -10
  if (task.completionRate != null && task.completionRate <= 20) {
    score -= 10;
  }

  return score;
}

/**
 * Calcule l'alignement entre une tâche et l'intention de l'utilisateur
 * @param task La tâche à évaluer
 * @param intention L'intention actuelle
 * @returns Un score entre 0 et 1
 */
function calculateIntentionAlignmentScore(task: TaskLike, intention: Intention): number {
  if (!intention) return 0.5;

  const taskContent = `${task.name} ${task.description || ""} ${task.tags?.join(" ") || ""}`.toLowerCase();
  
  const keywords: Record<Intention, string[]> = {
    focus: ["urgent", "important", "finish", "complete", "deadline", "projet", "dev", "fix", "terminer"],
    learning: ["read", "study", "learn", "course", "watch", "article", "research", "documentation", "apprendre", "lire", "tuto"],
    creativity: ["design", "draw", "write", "brainstorm", "create", "idea", "concept", "imaginer", "créer", "dessiner", "écrire"],
    planning: ["plan", "organize", "schedule", "todo", "list", "meeting", "calendar", "préparer", "organiser", "réunion"]
  };

  const relevantKeywords = keywords[intention] || [];
  let matches = 0;

  for (const word of relevantKeywords) {
    if (taskContent.includes(word.toLowerCase())) {
      matches++;
    }
  }

  // Score de base si correspondances trouvées, plafonné à 1
  if (matches > 0) {
    return Math.min(0.5 + (matches * 0.1), 1.0);
  }

  return 0.3; // Faible alignement par défaut si aucune correspondance
}

/**
 * Détermine si une tâche est un "Quick Win"
 * Tâche facile avec faible énergie requise et/ou faible priorité
 */
function isQuickWin(task: TaskLike): boolean {
  // Tâche avec faible énergie requise
  if (task.energyRequired === "low") {
    return true;
  }
  
  // Tâche avec faible priorité
  if (task.priority === "low") {
    return true;
  }
  
  // Tâche avec peu de sous-tâches
  if (Array.isArray(task.subtasks) && task.subtasks.length <= 2) {
    return true;
  }
  
  return false;
}

/**
 * Détermine si une tâche est urgente
 * Basé sur la deadline
 */
function isUrgent(task: TaskLike, currentTime: Date): boolean {
  if (!task.scheduledDate) {
    return false;
  }

  const scheduledDate = new Date(task.scheduledDate);
  const timeDiff = scheduledDate.getTime() - currentTime.getTime();
  const daysUntilDue = timeDiff / (1000 * 3600 * 24);

  // Urgent si deadline dans moins de 3 jours
  return daysUntilDue <= 3;
}

/**
 * Génère la playlist magique avec 3-5 tâches optimales
 * Ordre de présentation :
 * Position 1 : Quick Win (tâche facile, boost de dopamine)
 * Position 2 : Tâche urgente OU alignée avec l'énergie
 * Position 3-5 : Reste par score décroissant
 */
export function generateMagicalPlaylist(
  tasks: TaskLike[],
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

  // Trier par score décroissant pour faciliter la sélection
  scoredTasks.sort((a, b) => b.score - a.score);

  // Sélectionner la tâche Quick Win (position 1)
  let quickWinTask: TaskScore | null = null;
  const quickWinCandidates = scoredTasks.filter(st => isQuickWin(st.task));
  if (quickWinCandidates.length > 0) {
    // Prendre la Quick Win avec le meilleur score
    quickWinTask = quickWinCandidates[0];
    // Ajouter le détail pour le badge
    if (quickWinTask.reasonDetails) {
      quickWinTask.reasonDetails.push("Quick Win");
    } else {
      quickWinTask.reasonDetails = ["Quick Win"];
    }
  } else if (scoredTasks.length > 0) {
    // Si aucune Quick Win, prendre la tâche avec le plus faible score
    quickWinTask = scoredTasks[scoredTasks.length - 1];
  }

  // Sélectionner la tâche urgente ou alignée avec l'énergie (position 2)
  let priorityTask: TaskScore | null = null;
  const urgentTasks = scoredTasks.filter(st => 
    st.task.id !== quickWinTask?.task.id && isUrgent(st.task, options.currentTime)
  );
  
  if (urgentTasks.length > 0) {
    // Prendre la tâche la plus urgente
    priorityTask = urgentTasks[0];
    // Ajouter le détail pour le badge
    if (priorityTask.reasonDetails && !priorityTask.reasonDetails.includes("Deadline proche")) {
      priorityTask.reasonDetails.push("Deadline proche");
    } else if (!priorityTask.reasonDetails) {
      priorityTask.reasonDetails = ["Deadline proche"];
    }
  } else {
    // Sinon, prendre une tâche alignée avec l'énergie
    const energyAlignedTasks = scoredTasks.filter(st => 
      st.task.id !== quickWinTask?.task.id && 
      st.task.energyRequired === options.energyLevel
    );
    
    if (energyAlignedTasks.length > 0) {
      priorityTask = energyAlignedTasks[0];
      // Ajouter le détail pour le badge
      if (priorityTask.reasonDetails && !priorityTask.reasonDetails.includes("Matche votre énergie")) {
        priorityTask.reasonDetails.push("Matche votre énergie");
      } else if (!priorityTask.reasonDetails) {
        priorityTask.reasonDetails = ["Matche votre énergie"];
      }
    } else if (scoredTasks.length > 1) {
      // Prendre la tâche avec le deuxième meilleur score
      priorityTask = scoredTasks.find(st => st.task.id !== quickWinTask?.task.id) || null;
    }
  }

  // Construire la playlist finale
  const finalPlaylist: TaskScore[] = [];
  
  // Position 1 : Quick Win
  if (quickWinTask) {
    finalPlaylist.push(quickWinTask);
  }
  
  // Position 2 : Tâche urgente OU alignée avec l'énergie
  if (priorityTask) {
    finalPlaylist.push(priorityTask);
  }
  
  // Positions 3-5 : Reste par score décroissant (maximum 3 tâches supplémentaires)
  const remainingTasks = scoredTasks.filter(st => 
    st.task.id !== quickWinTask?.task.id && 
    st.task.id !== priorityTask?.task.id
  ).slice(0, 3);
  
  finalPlaylist.push(...remainingTasks);
  
  // Limiter à 5 tâches maximum
  return finalPlaylist.slice(0, 5);
}