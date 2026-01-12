/**
 * COACH SAFETY SYSTEM - PHASE 3.2
 * Implémentation des invariants critiques pour la sécurité du Coach IA
 * 
 * Couvre les besoins identifiés dans la méta-analyse :
 * - Bulle cognitive (XVIII - ALWAYS_SHOW_BRAIN_REASON)
 * - Dégradation forcée (XIX - invoke_coach_safe)
 * - Kill Switch Coach
 * - Override réversible
 */

// Invariant XVIII - Visibilité du cerveau brut
export interface CoachVisibilityConfig {
  ALWAYS_SHOW_BRAIN_REASON: boolean;  // Le cerveau explique toujours
  COACH_IS_ADDON: boolean;            // Le Coach reformule, ne remplace pas
  SHOW_COACH_OPTIONAL: boolean;       // Coach en mode optionnel
}

export const DEFAULT_COACH_VISIBILITY: CoachVisibilityConfig = {
  ALWAYS_SHOW_BRAIN_REASON: true,
  COACH_IS_ADDON: true,
  SHOW_COACH_OPTIONAL: true
};

// Invariant XIX - Dégradation forcée du Coach
export interface CoachPolicy {
  maxTimeout: number;              // ms
  fallbackToBrain: boolean;        // Retour au cerveau brut en cas d'échec
  gracefulDegradation: boolean;    // Dégradation gracieuse
  userCanDisable: boolean;         // L'utilisateur peut désactiver
  maxExplanationsPerSession: number; // Budget explications
  maxExplanationsPerDay: number;   // Budget explications journalier
}

export const DEFAULT_COACH_POLICY: CoachPolicy = {
  maxTimeout: 200,                // 200ms max
  fallbackToBrain: true,          // Toujours retourner au cerveau brut
  gracefulDegradation: true,      // Dégradation gracieuse
  userCanDisable: true,           // Désactivation possible
  maxExplanationsPerSession: 3,   // Max 3 explications par session
  maxExplanationsPerDay: 10       // Max 10 explications par jour
};

// Structure de réponse du Coach avec gestion d'échec
export interface CoachResponse {
  type: 'SUGGESTION' | 'WARNING' | 'INFO' | 'INVALID_RESPONSE';
  message: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  canBeDisabled: boolean;
  timestamp: Date;
}

// Fonction pour invoquer le Coach en mode sécurisé
export async function invokeCoachSafe(
  request: CoachRequest,
  policy: CoachPolicy = DEFAULT_COACH_POLICY
): Promise<CoachResponse | null> {
  try {
    // Créer une promesse avec timeout
    const timeoutPromise = new Promise<null>((_, reject) => {
      setTimeout(() => reject(new Error('TIMEOUT')), policy.maxTimeout);
    });

    // Appeler le Coach
    const coachPromise = callCoachAI(request);

    // Attendre soit la réponse du Coach, soit le timeout
    const response = await Promise.race([coachPromise, timeoutPromise]);
    
    // Vérifier si la réponse est valide
    if (response && isValidCoachResponse(response)) {
      return response;
    }
    
    return null; // Réponse invalide, on retourne null
  } catch (error) {
    // En cas d'erreur (timeout, exception, etc.), on retourne null
    console.warn('Coach unavailable, falling back to brain-only mode:', error);
    return null;
  }
}

// Simuler l'appel à l'IA du Coach
async function callCoachAI(request: CoachRequest): Promise<CoachResponse> {
  // Simulation d'un appel à l'IA du Coach
  // Dans la vraie implémentation, cela irait vers Claude ou un autre service
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        type: 'SUGGESTION',
        message: request.prompt,
        priority: 'MEDIUM',
        canBeDisabled: true,
        timestamp: new Date()
      });
    }, 100); // Simuler un délai
  });
}

// Valider la réponse du Coach
function isValidCoachResponse(response: CoachResponse): boolean {
  // Vérifier que la réponse ne viole pas les contrats du Coach
  if (response.type === 'INVALID_RESPONSE') {
    return false;
  }
  
  // Autres validations...
  return true;
}

// Interface pour les requêtes au Coach
export interface CoachRequest {
  prompt: string;
  context: any; // Contexte de la requête
  timeout?: number; // Timeout spécifique pour cette requête
}

// Structure pour les overrides réversibles
export interface ReversibleOverride {
  id: string;
  taskId: string;
  sessionId: string;
  timestamp: Date;
  
  // Informations sur l'invariant touché
  invariantTouched: string;
  userReason?: string;
  estimatedCognitiveDebt: number;
  acknowledged: boolean;
  
  // Informations pour la réversibilité
  reversible: boolean;
  undoWindow: number; // ms (1h = 3600000ms)
  undoAvailableUntil: Date;
  
