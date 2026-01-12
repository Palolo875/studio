/**
 * POLICY DE DÉCISION SÉCURISÉE - CORRECTION DE LA PHASE 3
 * Ajoute des garde-fous pour empêcher la dérive de DecisionPolicy
 * 
 * CORRECTION DE LA FAILLE 2 : Sécurisation de DecisionPolicy contre la dérive
 */

import { DecisionPolicyLevel } from '../phase3Contracts';

// Interface étendue pour DecisionPolicy avec des garde-fous
export interface SecureDecisionPolicy {
  level: DecisionPolicyLevel;
  consentRequired: boolean;
  consentGiven: boolean;
  consentTimestamp?: Date;
  canRevoke: boolean;
  overrideCostVisible: boolean;
  
  // NOUVEAU : Garde-fous supplémentaires
  maxDuration?: number;           // Durée maximale en ms (ex: 1 session = 8h = 28800000ms)
  scope: PolicyScope;            // Quelles tâches concernées
  autoDowngrade: boolean;        // Retour forcé à STRICT
  activationCount?: number;      // Compteur d'activation pour limiter la répétition
  lastActivation?: Date;         // Dernière activation pour éviter la persistance silencieuse
  downgradeCondition?: DowngradeCondition; // Conditions pour le downgrade automatique
}

// Définition de la portée de la politique
export interface PolicyScope {
  taskOrigins: ('IMPOSED' | 'SELF_CHOSEN')[]; // Quels types de tâches sont concernés
  taskCategories?: string[];                   // Catégories spécifiques
  timeWindows?: TimeWindow[];                  // Plages horaires autorisées
  maxTasks?: number;                          // Nombre maximum de tâches concernées
}

// Fenêtre temporelle
export interface TimeWindow {
  startHour: number;
  endHour: number;
  daysOfWeek?: number[]; // 0 = dimanche, 1 = lundi, etc.
}

// Condition de downgrade
export type DowngradeCondition = 
  | { type: 'time_elapsed'; maxDurationMs: number }
  | { type: 'session_end' }
  | { type: 'manual_trigger' }
  | { type: 'automatic_after_use'; usesBeforeDowngrade: number }
  | { type: 'user_idle'; idleTimeBeforeDowngradeMs: number };

// Interface pour le gestionnaire de sécurité des politiques
export interface PolicySecurityManager {
  validatePolicy(policy: SecureDecisionPolicy): PolicyValidationResult;
  enforceAutoDowngrade(policy: SecureDecisionPolicy): SecureDecisionPolicy;
  checkDriftConditions(policy: SecureDecisionPolicy): DriftDetectionResult;
  updatePolicyUsage(policy: SecureDecisionPolicy): SecureDecisionPolicy;
}

// Résultat de validation
export interface PolicyValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  securityScore: number; // 0-100
}

// Résultat de détection de dérive
export interface DriftDetectionResult {
  hasDrift: boolean;
  driftFactors: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  recommendedAction: 'ALLOW' | 'WARN' | 'RESTRICT' | 'FORCED_DOWNGRADE';
}

// Gestionnaire de sécurité pour DecisionPolicy
export class SecureDecisionPolicyManager implements PolicySecurityManager {
  private readonly DEFAULT_MAX_DURATION = 8 * 60 * 60 * 1000; // 8 heures en ms
  private readonly DEFAULT_MAX_ACTIVATIONS = 1; // Une seule activation par défaut
  
  validatePolicy(policy: SecureDecisionPolicy): PolicyValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Vérifier les conditions obligatoires pour ASSISTED et EMERGENCY
    if (policy.level !== 'STRICT') {
      if (!policy.consentRequired) {
        errors.push(`Erreur: Le niveau ${policy.level} doit toujours requérir un consentement explicite`);
      }
      
      if (!policy.autoDowngrade) {
        errors.push(`Erreur: Le niveau ${policy.level} doit avoir autoDowngrade activé pour éviter la persistance`);
      }
    }
    
    // Vérifier la durée maximale
    if (policy.level === 'EMERGENCY' && !policy.maxDuration) {
      warnings.push('Avertissement: Le niveau EMERGENCY devrait avoir une durée maximale définie');
    } else if (policy.maxDuration && policy.maxDuration > this.DEFAULT_MAX_DURATION) {
      errors.push(`Erreur: La durée maximale dépasse la limite autorisée (${this.DEFAULT_MAX_DURATION}ms)`);
    }
    
    // Vérifier la portée
    if (!policy.scope || policy.scope.taskOrigins.length === 0) {
      errors.push('Erreur: La portée de la politique doit être définie');
    }
    
    // Vérifier que ASSISTED et EMERGENCY ne deviennent pas persistants silencieusement
    if (policy.level !== 'STRICT' && !policy.downgradeCondition) {
      errors.push(`Erreur: Le niveau ${policy.level} doit avoir une condition de downgrade pour éviter la persistance silencieuse`);
    }
    
