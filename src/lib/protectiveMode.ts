// Protective Mode - Gestion du mode protectif
// Implémentation des protections contre le burnout et la surcharge

import { SovereigntyManager, SovereigntyMode } from './modeEngine';
import { type BurnoutDetectionResult } from './burnout/BurnoutEngine';
import { createLogger } from '@/lib/logger';

const logger = createLogger('ProtectiveMode');

// Interface pour les paramètres du mode protectif
export interface ProtectiveModeSettings {
  maxTasksPerSession: number;
  allowHeavyTasks: boolean;
  coachEnabled: boolean;
  sessionDurationLimit: number; // en minutes
  taskSuggestionsOnly: boolean;
}

// Interface pour le gestionnaire du mode protectif
export class ProtectiveModeManager {
  private sovereigntyManager: SovereigntyManager;
  private settings: ProtectiveModeSettings;
  private startTime: number | null = null;
  private escapeRequested: boolean = false;

  constructor(sovereigntyManager: SovereigntyManager) {
    this.sovereigntyManager = sovereigntyManager;
    
    // Paramètres par défaut pour le mode protectif
    this.settings = {
      maxTasksPerSession: 2,
      allowHeavyTasks: false,
      coachEnabled: false,
      sessionDurationLimit: 45, // 45 minutes
      taskSuggestionsOnly: true
    };
  }

  // Activer le mode protectif
  activate(reason: string) {
    try {
      this.sovereigntyManager.enforceTransition(SovereigntyMode.PROTECTIVE, reason);
      this.startTime = Date.now();
      this.escapeRequested = false;
      logger.info('Mode protectif activé', { reason });
    } catch (error) {
      logger.error("Erreur lors de l'activation du mode protectif", error as Error);
    }
  }

  // Désactiver le mode protectif
  deactivate() {
    if (this.sovereigntyManager.currentMode === SovereigntyMode.PROTECTIVE) {
      this.sovereigntyManager.resetToDefault();
      this.startTime = null;
      this.escapeRequested = false;
      logger.info('Mode protectif désactivé');
    }
  }

  // Vérifier si le mode protectif est actif
  isActive(): boolean {
    return this.sovereigntyManager.currentMode === SovereigntyMode.PROTECTIVE;
  }

  // Obtenir les paramètres du mode protectif
  getSettings(): ProtectiveModeSettings {
    return { ...this.settings };
  }

  // Mettre à jour les paramètres du mode protectif
  updateSettings(newSettings: Partial<ProtectiveModeSettings>) {
    this.settings = { ...this.settings, ...newSettings };
  }

  // Vérifier si l'utilisateur peut sortir du mode protectif
  canExit(): boolean {
    if (!this.isActive() || !this.startTime) {
      return true; // Pas en mode protectif, donc peut sortir
    }
    
    // Vérifier si 12 heures se sont écoulées
    const elapsed = Date.now() - this.startTime;
    const hoursElapsed = elapsed / (60 * 60 * 1000);
    
    return hoursElapsed >= 12 || this.escapeRequested;
  }

  // Demander à sortir du mode protectif
  requestExit(): boolean {
    if (!this.canExit()) {
      logger.info('Exit refusé: rester en mode protégé encore un peu');
      return false;
    }
    
    this.escapeRequested = true;
    logger.info('Demande de sortie du mode protectif enregistrée');
    return true;
  }

  // Vérifier automatiquement la sortie du mode protectif
  checkAutoExit() {
    if (!this.isActive() || !this.startTime) {
      return;
    }
    
    const elapsed = Date.now() - this.startTime;
    const hoursElapsed = elapsed / (60 * 60 * 1000);
    
    // Après 48 heures, sortir automatiquement
    if (hoursElapsed >= 48) {
      logger.info('48 heures écoulées en mode protectif. Le système vous redonne la main.');
      this.deactivate();
      return;
    }
    
    // Après 24 heures, proposer de sortir
    if (hoursElapsed >= 24 && hoursElapsed < 25) {
      logger.info('Mode protectif actif depuis 24h. Souhaitez-vous évaluer la situation ?');
      // Dans une implémentation réelle, cela afficherait une notification à l'utilisateur
    }
  }

  // Appliquer les restrictions du mode protectif
  applyRestrictions() {
    if (!this.isActive()) {
      return;
    }
    
    logger.info('Restrictions du mode protectif appliquées', {
      maxTasksPerSession: this.settings.maxTasksPerSession,
      allowHeavyTasks: this.settings.allowHeavyTasks,
      coachEnabled: this.settings.coachEnabled,
    });
  }

  // Vérifier si une tâche est autorisée en mode protectif
  isTaskAllowed(task: { effort: string; priority: string }): boolean {
    if (!this.isActive()) {
      return true; // Pas de restriction hors mode protectif
    }
    
    // Vérifier si c'est une tâche lourde
    if (task.effort === "HEAVY" && !this.settings.allowHeavyTasks) {
      return false;
    }
    
    // Vérifier la priorité (seules les tâches urgentes peuvent être autorisées)
    if (task.priority !== "URGENT") {
      // Dans le mode protectif, seules les tâches légères ou urgentes sont autorisées
      return task.effort === "LIGHT";
    }
    
    return true;
  }

  // Générer une notification de mode protectif
  generateNotification(burnoutResult: BurnoutDetectionResult): string {
    const signals = [];
    
    if (burnoutResult.signals.chronicOverload) {
      signals.push("une charge de travail élevée ces derniers jours");
    }
    
    if (burnoutResult.signals.sleepDebt) {
      signals.push("un manque de repos récent");
    }
    
    if (burnoutResult.signals.overrideAbuse) {
      signals.push("un besoin fréquent de forcer le système");
    }
    
    if (burnoutResult.signals.completionCollapse) {
      signals.push("une baisse du nombre de tâches terminées");
    }
    
    return `
### Mode Protection Activé

KairuFlow a détecté ${signals.join(', ')}. Pour vous aider à retrouver un rythme serein, quelques ajustements sont appliqués temporairement :

*   **Sessions plus courtes** et moins de tâches.
*   Priorité aux **tâches légères** ou vraiment urgentes.

Vous gardez le contrôle et pouvez toujours forcer une décision, mais l'idée est de vous aider à reprendre votre souffle.
`;
  }
}
