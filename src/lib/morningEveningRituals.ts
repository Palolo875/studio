/**
 * RITUÉLS MATIN / SOIR - KairuFlow Phase 1
 * Checkpoints système, pas routines de vie
 */

import { TaskWithContext } from './types';

export interface MorningRitualResult {
  selectedTaskId: string | null;
  timestamp: Date;
  skipped: boolean;
}

export interface EveningRitualResult {
  executedTasks: string[]; // IDs des tâches exécutées
  skippedTasks: string[];  // IDs des tâches non exécutées
  timestamp: Date;
  skipped: boolean;
}

/**
 * Rituel du matin - Recalage décisionnel, pas motivation
 * Optionnel, ≤ 2 minutes, une seule question possible
 */
export class MorningRitual {
  private static readonly MAX_DURATION_MS = 2 * 60 * 1000; // 2 minutes

  /**
   * Exécute le rituel du matin
   * @param availableTasks Tâches disponibles pour la journée
   * @returns Résultat du rituel ou null si sauté
   */
  public static execute(availableTasks: TaskWithContext[]): MorningRitualResult | null {
    // Peut être sauté sans trace
    if (this.shouldSkip()) {
      return {
        selectedTaskId: null,
        timestamp: new Date(),
        skipped: true
      };
    }

    // Seulement une question possible : "Quelle tâche mérite d'exister maintenant ?"
    const startTime = Date.now();
    const selectedTask = this.selectMostRelevantTask(availableTasks);
    const executionTime = Date.now() - startTime;

    // Limite de 2 minutes
    if (executionTime > this.MAX_DURATION_MS) {
      console.warn('Rituel du matin dépassé la limite de 2 minutes');
    }

    return {
      selectedTaskId: selectedTask?.id || null,
      timestamp: new Date(),
      skipped: false
    };
  }

  /**
   * Détermine si le rituel doit être sauté
   * Basé sur des heuristiques objectives
   */
  private static shouldSkip(): boolean {
    const now = new Date();
    const hour = now.getHours();

    // Sauter si très tôt ou très tard
    if (hour < 5 || hour > 12) {
      return true;
    }

    // Sauter si l'utilisateur a désactivé explicitement
    // (à implémenter selon les préférences utilisateur)
    
    return false;
  }

  /**
   * Sélectionne la tâche qui "mérite d'exister maintenant"
   * Basé sur des critères objectifs, pas subjectifs
   */
  private static selectMostRelevantTask(tasks: TaskWithContext[]): TaskWithContext | null {
    if (tasks.length === 0) {
      return null;
    }

    // Priorité aux tâches avec échéance expirée (OVERDUE)
    const overdueTasks = tasks.filter(task => task.pool === 'OVERDUE');
    if (overdueTasks.length > 0) {
      // Parmi les tâches expirées, prendre celle avec la durée la plus courte (quick win potentielle)
      return overdueTasks.reduce((closest, task) => 
        task.duration < closest.duration ? task : closest
      );
    }

    // Ensuite, les tâches pour aujourd'hui
    const todayTasks = tasks.filter(task => task.pool === 'TODAY');
    if (todayTasks.length > 0) {
      return todayTasks.reduce((closest, task) => 
        task.duration < closest.duration ? task : closest
      );
    }

    // Sinon, une tâche avec une deadline proche
    const soonTasks = tasks.filter(task => task.pool === 'SOON');
    if (soonTasks.length > 0) {
      return soonTasks.reduce((closest, task) => 
        task.duration < closest.duration ? task : closest
      );
    }

    // Enfin, une tâche disponible avec une courte durée
    return tasks.reduce((closest, task) => 
      task.duration < closest.duration ? task : closest
    );
  }
}

/**
 * Rituel du soir - Constat, pas bilan
 * Une seule chose observée : exécuté / non exécuté
 */
