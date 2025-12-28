// Gestionnaire de fallbacks pour le Cerveau de KairuFlow - Phase 1

import { Task, TaskPlaylist, EnergyState } from './types';
import { isEnergyCompatible } from './energyModel';

/**
 * Fallback pour énergie trop basse
 * @param tasks Ensemble des tâches disponibles
 * @returns Playlist de fallback ou null si non applicable
 */
export function handleLowEnergyFallback(tasks: Task[]): TaskPlaylist | null {
  // Trouver une tâche facile et rapide
  const easyTask = tasks.find(task => 
    task.effort === 'low' && 
    task.duration <= 15
  );
  
  if (easyTask) {
    return {
      tasks: [easyTask],
      generatedAt: new Date(),
      energyUsed: { level: 'low', stability: 'stable' }, // Énergie basse par défaut
      explanation: "Fallback : Votre énergie est basse, commençons par quelque chose de simple.",
      warnings: ["Votre énergie semble basse. Une seule tâche facile est suggérée pour commencer en douceur."]
    };
  }
  
  return null;
}

/**
 * Fallback pour trop de contraintes
 * @param tasks Ensemble des tâches disponibles
 * @param userEnergy État d'énergie de l'utilisateur
 * @returns Playlist de fallback ou null si non applicable
 */
export function handleOverconstrainedFallback(
  tasks: Task[],
  userEnergy: EnergyState
): TaskPlaylist | null {
  // Filtrer les tâches compatibles avec l'énergie
  const compatibleTasks = tasks.filter(task => 
    isEnergyCompatible(task.effort, userEnergy)
  );
  
  // Si aucune tâche compatible, retourner null
  if (compatibleTasks.length === 0) {
    return null;
  }
  
  // Trier par durée croissante
  const sortedTasks = [...compatibleTasks].sort((a, b) => a.duration - b.duration);
  
  // Prendre les 2 tâches les plus courtes
  const selectedTasks = sortedTasks.slice(0, 2);
  
  return {
    tasks: selectedTasks,
    generatedAt: new Date(),
    energyUsed: userEnergy,
    explanation: "Fallback : Trop de contraintes détectées. La playlist a été simplifiée.",
    warnings: ["Journée chargée ! La playlist a été allégée pour vous permettre de vous concentrer."]
  };
}

/**
 * Fallback pour historique incohérent
 * @param tasks Ensemble des tâches disponibles
 * @returns Playlist de fallback ou null si non applicable
 */
export function handleInconsistentHistoryFallback(tasks: Task[]): TaskPlaylist | null {
  // Filtrer les tâches avec un historique cohérent
  const consistentTasks = tasks.filter(task => {
    if (task.completionHistory.length === 0) {
      // Pas d'historique, considéré comme cohérent
      return true;
    }
    
    // Vérifier la cohérence de l'historique
    const totalTimePlanned = task.completionHistory.reduce((sum, record) => sum + task.duration, 0);
    const totalTimeActual = task.completionHistory.reduce((sum, record) => sum + record.actualDuration, 0);
    
    // Historique cohérent si la durée réelle est dans une plage raisonnable
    return totalTimeActual >= totalTimePlanned * 0.5 && totalTimeActual <= totalTimePlanned * 2;
  });
  
  // Si aucune tâche avec historique cohérent, utiliser toutes les tâches
  const tasksToUse = consistentTasks.length > 0 ? consistentTasks : tasks;
  
  const selectedTasks = tasksToUse.slice(0, 3);
  
  return {
    tasks: selectedTasks,
    generatedAt: new Date(),
    energyUsed: { level: 'medium', stability: 'stable' }, // Énergie moyenne par défaut
    explanation: "Fallback : Votre historique montre des variations. Proposition d'une playlist fraîche pour repartir sur de bonnes bases.",
    warnings: ["Vos habitudes semblent changer. Voici une nouvelle approche pour aujourd'hui."]
  };
}

/**
 * Fallback par défaut
 * @param tasks Ensemble des tâches disponibles
 * @returns Playlist de fallback par défaut
 */
export function handleDefaultFallback(tasks: Task[]): TaskPlaylist {
  const selectedTasks = tasks.slice(0, 3);
  
  return {
    tasks: selectedTasks,
    generatedAt: new Date(),
    energyUsed: { level: 'medium', stability: 'stable' }, // Énergie moyenne par défaut
    explanation: "Fallback par défaut appliqué.",
    warnings: ["Génération d'une playlist équilibrée pour commencer."]
  };
}
