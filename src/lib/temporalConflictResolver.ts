/**
 * RÉSOLUTION DE CONFLITS TEMPORÉLS - KairuFlow Phase 1
 * Algorithme de décomposition adaptative pour les conflits OVERDUE vs SCHEDULED
 */

import { TaskWithContext } from './types';

export interface Resolution {
  type: 'IMPOSSIBLE' | 'SPLIT_PROPOSED' | 'REORDERED' | 'DEFERRED' | 'MANUAL_CHOICE';
  message: string;
  options: Option[];
  autoChunks?: TaskWithContext[];
  suggestedOrder?: string[];
}

export interface Option {
  id: string;
  label: string;
  action: 'start_partial' | 'defer_after' | 'reschedule' | 'accept_split' | 'defer_all' | 'manual' | 'split_and_defer';
}

export interface TemporalConflictContext {
  overdueTask: TaskWithContext;
  scheduledConstraint: {
    taskId: string;
    time: string; // Format HH:MM
    duration: number; // minutes
    startTime: Date;
    endTime: Date;
  };
  availableTime: number; // minutes disponibles avant la contrainte
  currentTime: Date;
}

/**
 * Résout le conflit temporel entre une tâche OVERDUE et une contrainte horaire
 */
export function resolveTemporalConflict(context: TemporalConflictContext): Resolution {
  const { overdueTask, scheduledConstraint, availableTime } = context;
  
  // Vérifier si la tâche est indivisible
  if (isAtomicTask(overdueTask)) {
    // Tâche atomique : impossible de la diviser
    return {
      type: 'IMPOSSIBLE',
      message: (
        `${overdueTask.title} nécessite ${overdueTask.duration} minutes, ` +
        `mais vous avez seulement ${availableTime} minutes avant la réunion à ${scheduledConstraint.time}.`
      ),
      options: [
        {
          id: 'start_partial',
          label: 'Commencer (sera incomplet)',
          action: 'start_partial'
        },
        {
          id: 'defer_after',
          label: `Reporter après ${scheduledConstraint.time}`,
          action: 'defer_after'
        },
        {
          id: 'reschedule',
          label: 'Reprogrammer la réunion', // Honnête mais rare
          action: 'reschedule'
        }
      ]
    };
  }
  
  // Tâche divisible : proposer un découpage
  if (isDivisibleTask(overdueTask)) {
    // Calculer une taille de tranche raisonnable
    const chunkSize = calculateOptimalChunkSize(overdueTask, availableTime);
    
    // Vérifier si la tâche est plus longue que le temps disponible
    if (overdueTask.duration > availableTime) {
      // Proposer de faire une partie maintenant et le reste plus tard
      return {
        type: 'SPLIT_PROPOSED',
        message: (
          `Je peux découper '${overdueTask.title}' : ` +
          `${chunkSize} minutes maintenant, le reste après la réunion.`
        ),
        options: [
          {
            id: 'accept_split',
            label: `Faire ${chunkSize} minutes maintenant`,
            action: 'accept_split'
          },
          {
            id: 'defer_all',
            label: 'Tout reporter après la réunion',
            action: 'defer_all'
          },
          {
            id: 'manual',
            label: 'Je choisis moi-même',
            action: 'manual'
          }
        ],
        autoChunks: [
          {
            ...overdueTask,
            id: `${overdueTask.id}_part1`,
            title: `${overdueTask.title} (1/${Math.ceil(overdueTask.duration / chunkSize)})`,
            duration: chunkSize,
            description: `${overdueTask.description} (Première partie)`
          },
          {
            ...overdueTask,
            id: `${overdueTask.id}_part2`,
            title: `${overdueTask.title} (2/${Math.ceil(overdueTask.duration / chunkSize)})`,
            duration: overdueTask.duration - chunkSize,
            description: `${overdueTask.description} (Suite)`
          }
        ]
      };
    } else {
      // La tâche peut tenir, mais il peut y avoir d'autres raisons de la diviser
      return {
        type: 'REORDERED',
        message: (
          `'${overdueTask.title}' peut tenir avant la réunion, ` +
          `mais une division pourrait optimiser la concentration.`
        ),
        options: [
          {
            id: 'keep_whole',
            label: 'Faire la tâche entière maintenant',
            action: 'manual'
          },
          {
            id: 'split_for_focus',
            label: 'Diviser pour meilleure concentration',
            action: 'accept_split'
          }
        ]
      };
    }
  }
  
  // Cas par défaut : choix manuel
  return {
    type: 'MANUAL_CHOICE',
    message: (
      `Conflit entre la tâche OVERDUE '${overdueTask.title}' ` +
      `et la contrainte horaire à ${scheduledConstraint.time}.`
    ),
    options: [
      {
        id: 'prioritize_scheduled',
        label: 'Respecter la contrainte horaire',
        action: 'defer_after'
      },
      {
        id: 'prioritize_overdue',
        label: 'Traiter la tâche OVERDUE maintenant',
        action: 'start_partial'
      },
      {
        id: 'analyze_further',
        label: 'Voir plus d\'options',
        action: 'manual'
      }
    ]
  };
}

/**
 * Vérifie si une tâche est atomique (indivisible)
 */
function isAtomicTask(task: TaskWithContext): boolean {
  // Une tâche est atomique si elle a un attribut qui l'indique, ou si elle est très courte
  return task.hasOwnProperty('atomic') ? (task as any).atomic : task.duration <= 15;
}

/**
 * Vérifie si une tâche est divisible
 */
