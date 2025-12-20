// Système de suivi des résultats des tâches - Phase 3.6
import { Task } from './types';

/**
 * Types de résultats tangibles
 */
export type TangibleResultType = 
  | "DELIVERABLE"      // Livrable produit
  | "EXTERNAL_ACTION"  // Action externe effectuée
  | "TIME_BOUND"       // Temps irréversible investi
  | "STATE_CHANGE";    // État du monde modifié

/**
 * Définition d'un résultat tangible
 */
export interface TangibleResult {
  taskId: string;
  hasTangibleResult: boolean;
  resultType?: TangibleResultType;
  proofHint?: string; // Indice de preuve du résultat
}

/**
 * Suivi des efforts vs impact
 */
export interface TaskOutcome {
  taskId: string;
  effortCost: number;        // Basé sur effort + durée réelle
  impactScore: number;      // Calculé après coup (0.0 - 1.0)
  impactDeclaredByUser: boolean;
  completedAt?: Date;
}

/**
 * Métriques de productivité réelle
 */
export interface ProductivityMetrics {
  period: {
    start: Date;
    end: Date;
  };
  tangibleTasksCompleted: number;
  avgEffortPerImpact: number;
  completionRate: number; // 0.0 - 1.0
  avgTimeToResult: number; // En minutes
}

/**
 * Détermine si une tâche a un résultat tangible
 */
export function hasTangibleResult(task: Task): TangibleResult {
  // Pour l'instant, une implémentation basique
  // Dans une vraie application, cela serait basé sur des critères plus complexes
  
  // Si la tâche a un deadline, elle est probablement tangible
  if (task.deadlineDisplay) {
    return {
      taskId: task.id,
      hasTangibleResult: true,
      resultType: "DELIVERABLE",
      proofHint: `Deadline: ${task.deadlineDisplay}`
    };
  }
  
  // Si la tâche a des sous-tâches, elle peut être décomposée en résultats tangibles
  if (task.subtasks && task.subtasks.length > 0) {
    return {
      taskId: task.id,
      hasTangibleResult: true,
      resultType: "STATE_CHANGE",
      proofHint: `${task.subtasks.length} sous-tâches identifiées`
    };
  }
  
  // Par défaut, considérer comme non tangible
  return {
    taskId: task.id,
    hasTangibleResult: false
  };
}

/**
 * Calcule le coût d'effort d'une tâche
 */
export function calculateEffortCost(task: Task): number {
  // Mapping des niveaux d'effort vers des valeurs numériques
  const effortValues: Record<string, number> = {
    "S": 1,  // Simple
    "M": 2,  // Moyen
    "L": 3   // Lourd
  };
  
  // Durée estimée en minutes
  const duration = task.duration || 0;
  
  // Calcul du coût d'effort
  const effortValue = effortValues[task.effort] || 1;
  const durationFactor = Math.max(1, duration / 60); // Normaliser par heure
  
  return effortValue * durationFactor;
}

/**
 * Calcule le score d'impact d'une tâche
 */
export function calculateImpactScore(task: Task, outcome: TaskOutcome): number {
  // Si l'utilisateur a déclaré un impact, le prendre en compte
  if (outcome.impactDeclaredByUser) {
    return outcome.impactScore;
  }
  
  // Sinon, calculer un score basé sur les propriétés de la tâche
  let score = 0.5; // Score de base
  
  // Augmenter le score pour les tâches avec deadlines
  if (task.deadlineDisplay) {
    score += 0.2;
  }
  
  // Augmenter le score pour les tâches avec des tags indiquant de l'impact
  const impactTags = ["Important", "Urgent", "Client", "Production", "Livraison"];
  if (task.tags && task.tags.some(tag => impactTags.includes(tag))) {
    score += 0.1;
  }
  
  // Limiter le score à 1.0
  return Math.min(1.0, score);
}

/**
 * Calcule les métriques de productivité
 */
export function calculateProductivityMetrics(outcomes: TaskOutcome[]): ProductivityMetrics {
  if (outcomes.length === 0) {
    return {
      period: {
        start: new Date(),
        end: new Date()
      },
      tangibleTasksCompleted: 0,
      avgEffortPerImpact: 0,
      completionRate: 0,
      avgTimeToResult: 0
    };
  }
  
  // Période couverte
  const start = new Date(Math.min(...outcomes.map(o => o.completedAt?.getTime() || Date.now())));
  const end = new Date(Math.max(...outcomes.map(o => o.completedAt?.getTime() || Date.now())));
  
  // Nombre de tâches tangibles terminées
  const tangibleTasksCompleted = outcomes.filter(o => o.impactScore > 0.5).length;
  
  // Ratio effort/impact moyen
  const avgEffortPerImpact = outcomes.reduce((sum, outcome) => {
    return sum + (outcome.effortCost / Math.max(0.1, outcome.impactScore));
  }, 0) / outcomes.length;
  
  // Taux de complétion
  const completionRate = outcomes.filter(o => o.completedAt !== undefined).length / outcomes.length;
  
  // Temps moyen jusqu'au résultat
  const avgTimeToResult = outcomes.reduce((sum, outcome) => {
    return sum + (outcome.effortCost * 30); // Approximation: 30 min par unité d'effort
  }, 0) / outcomes.length;
  
  return {
    period: { start, end },
    tangibleTasksCompleted,
    avgEffortPerImpact,
    completionRate,
    avgTimeToResult
  };
}