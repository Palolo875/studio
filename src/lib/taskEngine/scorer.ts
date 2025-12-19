// Système de scoring pour le Cerveau de KairuFlow - Phase 1

import { Task, TaskScore, EnergyState } from './types';
import { isEnergyCompatible } from './energyModel';

/**
 * Calcule le score d'alignement énergétique d'une tâche
 * @param task Tâche à évaluer
 * @param userEnergy État d'énergie de l'utilisateur
 * @returns Score d'alignement énergétique (0-1)
 */
export function calculateEnergyAlignmentScore(task: Task, userEnergy: EnergyState): number {
  // Vérifier la compatibilité énergétique
  const isCompatible = isEnergyCompatible(task.effort, userEnergy);
  
  // Si incompatible, score très bas
  if (!isCompatible) {
    return 0.1;
  }
  
  // Si compatible et énergie stable, score élevé
  if (userEnergy.stability === 'stable') {
    return 0.9;
  }
  
  // Si compatible mais énergie volatile, score moyen
  return 0.7;
}

/**
 * Calcule le score d'urgence d'une tâche
 * @param task Tâche à évaluer
 * @returns Score d'urgence (0-1)
 */
export function calculateUrgencyScore(task: Task): number {
  switch (task.urgency) {
    case 'urgent':
      return 1.0;
    case 'high':
      return 0.8;
    case 'medium':
      return 0.5;
    case 'low':
      return 0.2;
    default:
      return 0.5;
  }
}

/**
 * Calcule le score d'impact d'une tâche
 * @param task Tâche à évaluer
 * @returns Score d'impact (0-1)
 */
export function calculateImpactScore(task: Task): number {
  switch (task.impact) {
    case 'high':
      return 1.0;
    case 'medium':
      return 0.6;
    case 'low':
      return 0.3;
    default:
      return 0.6;
  }
}

/**
 * Calcule le score d'équilibre effort/récompense
 * @param task Tâche à évaluer
 * @returns Score d'équilibre effort/récompense (0-1)
 */
export function calculateEffortBalanceScore(task: Task): number {
  // Ratio idéal : impact/effort
  const effortValueMap = { low: 1, medium: 2, high: 3 };
  const impactValueMap = { low: 1, medium: 2, high: 3 };
  
  const effortValue = effortValueMap[task.effort];
  const impactValue = impactValueMap[task.impact];
  
  // Calcul du ratio (normalisé entre 0 et 1)
  const ratio = impactValue / effortValue;
  return Math.min(1, ratio / 3); // Normalisation
}

/**
 * Calcule le score basé sur les patterns comportementaux
 * @param task Tâche à évaluer
 * @returns Score de pattern comportemental (0-1)
 */
export function calculateBehavioralPatternScore(task: Task): number {
  if (task.completionHistory.length === 0) {
    // Pas d'historique, score neutre
    return 0.5;
  }
  
  // Calculer le taux de complétion
  const completedCount = task.completionHistory.length;
  const totalTimePlanned = task.completionHistory.reduce((sum, record) => sum + task.duration, 0);
  const totalTimeActual = task.completionHistory.reduce((sum, record) => sum + record.actualDuration, 0);
  
  // Si l'utilisateur complète habituellement cette tâche rapidement, score élevé
  if (totalTimeActual < totalTimePlanned * 0.8) {
    return 0.9;
  }
  
  // Si l'utilisateur prend plus de temps que prévu, score plus bas
  if (totalTimeActual > totalTimePlanned * 1.2) {
    return 0.3;
  }
  
  // Performance normale
  return 0.7;
}

/**
 * Calcule le score de diversité cognitive
 * @param task Tâche à évaluer
 * @param recentTasks Tâches récemment sélectionnées
 * @returns Score de diversité (0-1)
 */
export function calculateDiversityScore(task: Task, recentTasks: Task[]): number {
  if (recentTasks.length === 0) {
    // Pas de tâches récentes, score maximal
    return 1.0;
  }
  
  // Compter combien de tâches récentes ont la même catégorie
  const sameCategoryCount = recentTasks.filter(t => t.category === task.category).length;
  
  // Plus il y a de tâches similaires, plus le score est bas
  return Math.max(0.1, 1 - (sameCategoryCount / recentTasks.length));
}

/**
 * Calcule le score total d'une tâche selon la formule canonique
 * @param task Tâche à évaluer
 * @param userEnergy État d'énergie de l'utilisateur
 * @param recentTasks Tâches récemment sélectionnées (pour la diversité)
 * @returns Score total de la tâche
 */
export function calculateTaskScore(
  task: Task,
  userEnergy: EnergyState,
  recentTasks: Task[] = []
): TaskScore {
  // Calculer chaque composant du score
  const energyAlignment = calculateEnergyAlignmentScore(task, userEnergy);
  const urgency = calculateUrgencyScore(task);
  const impact = calculateImpactScore(task);
  const effortBalance = calculateEffortBalanceScore(task);
  const behavioralPattern = calculateBehavioralPatternScore(task);
  const diversity = calculateDiversityScore(task, recentTasks);
  
  // Appliquer les poids de la formule canonique
  const totalScore = 
    0.40 * energyAlignment +
    0.20 * urgency +
    0.15 * impact +
    0.10 * effortBalance +
    0.10 * behavioralPattern +
    0.05 * diversity;
  
  return {
    task,
    totalScore,
    breakdown: {
      energyAlignment,
      urgency,
      impact,
      effortBalance,
      behavioralPattern,
      diversity
    },
    confidence: 0.9 // Confiance élevée dans le calcul déterministe
  };
}

/**
 * Trie les tâches par score décroissant
 * @param taskScores Tableau de scores de tâches
 * @returns Tableau de scores triés
 */
export function sortTasksByScore(taskScores: TaskScore[]): TaskScore[] {
  return [...taskScores].sort((a, b) => b.totalScore - a.totalScore);
}
