// Vérificateur d'invariants pour le Cerveau de KairuFlow - Phase 1

import { Task, TaskPlaylist, EnergyState } from './types';
import { isEnergyCompatible } from './energyModel';
import { isCapacityExhausted, calculateTaskCost } from './capacityCalculator';

/**
 * Vérifie l'invariant : jamais plus de 5 tâches
 * @param playlist Playlist à vérifier
 * @param maxTasks Nombre maximum de tâches autorisé (par défaut 5)
 * @returns Booléen indiquant si l'invariant est respecté
 */
export function checkMaxTasksInvariant(
  playlist: Task[],
  maxTasks: number = 5
): boolean {
  return playlist.length <= maxTasks;
}

/**
 * Vérifie l'invariant : toujours au moins 1 tâche faisable <15 min
 * @param playlist Playlist à vérifier
 * @returns Booléen indiquant si l'invariant est respecté
 */
export function checkMinQuickWinInvariant(playlist: Task[]): boolean {
  return playlist.some(task => task.duration <= 15 && task.effort === 'low');
}

/**
 * Vérifie l'invariant : charge totale (coût cognitif) ≤ capacité énergétique
 * @param playlist Playlist à vérifier
 * @param maxLoad Charge maximale autorisée (coût cumulé)
 * @param userEnergy État d'énergie de l'utilisateur
 * @returns Booléen indiquant si l'invariant est respecté
 */
export function checkTotalLoadInvariant(
  playlist: Task[],
  maxLoad: number,
  userEnergy: EnergyState
): boolean {
  // Calculer la charge totale de la playlist en utilisant le coût cognitif pondéré
  const totalLoad = playlist.reduce((sum, task) => sum + calculateTaskCost(task, userEnergy), 0);
  return totalLoad <= maxLoad;
}

/**
 * Vérifie l'invariant : pas de tâche "haute énergie" si énergie basse
 * @param playlist Playlist à vérifier
 * @param userEnergyLevel Niveau d'énergie de l'utilisateur
 * @returns Booléen indiquant si l'invariant est respecté
 */
export function checkEnergyMismatchInvariant(
  playlist: Task[],
  userEnergyLevel: 'low' | 'medium' | 'high'
): boolean {
  // Si l'énergie est haute, l'invariant est toujours respecté
  if (userEnergyLevel === 'high') {
    return true;
  }

  // Si l'énergie est moyenne, seules les tâches légères et moyennes sont autorisées
  if (userEnergyLevel === 'medium') {
    return playlist.every(task => task.effort === 'low' || task.effort === 'medium');
  }

  // Si l'énergie est faible, seules les tâches légères sont autorisées
  return playlist.every(task => task.effort === 'low');
}

/**
 * Vérifie l'invariant : une playlist doit être terminable à 70% minimum
 * @param playlist Playlist à vérifier
 * @returns Booléen indiquant si l'invariant est respecté
 */
export function checkCompletionRateInvariant(playlist: Task[]): boolean {
  if (playlist.length === 0) {
    return true; // Une playlist vide respecte l'invariant
  }

  const tasksWithProposals = playlist.filter(task => (task.proposalHistory?.length ?? 0) > 0);
  if (tasksWithProposals.length > 0) {
    const proposalRates = tasksWithProposals.map(task => {
      const proposedCount = task.proposalHistory?.length ?? 0;
      const completedCount = task.completionHistory.length;
      if (proposedCount <= 0) return 1;
      return completedCount / proposedCount;
    });

    const averageProposalRate = proposalRates.reduce((sum, rate) => sum + rate, 0) / proposalRates.length;
    return averageProposalRate >= 0.7;
  }

  // Fallback heuristique: basé sur la capacité observée à terminer dans une durée proche de l'estimation
  const tasksWithCompletions = playlist.filter(task => task.completionHistory.length > 0);
  if (tasksWithCompletions.length === 0) {
    return true;
  }

  const durationRates = tasksWithCompletions.map(task => {
    const avgActualDuration =
      task.completionHistory.reduce((sum, record) => sum + record.actualDuration, 0) /
      task.completionHistory.length;

    if (avgActualDuration <= 0) return 1;
    if (task.duration <= 0) return 0;
    return Math.min(1, task.duration / avgActualDuration);
  });

  const averageDurationRate = durationRates.reduce((sum, rate) => sum + rate, 0) / durationRates.length;
  return averageDurationRate >= 0.7;
}

/**
 * Vérifie tous les invariants absolus
 * @param playlist Playlist à vérifier
 * @param userEnergy État d'énergie de l'utilisateur
 * @param maxLoad Charge maximale autorisée
 * @returns Objet contenant le résultat de chaque invariant
 */
export function checkAllInvariants(
  playlist: Task[],
  userEnergy: EnergyState,
  maxLoad: number
): {
  maxTasks: boolean;
  minQuickWin: boolean;
  totalLoad: boolean;
  energyMismatch: boolean;
  completionRate: boolean;
  allValid: boolean;
} {
  const maxTasks = checkMaxTasksInvariant(playlist);
  const minQuickWin = checkMinQuickWinInvariant(playlist);
  const totalLoad = checkTotalLoadInvariant(playlist, maxLoad, userEnergy);
  const energyMismatch = checkEnergyMismatchInvariant(playlist, userEnergy.level);
  const completionRate = checkCompletionRateInvariant(playlist);

  // Tous les invariants doivent être respectés
  const allValid = maxTasks && minQuickWin && totalLoad && energyMismatch && completionRate;

  return {
    maxTasks,
    minQuickWin,
    totalLoad,
    energyMismatch,
    completionRate,
    allValid
  };
}

/**
 * Valide une playlist générée par le cerveau
 * @param playlist Playlist à valider
 * @param userEnergyLevel Niveau d'énergie de l'utilisateur
 * @param maxLoad Charge maximale autorisée
 * @returns Playlist validée ou erreur si les invariants ne sont pas respectés
 */
export function validatePlaylist(
  playlist: TaskPlaylist,
  userEnergy: EnergyState,
  maxLoad: number
): TaskPlaylist | { error: string; invalidInvariants: string[] } {
  const invariantResults = checkAllInvariants(playlist.tasks, userEnergy, maxLoad);

  // Si tous les invariants sont respectés, retourner la playlist
  if (invariantResults.allValid) {
    return playlist;
  }

  // Identifier les invariants non respectés
  const invalidInvariants: string[] = [];

  if (!invariantResults.maxTasks) {
    invalidInvariants.push("Nombre maximum de tâches dépassé");
  }

  if (!invariantResults.minQuickWin) {
    invalidInvariants.push("Aucune tâche quick win (<15 min) trouvée");
  }

  if (!invariantResults.totalLoad) {
    invalidInvariants.push("Charge totale supérieure à la capacité énergétique");
  }

  if (!invariantResults.energyMismatch) {
    invalidInvariants.push("Tâche incompatible avec le niveau d'énergie utilisateur");
  }

  if (!invariantResults.completionRate) {
    invalidInvariants.push("Taux de complétion inférieur à 70%");
  }

  // Retourner une erreur avec les invariants non respectés
  return {
    error: "Violations d'invariants détectées",
    invalidInvariants
  };
}
