import { db } from './database/index';
import { createLogger } from '@/lib/logger';

const logger = createLogger('StorageGuard');
/**
 * Storage Guard pour IndexedDB - Phase 4
 * Implémente la surveillance active des quotas de stockage
 */

// Constantes pour les unités
const KB = 1024;
const MB = 1024 * KB;
const GB = 1024 * MB;

// Interface pour la configuration du Storage Guard
export interface StorageGuardConfig {
  hardLimit: number;      // Limite stricte en octets
  warnThreshold: number;   // Seuil d'avertissement (0.0 - 1.0)
  checkInterval: number;   // Intervalle de vérification en millisecondes
}

// Configuration par défaut du Storage Guard
export const STORAGE_GUARD: StorageGuardConfig = {
  hardLimit: 50 * MB,     // 50 MB limite stricte
  warnThreshold: 0.8,     // Avertir à 80% de la limite
  checkInterval: 60_000   // Vérifier toutes les minutes
};

// Interface pour les statistiques de stockage
export interface StorageStats {
  usage: number;          // Utilisation actuelle en octets
  quota: number | null;   // Quota total en octets (null si non disponible)
  percentage: number;     // Pourcentage d'utilisation
}

/**
 * Classe de gestion du Storage Guard
 */
export class StorageGuard {
  private config: StorageGuardConfig;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private isActive: boolean = false;

  constructor(config?: Partial<StorageGuardConfig>) {
    this.config = { ...STORAGE_GUARD, ...config };
  }

  /**
   * Estime l'utilisation du stockage
   * @returns Promesse résolue avec les statistiques de stockage
   */
  async estimateStorage(): Promise<StorageStats> {
    try {
      const estimate = await navigator.storage.estimate();

      const usage = estimate.usage || 0;
      const quota = estimate.quota || null;

      // Calculer le pourcentage d'utilisation
      let percentage = 0;
      if (quota) {
        percentage = (usage / quota) * 100;
      } else {
        // Si le quota n'est pas disponible, utiliser la limite stricte
        percentage = (usage / this.config.hardLimit) * 100;
      }

      return {
        usage,
        quota,
        percentage
      };
    } catch (error) {
      logger.error("Erreur lors de l'estimation du stockage", error as Error);
      return {
        usage: 0,
        quota: null,
        percentage: 0
      };
    }
  }

  /**
   * Applique le Storage Guard
   * Vérifie l'utilisation du stockage et déclenche des actions si nécessaire
   */
  async enforce(): Promise<void> {
    try {
      const stats = await this.estimateStorage();

      // Vérifier si nous avons dépassé le seuil d'avertissement
      if (stats.usage > this.config.hardLimit * this.config.warnThreshold) {
        logger.warn('Utilisation du stockage élevée', { percentage: Number(stats.percentage.toFixed(2)) });

        // Déclencher le pruning des anciennes données
        await this.pruneOldData(30); // Archiver les données de plus de 30 jours

        // Notifier l'utilisateur
        this.notifyUser("Archivage automatique pour éviter la saturation");
      }

      // Vérifier si nous avons dépassé la limite stricte
      if (stats.usage > this.config.hardLimit) {
        logger.error('Limite de stockage dépassée', new Error(`${stats.usage / MB} MB > ${this.config.hardLimit / MB} MB`));

        // Déclencher un pruning plus agressif
        await this.pruneOldData(7); // Archiver les données de plus de 7 jours

        // Notifier l'utilisateur
        this.notifyUser("Saturation imminente - archivage intensif activé");
      }
    } catch (error) {
      logger.error("Erreur lors de l'application du Storage Guard", error as Error);
    }
  }

  /**
   * Archive les anciennes données (Phase 4.2)
   */
  async pruneOldData(days: number): Promise<void> {
    try {
      logger.info('Déclenchement du pruning', { days });
      const removedCount = await db.pruneData(days);

      if (removedCount > 0) {
        this.notifyUser(`${removedCount} éléments anciens ont été archivés pour libérer de l'espace.`);
      }
    } catch (error) {
      logger.error('Erreur lors du pruning', error as Error);
    }
  }

  /**
   * Notifie l'utilisateur d'un événement de stockage
   * @param message Message de notification
   */
  notifyUser(message: string): void {
    // Dans une implémentation réelle, cela utiliserait le système de notifications
    // de l'application pour afficher un message à l'utilisateur
    logger.info('Notification utilisateur', { message });

    // Exemple d'implémentation avec un toast ou une notification
    /*
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('storage-guard-notification', {
        detail: { message }
      }));
    }
    */
  }

  /**
   * Démarre la surveillance périodique du stockage
   */
  startMonitoring(): void {
    if (this.intervalId) {
      logger.warn('Surveillance déjà active');
      return;
    }

    this.isActive = true;
    this.intervalId = setInterval(() => {
      this.enforce();
    }, this.config.checkInterval);

    logger.info('Surveillance démarrée');
  }

  /**
   * Arrête la surveillance périodique du stockage
   */
  stopMonitoring(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.isActive = false;
      logger.info('Surveillance arrêtée');
    }
  }

  /**
   * Met à jour la configuration du Storage Guard
   * @param newConfig Nouvelle configuration
   */
  updateConfig(newConfig: Partial<StorageGuardConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // Redémarrer la surveillance si elle est active
    if (this.isActive) {
      this.stopMonitoring();
      this.startMonitoring();
    }
  }

  /**
   * Obtient la configuration actuelle
   * @returns Configuration actuelle
   */
  getConfig(): StorageGuardConfig {
    return { ...this.config };
  }

  /**
   * Vérifie si la surveillance est active
   * @returns true si la surveillance est active, false sinon
   */
  isMonitoring(): boolean {
    return this.isActive;
  }
}

// Instance singleton du Storage Guard
export const storageGuard = new StorageGuard();