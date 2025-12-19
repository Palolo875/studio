// Gestionnaire de fenêtre active pour le Cerveau de KairuFlow - Phase 1
import { Task } from './types';

/**
 * État d'une tâche active
 */
export type TaskActiveStatus = 
  | 'active'     // Tâche active
  | 'frozen'     // Tâche gelée
  | 'inactive';  // Tâche inactive

/**
 * Gestionnaire de fenêtre active
 */
export interface ActiveWindowManager {
  /** Tâches actives */
  activeTasks: Task[];
  /** Tâches gelées */
  frozenTasks: Task[];
  /** Limite maximale de tâches actives */
  maxActiveTasks: number;
  /** Date de la dernière mise à jour */
  lastUpdated: Date;
}

/**
 * Crée un gestionnaire de fenêtre active
 * @param maxActiveTasks Limite maximale de tâches actives (par défaut 10)
 * @returns Gestionnaire de fenêtre active
 */
export function createActiveWindowManager(maxActiveTasks: number = 10): ActiveWindowManager {
  return {
    activeTasks: [],
    frozenTasks: [],
    maxActiveTasks,
    lastUpdated: new Date()
  };
}

/**
 * Détermine si une tâche devient active
 * @param task Tâche à évaluer
 * @param action Action de l'utilisateur
 * @param today Date d'aujourd'hui
 * @returns Booléen indiquant si la tâche devient active
 */
export function shouldActivateTask(
  task: Task,
  action: 'user_clicked_start' | 'auto_activation' | 'none',
  today: Date = new Date()
): boolean {
  // Si l'utilisateur a explicitement cliqué sur "Start"
  if (action === 'user_clicked_start') {
    return true;
  }
  
  // Activation automatique si la tâche a été créée aujourd'hui
  if (action === 'auto_activation') {
    // Vérifier si la tâche a été créée aujourd'hui
    if (task.completionHistory.length > 0) {
      const creationDate = task.completionHistory[0].date;
      return creationDate.toDateString() === today.toDateString();
    }
  }
  
  return false;
}

/**
 * Active une tâche
 * @param task Tâche à activer
 * @param manager Gestionnaire de fenêtre active
 * @returns Gestionnaire mis à jour
 */
export function activateTask(task: Task, manager: ActiveWindowManager): ActiveWindowManager {
  // Vérifier si la tâche est déjà active
  if (manager.activeTasks.some(t => t.id === task.id)) {
    return manager;
  }
  
  // Vérifier si la tâche est gelée et la retirer du tableau des gelées
  const frozenTasks = manager.frozenTasks.filter(t => t.id !== task.id);
  
  // Ajouter la tâche aux tâches actives
  const activeTasks = [...manager.activeTasks, task];
  
  // Vérifier si nous avons dépassé la limite
  if (activeTasks.length > manager.maxActiveTasks) {
    // Geler la tâche la plus ancienne (celle avec la date de dernière activation la plus ancienne)
    const oldestTask = activeTasks.reduce((oldest, current) => {
      const oldestLastActivated = oldest.completionHistory.length > 0 
        ? oldest.completionHistory[oldest.completionHistory.length - 1].date 
        : new Date(0);
      const currentLastActivated = current.completionHistory.length > 0 
        ? current.completionHistory[current.completionHistory.length - 1].date 
        : new Date(0);
      
      return oldestLastActivated < currentLastActivated ? oldest : current;
    });
    
    // Retirer la tâche gelée des tâches actives
    const updatedActiveTasks = activeTasks.filter(t => t.id !== oldestTask.id);
    
    // Ajouter la tâche gelée au tableau des tâches gelées
    const updatedFrozenTasks = [...frozenTasks, {
      ...oldestTask,
      // Ajouter une propriété pour indiquer qu'elle est gelée (simulée car pas dans le type Task)
    }];
    
    return {
      activeTasks: updatedActiveTasks,
      frozenTasks: updatedFrozenTasks,
      maxActiveTasks: manager.maxActiveTasks,
      lastUpdated: new Date()
    };
  }
  
  return {
    activeTasks,
    frozenTasks,
    maxActiveTasks: manager.maxActiveTasks,
    lastUpdated: new Date()
  };
}

/**
 * Gèle une tâche
 * @param task Tâche à geler
 * @param manager Gestionnaire de fenêtre active
 * @returns Gestionnaire mis à jour
 */
export function freezeTask(task: Task, manager: ActiveWindowManager): ActiveWindowManager {
  // Vérifier si la tâche est déjà gelée
  if (manager.frozenTasks.some(t => t.id === task.id)) {
    return manager;
  }
  
  // Retirer la tâche des tâches actives
  const activeTasks = manager.activeTasks.filter(t => t.id !== task.id);
  
  // Ajouter la tâche aux tâches gelées
  const frozenTasks = [...manager.frozenTasks, task];
  
  return {
    activeTasks,
    frozenTasks,
    maxActiveTasks: manager.maxActiveTasks,
    lastUpdated: new Date()
  };
}

