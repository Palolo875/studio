/**
 * Moniteur de croissance de la base de données - Phase 5
 * Surveille l'utilisation de l'espace de stockage de IndexedDB
 */

import { createLogger } from '@/lib/logger';

const logger = createLogger('DbGrowthMonitor');

// Seuil d'utilisation de la base de données (en octets)
const DB_SIZE_WARNING_THRESHOLD = 30 * 1024 * 1024; // 30 MB
const DB_SIZE_CRITICAL_THRESHOLD = 45 * 1024 * 1024; // 45 MB
const DB_SIZE_MAXIMUM = 50 * 1024 * 1024; // 50 MB

/**
 * Surveille la croissance de la base de données
 */
export class DbGrowthMonitor {

  private monitoringInterval: ReturnType<typeof setInterval> | null = null;
  private isMonitoring: boolean = false;

  /**
   * Démarre la surveillance de la croissance de la base de données
   * @param interval Intervalle de surveillance en millisecondes (défaut: 30 minutes)
   */
  startMonitoring(interval: number = 30 * 60 * 1000): void {
    if (this.monitoringInterval) {
      logger.warn('Surveillance déjà active');
      return;
    }

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      this.checkDbGrowth();
    }, interval);

    logger.info('Surveillance démarrée', { intervalMs: interval });

    // Effectuer une vérification immédiate
    this.checkDbGrowth();
  }

  /**
   * Arrête la surveillance de la croissance de la base de données
   */
  stopMonitoring(): void {

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      this.isMonitoring = false;
      logger.info('Surveillance arrêtée');
    }
  }

  /**
   * Vérifie la croissance de la base de données
   */
  async checkDbGrowth(): Promise<void> {
    try {

      // Obtenir les informations de stockage
      const storageInfo = await navigator.storage?.estimate();

      if (!storageInfo) {
        logger.warn('API de stockage non disponible');
        return;
      }

      const { usage, quota } = storageInfo;

      if (usage === undefined || quota === undefined) {
        logger.warn('Informations de stockage incomplètes');
        return;
      }

      // Calculer le pourcentage d'utilisation
      const usagePercentage = (usage / quota) * 100;

      logger.debug('Utilisation', {
        usageBytes: usage,
        quotaBytes: quota,
        usagePercentage: Number(usagePercentage.toFixed(2)),
      });

      // Vérifier les seuils
      if (usage > DB_SIZE_CRITICAL_THRESHOLD) {
        this.handleCriticalUsage(usage);
      } else if (usage > DB_SIZE_WARNING_THRESHOLD) {
        this.handleWarningUsage(usage);
      }
    } catch (error) {
      logger.error('Erreur lors de la vérification de la croissance', error as Error);
    }
  }

  /**
   * Gère l'utilisation critique de l'espace de stockage
   * @param usage Utilisation actuelle en octets
   */
  private handleCriticalUsage(usage: number): void {
    logger.error('Utilisation critique de la base de données', new Error(formatBytes(usage)));

    // Afficher un message à l'utilisateur
    logger.warn('USER_MESSAGE', {
      message: "La base de données est presque pleine. Pensez à archiver vos anciennes données.",
      type: 'critical',
    });

    // Activer l'auto-pruning
    this.enableAutoPrune();
  }

  /**
   * Gère l'utilisation élevée de l'espace de stockage
   * @param usage Utilisation actuelle en octets
   */
  private handleWarningUsage(usage: number): void {
    logger.warn('Utilisation élevée de la base de données', { usageBytes: usage });

    // Afficher un message à l'utilisateur
    logger.warn('USER_MESSAGE', {
      message: "La base de données commence à être volumineuse. Pensez à archiver vos anciennes données.",
      type: 'warning',
    });
  }

  /**
   * Active l'auto-pruning des données anciennes
   */
  private enableAutoPrune(): void {
    logger.info("Activation de l'auto-pruning");

    // Dans une implémentation réelle, cela déclencherait le pruning
    // des données de plus de 7 jours par exemple

    // Exemple de pseudo-code:
    // storageGuard.pruneOldData(7);
  }

  /**
   * Vérifie si la surveillance est active
   * @returns true si la surveillance est active, false sinon
   */
  isMonitoringActive(): boolean {
    return this.isMonitoring;
  }
}

/**
 * Formate un nombre d'octets en une chaîne lisible
 * @param bytes Nombre d'octets
 * @returns Chaîne formatée
 */
function formatBytes(bytes: number): string {

  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Instance singleton du moniteur
export const dbGrowthMonitor = new DbGrowthMonitor();