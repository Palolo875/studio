/**
 * INDEX DE LA PHASE 3 - CERVEAU DÉCISIONNEL
 * Point d'entrée central pour tous les composants de la Phase 3
 * 
 * Intègre les corrections apportées au Contre-audit Final de la Phase 3
 */

// Exporter tous les composants de la Phase 3
export * from './OptimizationScope';
export * from './SecureDecisionPolicy';
export * from './OutcomeTypeSystem';
export * from '../phase3Contracts';

// Fonction utilitaire pour initialiser un système de cerveau décisionnel conforme aux corrections de la Phase 3
export interface Phase3BrainConfig {
  optimizationScope?: import('./OptimizationScope').OptimizationScope;
  enableSecureDecisionPolicy?: boolean;
  outcomePreferences?: import('./OutcomeTypeSystem').OutcomePreferences;
}

// Initialiser un contrôleur de politique décisionnelle sécurisée
export function initializeSecureDecisionController(): import('./SecureDecisionPolicy').SecureDecisionPolicyController {
  return new SecureDecisionPolicyController();
}

// Initialiser un classifieur de type de résultat
export function initializeOutcomeClassifier(): import('./OutcomeTypeSystem').OutcomeTypeClassifier {
  return new OutcomeTypeClassifierImpl();
}

// Initialiser un gestionnaire de résultats basé sur les résultats
export function initializeOutcomeManager(): import('./OutcomeTypeSystem').OutcomeBasedManager {
  return new OutcomeBasedManagerImpl();
}

// Initialiser le scope d'optimisation par défaut
export function getDefaultOptimizationScope(): import('./OptimizationScope').OptimizationScope {
  return DEFAULT_OPTIMIZATION_SCOPE;
}

// Initialiser les préférences de résultat par défaut
export function getDefaultOutcomePreferences(): import('./OutcomeTypeSystem').OutcomePreferences {
  return DEFAULT_OUTCOME_PREFERENCES;
}

// Fonction pour créer une politique décisionnelle sécurisée pour un niveau donné
export function createSecureDecisionPolicy(
  level: import('../phase3Contracts').DecisionPolicyLevel,
  consentGiven: boolean
): import('./SecureDecisionPolicy').SecureDecisionPolicy {
  const controller = initializeSecureDecisionController();
  return controller['securityManager'].createSecurePolicy(level, consentGiven);
}

// Fonction pour classifier un résultat de tâche
export function classifyTaskOutcome(
  taskDescription: string,
  taskAction: string,
  taskObject: string
): import('./OutcomeTypeSystem').OutcomeClassificationResult {
  const classifier = initializeOutcomeClassifier();
  return classifier.classifyTaskOutcome(taskDescription, taskAction, taskObject);
}

// Fonction pour convertir un ancien résultat tangible en nouveau format
export function convertToOutcomeBasedResult(
  taskId: string,
  tangibleResult: boolean,
  taskDescription: string,
  taskAction: string,
  taskObject: string
): import('./OutcomeTypeSystem').OutcomeBasedTaskResult {
  return convertTangibleResult(taskId, tangibleResult, taskDescription, taskAction, taskObject);
}

// Fonction pour vérifier si une décision d'optimisation est autorisée
export function validateOptimizationTarget(
  target: import('./OptimizationScope').OptimizationDomain
): import('./OptimizationScope').BrainDecisionWithOptimizationCheck {
  return validateBrainDecisionOptimization(target);
}

export {
  // Classes
  OptimizationScopeValidator,
  SecureDecisionPolicyManager,
  SecureDecisionPolicyController,
  OutcomeTypeClassifierImpl,
  OutcomeBasedManagerImpl,
  
  // Fonctions utilitaires
  validateBrainDecisionOptimization,
  convertTangibleResult,
  createSecureEmergencyPolicy,
  createSecureAssistedPolicy,
  
  // Constantes
  DEFAULT_OPTIMIZATION_SCOPE,
  DEFAULT_OUTCOME_PREFERENCES,
  OPTIMIZATION_MESSAGES,
  POLICY_SECURITY_MESSAGES,
  
  // Types
  type OptimizationDomain,
  type OutcomeType,
  type DecisionPolicyLevel,
  type SecureDecisionPolicy,
  type OutcomeBasedTaskResult
};