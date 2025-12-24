// Gestionnaire de pools de tâches pour le Cerveau de KairuFlow - Phase 1
import { Task } from './types';

/**
 * Types de pools de tâches
 */
export type TaskPoolType =
  | 'OVERDUE'    // Tâches en retard
  | 'TODAY'      // Tâches du jour
  | 'SOON'       // Tâches dans 2-7 jours
  | 'AVAILABLE'; // Tâches disponibles

/**
 * Gestionnaire de pools de tâches
 */
export interface TaskPoolManager {
  /** Tâches en retard */
  overdue: Task[];
  /** Tâches du jour */
  today: Task[];
  /** Tâches dans 2-7 jours */
  soon: Task[];
  /** Tâches disponibles */
  available: Task[];
  /** Date de référence */
  referenceDate: Date;
}

/**
 * Crée un gestionnaire de pools de tâches
 * @param referenceDate Date de référence
 * @returns Gestionnaire de pools de tâches
 */
export function createTaskPoolManager(referenceDate: Date = new Date()): TaskPoolManager {
  return {
    overdue: [],
    today: [],
    soon: [],
    available: [],
    referenceDate
  };
}

/**
 * Classe de score pour les tâches SOON
 */
export interface SoonScore {
  /** Score de priorité */
  score: number;
  /** Date du dernier calcul */
  lastCalculated: Date;
}

/**
 * Calcule le score SOON pour une tâche
 * @param task Tâche à évaluer
 * @param referenceDate Date de référence
 * @returns Score SOON
 */
export function calculateSoonScore(task: Task, referenceDate: Date): SoonScore {
  // Score basé sur l'urgence et l'impact
  let score = 0.5; // Score de base

  // Ajouter de l'importance selon l'urgence
  switch (task.urgency) {
    case 'urgent':
      score += 0.3;
      break;
    case 'high':
      score += 0.2;
      break;
    case 'medium':
      score += 0.1;
      break;
  }

  // Ajouter de l'importance selon l'impact
  switch (task.impact) {
    case 'high':
      score += 0.2;
      break;
    case 'medium':
      score += 0.1;
      break;
  }

  // Dégrader le score de 10% par jour
  if (task.deadline) {
    const daysUntilDeadline = Math.ceil(
      (task.deadline.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Appliquer la dégradation (10% par jour)
    const degradation = Math.max(0, (daysUntilDeadline - 2) * 0.1);
    score = Math.max(0.1, score - degradation);
  }

  return {
    score,
    lastCalculated: new Date()
  };
}

/**
 * Trie les tâches SOON par score décroissant
 * @param tasks Tâches à trier
 * @param referenceDate Date de référence
 * @returns Tâches triées
 */
export function sortSoonTasks(tasks: Task[], referenceDate: Date): Task[] {
  return [...tasks].sort((a, b) => {
    const scoreA = calculateSoonScore(a, referenceDate).score;
    const scoreB = calculateSoonScore(b, referenceDate).score;
    return scoreB - scoreA;
  });
}

/**
 * Assigner une tâche à un pool
 * @param task Tâche à assigner
 * @param manager Gestionnaire de pools
 * @returns Type de pool assigné
 */
export function assignTaskToPool(task: Task, manager: TaskPoolManager): TaskPoolType {
  const today = new Date(manager.referenceDate);
  today.setHours(0, 0, 0, 0);

  // Vérifier si la tâche a une deadline
  if (task.deadline) {
    const taskDeadline = new Date(task.deadline);
    taskDeadline.setHours(0, 0, 0, 0);

    // Comparer les dates
    if (taskDeadline < today) {
      return 'OVERDUE';
    } else if (taskDeadline.getTime() === today.getTime()) {
      // Si c'est aujourd'hui, vérifier l'heure programmée (si elle existe)
      if (task.scheduledTime) {
        const now = new Date(manager.referenceDate);
        const timeMatch = task.scheduledTime.match(/(\d{1,2})[:h](\d{2})/);

        if (timeMatch) {
          const hours = parseInt(timeMatch[1], 10);
          const minutes = parseInt(timeMatch[2], 10);
          const scheduledDate = new Date(today);
          scheduledDate.setHours(hours, minutes, 0, 0);

          // Si l'heure programmée est passée d'au moins 1 minute
          if (now.getTime() > scheduledDate.getTime() + 60 * 1000) {
            return 'OVERDUE';
          }
        }
      }
      return 'TODAY';
    } else {
      // Calculer la différence en jours
      const diffTime = taskDeadline.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Tâches dans 2-7 jours
      if (diffDays >= 2 && diffDays <= 7) {
        return 'SOON';
      }
    }
  }

  // Tâches sans deadline ou avec deadline > J+7
  return 'AVAILABLE';
}

/**
 * Met à jour les pools de tâches
 * @param tasks Tâches à distribuer
 * @param manager Gestionnaire de pools
 * @returns Gestionnaire de pools mis à jour
 */
export function updateTaskPools(tasks: Task[], manager: TaskPoolManager): TaskPoolManager {
  const updatedManager = createTaskPoolManager(manager.referenceDate);

  // Distribuer les tâches dans les pools
  for (const task of tasks) {
    const poolType = assignTaskToPool(task, manager);

    switch (poolType) {
      case 'OVERDUE':
        updatedManager.overdue.push(task);
        break;
      case 'TODAY':
        updatedManager.today.push(task);
        break;
      case 'SOON':
        updatedManager.soon.push(task);
        break;
      case 'AVAILABLE':
        updatedManager.available.push(task);
        break;
    }
  }

  // Trier les tâches SOON par score
  updatedManager.soon = sortSoonTasks(updatedManager.soon, manager.referenceDate);

  // Limiter la taille des pools
  // SOON limité à 3 tâches
  if (updatedManager.soon.length > 3) {
    // Déplacer les tâches excédentaires vers AVAILABLE
    const excessTasks = updatedManager.soon.splice(3);
    updatedManager.available.push(...excessTasks);
  }

  // AVAILABLE limité à 10 tâches
  if (updatedManager.available.length > 10) {
    // Garder les 10 tâches les plus récentes
    updatedManager.available.sort((a, b) => {
      // Trier par date de création (la plus récente en premier)
      const dateA = a.completionHistory.length > 0
        ? a.completionHistory[a.completionHistory.length - 1].date
        : new Date(0);
      const dateB = b.completionHistory.length > 0
        ? b.completionHistory[b.completionHistory.length - 1].date
        : new Date(0);
      return dateB.getTime() - dateA.getTime();
    });

    updatedManager.available = updatedManager.available.slice(0, 10);
  }

  return updatedManager;
}

/**
 * Obtient les tâches éligibles selon la règle d'or
 * @param manager Gestionnaire de pools
 * @returns Tâches éligibles
 */
export function getEligibleTasks(manager: TaskPoolManager): Task[] {
  // Règle d'or : si OVERDUE ou TODAY non vide, SOON & AVAILABLE invisibles
  if (manager.overdue.length > 0 || manager.today.length > 0) {
    return [...manager.overdue, ...manager.today];
  }

  // Sinon, prendre SOON et AVAILABLE (dans la limite)
  return [...manager.soon, ...manager.available];
}
