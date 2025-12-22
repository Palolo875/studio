// Protective Mode - Gestion du mode protectif
// Implémentation des protections contre le burnout et la surcharge

import { SovereigntyManager, SovereigntyMode } from './modeEngine';
import { BurnoutDetectionResult } from './burnoutEngine';

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
      console.log("Mode protectif activé:", reason);
    } catch (error) {
      console.error("Erreur lors de l'activation du mode protectif:", error);
    }
  }

  // Désactiver le mode protectif
  deactivate() {
    if (this.sovereigntyManager.currentMode === SovereigntyMode.PROTECTIVE) {
      this.sovereigntyManager.resetToDefault();
      this.startTime = null;
      this.escapeRequested = false;
      console.log("Mode protectif désactivé");
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
      console.log("Impossible de sortir du mode protectif pour le moment. Veuillez patienter.");
      return false;
    }
    
    this.escapeRequested = true;
    console.log("Demande de sortie du mode protectif enregistrée.");
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
      console.log("48 heures écoulées en mode protectif. Sortie automatique.");
      this.deactivate();
      return;
    }
    
    // Après 24 heures, proposer de sortir
    if (hoursElapsed >= 24 && hoursElapsed < 25) {
      console.log("Mode protectif actif depuis 24h. Voulez-vous sortir ?");
      // Dans une implémentation réelle, cela afficherait une notification à l'utilisateur
    }
  }

  // Appliquer les restrictions du mode protectif
  applyRestrictions() {
    if (!this.isActive()) {
      return;
    }
    
    console.log("Restrictions du mode protectif appliquées:");
    console.log("- Nombre maximal de tâches par session:", this.settings.maxTasksPerSession);
    console.log("- Tâches lourdes autorisées:", this.settings.allowHeavyTasks);
    console.log("- Coach activé:", this.settings.coachEnabled);
    console.log("- Durée limite de session:", this.settings.sessionDurationLimit, "minutes");
    console.log("- Suggestions uniquement:", this.settings.taskSuggestionsOnly);
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
      signals.push("Charge élevée depuis plusieurs jours");
    }
    
    if (burnoutResult.signals.sleepDebt) {
      signals.push("Repos insuffisant récemment");
    }
    
    if (burnoutResult.signals.overrideAbuse) {
      signals.push("Beaucoup de décisions forcées");
    }
    
    if (burnoutResult.signals.completionCollapse) {
      signals.push("Taux de complétion faible");
    }
    
    if (burnoutResult.signals.erraticBehavior) {
      signals.push("Comportement erratique détecté");
    }
    
    if (burnoutResult.signals.taskAccumulation) {
      signals.push("Accumulation excessive de tâches");
    }
    
    return `
=== MODE PROTECTION ACTIVÉ ===

J'ai détecté plusieurs signaux qui suggèrent que tu forces trop en ce moment :

${signals.map(signal => `• ${signal}`).join('\n')}

Pendant les prochaines 24h :
• Max ${this.settings.maxTasksPerSession} tâches par session
• Seulement tâches légères ou urgentes
• Suggestions de repos

Tu gardes le contrôle : tu peux forcer des décisions,
mais cela désactive les protections pendant 24h.

============================
`;
  }
}