import type { Task, UserPatterns } from '@/lib/types';
import {
  getTodoTasksBulk as getTodoTasksBulkDexie,
  getTaskHistoryBulk as getTaskHistoryBulkDexie,
  updateUserPatternsInDB as updateUserPatternsInDBDexie,
  getUserPatternsFromDB as getUserPatternsFromDBDexie,
} from '@/lib/database';
import { createLogger } from '@/lib/logger';

const logger = createLogger('TaskDatabase');

// Interface pour l'historique des tâches
export interface TaskHistoryEntry {
  id?: number;
  taskId: string;
  timestamp: Date;
  completed: boolean;
}

export const db = {} as const;

/**
 * Récupère toutes les tâches 'todo' avec bulkGet
 * Optimisé pour les performances (<200ms)
 */
export async function getTodoTasksBulk(): Promise<Task[]> {
  try {
    return await getTodoTasksBulkDexie();
  } catch (error) {
    logger.error('Erreur lors de la récupération des tâches todo', error as Error);
    return [];
  }
}

/**
 * Récupère l'historique des tâches
 */
export async function getTaskHistoryBulk(): Promise<TaskHistoryEntry[]> {
  try {
    const completedTasks = await getTaskHistoryBulkDexie();
    return completedTasks.map((t: Task) => ({
      taskId: t.id,
      timestamp: new Date(t.completedAt || t.lastAccessed),
      completed: true,
    }));
  } catch (error) {
    logger.error("Erreur lors de la récupération de l'historique", error as Error);
    return [];
  }
}

/**
 * Met à jour les patterns utilisateur dans la base de données
 */
export async function updateUserPatternsInDB(patterns: UserPatterns): Promise<void> {
  try {
    await updateUserPatternsInDBDexie(patterns);
  } catch (error) {
    logger.error('Erreur lors de la mise à jour des patterns', error as Error);
  }
}

/**
 * Récupère les patterns utilisateur depuis la base de données
 */
export async function getUserPatternsFromDB(): Promise<UserPatterns | null> {
  try {
    return await getUserPatternsFromDBDexie();
  } catch (error) {
    logger.error('Erreur lors de la récupération des patterns', error as Error);
    return null;
  }
}