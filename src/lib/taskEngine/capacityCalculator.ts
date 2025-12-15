// Calculateur de capacité journalière pour le Cerveau de KairuFlow - Phase 1

import { Task, DailyCapacity, EnergyState } from './types';
import { getStabilityPenalty } from './energyModel';

/**
 * Calcule le coût d'une tâche en fonction de l'énergie de l'utilisateur
 * @param task Tâche à évaluer
 * @param userEnergy État d'énergie de l'utilisateur
 * @returns Coût de la tâche
 */
export function calculateTaskCost(task: Task, userEnergy: EnergyState): number {
  // Facteur de base basé sur l'effort requis
  let effortFactor: number;
  switch (task.effort) {
    case 'low':
      effortFactor = 1.0;
      break;
    case 'medium':
      effortFactor = 1.5;
      break;
    case 'high':
      effortFactor = 2.5;
      break;
    default:
      effortFactor = 1.5; // Valeur par défaut
  }
  
  // Facteur de pénalité basé sur la stabilité de l'énergie
  const stabilityPenalty = getStabilityPenalty(userEnergy.stability);
  
  // Calcul du coût : effort × durée × pénalité de stabilité
  return task.duration * effortFactor * stabilityPenalty;
}

/**
 * Initialise la capacité cognitive journalière
 * @param maxLoad Charge maximale autorisée (par défaut 10)
 * @returns Capacité cognitive journalière initialisée
 */
export function initializeDailyCapacity(maxLoad: number = 10): DailyCapacity {
  return {
    maxLoad,
    usedLoad: 0,
    remaining: maxLoad,
    tasksToday: []
  };
}

/**
 * Met à jour la capacité cognitive journalière avec une nouvelle tâche
 * @param capacity Capacité actuelle
 * @param task Tâche à ajouter
 * @param taskCost Coût de la tâche
 * @param status Statut de la tâche
 * @returns Nouvelle capacité mise à jour
 */
export function updateDailyCapacity(
  capacity: DailyCapacity,
  task: Task,
  taskCost: number,
  status: 'done' | 'in_progress' | 'planned'
): DailyCapacity {
  // Créer une copie de la capacité pour ne pas muter l'originale
  const updatedCapacity: DailyCapacity = {
    ...capacity,
    tasksToday: [
      ...capacity.tasksToday,
      { cost: taskCost, status }
    ]
  };
  
  // Mettre à jour la charge utilisée et restante
  updatedCapacity.usedLoad += taskCost;
  updatedCapacity.remaining = Math.max(0, capacity.maxLoad - updatedCapacity.usedLoad);
  
  return updatedCapacity;
}

/**
 * Vérifie si une tâche peut être ajoutée sans dépasser la capacité
 * @param capacity Capacité actuelle
 * @param taskCost Coût de la tâche à ajouter
 * @returns Booléen indiquant si l'ajout est possible
 */
export function canAddTask(capacity: DailyCapacity, taskCost: number): boolean {
  return capacity.remaining >= taskCost;
}

/**
 * Vérifie si la capacité est épuisée (seuil critique atteint)
 * @param capacity Capacité actuelle
 * @param criticalThreshold Seuil critique (par défaut 20%)
 * @returns Booléen indiquant si la capacité est épuisée
 */
export function isCapacityExhausted(
  capacity: DailyCapacity,
  criticalThreshold: number = 0.2
): boolean {
  return capacity.remaining < capacity.maxLoad * criticalThreshold;
}

/**
 * Vérifie si la capacité approche de l'épuisement (seuil d'alerte)
 * @param capacity Capacité actuelle
 * @param warningThreshold Seuil d'alerte (par défaut 40%)
 * @returns Booléen indiquant si la capacité approche de l'épuisement
 */
export function isCapacityNearExhaustion(
  capacity: DailyCapacity,
  warningThreshold: number = 0.4
): boolean {
  return capacity.remaining < capacity.maxLoad * warningThreshold;
}