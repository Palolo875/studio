// Mode Engine - Gestion des transitions de modes de souveraineté
// Implémentation des 4 fonctions de transition avec triggers temporels

import { SovereigntyMode } from './phase7Implementation';
import { createLogger } from '@/lib/logger';

type SessionLike = {
  timestamp: number;
  plannedTasks: number;
  completedTasks: number;
};

const logger = createLogger('ModeEngine');

// Interface pour les transitions de mode
export interface ModeTransition {
  from: SovereigntyMode;
  to: SovereigntyMode;
  reason: string;
  timestamp: number;
  forced?: boolean;
}

// Interface pour le gestionnaire de modes
export class SovereigntyManager {
  currentMode: SovereigntyMode;
  previousMode: SovereigntyMode;
  transitionLog: ModeTransition[];
  lastActivityTimestamp: number;
  protectiveModeStartTime: number | null;

  constructor(initialMode: SovereigntyMode = SovereigntyMode.GUIDED) {
    this.currentMode = initialMode;
    this.previousMode = initialMode;
    this.transitionLog = [];
    this.lastActivityTimestamp = Date.now();
    this.protectiveModeStartTime = null;
  }

  // Enregistrer une activité utilisateur
  registerUserActivity(timestamp: number = Date.now()) {
    this.lastActivityTimestamp = timestamp;
  }

  // Suggérer une transition de mode
  suggestTransition(from: SovereigntyMode, to: SovereigntyMode, reason: string) {
    // Vérifier si la transition est autorisée
    const allowedTransitions = this.getAllowedTransitions();
    
    if (!allowedTransitions.some(t => t.from === from && t.to === to)) {
      logger.warn('Transition non autorisée', { from: SovereigntyMode[from], to: SovereigntyMode[to] });
      return;
    }
    
    // Enregistrer la suggestion
    this.transitionLog.push({
      from,
      to,
      reason,
      timestamp: Date.now()
    });
    
    // Notification (simulée)
    logger.info('Suggestion de transition', { from: SovereigntyMode[from], to: SovereigntyMode[to], reason });
  }

  // Forcer une transition de mode (uniquement pour le mode PROTECTIVE)
  enforceTransition(to: SovereigntyMode, reason: string) {
    // Seulement le mode PROTECTIVE peut être forcé
    if (to !== SovereigntyMode.PROTECTIVE) {
      throw new Error("Cannot enforce non-protective mode");
    }
    
    this.previousMode = this.currentMode;
    this.currentMode = to;
    
    // Enregistrer le changement
    this.transitionLog.push({
      timestamp: Date.now(),
      from: this.previousMode,
      to: to,
      reason: reason,
      forced: true
    });
    
    // Enregistrer le début du mode protectif
    if (to === SovereigntyMode.PROTECTIVE) {
      this.protectiveModeStartTime = Date.now();
    }
    
    logger.info('Transition forcée', { from: SovereigntyMode[this.previousMode], to: SovereigntyMode[to], reason });
  }

  // Obtenir les transitions autorisées
  getAllowedTransitions(): { from: SovereigntyMode; to: SovereigntyMode }[] {
    return [
      // User peut toujours entrer dans ces modes
      { from: SovereigntyMode.MANUAL, to: SovereigntyMode.ASSISTED },
      { from: SovereigntyMode.MANUAL, to: SovereigntyMode.GUIDED },
      { from: SovereigntyMode.MANUAL, to: SovereigntyMode.PROTECTIVE },
      { from: SovereigntyMode.ASSISTED, to: SovereigntyMode.MANUAL },
      { from: SovereigntyMode.ASSISTED, to: SovereigntyMode.GUIDED },
      { from: SovereigntyMode.ASSISTED, to: SovereigntyMode.PROTECTIVE },
      { from: SovereigntyMode.GUIDED, to: SovereigntyMode.MANUAL },
      { from: SovereigntyMode.GUIDED, to: SovereigntyMode.ASSISTED },
      { from: SovereigntyMode.GUIDED, to: SovereigntyMode.PROTECTIVE },
      { from: SovereigntyMode.PROTECTIVE, to: SovereigntyMode.MANUAL },
      { from: SovereigntyMode.PROTECTIVE, to: SovereigntyMode.ASSISTED },
      { from: SovereigntyMode.PROTECTIVE, to: SovereigntyMode.GUIDED }
    ];
  }

