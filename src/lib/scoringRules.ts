export type EnergyLevel = 'high' | 'medium' | 'low';

type UserPatternsLike = {
  skippedTaskTypes?: Record<string, number>;
  completedTaskTypes?: Record<string, number>;
  shuffleCount?: number;
};

type TaskLike = {
  id: string;
  name: string;
  description?: string;
  objective?: string;
  tags?: string[];
  scheduledDate?: string;
  energyRequired?: EnergyLevel;
  effort?: 'S' | 'M' | 'L';
  priority?: 'low' | 'medium' | 'high';
  completed?: boolean;
  lastAccessed?: string;
};

/**
 * Module de règles de scoring pour l'algorithme de génération de playlist
 * 
 * Contient les fonctions de calcul pour chaque facteur de décision :
 * - Énergie (40%)
 * - Impact SOTA (15%) - Nouvelle formule : Impact = (Valeur Perçue + Momentum Passé) / Effort Estimé
 * - Deadline/Priorité (20%)
 * - Effort (15%)
 * - Historique/Patterns (10%)
 * 
 * SOTA Enhancements:
 * - Impact calculé avec la nouvelle formule
 * - Intégration des patterns d'apprentissage avancé
 * - Ajustements dynamiques basés sur l'historique
 */

/**
 * Calcule le score d'énergie (40%)
 * High → Tâches complexes, créatives, exigeantes
 * Medium → Tâches équilibrées
 * Low → Tâches simples, rapides, de maintenance
 */
