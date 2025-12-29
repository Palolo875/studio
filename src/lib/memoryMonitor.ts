import { modelMemoryManager } from './modelMemoryManager';
import { progressiveFallback, FallbackLevel } from './progressiveFallback';
import { createLogger } from '@/lib/logger';

const logger = createLogger('MemoryMonitor');

// Interface pour les statistiques de mémoire
export interface MemoryStats {
  used: number;        // Mémoire utilisée en octets
  total: number;       // Mémoire totale en octets
  limit: number;       // Limite de mémoire en octets
  percent: number;     // Pourcentage d'utilisation
}

// Interface pour les limites de mémoire
export interface MemoryLimits {
  warningThreshold: number;  // Seuil d'avertissement (0-100)
  criticalThreshold: number;  // Seuil critique (0-100)
  checkInterval: number;     // Intervalle de vérification en ms
}

// Configuration par défaut
export const DEFAULT_MEMORY_LIMITS: MemoryLimits = {
  warningThreshold: 80,    // 80%
  criticalThreshold: 90,   // 90%
  checkInterval: 30000     // 30 secondes
};

/**
 * Classe de monitoring de la mémoire
 */
export class MemoryMonitor {
  private limits: MemoryLimits;
  private intervalId: NodeJS.Timeout | null = null;
  private isActive: boolean = false;
  private onWarningCallback: ((stats: MemoryStats) => void) | null = null;
  private onCriticalCallback: ((stats: MemoryStats) => void) | null = null;

  constructor(limits?: Partial<MemoryLimits>) {
    this.limits = { ...DEFAULT_MEMORY_LIMITS, ...limits };
  }

  /**
   * Vérifie l'utilisation actuelle de la mémoire
   * @returns Statistiques de mémoire ou null si l'API n'est pas disponible
   */
  check(): MemoryStats | null {
    // Vérifier si l'API de performance.memory est disponible (Chrome uniquement)
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      // @ts-ignore
      const mem = performance.memory;

      if (mem) {
        const used = mem.usedJSHeapSize;
        const total = mem.totalJSHeapSize;
        const limit = mem.jsHeapSizeLimit;
        const percent = (used / limit) * 100;

        return {
          used,
          total,
          limit,
          percent
        };
      }
    }

    // API non disponible
    return null;
  }

  /**
   * Applique les actions d'enforcement en fonction de l'utilisation mémoire
   * @param limits Limites de mémoire à utiliser (optionnel)
   */
  enforce(limits?: MemoryLimits): void {
    const currentLimits = limits || this.limits;
    const current = this.check();

    if (!current) {
      // API de mémoire non disponible
      return;
    }

    // Vérifier le seuil critique
    if (current.percent > currentLimits.criticalThreshold) {
      this.handleCriticalMemory(current);
      return;
    }

    // Vérifier le seuil d'avertissement
    if (current.percent > currentLimits.warningThreshold) {
      this.handleWarningMemory(current);
      return;
    }
  }

  /**
   * Gère l'utilisation mémoire critique
   * @param stats Statistiques de mémoire
   */
  /**
   * Actions de dégradation progressive (Phase 4.5)
   */
  private handleCriticalMemory(stats: MemoryStats): void {
    logger.warn('Utilisation mémoire critique', { percent: Number(stats.percent.toFixed(2)) });

    // 1. Décharger tous les modèles (Poids lourd)
    modelMemoryManager.unloadAllModels();

    // 2. Vider les caches volatils
    this.clearCache();

    // 3. Forcer le mode SURVIVAL (Phase 4.5)
    progressiveFallback.forceFallbackLevel(FallbackLevel.LEVEL_3);

    // 4. Alerte utilisateur non intrusive
    this.alertUser("Mémoire saturée : Passage en mode survie pour rester fluide.");

    if (this.onCriticalCallback) {
      this.onCriticalCallback(stats);
    }
  }

  private handleWarningMemory(stats: MemoryStats): void {
    logger.warn('Utilisation mémoire élevée', { percent: Number(stats.percent.toFixed(2)) });

    // 1. Décharger les modèles inutilisés
    // modelMemoryManager.unloadUnusedModels(); // À implémenter si besoin

    // 2. Passer en mode OPTIMIZED
    progressiveFallback.forceFallbackLevel(FallbackLevel.LEVEL_1);
  }

  /**
   * Alerte l'utilisateur
   * @param message Message d'alerte
   */
  private alertUser(message: string): void {
    // Cette fonction dépend de l'implémentation spécifique des notifications
    logger.info('Alerte utilisateur', { message });

    // Exemple d'implémentation hypothétique:
    /*
    if (typeof notificationService !== 'undefined') {
      notificationService.showWarning(message);
    }
    */
  }

  /**
   * Démarre le monitoring périodique
   */
  startMonitoring(): void {
    if (this.intervalId) {
      logger.warn('Monitoring déjà actif');
      return;
    }

    this.isActive = true;
    this.intervalId = setInterval(() => {
      this.enforce();
    }, this.limits.checkInterval);

    logger.info('Monitoring démarré');
  }

  /**
   * Arrête le monitoring périodique
   */
  stopMonitoring(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.isActive = false;
      logger.info('Monitoring arrêté');
    }
  }

  /**
   * Met à jour les limites de mémoire
   * @param limits Nouvelles limites
   */
  updateLimits(limits: Partial<MemoryLimits>): void {
    this.limits = { ...this.limits, ...limits };

    // Redémarrer le monitoring si actif
    if (this.isActive) {
      this.stopMonitoring();
      this.startMonitoring();
    }
  }

  /**
   * Obtient les limites actuelles
   * @returns Limites actuelles
   */
  getLimits(): MemoryLimits {
    return { ...this.limits };
  }

  /**
   * Définit le callback pour les avertissements mémoire
   * @param callback Fonction de rappel
   */
  onWarning(callback: (stats: MemoryStats) => void): void {
    this.onWarningCallback = callback;
  }

  /**
   * Définit le callback pour les situations critiques
   * @param callback Fonction de rappel
   */
  onCritical(callback: (stats: MemoryStats) => void): void {
    this.onCriticalCallback = callback;
  }

  /**
   * Vérifie si le monitoring est actif
   * @returns true si le monitoring est actif, false sinon
   */
  isMonitoring(): boolean {
    return this.isActive;
  }
}

// Instance singleton du moniteur de mémoire
export const memoryMonitor = new MemoryMonitor();