  // Résultats
  succeeded: boolean;
  actualCost?: number;
  userRegretted?: boolean;
  
  // Informations de tracking
  createdBy: 'USER' | 'SYSTEM';
  source: 'COACH' | 'BRAIN' | 'MANUAL';
}

// Gestionnaire des overrides réversibles
export class ReversibleOverrideManager {
  private activeOverrides: Map<string, ReversibleOverride> = new Map();
  
  createOverride(override: Omit<ReversibleOverride, 'undoAvailableUntil'>): ReversibleOverride {
    const now = new Date();
    const undoAvailableUntil = new Date(now.getTime() + override.undoWindow);
    
    const fullOverride: ReversibleOverride = {
      ...override,
      undoAvailableUntil
    };
    
    this.activeOverrides.set(fullOverride.id, fullOverride);
    return fullOverride;
  }
  
  canUndo(overrideId: string): boolean {
    const override = this.activeOverrides.get(overrideId);
    if (!override) {
      return false;
    }
    
    const now = new Date();
    return now <= override.undoAvailableUntil;
  }
  
  undoOverride(overrideId: string): boolean {
    if (!this.canUndo(overrideId)) {
      return false;
    }
    
    const override = this.activeOverrides.get(overrideId);
    if (!override) {
      return false;
    }
    
    // Marquer comme regretté et rembourser le coût
    const updatedOverride = {
      ...override,
      userRegretted: true
    };
    
    this.activeOverrides.set(overrideId, updatedOverride);
    return true;
  }
  
  getActiveOverrides(): ReversibleOverride[] {
    return Array.from(this.activeOverrides.values());
  }
  
  getExpiredOverrides(): ReversibleOverride[] {
    const now = new Date();
    return Array.from(this.activeOverrides.values())
      .filter(override => now > override.undoAvailableUntil);
  }
  
  cleanupExpired(): void {
    const expired = this.getExpiredOverrides();
    for (const override of expired) {
      this.activeOverrides.delete(override.id);
    }
  }
}

// Interface pour le Kill Switch Coach
export interface CoachKillSwitch {
  isActive: boolean;
  disabledUntil?: Date;
  lastToggle: Date;
  toggleCount: number;
  reasonLastUsed?: string;
}

// Manager pour le Kill Switch Coach
export class CoachKillSwitchManager {
  private killSwitch: CoachKillSwitch = {
    isActive: false,
    lastToggle: new Date(0),
    toggleCount: 0
  };
  
  // Activer le Kill Switch pour une période donnée
  activate(durationMs: number = 24 * 60 * 60 * 1000, reason?: string): CoachKillSwitch {
    const now = new Date();
    const disabledUntil = new Date(now.getTime() + durationMs);
    
    this.killSwitch = {
      isActive: true,
      disabledUntil,
      lastToggle: now,
      toggleCount: this.killSwitch.toggleCount + 1,
      reasonLastUsed: reason
    };
    
    return this.killSwitch;
  }
  
  // Désactiver le Kill Switch
  deactivate(): CoachKillSwitch {
    this.killSwitch.isActive = false;
    this.killSwitch.disabledUntil = undefined;
    return this.killSwitch;
  }
  
  // Vérifier si le Coach est actuellement désactivé
  isCoachDisabled(): boolean {
    if (!this.killSwitch.isActive) {
      return false;
    }
    
    if (this.killSwitch.disabledUntil) {
      return new Date() <= this.killSwitch.disabledUntil;
    }
    
    return this.killSwitch.isActive;
  }
  
  // Obtenir l'état actuel du Kill Switch
  getState(): CoachKillSwitch {
    return { ...this.killSwitch };
  }
}

// Fonction utilitaire pour vérifier si le Coach est disponible
export function isCoachAvailable(coachPolicy: CoachPolicy, killSwitch: CoachKillSwitch): boolean {
  return coachPolicy.userCanDisable && !killSwitch.isActive && 
         (!killSwitch.disabledUntil || new Date() > killSwitch.disabledUntil);
}

// Constantes pour les messages de sécurité
export const COACH_SAFETY_MESSAGES = {
  FALLBACK_TO_BRAIN: () => "Le coach est indisponible. Voici la décision brute du cerveau.",
  KILL_SWITCH_ACTIVATED: (durationHours: number) => 
    `Coach désactivé pour ${durationHours}h. Affichage du cerveau brut.`,
  REVERSIBLE_OVERRIDE: (cost: number) => 
    `Vous pouvez annuler cet override dans l'heure sans coût supplémentaire. Coût estimé: ${cost}%`,
  EXPLANATION_BUDGET_EXCEEDED: () => 
    "Limite d'explications atteinte. Affichage d'informations essentielles uniquement."
};