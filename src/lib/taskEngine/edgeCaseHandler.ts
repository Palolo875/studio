// Gestionnaire de cas limites pour le Cerveau de KairuFlow - Phase 1

import { Task, TaskPlaylist, EnergyState } from './types';
import { isEnergyCompatible } from './energyModel';
import { handleLowEnergyFallback, handleOverconstrainedFallback, handleInconsistentHistoryFallback, handleDefaultFallback } from './fallbackHandler';

/**
 * Gère le cas où l'utilisateur ment sur son énergie
 * @param tasks Ensemble des tâches disponibles
 * @param declaredEnergy Énergie déclarée par l'utilisateur
 * @param actualPerformance Performance réelle observée
 * @returns Playlist ajustée ou fallback
 */
export function handleEnergyMisreporting(
  tasks: Task[],
  declaredEnergy: EnergyState,
  actualPerformance: { avgDurationRatio: number; completionRate: number }
): TaskPlaylist {
  // Si l'utilisateur déclare une énergie haute mais sa performance est faible
  if (declaredEnergy.level === 'high' && actualPerformance.avgDurationRatio > 1.5) {
    // Réduire le niveau d'énergie pour la sélection
    const adjustedEnergy: EnergyState = {
      level: 'medium',
      stability: declaredEnergy.stability
    };
    
    const fallbackResult = handleOverconstrainedFallback(tasks, adjustedEnergy);
    if (fallbackResult) {
      return {
        ...fallbackResult,
        warnings: [
          ...(fallbackResult.warnings || []),
          "Suggestion : Votre énergie semble plus modérée. La playlist est adaptée pour un rythme plus calme."
        ]
      };
    }
  }
  
  // Si l'utilisateur déclare une énergie basse mais sa performance est bonne
  if (declaredEnergy.level === 'low' && actualPerformance.avgDurationRatio < 0.8) {
    // Augmenter légèrement le niveau d'énergie pour la sélection
    const adjustedEnergy: EnergyState = {
      level: 'medium',
      stability: declaredEnergy.stability
    };
    
    const fallbackResult = handleOverconstrainedFallback(tasks, adjustedEnergy);
    if (fallbackResult) {
      return {
        ...fallbackResult,
        warnings: [
          ...(fallbackResult.warnings || []),
          "Suggestion : Vous semblez avoir plus d'énergie que prévu ! La playlist est ajustée."
        ]
      };
    }
  }
  
  // Si aucun ajustement nécessaire, utiliser le fallback par défaut
  return handleDefaultFallback(tasks);
}

/**
 * Gère le cas où l'utilisateur n'accomplit jamais rien
 * @param tasks Ensemble des tâches disponibles
 * @param completionHistory Historique de complétion
 * @returns Playlist ajustée ou fallback
 */
export function handleNeverCompletes(
  tasks: Task[],
  completionHistory: { taskId: string; attempts: number }[]
): TaskPlaylist {
  // Vérifier si l'utilisateur a beaucoup de tentatives sans complétion
  const highAttemptTasks = completionHistory.filter(record => record.attempts > 3);
  
  if (highAttemptTasks.length > 0) {
    // Filtrer les tâches avec trop de tentatives
    const filteredTasks = tasks.filter(task => 
      !highAttemptTasks.some(record => record.taskId === task.id)
    );
    
    // Si assez de tâches restent après filtrage
    if (filteredTasks.length >= 3) {
      return {
        tasks: filteredTasks.slice(0, 3),
        generatedAt: new Date(),
        energyUsed: { level: 'low', stability: 'stable' },
        explanation: "Ajustement pour tâches non complétées",
        warnings: [
          "Certaines tâches semblent bloquées. Mettons-les de côté pour aujourd'hui.",
        ]
      };
    }
  }
  
  // Si trop de tâches filtrées, utiliser le fallback par défaut
  return handleDefaultFallback(tasks);
}

/**
 * Gère le cas où l'utilisateur surcharge volontairement
 * @param tasks Ensemble des tâches disponibles
 * @param requestedTasks Tâches demandées par l'utilisateur
 * @param maxRecommended Max recommandé par le système
 * @returns Playlist ajustée ou fallback
 */
