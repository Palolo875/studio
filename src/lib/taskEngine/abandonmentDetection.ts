// Système de détection d'abandon - Phase 3.8
import { BrainDecision } from './brainContracts';

/**
 * État d'inactivité utilisateur
 */
export interface InactivityState {
  lastUserActionAt: Date;
  inactivityDurationDays: number;
  status: "ACTIVE" | "PAUSED" | "DORMANT";
}

/**
 * Seuils d'inactivité
 */
export interface InactivityThresholds {
  activeToPausedDays: number; // Jours d'inactivité pour passer d'ACTIF à PAUSE
  pausedToDormantDays: number; // Jours d'inactivité pour passer de PAUSE à DORMANT
}

/**
 * Politique de retour après inactivité
 */
export interface ReturnPolicy {
  resetOverdueFlags: boolean;
  preserveHistory: boolean;
  recalcTodayContext: boolean;
}

/**
 * Session de retour après inactivité
 */
export interface ReturnSession {
  mode: "RECOVERY";
  maxTasks: number;
  explanationLevel: "MINIMAL";
  timestamp: Date;
}

/**
 * Gestionnaire de détection d'abandon
 */
export class AbandonmentDetector {
  private inactivityState: InactivityState;
  private thresholds: InactivityThresholds;
  private returnSessions: ReturnSession[] = [];

  constructor(thresholds?: InactivityThresholds) {
    this.thresholds = thresholds || {
      activeToPausedDays: 3,
      pausedToDormantDays: 7
    };

    // Initialiser l'état d'inactivité
    this.inactivityState = {
      lastUserActionAt: new Date(),
      inactivityDurationDays: 0,
      status: "ACTIVE"
    };
  }

  /**
   * Met à jour l'état d'inactivité basé sur la dernière action utilisateur
   */
  updateUserActivity(lastActionAt: Date = new Date()): void {
    this.inactivityState.lastUserActionAt = lastActionAt;

    const now = new Date();
    const diffTime = Math.abs(now.getTime() - lastActionAt.getTime());
    const diffHours = diffTime / (1000 * 60 * 60);
    const diffDays = diffHours / 24;

    this.inactivityState.inactivityDurationDays = Math.floor(diffDays);

    // Phase 3.5.3/3.8.3 : Silent Recovery Mode trigger (48h)
    if (diffHours >= 48 && diffDays < this.thresholds.pausedToDormantDays) {
      this.inactivityState.status = "PAUSED";
      console.log("[AbandonmentDetection] Mode SILENCE activé (48h d'inactivité)");
    } else if (diffDays >= this.thresholds.pausedToDormantDays) {
      this.inactivityState.status = "DORMANT";
    } else {
      this.inactivityState.status = "ACTIVE";
    }
  }

  /**
   * Phase 3.8.3 : Ré-entrée productive immédiate
   */
  prepareReturnSession(): ReturnSession {
    const session: ReturnSession = {
      mode: "RECOVERY",
      maxTasks: 2, // Loi 5 : retour sans surcharge
      explanationLevel: "MINIMAL",
      timestamp: new Date()
    };

    this.returnSessions.push(session);
    console.log("[AbandonmentDetection] Session RECOVERY préparée (Zéro punition)");
    return session;
  }

  /**
   * Phase 3.8.6 : Absence Longue (>90 jours)
   */
  checkLongAbsence(): boolean {
    return this.inactivityState.inactivityDurationDays >= 90;
  }
}

// Instance singleton pour la détection d'abandon
export const abandonmentDetector = new AbandonmentDetector();

/**
 * Politique de retour par défaut
 */
export const DEFAULT_RETURN_POLICY: ReturnPolicy = {
  resetOverdueFlags: true,
  preserveHistory: true,
  recalcTodayContext: true
};

/**
 * Vérifie l'état d'inactivité et prend les mesures appropriées
 */
export function checkAndHandleInactivity(): void {
  const state = abandonmentDetector.getInactivityState();

  switch (state.status) {
    case "ACTIVE":
      // Rien à faire, l'utilisateur est actif
      break;

    case "PAUSED":
      console.log(`[AbandonmentDetection] Utilisateur inactif depuis ${state.inactivityDurationDays} jours`);
      // Possibilité d'envoyer une notification passive
      break;

    case "DORMANT":
      console.log(`[AbandonmentDetection] Utilisateur dormant depuis ${state.inactivityDurationDays} jours`);
      // Préparer une session de retour
      abandonmentDetector.prepareReturnSession();
      break;
  }
}

/**
 * Gère le retour de l'utilisateur après une période d'inactivité
 */
export function handleUserReturn(): void {
  console.log("[AbandonmentDetection] Gestion du retour utilisateur");

  // Appliquer la politique de retour
  abandonmentDetector.applyReturnPolicy(DEFAULT_RETURN_POLICY);

  // Préparer une session de retour
  const returnSession = abandonmentDetector.prepareReturnSession();

  console.log(`[AbandonmentDetection] Session de retour créée: ${JSON.stringify(returnSession)}`);
}