    // Calculer le score de sécurité
    const maxScore = 100;
    const errorPenalty = errors.length * 15;
    const warningPenalty = warnings.length * 5;
    const securityScore = Math.max(0, maxScore - errorPenalty - warningPenalty);
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      securityScore
    };
  }
  
  enforceAutoDowngrade(policy: SecureDecisionPolicy): SecureDecisionPolicy {
    // Si le mode n'est pas STRICT et qu'il devrait être downgrade
    if (policy.level !== 'STRICT' && this.shouldDowngrade(policy)) {
      return {
        ...policy,
        level: 'STRICT',
        consentGiven: false,
        activationCount: 0,
        lastActivation: new Date(),
        downgradeCondition: undefined
      };
    }
    
    return policy;
  }
  
  checkDriftConditions(policy: SecureDecisionPolicy): DriftDetectionResult {
    const driftFactors: string[] = [];
    
    // Vérifier la durée d'activation
    if (policy.lastActivation) {
      const elapsed = Date.now() - policy.lastActivation.getTime();
      if (policy.maxDuration && elapsed > policy.maxDuration) {
        driftFactors.push('Durée maximale dépassée');
      }
    }
    
    // Vérifier le nombre d'activations
    if (policy.activationCount && policy.activationCount > this.DEFAULT_MAX_ACTIVATIONS) {
      driftFactors.push('Trop d\'activations répétées');
    }
    
    // Vérifier si le mode est devenu silencieusement persistant
    if (policy.level !== 'STRICT' && !policy.downgradeCondition) {
      driftFactors.push('Mode non-STRICT sans condition de downgrade');
    }
    
    // Déterminer le niveau de risque
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    if (driftFactors.length >= 2) {
      riskLevel = 'HIGH';
    } else if (driftFactors.length === 1) {
      riskLevel = 'MEDIUM';
    }
    
    // Déterminer l'action recommandée
    let recommendedAction: 'ALLOW' | 'WARN' | 'RESTRICT' | 'FORCED_DOWNGRADE' = 'ALLOW';
    if (riskLevel === 'HIGH') {
      recommendedAction = 'FORCED_DOWNGRADE';
    } else if (riskLevel === 'MEDIUM') {
      recommendedAction = 'WARN';
    }
    
    return {
      hasDrift: driftFactors.length > 0,
      driftFactors,
      riskLevel,
      recommendedAction
    };
  }
  
  updatePolicyUsage(policy: SecureDecisionPolicy): SecureDecisionPolicy {
    return {
      ...policy,
      activationCount: (policy.activationCount || 0) + 1,
      lastActivation: new Date()
    };
  }
  
  private shouldDowngrade(policy: SecureDecisionPolicy): boolean {
    if (!policy.downgradeCondition) {
      return policy.level !== 'STRICT'; // Si pas de condition, forcer le downgrade
    }
    
    switch (policy.downgradeCondition.type) {
      case 'time_elapsed':
        if (policy.lastActivation) {
          const elapsed = Date.now() - policy.lastActivation.getTime();
          return elapsed > policy.downgradeCondition.maxDurationMs;
        }
        return false;
        
      case 'session_end':
        // Cette logique serait gérée par le cycle de vie de session
        return false; // Géré ailleurs
        
      case 'automatic_after_use':
        return (policy.activationCount || 0) >= policy.downgradeCondition.usesBeforeDowngrade;
        
      case 'user_idle':
        // Cette logique nécessiterait un suivi d'activité utilisateur
        return false; // Géré ailleurs
        
      case 'manual_trigger':
        return false; // Déclenché manuellement
      
      default:
        return false;
    }
  }
  
  // Créer une politique sécurisée avec des valeurs par défaut sûres
  createSecurePolicy(
    level: DecisionPolicyLevel, 
    consentGiven: boolean,
    customScope?: Partial<PolicyScope>,
    downgradeCondition?: DowngradeCondition
  ): SecureDecisionPolicy {
    const basePolicy: SecureDecisionPolicy = {
      level,
      consentRequired: level !== 'STRICT',
      consentGiven,
      canRevoke: true,
      overrideCostVisible: true,
      scope: {
        taskOrigins: ['IMPOSED'], // Par défaut, uniquement pour les tâches imposées
        ...customScope
      },
      autoDowngrade: true,
      activationCount: 0,
      lastActivation: new Date(),
      downgradeCondition: downgradeCondition || {
        type: 'time_elapsed',
        maxDurationMs: level === 'EMERGENCY' ? 4 * 60 * 60 * 1000 : 8 * 60 * 60 * 1000 // 4h pour EMERGENCY, 8h pour ASSISTED
      }
    };
    
    // Définir la durée maximale en fonction du niveau
    if (level === 'EMERGENCY') {
      basePolicy.maxDuration = 4 * 60 * 60 * 1000; // 4 heures max pour EMERGENCY
    } else if (level === 'ASSISTED') {
      basePolicy.maxDuration = 8 * 60 * 60 * 1000; // 8 heures max pour ASSISTED
    }
    
    return basePolicy;
  }
}

