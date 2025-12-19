// Modèle d'énergie pour le Cerveau de KairuFlow - Phase 1

import { EnergyState } from './types';

/**
 * Détermine l'état d'énergie à partir d'un self-report utilisateur
 * @param level Niveau d'énergie déclaré
 * @param stability Stabilité déclarée
 * @param confidence Confiance dans l'état (optionnel)
 * @returns État d'énergie conforme au modèle
 */
export function createEnergyState(
  level: 'low' | 'medium' | 'high',
  stability: 'volatile' | 'stable',
  confidence?: number
): EnergyState {
  return {
    level,
    stability,
    confidence
  };
}

/**
 * Calcule le facteur de pénalité en fonction de la stabilité
 * @param stability Stabilité de l'énergie
 * @returns Facteur de pénalité (1.0 pour stable, 1.3 pour volatile)
 */
export function getStabilityPenalty(stability: 'stable' | 'volatile'): number {
  return stability === 'stable' ? 1.0 : 1.3;
}

/**
 * Détermine si une tâche est compatible avec l'énergie disponible
 * @param taskEffort Niveau d'effort requis par la tâche
 * @param energy État d'énergie de l'utilisateur
 * @returns Booléen indiquant la compatibilité
 */
export function isEnergyCompatible(
  taskEffort: 'low' | 'medium' | 'high',
  energy: EnergyState
): boolean {
  // Si l'énergie est faible, seules les tâches légères sont compatibles
  if (energy.level === 'low') {
    return taskEffort === 'low';
  }
  
  // Si l'énergie est moyenne, les tâches légères et moyennes sont compatibles
  if (energy.level === 'medium') {
    return taskEffort === 'low' || taskEffort === 'medium';
  }
  
  // Si l'énergie est élevée, toutes les tâches sont compatibles
  return true;
}

/**
 * Prédit l'état d'énergie pour un créneau horaire donné
 * Basé sur les patterns généraux et l'historique utilisateur
 * @param timeOfDay Heure de la journée (0-23)
 * @param userPatterns Patterns personnalisés de l'utilisateur (optionnel)
 * @returns État d'énergie prédit
 */
export function predictEnergyState(
  timeOfDay: number,
  userPatterns?: Partial<EnergyState>
): EnergyState {
  // Modèle par défaut basé sur les rythmes circadiens
  let defaultLevel: 'low' | 'medium' | 'high' = 'medium';
  let defaultStability: 'stable' | 'volatile' = 'stable';
  let defaultConfidence: number = 0.8; // Confiance moyenne pour le modèle par défaut
  
  // Matin (6h-10h) : montée en puissance
  if (timeOfDay >= 6 && timeOfDay < 10) {
    defaultLevel = 'medium';
    defaultStability = 'stable';
  }
  // Milieu de journée (10h-14h) : pic d'énergie
  else if (timeOfDay >= 10 && timeOfDay < 14) {
    defaultLevel = 'high';
    defaultStability = 'stable';
  }
  // Après-midi (14h-18h) : creux après déjeuner
  else if (timeOfDay >= 14 && timeOfDay < 18) {
    defaultLevel = 'medium';
    defaultStability = 'volatile';
    defaultConfidence = 0.6; // Moins de confiance l'après-midi
  }
  // Soirée (18h-22h) : déclin progressif
  else if (timeOfDay >= 18 && timeOfDay < 22) {
    defaultLevel = 'low';
    defaultStability = 'stable';
  }
  // Nuit (22h-6h) : énergie faible
  else {
    defaultLevel = 'low';
    defaultStability = 'volatile';
    defaultConfidence = 0.5; // Faible confiance la nuit
  }
  
  // Appliquer les patterns utilisateur s'ils existent
  const level = userPatterns?.level || defaultLevel;
  const stability = userPatterns?.stability || defaultStability;
  const confidence = userPatterns?.confidence || defaultConfidence;
  
  return {
    level,
    stability,
    confidence
  };
}
