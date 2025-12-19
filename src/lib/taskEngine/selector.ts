// Algorithme de sélection des tâches pour le Cerveau de KairuFlow - Phase 1

import { Task, TaskPlaylist, TaskScore, EnergyState, DailyCapacity } from './types';
import { calculateTaskScore, sortTasksByScore } from './scorer';
import { isEnergyCompatible } from './energyModel';
import { canAddTask, calculateTaskCost, updateDailyCapacity } from './capacityCalculator';
import { getEligibleTasks } from './taskPoolManager';

/**
 * Filtre les tâches éligibles en fonction de leur deadline et statut
 * @param tasks Ensemble des tâches
 * @param currentDate Date actuelle
 * @returns Tâches éligibles
 */
export function filterEligibleTasks(tasks: Task[], currentDate: Date): Task[] {
  const today = new Date(currentDate);
  today.setHours(0, 0, 0, 0);
  
  return tasks.filter(task => {
    // Tâches en retard (deadline passée et non terminées)
    if (task.deadline && task.deadline < today) {
      return true;
    }
    
    // Tâches d'aujourd'hui
    if (task.deadline) {
      const taskDay = new Date(task.deadline);
      taskDay.setHours(0, 0, 0, 0);
      if (taskDay.getTime() === today.getTime()) {
        return true;
      }
    }
    
    // Tâches sans deadline sont toujours éligibles
    if (!task.deadline) {
      return true;
    }

    // Tâches futures, seulement si elles ont été démarrées
    if (task.deadline > today) {
      return task.completionHistory.length > 0 || task.status === 'active';
    }
    
    return false;
  });
}

/**
 * Injecte une tâche quick win dans la playlist
 * @param tasks Tâches disponibles
 * @param playlist Playlist en cours de construction
 * @param maxQuickWins Nombre maximum de quick wins à injecter
 * @returns Tâche quick win trouvée (ou null si aucune)
 */
export function injectQuickWin(
  tasks: Task[],
  playlist: Task[],
  maxQuickWins: number = 1
): Task | null {
  // Compter les quick wins déjà dans la playlist
  const quickWinsInPlaylist = playlist.filter(task => 
    task.duration <= 15 && task.effort === 'low'
  ).length;
  
  // Si on a déjà atteint le maximum, ne pas en ajouter d'autres
  if (quickWinsInPlaylist >= maxQuickWins) {
    return null;
  }
  
  // Trouver une tâche quick win parmi les tâches disponibles
  const quickWin = tasks.find(task => 
    task.duration <= 15 && 
    task.effort === 'low' &&
    !playlist.includes(task)
  );
  
  return quickWin || null;
}

/**
 * Vérifie la diversité de la playlist
 * @param playlist Playlist à vérifier
 * @param maxSameCategory Nombre maximum de tâches de la même catégorie
 * @returns Booléen indiquant si la diversité est suffisante
 */
export function checkDiversity(playlist: Task[], maxSameCategory: number = 2): boolean {
  // Compter les tâches par catégorie
  const categoryCount: Record<string, number> = {};
  
  for (const task of playlist) {
    categoryCount[task.category] = (categoryCount[task.category] || 0) + 1;
    
    // Si une catégorie dépasse le maximum, la diversité n'est pas suffisante
    if (categoryCount[task.category] > maxSameCategory) {
      return false;
    }
  }
  
  return true;
}

/**
 * Génère une playlist de tâches en appliquant l'algorithme de sélection
 * @param tasks Ensemble des tâches disponibles
 * @param userEnergy État d'énergie de l'utilisateur
 * @param capacity Capacité cognitive actuelle de l'utilisateur
 * @param maxTasks Nombre maximum de tâches dans la playlist (par défaut 5)
 * @param currentDate Date actuelle (pour le filtrage)
 * @returns Playlist de tâches générée
 */
