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
  let effortBase: number;
  switch (task.effort) {
    case 'low':
      effortBase = 1.0;
      break;
    case 'medium':
      effortBase = 1.5;
      break;
    case 'high':
      effortBase = 2.5;
      break;
    default:
      effortBase = 1.5;
  }

  // Facteur d'inadéquation énergétique (energyMismatchFactor)
  // Basé sur les exemples de la documentation Phase 1
  let energyMismatchFactor = 1.0;

  if (userEnergy.level === 'low') {
    if (task.effort === 'high') energyMismatchFactor = 3.0; // Devrait être bloqué par invariant
    else if (task.effort === 'medium') energyMismatchFactor = 2.0;
    else if (task.effort === 'low') energyMismatchFactor = 0.8; // "admin (S) + énergie basse -> coût x0.8"
  } else if (userEnergy.level === 'medium') {
    if (task.effort === 'high') energyMismatchFactor = 1.5;
    else if (task.effort === 'medium') energyMismatchFactor = 1.0;
    else if (task.effort === 'low') energyMismatchFactor = 0.9;
  } else if (userEnergy.level === 'high') {
    if (task.effort === 'high') energyMismatchFactor = 1.0;
    else if (task.effort === 'medium') energyMismatchFactor = 0.8;
    else if (task.effort === 'low') energyMismatchFactor = 0.6;
  }

  // Facteur de pénalité basé sur la stabilité de l'énergie
  const stabilityPenalty = getStabilityPenalty(userEnergy.stability);

  // Calcul du coût final : durée × base_effort × mismatch × stabilité
  return task.duration * effortBase * energyMismatchFactor * stabilityPenalty;
}

/**
 * Calcule la capacité de session en fonction de sa durée et de l'énergie de l'utilisateur
 * @param durationMinutes Durée de la session en minutes
 * @param energyState État d'énergie de l'utilisateur
 * @returns Capacité de la session
 */
export function calculateSessionCapacity(durationMinutes: number, energyState: EnergyState): number {
  // Barème fixe basé sur la durée de session
  // Pour une session de 30 min : capacité de 5
  // Pour une session de 60 min : capacité de 10
  // Pour une session de 120 min : capacité de 20
  const baseCapacity = Math.round(durationMinutes / 6);

  // Appliquer une pénalité si l'énergie est instable
  const stabilityPenalty = getStabilityPenalty(energyState.stability);

  return baseCapacity / stabilityPenalty;
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
 * Applique une dette cognitive à la capacité (Mode Dette)
 * @param capacity Capacité actuelle
 * @param debtPercentage Pourcentage de réduction (ex: 0.2 pour 20%)
 * @returns Capacité avec la dette appliquée
 */
export function applyCognitiveDebt(capacity: DailyCapacity, debtPercentage: number): DailyCapacity {
  const reduction = capacity.maxLoad * debtPercentage;
  const newMaxLoad = Math.max(0, capacity.maxLoad - reduction);

  return {
    ...capacity,
    maxLoad: newMaxLoad,
    remaining: Math.max(0, newMaxLoad - capacity.usedLoad)
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