export class EveningRitual {
  /**
   * Exécute le rituel du soir
   * @param scheduledTasks Tâches prévues pour la journée
   * @param completedTaskIds IDs des tâches complétées
   * @returns Résultat du rituel ou null si sauté
   */
  public static execute(
    scheduledTasks: TaskWithContext[], 
    completedTaskIds: string[]
  ): EveningRitualResult | null {
    // Peut être sauté sans trace
    if (this.shouldSkip()) {
      return {
        executedTasks: [],
        skippedTasks: [],
        timestamp: new Date(),
        skipped: true
      };
    }

    const scheduledTaskIds = scheduledTasks.map(task => task.id);
    const executedTasks = scheduledTaskIds.filter(id => completedTaskIds.includes(id));
    const skippedTasks = scheduledTaskIds.filter(id => !completedTaskIds.includes(id));

    return {
      executedTasks,
      skippedTasks,
      timestamp: new Date(),
      skipped: false
    };
  }

  /**
   * Détermine si le rituel doit être sauté
   */
  private static shouldSkip(): boolean {
    const now = new Date();
    const hour = now.getHours();

    // Sauter si très tôt ou très tard
    if (hour < 18 || hour > 23) {
      return true;
    }

    // Sauter si l'utilisateur a désactivé explicitement
    // (à implémenter selon les préférences utilisateur)
    
    return false;
  }

  /**
   * Calcule un résumé objectif des résultats
   */
  public static getObjectiveSummary(results: EveningRitualResult): {
    completionRate: number;
    totalTasks: number;
    completedTasks: number;
    missedTasks: number;
  } {
    const total = results.executedTasks.length + results.skippedTasks.length;
    const completed = results.executedTasks.length;
    
    return {
      completionRate: total > 0 ? completed / total : 0,
      totalTasks: total,
      completedTasks: completed,
      missedTasks: results.skippedTasks.length
    };
  }
}

/**
 * Interface pour le gestionnaire de rituels
 */
export interface RitualHandler {
  executeMorningRitual(availableTasks: TaskWithContext[]): MorningRitualResult | null;
  executeEveningRitual(scheduledTasks: TaskWithContext[], completedTaskIds: string[]): EveningRitualResult | null;
  getLastMorningResult(): MorningRitualResult | null;
  getLastEveningResult(): EveningRitualResult | null;
}

/**
 * Gestionnaire par défaut des rituels
 */
export class DefaultRitualHandler implements RitualHandler {
  private lastMorningResult: MorningRitualResult | null = null;
  private lastEveningResult: EveningRitualResult | null = null;

  executeMorningRitual(availableTasks: TaskWithContext[]): MorningRitualResult | null {
    const result = MorningRitual.execute(availableTasks);
    if (result) {
      this.lastMorningResult = result;
    }
    return result;
  }

  executeEveningRitual(scheduledTasks: TaskWithContext[], completedTaskIds: string[]): EveningRitualResult | null {
    const result = EveningRitual.execute(scheduledTasks, completedTaskIds);
    if (result) {
      this.lastEveningResult = result;
    }
    return result;
  }

  getLastMorningResult(): MorningRitualResult | null {
    return this.lastMorningResult;
  }

  getLastEveningResult(): EveningRitualResult | null {
    return this.lastEveningResult;
  }
}

/**
 * Options de configuration des rituels
 */
export interface RitualOptions {
  enableMorningRitual: boolean;
  enableEveningRitual: boolean;
  morningTimeWindow: { start: number; end: number }; // heures 0-24
  eveningTimeWindow: { start: number; end: number }; // heures 0-24
  maxDurationMinutes: number;
}

/**
 * Configuration par défaut
 */
export const DEFAULT_RITUAL_OPTIONS: RitualOptions = {
  enableMorningRitual: true,
  enableEveningRitual: true,
  morningTimeWindow: { start: 5, end: 12 }, // 5h à 12h
  eveningTimeWindow: { start: 18, end: 23 }, // 18h à 23h
  maxDurationMinutes: 2
};