function isDivisibleTask(task: TaskWithContext): boolean {
  // Une tâche est divisible si elle n'est pas atomique et qu'elle est suffisamment longue
  return !isAtomicTask(task) && task.duration > 15;
}

/**
 * Calcule la taille optimale d'une tranche
 */
function calculateOptimalChunkSize(task: TaskWithContext, availableTime: number): number {
  // Laisser un peu de marge (10 minutes) pour la transition
  const usableTime = Math.max(5, availableTime - 10);
  
  // Si la tâche peut tenir entièrement avec la marge, la faire entière
  if (task.duration <= usableTime) {
    return task.duration;
  }
  
  // Sinon, prendre une portion raisonnable
  // Idéalement une fraction simple (demi, tiers, quart) ou le temps disponible
  const halfTask = Math.floor(task.duration / 2);
  const thirdTask = Math.floor(task.duration / 3);
  const quarterTask = Math.floor(task.duration / 4);
  
  // Prendre la plus grande portion qui tienne dans le temps disponible
  const candidates = [quarterTask, thirdTask, halfTask, usableTime].filter(size => size > 0);
  return Math.max(...candidates.filter(size => size <= usableTime));
}

/**
 * Vérifie si une journée est impossible (invariant XI)
 */
export function detectImpossibleDay(tasks: TaskWithContext[], availableTime: number): boolean {
  // Calculer le temps total requis pour les tâches d'aujourd'hui
  const totalRequired = tasks
    .filter(task => {
      // Considérer les tâches pour aujourd'hui (TODAY, OVERDUE)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (task.pool === 'OVERDUE') return true;
      if (task.pool === 'TODAY') return true;
      
      // Si la tâche a une deadline aujourd'hui
      if (task.deadline) {
        const deadlineDate = new Date(task.deadline);
        deadlineDate.setHours(0, 0, 0, 0);
        return deadlineDate.getTime() === today.getTime();
      }
      
      return false;
    })
    .reduce((sum, task) => sum + task.duration, 0);
  
  // Si le temps requis dépasse 1.5 fois le temps disponible, c'est impossible
  return totalRequired > availableTime * 1.5;
}

/**
 * Renvoie la résolution de conflit pour une journée impossible
 */
export function resolveImpossibleDay(tasks: TaskWithContext[], availableTime: number): Resolution {
  const totalRequired = tasks
    .filter(task => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (task.pool === 'OVERDUE') return true;
      if (task.pool === 'TODAY') return true;
      
      if (task.deadline) {
        const deadlineDate = new Date(task.deadline);
        deadlineDate.setHours(0, 0, 0, 0);
        return deadlineDate.getTime() === today.getTime();
      }
      
      return false;
    })
    .reduce((sum, task) => sum + task.duration, 0);
  
  return {
    type: 'IMPOSSIBLE',
    message: (
      `Vous avez ${totalRequired} minutes de tâches prévues pour aujourd'hui, ` +
      `mais seulement ${availableTime} minutes disponibles. ` +
      `Le ratio est de ${totalRequired / availableTime:.2f}, ce qui dépasse la limite de 1.5.`
    ),
    options: [
      {
        id: 'forced_triage',
        label: 'Mode triage forcé - Réduction de la charge',
        action: 'manual'
      },
      {
        id: 'reschedule_overdue',
        label: 'Reporter les tâches OVERDUE',
        action: 'defer_after'
      },
      {
        id: 'extend_day',
        label: 'Étendre la journée (ajuster les disponibilités)',
        action: 'manual'
      }
    ]
  };
}

/**
 * Principe de résolution : CRITICAL (scheduled_time) > STRUCTURAL (overdue)
 * → La contrainte physique bat la contrainte cognitive
 * → Mais le système propose des adaptations intelligentes
 */
export const RESOLUTION_PRINCIPLES = {
  physicalConstraintsFirst: true,
  cognitiveConstraintsSecondary: true,
  intelligentAdaptation: true,
  userChoicePreservation: true,
  automaticSolutions: 'suggested_not_forced'
};

/**
 * Interface pour le résolveur de conflits temporels
 */
export interface TemporalConflictResolver {
  resolve(context: TemporalConflictContext): Resolution;
  detectImpossibleDay(tasks: TaskWithContext[], availableTime: number): boolean;
  resolveImpossibleDay(tasks: TaskWithContext[], availableTime: number): Resolution;
}

/**
 * Résolveur par défaut
 */
export class DefaultTemporalConflictResolver implements TemporalConflictResolver {
  resolve(context: TemporalConflictContext): Resolution {
    return resolveTemporalConflict(context);
  }

  detectImpossibleDay(tasks: TaskWithContext[], availableTime: number): boolean {
    return detectImpossibleDay(tasks, availableTime);
  }

  resolveImpossibleDay(tasks: TaskWithContext[], availableTime: number): Resolution {
    return resolveImpossibleDay(tasks, availableTime);
  }
}

/**
 * Options de configuration pour le résolveur
 */
export interface ConflictResolutionOptions {
  enableAutomaticSplitting: boolean;
  minChunkSize: number; // Taille minimale d'une tranche en minutes
  timeBuffer: number; // Marge temporelle en minutes
  prioritizeScheduledTime: boolean;
  suggestAlternativeTimes: boolean;
}

/**
 * Options par défaut
 */
export const DEFAULT_CONFLICT_RESOLUTION_OPTIONS: ConflictResolutionOptions = {
  enableAutomaticSplitting: true,
  minChunkSize: 15,
  timeBuffer: 10,
  prioritizeScheduledTime: true,
  suggestAlternativeTimes: true
};