// Système de retour sans punition - Phase 3.8
import { Task } from './types';
import { InactivityState, ReturnSession } from './abandonmentDetection';
import { createLogger } from '@/lib/logger';

const logger = createLogger('ZeroPunishmentReturn');

/**
 * Politique de traitement des tâches anciennes
 */
export interface TaskAgingPolicy {
  staleThresholdDays: number; // Seuil pour considérer une tâche comme ancienne
  maxStaleTasksToShow: number; // Nombre maximum de tâches anciennes à montrer
}

/**
 * État d'une tâche vieillissante
 */
export interface TaskAging {
  taskId: string;
  ageDays: number;
  status: "ACTIVE" | "STALE";
}

/**
 * Gestionnaire de retour sans punition
 */
export class ZeroPunishmentReturnManager {
  private taskAgingPolicy: TaskAgingPolicy;
  
  constructor(policy?: TaskAgingPolicy) {
    this.taskAgingPolicy = policy || {
      staleThresholdDays: 14,
      maxStaleTasksToShow: 5
    };
  }
  
  /**
   * Réinitialise les drapeaux de retard lors du retour
   */
  resetOverdueFlags(tasks: Task[]): Task[] {
    logger.debug('Reset overdue flags', { taskCount: tasks.length });
    
    // Créer une copie des tâches avec les drapeaux réinitialisés
    return tasks.map(task => {
      // Ne pas modifier les tâches déjà terminées
      if (task.status === 'done') {
        return task;
      }
      
      // Réinitialiser les propriétés liées au retard
      return {
        ...task,
        // Note: Dans une implémentation complète, cela dépendrait des propriétés réelles du modèle Task
      };
    });
  }
  
  /**
   * Recalcule le contexte du jour
   */
  recalculateTodayContext(): any {
    logger.debug('Recalculate today context');
    
    // Dans une implémentation complète, cela recalculerait:
    // - L'énergie disponible
    // - Le temps disponible
    // - Les priorités du jour
    // - Les contraintes temporelles
    
    return {
      energy: "medium", // Valeur par défaut
      availableTime: 120, // 2 heures par défaut
      timeOfDay: "morning", // Valeur par défaut
      currentTime: new Date()
    };
  }
  
  /**
   * Met à jour l'état des tâches selon leur ancienneté
   */
  updateTaskAging(tasks: Task[]): { updatedTasks: Task[], agingInfo: TaskAging[] } {
    const now = new Date();
    const agingInfo: TaskAging[] = [];
    const updatedTasks: Task[] = [];
    
    for (const task of tasks) {
      // Calculer l'âge de la tâche
      let lastInteractionDate: Date;
      
      if (task.lastActivated) {
        lastInteractionDate = new Date(task.lastActivated);
      } else {
        // Si pas d'interaction enregistrée, utiliser la date de création
        lastInteractionDate = new Date(task.createdAt);
      }
      
      const diffTime = Math.abs(now.getTime() - lastInteractionDate.getTime());
      const ageDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // Créer l'information de vieillissement
      const aging: TaskAging = {
        taskId: task.id,
        ageDays,
        status: ageDays > this.taskAgingPolicy.staleThresholdDays ? "STALE" : "ACTIVE"
      };
      
      agingInfo.push(aging);
      
      // Mettre à jour la tâche si nécessaire
      const updatedTask = { ...task };
      // Note: Dans une implémentation complète, on pourrait ajouter des propriétés
      // pour indiquer que la tâche est ancienne mais toujours pertinente
      
      updatedTasks.push(updatedTask);
    }
    
    logger.debug('Task aging updated', { taskCount: tasks.length });
    return { updatedTasks, agingInfo };
  }
  
