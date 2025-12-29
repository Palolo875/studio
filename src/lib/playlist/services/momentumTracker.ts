/**
 * Service de suivi du momentum pour l'algorithme de playlist SOTA
 * Suit l'efficacité passée des tâches pour prédire le momentum futur
 */

import { createLogger } from '@/lib/logger';

const logger = createLogger('MomentumTracker');

// Définition minimale du type Task pour éviter les problèmes d'importation
interface Task {
  id: string;
  name?: string;
  tags?: string[];
  estimatedDuration?: number;
  effort?: string;
  completedAt?: string;
  lastAccessed?: string;
  completionRate?: number;
}

export interface MomentumData {
  taskId: string;
  completionSpeed: number; // Rapport entre temps estimé et temps réel
  efficiencyScore: number; // Score d'efficacité (0-100)
  completionConsistency: number; // Consistance de complétion (0-100)
}

export class MomentumTracker {
  private momentumCache: Map<string, MomentumData> = new Map();
  private userHistory: Task[] = [];

  constructor(userHistory: Task[] = []) {
    this.userHistory = userHistory;
    this.initializeMomentumData();
  }

  /**
   * Initialise les données de momentum à partir de l'historique
   */
  private initializeMomentumData(): void {
    this.userHistory.forEach(task => {
      const momentumData = this.calculateMomentumData(task);
      if (momentumData) {
        this.momentumCache.set(task.id, momentumData);
      }
    });
  }

  /**
   * Calcule les données de momentum pour une tâche
   */
  private calculateMomentumData(task: Task): MomentumData | null {
    if (!task.completedAt || !task.estimatedDuration) {
      return null;
    }

    try {
      // Calculer le temps réel pris
      const createdAt = new Date(task.lastAccessed || new Date().toISOString());
      const completedAt = new Date(task.completedAt);
      const actualMinutes = (completedAt.getTime() - createdAt.getTime()) / (1000 * 60);

      // Calculer la vitesse de complétion
      const completionSpeed = task.estimatedDuration > 0 
        ? actualMinutes / task.estimatedDuration 
        : 1;

      // Calculer le score d'efficacité (plus c'est bas, mieux c'est)
      let efficiencyScore = 100;
      if (completionSpeed > 1) {
        // En retard : score bas
        efficiencyScore = Math.max(0, 100 - (completionSpeed - 1) * 50);
      } else if (completionSpeed < 1) {
        // En avance : bonus
        efficiencyScore = Math.min(100, 100 + (1 - completionSpeed) * 20);
      }

      // Calculer la consistance de complétion
      const completionConsistency = task.completionRate || 0;

      return {
        taskId: task.id,
        completionSpeed,
        efficiencyScore,
        completionConsistency
      };
    } catch (error) {
      logger.warn('Erreur lors du calcul du momentum pour la tâche', { taskId: task.id, error });
      return null;
    }
  }

  /**
   * Obtient le momentum pour une tâche spécifique
   */
  getMomentumForTask(taskId: string): MomentumData | null {
    return this.momentumCache.get(taskId) || null;
  }

  /**
   * Obtient le momentum moyen pour un ensemble de tags
   */
  getAverageMomentumForTags(tags: string[]): number {
    if (tags.length === 0) return 50; // Score neutre par défaut

    const matchingTasks = Array.from(this.momentumCache.values()).filter(data => {
      const task = this.userHistory.find(t => t.id === data.taskId);
      if (!task || !task.tags) return false;
      
      return tags.some(tag => task.tags?.includes(tag));
    });

    if (matchingTasks.length === 0) return 50;

    // Calculer la moyenne des scores d'efficacité
    const totalEfficiency = matchingTasks.reduce((sum, data) => sum + data.efficiencyScore, 0);
    return totalEfficiency / matchingTasks.length;
  }

  /**
   * Prédit le momentum futur pour une nouvelle tâche basée sur ses tags
   */
  predictMomentumForNewTask(taskTags: string[]): number {
    if (!taskTags.length) return 50; // Score neutre par défaut

    // Trouver les tâches similaires dans l'historique
    const similarTasks = this.userHistory.filter(task => {
      if (!task.tags) return false;
      
      const commonTags = task.tags.filter(tag => taskTags.includes(tag));
      return commonTags.length > 0;
    });

    if (similarTasks.length === 0) return 50;

    // Calculer le momentum moyen des tâches similaires
    const momentumSum = similarTasks.reduce((sum, task) => {
      const momentum = this.getMomentumForTask(task.id);
      return sum + (momentum ? momentum.efficiencyScore : 50);
    }, 0);

    return momentumSum / similarTasks.length;
  }

  /**
   * Met à jour le momentum après la complétion d'une tâche
   */
  updateMomentumAfterCompletion(task: Task): void {
    const momentumData = this.calculateMomentumData(task);
    if (momentumData) {
      this.momentumCache.set(task.id, momentumData);
    }
  }

  /**
   * Obtient les tâches avec le meilleur momentum
   */
  getTopMomentumTasks(limit: number = 5): MomentumData[] {
    return Array.from(this.momentumCache.values())
      .sort((a, b) => b.efficiencyScore - a.efficiencyScore)
      .slice(0, limit);
  }

  /**
   * Obtient les statistiques globales du momentum
   */
  getMomentumStatistics(): {
    averageEfficiency: number;
    totalTrackedTasks: number;
    highPerformers: number; // Tâches avec efficiency > 80
    lowPerformers: number;  // Tâches avec efficiency < 30
  } {
    const allData = Array.from(this.momentumCache.values());
    
    if (allData.length === 0) {
      return {
        averageEfficiency: 50,
        totalTrackedTasks: 0,
        highPerformers: 0,
        lowPerformers: 0
      };
    }

    const totalEfficiency = allData.reduce((sum, data) => sum + data.efficiencyScore, 0);
    const averageEfficiency = totalEfficiency / allData.length;
    
    const highPerformers = allData.filter(data => data.efficiencyScore > 80).length;
    const lowPerformers = allData.filter(data => data.efficiencyScore < 30).length;

    return {
      averageEfficiency,
      totalTrackedTasks: allData.length,
      highPerformers,
      lowPerformers
    };
  }
}