export function calculateEnergyScore(task: TaskLike, energyLevel: EnergyLevel): number {
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
 * Calcule le score d'impact inféré (15%)
 * Basé sur des mots-clés dans les tags et le nom de la tâche
 * Ex: 'client' = +20, 'projet' = +15, etc.
 * 
 * NOTE: Cette fonction est conservée pour la compatibilité mais l'impact SOTA
 * est maintenant calculé dans playlistGenerator.ts avec la nouvelle formule
 */
export function calculateImpactScore(task: TaskLike): number {
  let score = 0;
  
  // Mots-clés à forte valeur d'impact
  const highImpactKeywords = ['client', 'projet', 'stratégie', 'revenue', 'croissance', 'business', 'vente', 'performance', 'objectif', 'résultat'];
  const mediumImpactKeywords = ['équipe', 'collaboration', 'processus', 'amélioration', 'organisation', 'efficacité', 'optimisation'];
  
  // Vérifier dans les tags
  if (task.tags) {
    for (const tag of task.tags) {
      const lowerTag = tag.toLowerCase();
      if (highImpactKeywords.some(keyword => lowerTag.includes(keyword))) {
        score += 20;
      } else if (mediumImpactKeywords.some(keyword => lowerTag.includes(keyword))) {
        score += 10;
      }
    }
  }
  
  // Vérifier dans le nom de la tâche
  const lowerName = task.name.toLowerCase();
  if (highImpactKeywords.some(keyword => lowerName.includes(keyword))) {
    score += 20;
  } else if (mediumImpactKeywords.some(keyword => lowerName.includes(keyword))) {
    score += 10;
  }
  
  // Vérifier dans la description si elle existe
  if (task.description) {
    const lowerDesc = task.description.toLowerCase();
    if (highImpactKeywords.some(keyword => lowerDesc.includes(keyword))) {
      score += 15;
    } else if (mediumImpactKeywords.some(keyword => lowerDesc.includes(keyword))) {
      score += 5;
    }
  }
  
  // Vérifier dans l'objectif si elle existe
  if (task.objective) {
    const lowerObj = task.objective.toLowerCase();
    if (highImpactKeywords.some(keyword => lowerObj.includes(keyword))) {
      score += 15;
    } else if (mediumImpactKeywords.some(keyword => lowerObj.includes(keyword))) {
      score += 5;
    }
  }
  
  // Limiter le score maximum
  return Math.min(score, 40); // Maximum 40 points
}

/**
 * Calcule le score de deadline (20%)
 * Deadline <24 h : Score +30
 * Deadline < 3 jours : Score +15
 * Deadline <7 jours : Score +5
 * Pas de deadline : Score 0
 */
export function calculateDeadlineScore(task: TaskLike, currentTime: Date): number {
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
 * Calcule le score d'effort (15%)
 * S = +10 (quick win)
 * L = -5 si énergie low
 * M = 0 (neutre)
 */
export function calculateEffortScore(task: TaskLike, energyLevel: EnergyLevel): number {
  switch (task.effort) {
    case "S": // Simple
      return 10;
    case "L": // Long
      // Si énergie low, pénalité pour les tâches longues
      if (energyLevel === "low") {
        return -15; // Pénalité plus forte
      }
      // Si énergie high, bonus pour les tâches longues
      if (energyLevel === "high") {
        return 5;
      }
      return -5; // Pénalité modérée pour énergie medium
    case "M": // Moyen
      // Si énergie high, légère pénalité
      if (energyLevel === "high") {
        return -5;
      }
      return 0;
    default:
      return 0;
  }
}

/**
 * Calcule le score basé sur l'historique (10%)
 * Tâches complétées régulièrement : Score +5
 * Tâches souvent reportées : Score -10
 * Intègre l'apprentissage automatique des patterns
 * 
 * SOTA Enhancements:
 * - Apprentissage adaptatif basé sur les patterns
 * - Ajustement dynamique des poids après génération
 */
export function calculateHistoryScore(task: TaskLike, taskHistory: TaskLike[] = [], userPatterns?: UserPatternsLike): number {
  let score = 0;
  
  // Calcul basé sur l'historique des tâches
  if (taskHistory.length > 0) {
    // Trouver l'historique de cette tâche spécifique
    const taskHistoryEntries = taskHistory.filter(historyTask => historyTask.id === task.id);
    
    if (taskHistoryEntries.length > 0) {
      // Calculer le taux de complétion historique
      const completedCount = taskHistoryEntries.filter(t => t.completed).length;
      const completionRate = (completedCount / taskHistoryEntries.length) * 100;
      
      // Tâches complétées régulièrement : Score +5
      if (completionRate >= 80) {
        score += 5;
      }
      
      // Tâches souvent reportées : Score -10
      if (completionRate <= 20) {
        score -= 10;
      }
      
      // Tâches avec bon historique récent : Score +3
      const recentHistory = taskHistoryEntries.slice(-5); // 5 dernières occurrences
      const recentCompletionRate = recentHistory.length > 0 ? 
        (recentHistory.filter(t => t.completed).length / recentHistory.length) * 100 : 0;
      
      if (recentCompletionRate >= 80) {
        score += 3;
      }
    }
  }
  
  // Intégration de l'apprentissage automatique des patterns
  if (userPatterns) {
    const shuffleCount = userPatterns.shuffleCount ?? 0;
    // Pénalité si l'utilisateur a souvent ignoré ce type de tâche
    if (task.tags) {
      for (const tag of task.tags) {
        const skipped = userPatterns.skippedTaskTypes?.[tag] ?? 0;
        if (skipped > 2) {
          // Réduire le score si l'utilisateur a mélangé plus de 2 fois
          if (shuffleCount > 2) {
            // Réduction progressive basée sur le nombre de fois ignorées
            const reductionFactor = Math.min(0.5, skipped / 10);
            score -= 15 * reductionFactor; // Réduction maximale de 15 points
          }
        }
      }
    }
    
    // Bonus si l'utilisateur complète souvent ce type de tâche
    if (task.tags) {
      for (const tag of task.tags) {
        const completedCount = userPatterns.completedTaskTypes?.[tag] ?? 0;
        if (completedCount > 3) {
          score += 8; // Bonus plus élevé pour les tâches souvent complétées
        }
      }
    }
    
    // Ajustement basé sur le nombre de shuffles
    // Si l'utilisateur shuffle souvent, cela signifie qu'il cherche peut-être des alternatives
    if (shuffleCount > 3) {
      // Augmenter légèrement le poids des tâches non essayées récemment
      if (task.lastAccessed) {
        const recentlyAccessed = new Date(task.lastAccessed).getTime();
        const now = Date.now();
        const daysSinceAccess = (now - recentlyAccessed) / (1000 * 3600 * 24);
        
        if (daysSinceAccess > 7) {
          score += 2; // Encourager les tâches non touchées depuis longtemps
        }
      }
    }
  }

  return score;
}

/**
 * Détermine si une tâche est un "Quick Win"
 * Tâche facile avec faible énergie requise et/ou faible priorité
 */
export function isQuickWin(task: TaskLike): boolean {
  // Tâche avec faible énergie requise
  if (task.energyRequired === "low") {
    return true;
  }
  
  // Tâche avec faible priorité
  if (task.priority === "low") {
    return true;
  }
  
  // Tâche avec effort S (simple)
  if (task.effort === "S") {
    return true;
  }
  
  return false;
}