  /**
   * Filtre les tâches pour ne montrer que celles pertinentes au retour
   */
  filterTasksForReturn(tasks: Task[]): Task[] {
    const { updatedTasks, agingInfo } = this.updateTaskAging(tasks);
    
    // Séparer les tâches actives des tâches anciennes
    const activeTasks = updatedTasks.filter(task => {
      const aging = agingInfo.find(a => a.taskId === task.id);
      return aging?.status === "ACTIVE";
    });
    
    const staleTasks = updatedTasks.filter(task => {
      const aging = agingInfo.find(a => a.taskId === task.id);
      return aging?.status === "STALE";
    });
    
    // Limiter le nombre de tâches anciennes à montrer
    const limitedStaleTasks = staleTasks.slice(0, this.taskAgingPolicy.maxStaleTasksToShow);
    
    // Combiner les tâches actives et un nombre limité de tâches anciennes
    const filteredTasks = [...activeTasks, ...limitedStaleTasks];
    
    logger.debug('Tasks filtered for return', { activeCount: activeTasks.length, staleCount: limitedStaleTasks.length });
    return filteredTasks;
  }
  
  /**
   * Génère un message de retour approprié
   */
  generateReturnMessage(inactivityState: InactivityState): string {
    const days = inactivityState.inactivityDurationDays;
    
    if (days === 0) {
      return "Bienvenue ! Voici ce qui existe. On décide maintenant.";
    } else if (days <= 3) {
      return "Bon retour ! Voici ce qui existe. On décide maintenant.";
    } else if (days <= 7) {
      return "Ça fait plaisir de te revoir ! Voici ce qui existe. On décide maintenant.";
    } else {
      return "Bienvenue de retour ! Voici ce qui existe. On décide maintenant.";
    }
  }
  
  /**
   * Génère un message pour les tâches anciennes
   */
  generateStaleTaskMessage(staleCount: number): string {
    if (staleCount === 0) {
      return "";
    } else if (staleCount === 1) {
      return "Cette tâche existe toujours. On pourra la revoir plus tard.";
    } else {
      return `Ces ${staleCount} tâches existent toujours. On pourra les revoir plus tard.`;
    }
  }
}

// Instance singleton pour la gestion du retour sans punition
export const returnManager = new ZeroPunishmentReturnManager();

/**
 * Prépare une session de retour productive immédiate
 */
export function prepareImmediateReturnSession(tasks: Task[]): { 
  session: ReturnSession, 
  filteredTasks: Task[], 
  message: string,
  staleMessage: string
} {
  // Préparer la session de retour
  const session: ReturnSession = {
    mode: "RECOVERY",
    maxTasks: 2, // Maximum 2 tâches pour commencer
    explanationLevel: "MINIMAL", // Explications minimales
    timestamp: new Date()
  };
  
  // Filtrer les tâches pour le retour
  const filteredTasks = returnManager.filterTasksForReturn(tasks);
  
  // Générer les messages appropriés
  // Note: Pour cet exemple, nous simulons un état d'inactivité
  const mockInactivityState: InactivityState = {
    lastUserActionAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 jours d'inactivité
    inactivityDurationDays: 5,
    status: "PAUSED"
  };
  
  const message = returnManager.generateReturnMessage(mockInactivityState);
  
  // Compter les tâches anciennes
  const { agingInfo } = returnManager.updateTaskAging(tasks);
  const staleCount = agingInfo.filter(a => a.status === "STALE").length;
  const staleMessage = returnManager.generateStaleTaskMessage(staleCount);
  
  return {
    session,
    filteredTasks,
    message,
    staleMessage
  };
}

/**
 * Applique la politique de retour complète
 */
export function applyFullReturnPolicy(tasks: Task[]): { 
  updatedTasks: Task[], 
  session: ReturnSession, 
  message: string 
} {
  logger.info('Apply full return policy', { taskCount: tasks.length });
  
  // Réinitialiser les drapeaux de retard
  const tasksWithoutOverdue = returnManager.resetOverdueFlags(tasks);
  
  // Recalculer le contexte du jour
  const todayContext = returnManager.recalculateTodayContext();
  
  // Préparer la session de retour
  const { session, filteredTasks, message } = prepareImmediateReturnSession(tasksWithoutOverdue);
  
  return {
    updatedTasks: filteredTasks,
    session,
    message
  };
}