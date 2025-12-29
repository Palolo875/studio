// Système de ré-entrée productive immédiate - Phase 3.8
import { Task } from './types';
import { ReturnSession } from './abandonmentDetection';
import { TaskOutcome } from './taskOutcome';
import { createLogger } from '@/lib/logger';

const logger = createLogger('ImmediateReentry');

/**
 * Résultat d'une session de ré-entrée
 */
export interface ReentryResult {
  session: ReturnSession;
  immediateTasks: Task[];
  quickWins: Task[];
  estimatedCompletionTime: number; // En minutes
  message: string;
}

/**
 * Critères pour les victoires rapides
 */
export interface QuickWinCriteria {
  maxDurationMinutes: number; // Durée maximale
  maxEffort: 'low' | 'medium'; // Niveau d'effort maximum
  requiresResult: boolean; // Doit produire un résultat tangible
}

/**
 * Gestionnaire de ré-entrée productive immédiate
 */
export class ImmediateReentryManager {
  private quickWinCriteria: QuickWinCriteria;
  
  constructor(criteria?: QuickWinCriteria) {
    this.quickWinCriteria = criteria || {
      maxDurationMinutes: 15,
      maxEffort: 'low',
      requiresResult: true
    };
  }
  
  /**
   * Identifie les tâches à résultat rapide
   */
  identifyQuickWins(tasks: Task[]): Task[] {
    return tasks.filter(task => {
      // Vérifier que la tâche n'est pas déjà terminée
      if (task.status === 'done') {
        return false;
      }
      
      // Vérifier la durée
      if (task.duration > this.quickWinCriteria.maxDurationMinutes) {
        return false;
      }
      
      // Vérifier l'effort
      if (task.effort === 'high') {
        return false;
      }
      if (task.effort === 'medium' && this.quickWinCriteria.maxEffort === 'low') {
        return false;
      }
      
      // Vérifier si un résultat tangible est requis
      if (this.quickWinCriteria.requiresResult) {
        if (!task.hasTangibleResult) {
          return false;
        }
      }
      
      return true;
    });
  }
  
  /**
   * Prépare une session de ré-entrée ultra-légère
   */
  prepareUltraLightSession(tasks: Task[]): ReentryResult {
    // Créer une session de retour
    const session: ReturnSession = {
      mode: "RECOVERY",
      maxTasks: 2, // Maximum 2 tâches
      explanationLevel: "MINIMAL", // Explications minimales
      timestamp: new Date()
    };
    
    // Identifier les victoires rapides
    const quickWins = this.identifyQuickWins(tasks);
    
    // Sélectionner les tâches immédiates (maximum 2)
    const immediateTasks = quickWins.slice(0, session.maxTasks);
    
    // Estimer le temps de complétion
    const estimatedCompletionTime = immediateTasks.reduce((total, task) => {
      return total + (task.duration || 0);
    }, 0);
    
    // Générer un message approprié
    let message: string;
    if (immediateTasks.length === 0) {
      message = "Aucune tâche immédiate disponible. Choisissez parmi les suggestions.";
    } else if (immediateTasks.length === 1) {
      message = "Voici une tâche faisable immédiatement.";
    } else {
      message = `Voici ${immediateTasks.length} tâches faisables immédiatement.`;
    }
    
    logger.debug('Session préparée', { immediateTasksCount: immediateTasks.length });
    
    return {
      session,
      immediateTasks,
      quickWins,
      estimatedCompletionTime,
      message
    };
  }
  
  /**
   * Optimise l'ordre des tâches pour la ré-entrée
   */
  optimizeTaskOrder(tasks: Task[]): Task[] {
    // Trier par urgence puis par effort croissant
    return [...tasks].sort((a, b) => {
      // Urgence : urgent > high > medium > low
      const urgencyOrder: Record<string, number> = { urgent: 4, high: 3, medium: 2, low: 1 };
      const urgencyDiff = (urgencyOrder[b.urgency] || 0) - (urgencyOrder[a.urgency] || 0);
      
      if (urgencyDiff !== 0) {
        return urgencyDiff;
      }
      
      // Effort : low < medium < high
      const effortOrder: Record<string, number> = { low: 1, medium: 2, high: 3 };
      return (effortOrder[a.effort] || 0) - (effortOrder[b.effort] || 0);
    });
  }
  
  /**
   * Génère des suggestions de démarrage
   */
  generateStartSuggestions(tasks: Task[]): string[] {
    const suggestions: string[] = [];
    
    if (tasks.length === 0) {
      suggestions.push("Commencez par une tâche toute simple, même petite.");
      suggestions.push("Prenez 2 minutes pour noter une idée.");
      return suggestions;
    }
    
    const firstTask = tasks[0];
    suggestions.push(`Commencez par : "${firstTask.title}"`);
    
    if (tasks.length > 1) {
      const secondTask = tasks[1];
      suggestions.push(`Ou essayez : "${secondTask.title}"`);
    }
    
    suggestions.push("Concentrez-vous sur l'action, pas la perfection.");
    suggestions.push("2 minutes suffisent pour commencer.");
    
    return suggestions;
  }
}

// Instance singleton pour la gestion de la ré-entrée immédiate
export const reentryManager = new ImmediateReentryManager();

/**
 * Exécute une ré-entrée productive immédiate complète
 */
export function executeImmediateReentry(allTasks: Task[]): ReentryResult {
  logger.info("Exécution d'une ré-entrée productive immédiate");
  
  // Optimiser l'ordre des tâches
  const orderedTasks = reentryManager.optimizeTaskOrder(allTasks);
  
  // Préparer la session ultra-légère
  const result = reentryManager.prepareUltraLightSession(orderedTasks);
  
  return result;
}

/**
 * Intègre la ré-entrée immédiate dans le flux décisionnel
 */
export class ReentryIntegrator {
  private reentryManager: ImmediateReentryManager;
  
  constructor() {
    this.reentryManager = reentryManager;
  }
  
  /**
   * Adapte les décisions pour la ré-entrée
   */
  adaptDecisionForReentry(tasks: Task[]): { adaptedTasks: Task[], reentryResult: ReentryResult } {
    // Exécuter la ré-entrée immédiate
    const reentryResult = executeImmediateReentry(tasks);
    
    // Adapter les tâches en fonction des résultats
    const adaptedTasks = reentryResult.immediateTasks.map(task => ({
      ...task,
      selectionReason: "Sélectionnée pour ré-entrée productive immédiate"
    }));
    
    logger.debug('Décision adaptée pour ré-entrée', { adaptedTasksCount: adaptedTasks.length });
    
    return {
      adaptedTasks,
      reentryResult
    };
  }
  
  /**
   * Génère un rapport de ré-entrée
   */
  generateReentryReport(result: ReentryResult): string {
    let report = "=== RAPPORT DE RÉ-ENTRÉE PRODUCTIVE IMMÉDIATE ===\n\n";
    
    report += `Session créée à: ${result.session.timestamp.toLocaleTimeString()}\n`;
    report += `Mode: ${result.session.mode}\n`;
    report += `Tâches immédiates: ${result.immediateTasks.length}\n`;
    report += `Temps estimé: ${result.estimatedCompletionTime} minutes\n\n`;
    
    report += "MESSAGE:\n";
    report += `${result.message}\n\n`;
    
    if (result.immediateTasks.length > 0) {
      report += "TÂCHES IMMÉDIATES:\n";
      for (const task of result.immediateTasks) {
        report += `- ${task.title} (${task.duration || 0} min, effort: ${task.effort || 'N/A'})\n`;
      }
    }
    
    return report;
  }
}