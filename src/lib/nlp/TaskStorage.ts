/**
 * Stockage optimisé des tâches NLP dans Dexie
 * Gère le stockage en masse, les statistiques et le rafraîchissement de l'UI
 */

import { upsertTasks, type DBTask } from '@/lib/database';
import { createLogger } from '@/lib/logger';

const logger = createLogger('NlpTaskStorage');

export class NlpTaskStorage {
  constructor(_db?: unknown) {}

  async bulkStoreTasks(tasks: DBTask[]): Promise<void> {

    // Transaction atomique
    // Note: Dans une vraie implémentation, nous utiliserions:
    // await this.db.transaction('rw', this.tasks, async () => {
    logger.info('Stockage en masse des tâches NLP', { count: tasks.length });

    try {
      await upsertTasks(tasks);

      // 2. Update stats quotidiennes
      await this.updateDailyStats(tasks);

      // 3. Trigger playlist refresh si aujourd'hui
      if (tasks.some(t => this.isTodayTask(t))) {
        await this.triggerPlaylistRefresh();
      }
    } catch (error) {
      logger.error('Erreur lors du stockage des tâches', error as Error);
      throw error;
    }
  }

  private async updateDailyStats(tasks: DBTask[]) {
    // Simulation de la mise à jour des statistiques
    logger.debug('Mise à jour des statistiques quotidiennes', { count: tasks.length });

    /*
    const today = this.getTodayKey();
    const ritual = await this.db.table('dailyRituals').get(today);
    
    if (ritual) {
      await this.db.table('dailyRituals').update(today, {
        pendingTasksAdded: (ritual.pendingTasksAdded || 0) + tasks.length,
        nlpTasksCreated: (ritual.nlpTasksCreated || 0) + tasks.length
      });
    }
    */
  }

  private async triggerPlaylistRefresh() {
    // Émettre event pour refresh UI
    logger.info('Déclenchement du rafraîchissement de la playlist');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('nlptasks:added'));
    }
  }

  private isTodayTask(task: DBTask): boolean {
    // Vérifier si la tâche est pour aujourd'hui
    if (task.deadline) {
      const today = new Date();
      const deadline = new Date(task.deadline);
      return deadline.getDate() === today.getDate() &&
             deadline.getMonth() === today.getMonth() &&
             deadline.getFullYear() === today.getFullYear();
    }
    return false;
  }

  private getTodayKey(): string {
    const today = new Date();
    return `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
  }
}

// Utilisation
// const storage = new NlpTaskStorage(yourDexieInstance);
// await storage.bulkStoreTasks(fullTasks);