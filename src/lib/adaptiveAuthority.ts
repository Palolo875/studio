// adaptiveAuthority.ts
// Implémentation de la hiérarchie des modes d'autorité adaptatifs

import { createLogger } from '@/lib/logger';

const logger = createLogger('AdaptiveAuthority');

export type AuthorityMode = 'NORMAL' | 'PROTECTIVE' | 'CRISIS';

export interface UserContext {
  cognitiveLoad: number;
  isBurnoutDetected: boolean;
  isCurious: boolean;
  physiologicalSignals: {
    typingRhythmStability: number;
    activityHoursVariance: number;
  };
  behavioralPatterns: {
    systematicReporting: boolean;
    cancelledTasksRate: number;
  };
  selfAssessment?: {
    energyLevel: number;
    stressLevel: number;
  };
}

export interface AuthorityModeConfig {
  userCanOverride: boolean;
  systemCanRefuse: boolean;
  canForceBreak: boolean;
}

export class AdaptiveAuthorityManager {
  private currentMode: AuthorityMode = 'NORMAL';
  private modeConfigs: Record<AuthorityMode, AuthorityModeConfig> = {
    NORMAL: {
      userCanOverride: true,
      systemCanRefuse: false,
      canForceBreak: false
    },
    PROTECTIVE: {
      userCanOverride: false,
      systemCanRefuse: true,
      canForceBreak: false
    },
    CRISIS: {
      userCanOverride: false,
      systemCanRefuse: true,
      canForceBreak: true
    }
  };

  // Déterminer le mode d'autorité basé sur le contexte utilisateur
  determineAuthorityMode(context: UserContext): AuthorityMode {
    // En état de burnout détecté, passage en mode protecteur
    if (context.isBurnoutDetected) {
      return 'PROTECTIVE';
    }

    // Charge cognitive élevée (> 70%) active le mode protecteur
    if (context.cognitiveLoad > 0.7) {
      return 'PROTECTIVE';
    }

    // Patterns comportementaux problématiques
    if (context.behavioralPatterns.systematicReporting || 
        context.behavioralPatterns.cancelledTasksRate > 0.5) {
      return 'PROTECTIVE';
    }

    // Signaux physiologiques instables
    if (context.physiologicalSignals.typingRhythmStability < 0.5 ||
        context.physiologicalSignals.activityHoursVariance > 0.8) {
      return 'PROTECTIVE';
    }

    // Sinon, mode normal
    return 'NORMAL';
  }

  // Obtenir la configuration du mode actuel
  getCurrentModeConfig(): AuthorityModeConfig {
    return this.modeConfigs[this.currentMode];
  }

  // Mettre à jour le mode d'autorité
  updateAuthorityMode(context: UserContext): AuthorityMode {
    const newMode = this.determineAuthorityMode(context);
    if (newMode !== this.currentMode) {
      logger.info('AUTHORITY_MODE_CHANGED', { from: this.currentMode, to: newMode });
      this.currentMode = newMode;
    }
    return this.currentMode;
  }

  // Appliquer les changements protecteurs automatiquement
  applyProtectiveChanges(): void {
    logger.info('PROTECTIVE_CHANGES_APPLIED: Mode protecteur activé');
    // Dans une implémentation réelle, cela appliquerait des changements
    // spécifiques pour protéger l'utilisateur (réduction de charge, etc.)
  }

  // Afficher une notification simple en mode protecteur
  showSimpleNotification(message: string): void {
    logger.info('NOTIFICATION', { message });
    // Dans une implémentation réelle, cela afficherait une notification
    // simple dans l'interface utilisateur
  }
}