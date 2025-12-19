// Calculateur du Task Age Index (TAI) pour le Cerveau de KairuFlow - Phase 1
import { Task } from './types';

/**
 * Calcule le Task Age Index (TAI) pour un ensemble de tâches
 * @param tasks Ensemble des tâches
 * @param referenceDate Date de référence (par défaut aujourd'hui)
 * @returns Task Age Index (moyenne des âges des tâches en jours)
 */
export function calculateTaskAgeIndex(tasks: Task[], referenceDate: Date = new Date()): number {
  if (tasks.length === 0) {
    return 0;
  }
  
  // Filtrer les tâches qui ont une date de création
  const tasksWithCreationDate = tasks.filter(task => {
    // Utiliser la date de création si elle existe, sinon utiliser la première entrée de l'historique
    return task.createdAt || (task.completionHistory.length > 0);
  });
  
  if (tasksWithCreationDate.length === 0) {
    return 0;
  }
  
  // Calculer l'âge total de toutes les tâches
  const totalAgeInDays = tasksWithCreationDate.reduce((sum, task) => {
    // Utiliser la date de création si elle existe, sinon utiliser la première entrée de l'historique
    const creationDate = task.createdAt || task.completionHistory[0].date;
    const ageInMs = referenceDate.getTime() - creationDate.getTime();
    const ageInDays = ageInMs / (1000 * 60 * 60 * 24);
    return sum + Math.max(0, ageInDays); // Ne pas compter les âges négatifs
  }, 0);
  
  // Retourner l'âge moyen
  return totalAgeInDays / tasksWithCreationDate.length;
}

/**
 * Détermine si le mode DETOX doit être activé
 * @param taskAgeIndex Task Age Index actuel
 * @param consecutiveDays Nombre de jours consécutifs avec TAI > 2
 * @returns Booléen indiquant si le mode DETOX doit être activé
 */
export function shouldActivateDetoxMode(taskAgeIndex: number, consecutiveDays: number): boolean {
  // Activer le mode DETOX si TAI > 2 pendant 3 jours consécutifs
  return taskAgeIndex > 2 && consecutiveDays >= 3;
}

/**
 * Modes DETOX disponibles
 */
export type DetoxMode = 
  | 'NONE'        // Pas de mode DETOX
  | 'WARNING'     // Avertissement doux
  | 'SUGGESTION'  // Suggestion de revue
  | 'BLOCK';      // Blocage des nouvelles tâches

/**
 * Détermine le mode DETOX approprié
 * @param taskAgeIndex Task Age Index actuel
 * @param consecutiveDays Nombre de jours consécutifs avec TAI > 2
 * @returns Mode DETOX approprié
 */
export function getDetoxMode(taskAgeIndex: number, consecutiveDays: number): DetoxMode {
  if (taskAgeIndex <= 2) {
    return 'NONE';
  }
  
  if (consecutiveDays < 1) {
    return 'WARNING';
  }
  
  if (consecutiveDays < 3) {
    return 'SUGGESTION';
  }
  
  return 'BLOCK';
}

/**
 * Applique les actions du mode DETOX
 * @param tasks Ensemble des tâches
 * @param detoxMode Mode DETOX actuel
 * @returns Actions à prendre
 */
export function applyDetoxActions(tasks: Task[], detoxMode: DetoxMode): {
  frozenSoonTasks: Task[];
  limitedTodayTasks: Task[];
  message: string;
} {
  switch (detoxMode) {
    case 'WARNING':
      return {
        frozenSoonTasks: [],
        limitedTodayTasks: [],
        message: "Beaucoup de vieilles tâches. Revue bientôt ?"
      };
      
    case 'SUGGESTION':
      // Geler toutes les tâches SOON
      const soonTasks = tasks.filter(task => 
        task.deadline && 
        task.deadline >= new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) &&
        task.deadline <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      );
      
      return {
        frozenSoonTasks: soonTasks,
        limitedTodayTasks: [],
        message: "Mode DETOX : session de revue suggérée"
      };
      
    case 'BLOCK':
      // Geler toutes les tâches SOON
      const allSoonTasks = tasks.filter(task => 
        task.deadline && 
        task.deadline >= new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) &&
        task.deadline <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      );
      
      // Limiter TODAY à 2 tâches
      const todayTasks = tasks.filter(task => 
        task.deadline && 
        task.deadline.toDateString() === new Date().toDateString()
      ).slice(0, 2);
      
      return {
        frozenSoonTasks: allSoonTasks,
        limitedTodayTasks: todayTasks,
        message: "Mode DETOX : Revue obligatoire avant ajout"
      };
      
    default:
      return {
        frozenSoonTasks: [],
        limitedTodayTasks: [],
        message: ""
      };
  }
}