  // Évaluer les transitions automatiques
  async evaluateAutomaticTransitions(
    sessions: SessionLike[],
    overrides: { timestamp: number }[],
    userId: string
  ) {
    const now = Date.now();
    
    // Transition MANUAL → ASSISTED : pas d'activité pendant 7+ jours
    if (this.currentMode === SovereigntyMode.MANUAL) {
      const daysSinceActivity = (now - this.lastActivityTimestamp) / (24 * 60 * 60 * 1000);
      if (daysSinceActivity > 7) {
        this.suggestTransition(
          SovereigntyMode.MANUAL,
          SovereigntyMode.ASSISTED,
          "No activity 7+ days"
        );
      }
    }
    
    // Transition ASSISTED/GUIDED → PROTECTIVE : taux d'overrides élevé ou faible complétion
    if (this.currentMode === SovereigntyMode.ASSISTED || this.currentMode === SovereigntyMode.GUIDED) {
      // Vérifier le taux d'overrides (sur les 7 derniers jours)
      const weekAgo = now - (7 * 24 * 60 * 60 * 1000);
      const recentOverrides = overrides.filter(o => o.timestamp > weekAgo);

      const weekSessions = sessions.filter(s => s.timestamp > weekAgo);
      const totalDecisions = weekSessions.reduce((sum, s) => sum + (s.plannedTasks ?? 0), 0);
      const overrideRate = totalDecisions > 0 ? recentOverrides.length / totalDecisions : 0;
      
      // Vérifier le taux de complétion (sur les 7 derniers jours)
      let totalPlanned = 0;
      let totalCompleted = 0;
      
      weekSessions.forEach(session => {
        totalPlanned += session.plannedTasks;
        totalCompleted += session.completedTasks;
      });
      
      const completionRate = totalPlanned > 0 ? totalCompleted / totalPlanned : 1;
      
      // Si le taux d'overrides est élevé OU le taux de complétion est faible
      if (overrideRate > 0.7 || completionRate < 0.3) {
        this.suggestTransition(
          this.currentMode,
          SovereigntyMode.PROTECTIVE,
          "High override rate OR low completion"
        );
      }
    }
    
    // Transition PROTECTIVE → GUIDED : signaux de burnout < 2 pendant 48h
    if (this.currentMode === SovereigntyMode.PROTECTIVE && this.protectiveModeStartTime) {
      const protectiveDuration = now - this.protectiveModeStartTime;
      const hoursInProtective = protectiveDuration / (60 * 60 * 1000);
      
      // Vérifier si 48h se sont écoulées (simulé)
      if (hoursInProtective > 48) {
        // Dans une implémentation réelle, cela vérifierait les signaux de burnout
        // Pour cet exemple, nous simulons une condition remplie
        const burnoutSignalsBelowThreshold = true; // Valeur simulée
        
        if (burnoutSignalsBelowThreshold) {
          this.suggestTransition(
            SovereigntyMode.PROTECTIVE,
            SovereigntyMode.GUIDED,
            "Burnout signals < 2 for 48h"
          );
        }
      }
    }
  }

  // Vérifier les contraintes de mode
  checkModeConstraints() {
    const now = Date.now();
    
    // Vérifier la durée maximale en mode PROTECTIVE (24h)
    if (this.currentMode === SovereigntyMode.PROTECTIVE && this.protectiveModeStartTime) {
      const protectiveDuration = now - this.protectiveModeStartTime;
      const hoursInProtective = protectiveDuration / (60 * 60 * 1000);
      
      if (hoursInProtective > 24) {
        // Afficher une notification pour sortir du mode protectif
        logger.info('Mode protectif actif depuis 24h. Voulez-vous sortir ?');
      }
    }
    
    // Vérifier la durée maximale en mode MANUAL (30 jours)
    if (this.currentMode === SovereigntyMode.MANUAL) {
      const daysInManual = (now - this.lastActivityTimestamp) / (24 * 60 * 60 * 1000);
      
      if (daysInManual > 30) {
        // Afficher une alerte
        logger.info('Mode MANUAL actif depuis 30 jours. Recommandation de passer en mode assisté.');
      }
    }
  }

  // Obtenir l'historique des transitions
  getTransitionHistory(): ModeTransition[] {
    return [...this.transitionLog];
  }

  // Réinitialiser le mode
  resetToDefault() {
    this.previousMode = this.currentMode;
    this.currentMode = SovereigntyMode.GUIDED;
    
    this.transitionLog.push({
      timestamp: Date.now(),
      from: this.previousMode,
      to: this.currentMode,
      reason: "Reset to default mode"
    });
  }
}

export { SovereigntyMode };