// Interface pour le contrôleur de politique décisionnelle
export interface DecisionPolicyController {
  setActivePolicy(policy: SecureDecisionPolicy): void;
  getActivePolicy(): SecureDecisionPolicy | null;
  validateAndApplyPolicy(newPolicy: SecureDecisionPolicy): SecureDecisionPolicy | null;
  checkForPolicyDrift(): DriftDetectionResult;
  forcePolicyDowngrade(): SecureDecisionPolicy | null;
}

// Contrôleur de politique décisionnelle avec sécurité intégrée
export class SecureDecisionPolicyController implements DecisionPolicyController {
  private activePolicy: SecureDecisionPolicy | null = null;
  private securityManager: SecureDecisionPolicyManager;
  
  constructor() {
    this.securityManager = new SecureDecisionPolicyManager();
  }
  
  setActivePolicy(policy: SecureDecisionPolicy): void {
    const validationResult = this.securityManager.validatePolicy(policy);
    
    if (!validationResult.isValid) {
      throw new Error(`Politique invalide: ${validationResult.errors.join(', ')}`);
    }
    
    this.activePolicy = this.securityManager.updatePolicyUsage(policy);
  }
  
  getActivePolicy(): SecureDecisionPolicy | null {
    if (!this.activePolicy) {
      return null;
    }
    
    // Appliquer le downgrade automatique si nécessaire
    const updatedPolicy = this.securityManager.enforceAutoDowngrade(this.activePolicy);
    if (updatedPolicy !== this.activePolicy) {
      this.activePolicy = updatedPolicy;
    }
    
    return this.activePolicy;
  }
  
  validateAndApplyPolicy(newPolicy: SecureDecisionPolicy): SecureDecisionPolicy | null {
    const validationResult = this.securityManager.validatePolicy(newPolicy);
    
    if (!validationResult.isValid) {
      console.warn('Politique refusée pour raison de sécurité:', validationResult.errors);
      return null;
    }
    
    // Vérifier les conditions de dérive
    const driftResult = this.securityManager.checkDriftConditions(newPolicy);
    if (driftResult.riskLevel === 'CRITICAL' || driftResult.recommendedAction === 'FORCED_DOWNGRADE') {
      console.warn('Politique avec risque de dérive détecté:', driftResult.driftFactors);
      // Forcer le downgrade dans ce cas
      return this.securityManager.enforceAutoDowngrade(newPolicy);
    }
    
    this.setActivePolicy(newPolicy);
    return this.activePolicy;
  }
  
  checkForPolicyDrift(): DriftDetectionResult {
    if (!this.activePolicy) {
      return {
        hasDrift: false,
        driftFactors: [],
        riskLevel: 'LOW',
        recommendedAction: 'ALLOW'
      };
    }
    
    return this.securityManager.checkDriftConditions(this.activePolicy);
  }
  
  forcePolicyDowngrade(): SecureDecisionPolicy | null {
    if (!this.activePolicy) {
      return null;
    }
    
    this.activePolicy = this.securityManager.enforceAutoDowngrade(this.activePolicy);
    return this.activePolicy;
  }
}

// Constantes pour les messages de sécurité
export const POLICY_SECURITY_MESSAGES = {
  DOWNGRADE_FORCED: (level: DecisionPolicyLevel) => 
    `Politique ${level} downgrade automatique activé pour éviter la dérive. Retour à STRICT.`,
    
  DRIFT_DETECTED: (factors: string[]) => 
    `Risque de dérive détecté: ${factors.join(', ')}. Application de mesures correctives.`,
    
  POLICY_REJECTED: (errors: string[]) => 
    `Politique refusée pour raison de sécurité: ${errors.join(', ')}`
};

// Fonction utilitaire pour créer une politique de niveau EMERGENCY sécurisée
export function createSecureEmergencyPolicy(
  consentGiven: boolean,
  customScope?: Partial<PolicyScope>
): SecureDecisionPolicy {
  const controller = new SecureDecisionPolicyController();
  return controller['securityManager'].createSecurePolicy(
    'EMERGENCY',
    consentGiven,
    customScope,
    { type: 'time_elapsed', maxDurationMs: 4 * 60 * 60 * 1000 } // 4 heures
  );
}

// Fonction utilitaire pour créer une politique de niveau ASSISTED sécurisée
export function createSecureAssistedPolicy(
  consentGiven: boolean,
  customScope?: Partial<PolicyScope>
): SecureDecisionPolicy {
  const controller = new SecureDecisionPolicyController();
  return controller['securityManager'].createSecurePolicy(
    'ASSISTED',
    consentGiven,
    customScope,
    { type: 'time_elapsed', maxDurationMs: 8 * 60 * 60 * 1000 } // 8 heures
  );
}