/**
 * Dégèle une tâche
 * @param task Tâche à dégeler
 * @param manager Gestionnaire de fenêtre active
 * @returns Gestionnaire mis à jour
 */
export function unfreezeTask(task: Task, manager: ActiveWindowManager): ActiveWindowManager {
  // Vérifier si la tâche est gelée
  if (!manager.frozenTasks.some(t => t.id === task.id)) {
    return manager;
  }
  
  // Retirer la tâche des tâches gelées
  const frozenTasks = manager.frozenTasks.filter(t => t.id !== task.id);
  
  // Ajouter la tâche aux tâches actives (si la limite n'est pas dépassée)
  let activeTasks = manager.activeTasks;
  if (activeTasks.length < manager.maxActiveTasks) {
    activeTasks = [...activeTasks, task];
  }
  
  return {
    activeTasks,
    frozenTasks,
    maxActiveTasks: manager.maxActiveTasks,
    lastUpdated: new Date()
  };
}

/**
 * Met à jour le gestionnaire de fenêtre active
 * @param tasks Tâches à gérer
 * @param manager Gestionnaire de fenêtre active
 * @param userActions Actions de l'utilisateur
 * @returns Gestionnaire mis à jour
 */
export function updateActiveWindow(
  tasks: Task[],
  manager: ActiveWindowManager,
  userActions: { taskId: string; action: 'start' | 'freeze' | 'unfreeze' }[] = []
): ActiveWindowManager {
  let updatedManager = { ...manager };
  
  // Traiter les actions de l'utilisateur
  for (const userAction of userActions) {
    const task = tasks.find(t => t.id === userAction.taskId);
    if (!task) continue;
    
    switch (userAction.action) {
      case 'start':
        updatedManager = activateTask(task, updatedManager);
        break;
      case 'freeze':
        updatedManager = freezeTask(task, updatedManager);
        break;
      case 'unfreeze':
        updatedManager = unfreezeTask(task, updatedManager);
        break;
    }
  }
  
  // Vérifier si nous avons besoin de geler automatiquement des tâches
  if (updatedManager.activeTasks.length > updatedManager.maxActiveTasks) {
    // Geler les tâches les plus anciennes jusqu'à respecter la limite
    const excessCount = updatedManager.activeTasks.length - updatedManager.maxActiveTasks;
    
    // Trier les tâches actives par date de dernière activation (les plus anciennes en premier)
    const sortedActiveTasks = [...updatedManager.activeTasks].sort((a, b) => {
      const dateA = a.completionHistory.length > 0 
        ? a.completionHistory[a.completionHistory.length - 1].date 
        : new Date(0);
      const dateB = b.completionHistory.length > 0 
        ? b.completionHistory[b.completionHistory.length - 1].date 
        : new Date(0);
      return dateA.getTime() - dateB.getTime();
    });
    
    // Geler les tâches excédentaires
    const tasksToFreeze = sortedActiveTasks.slice(0, excessCount);
    const tasksToKeep = sortedActiveTasks.slice(excessCount);
    
    // Mettre à jour le gestionnaire
    updatedManager = {
      activeTasks: tasksToKeep,
      frozenTasks: [...updatedManager.frozenTasks, ...tasksToFreeze],
      maxActiveTasks: updatedManager.maxActiveTasks,
      lastUpdated: new Date()
    };
  }
  
  return updatedManager;
}

/**
 * Obtient le statut d'une tâche
 * @param task Tâche à vérifier
 * @param manager Gestionnaire de fenêtre active
 * @returns Statut de la tâche
 */
export function getTaskStatus(task: Task, manager: ActiveWindowManager): TaskActiveStatus {
  if (manager.activeTasks.some(t => t.id === task.id)) {
    return 'active';
  }
  
  if (manager.frozenTasks.some(t => t.id === task.id)) {
    return 'frozen';
  }
  
  return 'inactive';
}

/**
 * Compte les tâches actives
 * @param manager Gestionnaire de fenêtre active
 * @returns Nombre de tâches actives
 */
export function countActiveTasks(manager: ActiveWindowManager): number {
  return manager.activeTasks.length;
}

/**
 * Génère un message pour l'utilisateur concernant l'état de la fenêtre active
 * @param manager Gestionnaire de fenêtre active
 * @returns Message pour l'utilisateur
 */
export function generateActiveWindowMessage(manager: ActiveWindowManager): string {
  const activeCount = manager.activeTasks.length;
  const frozenCount = manager.frozenTasks.length;
  const maxCount = manager.maxActiveTasks;
  
  if (activeCount > maxCount) {
    return `Tu as ${activeCount} tâches actives. J'ai gelé les ${frozenCount} plus anciennes. Tu peux les dégeler manuellement si elles sont vraiment prioritaires.`;
  }
  
  if (activeCount === maxCount) {
    return `Tu as atteint la limite de ${maxCount} tâches actives. Termine-en quelques-unes avant d'en ajouter de nouvelles.`;
  }
  
  return `Tu as ${activeCount}/${maxCount} tâches actives. ${frozenCount} tâches sont gelées.`;
}