export function handleVoluntaryOverload(
  tasks: Task[],
  requestedTasks: Task[],
  maxRecommended: number
): TaskPlaylist {
  // Si l'utilisateur demande plus que le maximum recommandé
  if (requestedTasks.length > maxRecommended) {
    // Trier les tâches demandées par priorité (durée croissante)
    const sortedRequested = [...requestedTasks].sort((a, b) => a.duration - b.duration);
    
    // Prendre uniquement le nombre recommandé
    const limitedTasks = sortedRequested.slice(0, maxRecommended);
    
    return {
      tasks: limitedTasks,
      generatedAt: new Date(),
      energyUsed: { level: 'medium', stability: 'stable' }, // Énergie moyenne par défaut
      explanation: "Limitation pour préserver votre énergie",
      warnings: [
        `Pour rester concentré, nous allons commencer par ${maxRecommended} tâches.`,
        "Vous pourrez en ajouter d'autres une fois celles-ci terminées."
      ]
    };
  }
  
  // Si la demande est raisonnable, retourner les tâches demandées
  return {
    tasks: requestedTasks,
    generatedAt: new Date(),
    energyUsed: { level: 'medium', stability: 'stable' },
    explanation: "Playlist personnalisée",
    warnings: []
  };
}

/**
 * Gère le cas où l'utilisateur est anxieux (paralysie)
 * @param tasks Ensemble des tâches disponibles
 * @returns Playlist ajustée pour l'anxiété
 */
export function handleAnxietyParalysis(tasks: Task[]): TaskPlaylist {
  // Chercher les tâches les plus simples et les plus courtes
  const simpleTasks = tasks
    .filter(task => task.effort === 'low' && task.duration <= 10)
    .sort((a, b) => a.duration - b.duration);
  
  // Si des tâches simples existent
  if (simpleTasks.length > 0) {
    // Prendre une seule tâche très simple
    const selectedTask = simpleTasks[0];
    
    return {
      tasks: [selectedTask],
      generatedAt: new Date(),
      energyUsed: { level: 'low', stability: 'volatile' },
      explanation: "Mode anti-paralysie : une seule étape à la fois.",
      warnings: [
        "Commençons par quelque chose de simple pour briser l'inertie.",
        "Une seule tâche. C'est tout. Vous pouvez le faire."
      ]
    };
  }
  
  // Si aucune tâche simple, utiliser le fallback énergie basse
  const fallbackResult = handleLowEnergyFallback(tasks);
  if (fallbackResult) {
    return {
      ...fallbackResult,
      warnings: [
        ...(fallbackResult.warnings || []),
        "Approche douce pour vous aider à démarrer."
      ]
    };
  }
  
  // Fallback par défaut
  return handleDefaultFallback(tasks);
}

/**
 * Gère le cas où l'utilisateur est perfectionniste
 * @param tasks Ensemble des tâches disponibles
 * @param perfectionismHistory Historique des comportements perfectionnistes
 * @returns Playlist ajustée pour le perfectionnisme
 */
export function handlePerfectionism(
  tasks: Task[],
  perfectionismHistory: { taskId: string; timeSpentRatio: number }[]
): TaskPlaylist {
  // Identifier les tâches où l'utilisateur passe trop de temps
  const overSpentTasks = perfectionismHistory.filter(record => record.timeSpentRatio > 2.0);
  
  // Filtrer les tâches problématiques
  const filteredTasks = tasks.filter(task => 
    !overSpentTasks.some(record => record.taskId === task.id)
  );
  
  const playlist = handleDefaultFallback(filteredTasks);
  
  return {
    ...playlist,
    warnings: [
      ...(playlist.warnings || []),
      "Certaines tâches où vous passez beaucoup de temps ont été mises de côté.",
      "Concentrons-nous sur 'terminé' plutôt que 'parfait'."
    ]
  };
}

/**
 * Gère le cas des journées impossibles (10 urgences réelles)
 * @param tasks Ensemble des tâches disponibles
 * @returns Playlist pour journée impossible
 */
export function handleImpossibleDay(tasks: Task[]): TaskPlaylist {
  // Identifier les tâches urgentes
  const urgentTasks = tasks
    .filter(task => task.urgency === 'urgent')
    .sort((a, b) => a.deadline!.getTime() - b.deadline!.getTime()); // Trier par deadline
  
  // Si plus de 5 tâches urgentes, limiter à 5
  const selectedTasks = urgentTasks.slice(0, 5);
  
  // Ajouter un avertissement
  const warnings = [
    "Votre journée est exceptionnellement chargée.",
    "Mode survie : concentrons-nous sur les priorités absolues."
  ];
  
  // Si trop de tâches urgentes, suggérer de diviser la journée
  if (urgentTasks.length > 10) {
    warnings.push("Il sera difficile de tout faire. Concentrons-nous sur ce qui est essentiel.");
  }
  
  return {
    tasks: selectedTasks,
    generatedAt: new Date(),
    energyUsed: { level: 'high', stability: 'volatile' }, // Énergie haute mais volatile
    explanation: "Gestion de journée impossible : mode survie.",
    warnings
  };
}
