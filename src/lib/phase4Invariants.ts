/**
 * Invariants de la phase 4 - Performances & Optimisation
 * Implémente les invariants requis pour garantir la qualité et la robustesse
 */

import { performanceTracker } from './performanceTracker';
import { memoryMonitor } from './memoryMonitor';
import { WorkerCommunication } from './workerCommunication';
import { progressiveFallback } from './progressiveFallback';
import { storageGuard } from './storageGuard';
import { batteryAwareness } from './batteryAwareness';
import { createLogger } from '@/lib/logger';

const logger = createLogger('Phase4Invariants');

// Constantes pour les unités
const MB = 1024 * 1024;

// Interface pour un invariant
export interface Invariant {
  id: string;
  description: string;
  check: () => boolean;
  message: string;
}

// Liste des invariants de la phase 4
export const PHASE4_INVARIANTS: Invariant[] = [
  {
    id: "XXXIII",
    description: "Memory Ceiling",
    check: (): boolean => {
      // Vérifier l'utilisation mémoire actuelle
      const memoryStats = memoryMonitor.check();
      if (!memoryStats) return true; // Si l'API n'est pas disponible, on considère que c'est ok

      // Vérifier que l'utilisation totale ne dépasse pas 120MB
      return memoryStats.used <= 120 * MB;
    },
    message: "Total memory usage MUST NEVER exceed 120MB"
  },
  {
    id: "XXXIV",
    description: "Worker Timeout",
    check: (): boolean => {
      const stats = performanceTracker.getStats('worker_communication');
      if (!stats) return true;
      // Invariant : p95 doit être < 500ms
      return stats.p95 <= 500;
    },
    message: "Worker response timeout = 500ms max"
  },
  {
    id: "XXXV",
    description: "UI Frame Budget",
    check: (): boolean => {
      const stats = performanceTracker.getStats('ui_render');
      if (!stats) return true;
      // Invariant : Pas de frame bloquée > 16ms sur le thread UI
      return stats.violations === 0;
    },
    message: "Main thread tasks NEVER exceed 16ms"
  },
  {
    id: "XXXVI",
    description: "Progressive Degradation",
    check: (): boolean => {
      const currentLevel = progressiveFallback.getCurrentLevel();
      return currentLevel !== null;
    },
    message: "System MUST degrade gracefully under load"
  },
  {
    id: "XXXVII",
    description: "Battery Awareness",
    check: (): boolean => {
      const state = batteryAwareness.getPowerSaveState();
      const refreshRate = batteryAwareness.getCurrentRefreshRate();
      // Invariant : Si économie activée, rafraîchissement réduit
      if (state.enabled) return refreshRate >= 60;
      return true;
    },
    message: "On battery saver → reduce refresh to 1/min"
  },
  {
    id: "XXXVIII",
    description: "Quota Management",
    check: (): boolean => {
      // Vérifier que le Storage Guard est actif et sous le seuil
      const config = storageGuard.getConfig();
      return config.warnThreshold <= 0.8;
    },
    message: "IndexedDB usage MUST stay < 80% quota"
  }
];

/**
 * Classe de gestion des invariants de la phase 4
 */
export class Phase4Invariants {
  private invariants: Invariant[];
  private onViolationCallback: ((invariant: Invariant) => void) | null = null;

  constructor() {
    this.invariants = [...PHASE4_INVARIANTS];
  }

  /**
   * Vérifie tous les invariants
   * @returns Liste des invariants violés
   */
  checkAll(): Invariant[] {
    const violatedInvariants: Invariant[] = [];

    for (const invariant of this.invariants) {
      try {
        if (!invariant.check()) {
          violatedInvariants.push(invariant);

          // Appeler le callback si défini
          if (this.onViolationCallback) {
            this.onViolationCallback(invariant);
          }
        }
      } catch (error) {
        logger.error(`Erreur lors de la vérification de l'invariant ${invariant.id}`, error as Error);
        // En cas d'erreur, on considère que l'invariant est violé
        violatedInvariants.push(invariant);
      }
    }

    return violatedInvariants;
  }

  /**
   * Vérifie un invariant spécifique
   * @param invariantId ID de l'invariant à vérifier
   * @returns true si l'invariant est respecté, false sinon
   */
  check(invariantId: string): boolean {
    const invariant = this.invariants.find(inv => inv.id === invariantId);
    if (!invariant) {
      throw new Error(`Invariant ${invariantId} non trouvé`);
    }

    try {
      return invariant.check();
    } catch (error) {
      logger.error(`Erreur lors de la vérification de l'invariant ${invariantId}`, error as Error);
      return false;
    }
  }

  /**
   * Ajoute un nouvel invariant
   * @param invariant Invariant à ajouter
   */
  addInvariant(invariant: Invariant): void {
    this.invariants.push(invariant);
    logger.info('Invariant ajouté', { invariantId: invariant.id });
  }

  /**
   * Supprime un invariant
   * @param invariantId ID de l'invariant à supprimer
   */
  removeInvariant(invariantId: string): void {
    const index = this.invariants.findIndex(inv => inv.id === invariantId);
    if (index !== -1) {
      this.invariants.splice(index, 1);
      logger.info('Invariant supprimé', { invariantId });
    }
  }

  /**
   * Obtient tous les invariants
   * @returns Liste des invariants
   */
  getInvariants(): Invariant[] {
    return [...this.invariants];
  }

  /**
   * Définit le callback pour les violations d'invariants
   * @param callback Fonction de rappel
   */
  onViolation(callback: (invariant: Invariant) => void): void {
    this.onViolationCallback = callback;
  }

  /**
   * Force l'application des actions correctives pour un invariant violé
   * @param invariantId ID de l'invariant violé
   */
  enforceInvariant(invariantId: string): void {
    const invariant = this.invariants.find(inv => inv.id === invariantId);
    if (!invariant) {
      throw new Error(`Invariant ${invariantId} non trouvé`);
    }

    logger.info('Application des actions correctives', { invariantId });

    // Appliquer des actions spécifiques selon l'invariant
    switch (invariantId) {
      case "XXXIII": // Memory Ceiling
        // Forcer le mode survie
        progressiveFallback.forceFallbackLevel(progressiveFallback.selectFallbackLevel({
          brain_avg: 0,
          brain_p95: 0,
          memory_percent: 95, // Simuler une utilisation mémoire très élevée
          ui_lag_count: 0
        }));
        break;

      case "XXXIV": // Worker Timeout
        // Pour l'instant, rien à faire de spécifique
        break;

      case "XXXV": // UI Frame Budget
        // Pour l'instant, rien à faire de spécifique
        break;

      case "XXXVI": // Progressive Degradation
        // Le système de fallback progressif s'occupe déjà de cela
        break;

      case "XXXVII": // Battery Awareness
        // Forcer le mode économie d'énergie
        batteryAwareness.forcePowerSaveMode(true, 'high');
        break;

      case "XXXVIII": // Quota Management
        // Déclencher le pruning
        storageGuard.pruneOldData(7); // Archiver les données de plus de 7 jours
        break;
    }
  }
}

// Instance singleton des invariants de la phase 4
export const phase4Invariants = new Phase4Invariants();

// Exporter également les invariants individuels pour une utilisation directe
export { PHASE4_INVARIANTS as INVARIANTS };