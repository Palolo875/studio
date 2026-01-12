/**
 * SYSTEME DE VERSIONING DES DECISIONS - CORRECTION PHASE 3.3
 * Ajout du versioning pour assurer la reproductibilité des décisions
 * 
 * Correction de la faille : Pas de versioning de l'algorithme décisionnel
 */

// Interface pour le versioning des décisions
export interface BrainVersioningInfo {
  brainVersion: string;           // Version du cerveau décisionnel (ex: "3.2.1")
  rulesHash: string;             // Hash des règles appliquées
  algorithmState: any;           // État de l'algorithme au moment de la décision
  decisionTimestamp: Date;       // Horodatage de la décision
  decisionContextHash: string;   // Hash du contexte de décision
}

// Générateur de hash pour les règles
export function generateRulesHash(rules: any[]): string {
  // Créer une représentation textuelle des règles
  const rulesString = JSON.stringify(rules, Object.keys(rules).sort());
  
  // Générer un hash simple (dans une implémentation réelle, on utiliserait un vrai algorithme de hash)
  let hash = 0;
  for (let i = 0; i < rulesString.length; i++) {
    const char = rulesString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convertir en entier 32 bits
  }
  
  return hash.toString();
}

// Générateur de hash pour le contexte de décision
export function generateDecisionContextHash(context: any): string {
  // Créer une représentation textuelle du contexte
  const contextString = JSON.stringify(context, Object.keys(context).sort());
  
  // Générer un hash simple
  let hash = 0;
  for (let i = 0; i < contextString.length; i++) {
    const char = contextString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convertir en entier 32 bits
  }
  
  return hash.toString();
}

// Créateur d'information de versioning
export function createBrainVersioningInfo(
  brainVersion: string,
  rules: any[],
  algorithmState: any,
  decisionContext: any
): BrainVersioningInfo {
  return {
    brainVersion,
    rulesHash: generateRulesHash(rules),
    algorithmState,
    decisionTimestamp: new Date(),
    decisionContextHash: generateDecisionContextHash(decisionContext)
  };
}

// Interface étendue pour BrainDecision avec versioning
export interface EnhancedBrainDecision {
  // Propriétés existantes
  id: string;
  taskId: string;
  sessionId: string;
  timestamp: Date;
  
  // Contexte d'entrée complet (inputs)
  inputs: {
    energyState: 'low' | 'medium' | 'high';
    stability: 'volatile' | 'stable';
    linguisticFatigue: boolean;
    linguisticFatigueSignals?: string[];
    dailyBudget: {
      maxLoad: number;
      usedLoad: number;
      remaining: number;
      lockThreshold: number;
    };
    availableTime: number; // minutes
    currentTime: string; // ISO string
    timeOfDay: 'morning' | 'afternoon' | 'evening';
    taskCount: number;
    imposedCount: number;
    selfChosenCount: number;
    sessionBudget: {
      remaining: number;
      total: number;
    };
    temporalConstraints: any[]; // Contraintes temporelles
    behaviorHistory: any; // Historique de comportement
    decisionPolicy: any; // Politique de décision
    optimizationScope: any; // Scope d'optimisation
  };
  
  // Résultats de sortie (outputs)
  outputs: {
    allowed: boolean;
    allowedTasks: string[]; // IDs des tâches autorisées
    rejectedTasks: string[]; // IDs des tâches rejetées
    maxTasksCalculated: number;
    budgetConsumed: number;
    decisionMode: 'STRICT' | 'ASSISTED' | 'EMERGENCY';
  };
  
  // Explications détaillées
  explanations: {
    summary: string;
    perTask: Map<string, string>;
    reason: string; // Raison principale de la décision
    contextFactors: string[]; // Facteurs contextuels pris en compte
  };
  
  // Métriques de performance
  computeTimeMs: number; // Temps de calcul
  decisionType: 'ELIMINATION' | 'PRIORITY' | 'ALLOWANCE' | 'BLOCKAGE';
  
  // Traçabilité
  createdBy: 'SYSTEM' | 'USER_OVERRIDE';
  sourceModule: string; // Module qui a généré la décision
  
  // NOUVEAU : Information de versioning
  versioning: BrainVersioningInfo;
}

// Fonction utilitaire pour enrichir une décision avec les informations de versioning
export function enhanceDecisionWithVersioning(
  baseDecision: Omit<EnhancedBrainDecision, 'versioning'>,
  brainVersion: string,
  rules: any[],
  algorithmState: any
): EnhancedBrainDecision {
  const versioning = createBrainVersioningInfo(
    brainVersion,
    rules,
    algorithmState,
    baseDecision.inputs
  );
  
  return {
    ...baseDecision,
    versioning
  };
}

// Système de gestion des versions pour assurer la reproductibilité
export class DecisionReproducibilityManager {
  private versionHistory: Map<string, BrainVersioningInfo> = new Map();
  
  // Enregistrer une version pour une décision
  recordDecisionVersion(decisionId: string, versionInfo: BrainVersioningInfo): void {
    this.versionHistory.set(decisionId, versionInfo);
  }
  
  // Récupérer les informations de version pour une décision
  getDecisionVersion(decisionId: string): BrainVersioningInfo | undefined {
    return this.versionHistory.get(decisionId);
  }
  
  // Vérifier si une décision est reproductible
  isDecisionReproducible(decisionId: string): boolean {
    return this.versionHistory.has(decisionId);
  }
  
  // Comparer deux décisions basées sur leur version
  compareDecisions(decisionId1: string, decisionId2: string): boolean {
    const version1 = this.versionHistory.get(decisionId1);
    const version2 = this.versionHistory.get(decisionId2);
    
    if (!version1 || !version2) {
      return false;
    }
    
    // Comparer les versions et les contextes
    return version1.brainVersion === version2.brainVersion && 
           version1.rulesHash === version2.rulesHash &&
           version1.decisionContextHash === version2.decisionContextHash;
  }
  
  // Obtenir l'historique des versions
  getVersionHistory(): BrainVersioningInfo[] {
    return Array.from(this.versionHistory.values());
  }
  
  // Obtenir les décisions par version de cerveau
  getDecisionsByVersion(version: string): string[] {
    return Array.from(this.versionHistory.entries())
      .filter(([_, info]) => info.brainVersion === version)
      .map(([id, _]) => id);
  }
}

// Constantes pour les messages de versioning
export const VERSIONING_MESSAGES = {
  DECISION_REPRODUCTIBLE: (id: string) => `Décision ${id} est reproductible`,
  DECISION_NOT_REPRODUCTIBLE: (id: string) => `Décision ${id} n'est pas reproductible - manque d'information de version`,
  VERSION_MISMATCH: (id1: string, id2: string) => `Les décisions ${id1} et ${id2} ont été prises avec des versions différentes du cerveau`
};