export function generateTaskPlaylist(
  tasks: Task[],
  userEnergy: EnergyState,
  capacity: DailyCapacity,
  maxTasks: number = 5,
  currentDate: Date = new Date()
): TaskPlaylist {
  // Filtrer les tâches éligibles
  const eligibleTasks = filterEligibleTasks(tasks, currentDate);
  
  // Utiliser le gestionnaire de pools pour obtenir les tâches éligibles selon la règle d'or
  // Note: Pour une implémentation complète, cela devrait utiliser taskPoolManager
  // Pour l'instant, nous continuons avec l'approche existante
  
  // Calculer les scores pour chaque tâche éligible
  const taskScores: TaskScore[] = eligibleTasks.map(task => 
    calculateTaskScore(task, userEnergy, [])
  );
  
  // Trier par score décroissant
  const sortedTaskScores = sortTasksByScore(taskScores);
  
  // Construire la playlist
  let currentCapacity = { ...capacity };
  const playlist: Task[] = [];
  
  // Prioriser l'injection d'un "quick win"
  const quickWin = injectQuickWin(eligibleTasks, []);
  if (quickWin) {
    const quickWinCost = calculateTaskCost(quickWin, userEnergy);
    if (canAddTask(currentCapacity, quickWinCost)) {
      playlist.push(quickWin);
      currentCapacity = updateDailyCapacity(currentCapacity, quickWin, quickWinCost, 'planned');
    }
  }
  
  // Filtrer les tâches restantes (sans le quick win s'il a été ajouté)
  const remainingSortedScores = sortedTaskScores.filter(
    ts => !playlist.some(p => p.id === ts.task.id)
  );

  let remainingTasks = remainingSortedScores;

  // Ajouter les autres tâches jusqu'à atteindre la limite
  for (const taskScore of remainingTasks) {
    // Vérifier si on a atteint le nombre maximum de tâches
    if (playlist.length >= maxTasks) {
      break;
    }
    
    // Vérifier la compatibilité énergétique
    if (!isEnergyCompatible(taskScore.task.effort, userEnergy)) {
      continue;
    }
    
    // Vérifier si la tâche peut être ajoutée sans dépasser la capacité
    const taskCost = calculateTaskCost(taskScore.task, userEnergy);
    if (!canAddTask(currentCapacity, taskCost)) {
      continue; // Tâche trop coûteuse, on passe à la suivante
    }

    // Ajouter la tâche à la playlist et mettre à jour la capacité
    playlist.push(taskScore.task);
    currentCapacity = updateDailyCapacity(currentCapacity, taskScore.task, taskCost, 'planned');
  }
  
  // Vérifier la diversité et retirer des tâches si nécessaire
  while (!checkDiversity(playlist) && playlist.length > 1) {
    // Retirer la dernière tâche ajoutée
    playlist.pop();
  }
  
  return {
    tasks: playlist,
    generatedAt: new Date(),
    energyUsed: userEnergy,
    explanation: "Playlist générée selon l'algorithme de sélection du Cerveau de KairuFlow",
    warnings: playlist.length === 0 ? ["Aucune tâche éligible trouvée"] : undefined
  };
}

/**
 * Applique les fallbacks en cas d'échec de la sélection normale
 * @param tasks Ensemble des tâches disponibles
 * @param userEnergy État d'énergie de l'utilisateur
 * @param reason Raison du fallback
 * @returns Playlist générée par le fallback
 */
export function applyFallback(
  tasks: Task[],
  userEnergy: EnergyState,
  reason: string
): TaskPlaylist {
  // Fallback 1 : Si énergie trop basse, proposer une seule tâche facile + repos
  if (userEnergy.level === 'low') {
    const easyTask = tasks.find(task => 
      task.effort === 'low' && 
      task.duration <= 15
    );
    
    if (easyTask) {
      return {
        tasks: [easyTask],
        generatedAt: new Date(),
        energyUsed: userEnergy,
        explanation: "Fallback appliqué : énergie basse",
        warnings: ["Énergie basse détectée. Une seule tâche facile recommandée."]
      };
    }
  }
  
  // Fallback 2 : Mode survie - tâches les plus urgentes
  const urgentTasks = tasks
    .filter(task => task.urgency === 'urgent')
    .slice(0, 3);
    
  if (urgentTasks.length > 0) {
    return {
      tasks: urgentTasks,
      generatedAt: new Date(),
      energyUsed: userEnergy,
      explanation: "Fallback appliqué : mode survie",
      warnings: [`Mode survie activé : ${reason}`]
    };
  }
  
  // Fallback 3 : Playlist vide avec message d'explication
  return {
    tasks: [],
    generatedAt: new Date(),
    energyUsed: userEnergy,
    explanation: "Fallback appliqué : aucune tâche trouvée",
    warnings: [`Impossible de générer une playlist : ${reason}`]
  };
}