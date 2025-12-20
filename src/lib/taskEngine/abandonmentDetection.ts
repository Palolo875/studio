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
    
    // Calculer la durée d'inactivité en jours
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - lastActionAt.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    this.inactivityState.inactivityDurationDays = diffDays;
    
    // Mettre à jour le statut
    if (diffDays < this.thresholds.activeToPausedDays) {
      this.inactivityState.status = "ACTIVE";
    } else if (diffDays < this.thresholds.pausedToDormantDays) {
      this.inactivityState.status = "PAUSED";
    } else {
      this.inactivityState.status = "DORMANT";
    }
    
    console.log(`[AbandonmentDetection] État d'inactivité mis à jour: ${this.inactivityState.status}`);
  }
  
  /**
   * Obtient l'état d'inactivité actuel
   */
  getInactivityState(): InactivityState {
    return { ...this.inactivityState };
  }
  
  /**
   * Vérifie si l'utilisateur est considéré comme abandonnant
   */
  isUserAbandoning(): boolean {
    return this.inactivityState.status === "DORMANT";
  }
  
  /**
   * Vérifie si l'utilisateur est inactif mais pas encore abandonnant
   */
  isUserInactiveButNotAbandoning(): boolean {
    return this.inactivityState.status === "PAUSED";
  }
  
  /**
   * Prépare une session de retour après inactivité
   */
  prepareReturnSession(): ReturnSession {
    const session: ReturnSession = {
      mode: "RECOVERY",
      maxTasks: 2, // Maximum 2 tâches pour commencer
      explanationLevel: "MINIMAL", // Explications minimales
      timestamp: new Date()
    };
    
    this.returnSessions.push(session);
    
    console.log("[AbandonmentDetection] Session de retour préparée");
    return session;
  }
  
  /**
   * Applique la politique de retour
   */
  applyReturnPolicy(policy: ReturnPolicy): void {
    console.log("[AbandonmentDetection] Application de la politique de retour:", policy);
    
    if (policy.resetOverdueFlags) {
      console.log("[AbandonmentDetection] Réinitialisation des drapeaux de retard");
    }
    
    if (policy.recalcTodayContext) {
      console.log("[AbandonmentDetection] Recalcul du contexte du jour");
    }
    
    // Mettre à jour l'état d'inactivité
    this.updateUserActivity();
  }
  
  /**
   * Obtient les sessions de retour
   */
  getReturnSessions(): ReturnSession[] {
    return [...this.returnSessions];
  }
  
  /**
   * Réinitialise l'état d'inactivité
   */
  reset(): void {
    this.inactivityState = {
      lastUserActionAt: new Date(),
      inactivityDurationDays: 0,
      status: "ACTIVE"
    };
    this.returnSessions = [];
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