/**
 * Contrat de sortie NLP strict avec garanties négatives complètes
 * Ce contrat définit le format de sortie du module NLP avec des garanties
 * explicites sur ce qui a été fait et ce qui n'a pas été fait.
 * 
 * CORRECTION DE LA PHASE 2 : Ajout des garanties négatives explicites
 */

// Interface pour les garanties NLP complètes
export interface NLPGuarantees {
  // Ce qui n'a PAS été fait (garanties négatives)
  not_inferred: boolean;      // Rien n'a été deviné ou supposé
  not_corrected: boolean;     // Texte original non modifié
  not_decided: boolean;       // Aucune décision métier prise
  not_prioritized: boolean;   // Aucune priorité assignée
  not_interpreted: boolean;   // Aucune interprétation subjective
  reversible: boolean;        // Peut être défait ou annulé
  
  // Ce qui a été fait
  extracted: boolean;         // Extraction structurelle effectuée
  classified: boolean;        // Classification effectuée (si applicable)
  confidence: number;         // Score de confiance global (0-1)
}

// Interface pour les flags NLP étendus
export interface NLPFlags {
  // États d'erreur ou d'incertitude
  unknown?: boolean;          // Classification impossible
  ambiguous?: boolean;        // Ambiguïté détectée
  low_confidence?: boolean;   // Confiance basse (< 0.7)
  split_from_compound?: boolean; // Tâche issue d'un découpage
  
  // Informations contextuelles
  mixed_language?: boolean;   // Texte multilingue détecté
  linguistic_fatigue?: boolean; // Fatigue linguistique détectée
  cohesion_preserved?: boolean; // Cohésion préservée lors du split
  processing_error?: boolean; // Erreur de traitement
}

// Interface pour les métadonnées NLP complètes
export interface NLPMetadata {
  detectedLang: string;
  energyConfidence: number;
  urgency: number;
  rawAction: string;
  rawSentence: string;
  
  // Métadonnées pour le contrat
  processingSteps: string[];  // Étapes de traitement effectuées
  skippedSteps: string[];     // Étapes de traitement ignorées
  guarantees: NLPGuarantees;  // Garanties explicites
  flags: NLPFlags;            // Flags d'état
  
  // Traçabilité critique
  extraction_method: "rule_based" | "ml_assisted" | "hybrid";
  processing_timestamp: string; // ISO8601
  nlp_version: string;
  confidence_breakdown?: {
    action: number;
    object: number;
    context: number;
  };
}

// Interface pour les modificateurs
export interface Modifier {
  type: 'time' | 'location' | 'condition' | 'priority' | 'effort';
  value: string;
  confidence: number;
}

// Interface pour les tâches brutes avec contrat complet
export interface RawTaskWithContract {
  id: string;
  action: string;             // "appeler", "écrire"
  object: string;             // "Marc", "rapport Q4"
  deadline: string | null;    // "demain 15h"
  effortHint: 'S' | 'M' | 'L';
  rawText: string;
  sentence: string;
  confidence: number;         // Score de confiance de l'extraction
  entities: Record<string, string>; // Entités extraites
  
  // Champs pour le contrat
  metadata: NLPMetadata;      // Métadonnées avec garanties
  contractVersion: string;    // Version du contrat
  modifiers?: Modifier[];     // Modificateurs extraits
}

// Type pour le résultat du contrat NLP
export interface NLPContractResult {
  tasks: RawTaskWithContract[];
  guarantees: NLPGuarantees;
  flags: NLPFlags;
  metrics: {
    totalTasks: number;
    unknownRate: number;      // Taux de tâches non reconnues
    ambiguousRate: number;    // Taux de tâches ambiguës
    splitFailureRate: number; // Taux d'échec de découpage
    userOverrideRate: number; // Taux de remplacement utilisateur
  };
  mode: 'NORMAL' | 'RAW_CAPTURE_ONLY' | 'DEGRADED'; // Mode de fonctionnement
  contractVersion: string;
}

// Interface pour le validateur NLP
export interface NLPValidator {
  validate(output: RawTaskWithContract): ValidationResult;
  validateResult(result: NLPContractResult): ValidationResult;
}

// Interface pour le résultat de validation
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Validateur NLP complet
export class NLPContractValidator implements NLPValidator {
  
  validate(output: RawTaskWithContract): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Vérifier la présence des garanties
    if (!output.metadata?.guarantees) {
      errors.push("Missing guarantees field in metadata");
    } else {
      const guarantees = output.metadata.guarantees;
      
      // Vérifier la cohérence des garanties
      if (output.action && !guarantees.not_inferred) {
        errors.push("Action extracted but marked as inferred");
      }
      
      if (output.object && !guarantees.not_inferred) {
        errors.push("Object extracted but marked as inferred");
      }
      
      // Vérifier que les garanties sont booléennes
      if (typeof guarantees.not_inferred !== 'boolean') {
        errors.push("not_inferred must be boolean");
      }
      if (typeof guarantees.not_corrected !== 'boolean') {
        errors.push("not_corrected must be boolean");
      }
      if (typeof guarantees.not_decided !== 'boolean') {
        errors.push("not_decided must be boolean");
      }
      if (typeof guarantees.not_prioritized !== 'boolean') {
        errors.push("not_prioritized must be boolean");
      }
      if (typeof guarantees.not_interpreted !== 'boolean') {
        errors.push("not_interpreted must be boolean");
      }
      if (typeof guarantees.reversible !== 'boolean') {
        errors.push("reversible must be boolean");
      }
    }
    
    // Vérifier la traçabilité
    if (!output.metadata?.extraction_method) {
      errors.push("Missing extraction_method in metadata");
    }
    
    if (!output.metadata?.processing_timestamp) {
      errors.push("Missing processing_timestamp in metadata");
    }
    
    if (!output.metadata?.nlp_version) {
      errors.push("Missing nlp_version in metadata");
    }
    
    // Vérifier la validité du format de timestamp
    if (output.metadata?.processing_timestamp) {
      const isValidDate = !isNaN(Date.parse(output.metadata.processing_timestamp));
      if (!isValidDate) {
        errors.push("Invalid processing_timestamp format");
      }
    }
    
    // Vérifier que la confiance est dans la plage correcte
    if (output.confidence < 0 || output.confidence > 1) {
      errors.push("Confidence must be between 0 and 1");
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
  
  validateResult(result: NLPContractResult): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Valider les garanties du résultat
    if (!result.guarantees) {
      errors.push("Missing guarantees in result");
    }
    
    // Valider les tâches
    for (const task of result.tasks) {
      const taskValidation = this.validate(task);
      if (!taskValidation.isValid) {
        errors.push(`Task ${task.id} validation failed: ${taskValidation.errors.join(', ')}`);
      }
    }
    
    // Vérifier que les métriques sont valides
    if (result.metrics.unknownRate < 0 || result.metrics.unknownRate > 1) {
      errors.push("unknownRate must be between 0 and 1");
    }
    
    if (result.metrics.ambiguousRate < 0 || result.metrics.ambiguousRate > 1) {
      errors.push("ambiguousRate must be between 0 and 1");
    }
    
    if (result.metrics.splitFailureRate < 0 || result.metrics.splitFailureRate > 1) {
      errors.push("splitFailureRate must be between 0 and 1");
    }
    
    if (result.metrics.userOverrideRate < 0 || result.metrics.userOverrideRate > 1) {
      errors.push("userOverrideRate must be between 0 and 1");
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

// Fonction pour créer une tâche avec contrat complet
export function createTaskWithEnhancedContract(
  baseTask: Omit<RawTaskWithContract, 'metadata' | 'contractVersion'>,
  guarantees: NLPGuarantees,
  flags: NLPFlags = {},
  extractionMethod: "rule_based" | "ml_assisted" | "hybrid" = "rule_based"
): RawTaskWithContract {
  return {
    ...baseTask,
    metadata: {
      detectedLang: baseTask.metadata?.detectedLang || 'unknown',
      energyConfidence: baseTask.metadata?.energyConfidence || 0,
      urgency: baseTask.metadata?.urgency || 0,
      rawAction: baseTask.action,
      rawSentence: baseTask.sentence,
      processingSteps: baseTask.metadata?.processingSteps || [],
      skippedSteps: baseTask.metadata?.skippedSteps || [],
      guarantees,
      flags,
      extraction_method: extractionMethod,
      processing_timestamp: new Date().toISOString(),
      nlp_version: '2.0.0', // Version mise à jour pour le contrat complet
      confidence_breakdown: baseTask.metadata?.confidence_breakdown
    },
    contractVersion: '2.0.0' // Version du contrat mise à jour
  };
}

// Fonction pour créer un résultat de contrat NLP complet
export function createEnhancedNLPContractResult(
  tasks: RawTaskWithContract[],
  mode: 'NORMAL' | 'RAW_CAPTURE_ONLY' | 'DEGRADED' = 'NORMAL'
): NLPContractResult {
  const totalTasks = tasks.length;
  const unknownTasks = tasks.filter(t => t.metadata.flags?.unknown).length;
  const ambiguousTasks = tasks.filter(t => t.metadata.flags?.ambiguous).length;
  const splitFailureTasks = tasks.filter(t => t.metadata.flags?.split_from_compound === false).length;
  
  // Calculer les garanties globales
  const globalGuarantees: NLPGuarantees = {
    not_inferred: tasks.every(t => t.metadata.guarantees.not_inferred),
    not_corrected: tasks.every(t => t.metadata.guarantees.not_corrected),
    not_decided: tasks.every(t => t.metadata.guarantees.not_decided),
    not_prioritized: tasks.every(t => t.metadata.guarantees.not_prioritized),
    not_interpreted: tasks.every(t => t.metadata.guarantees.not_interpreted),
    reversible: tasks.every(t => t.metadata.guarantees.reversible),
    extracted: true,
    classified: tasks.some(t => t.metadata.energyConfidence > 0),
    confidence: tasks.reduce((sum, t) => sum + t.confidence, 0) / Math.max(1, totalTasks)
  };
  
  return {
    tasks,
    guarantees: globalGuarantees,
    flags: {
      unknown: unknownTasks > 0,
      ambiguous: ambiguousTasks > 0,
      low_confidence: tasks.some(t => t.confidence < 0.7)
    },
    metrics: {
      totalTasks,
      unknownRate: totalTasks > 0 ? unknownTasks / totalTasks : 0,
      ambiguousRate: totalTasks > 0 ? ambiguousTasks / totalTasks : 0,
      splitFailureRate: totalTasks > 0 ? splitFailureTasks / totalTasks : 0,
      userOverrideRate: 0 // À implémenter avec le suivi utilisateur
    },
    mode,
    contractVersion: '2.0.0'
  };
}

// Instance du validateur
export const nlpContractValidator = new NLPContractValidator();

// Fonction utilitaire pour créer un contrat de base avec garanties
export function createBaseGuarantees(): NLPGuarantees {
  return {
    not_inferred: true,
    not_corrected: true,
    not_decided: true,
    not_prioritized: true,
    not_interpreted: true,
    reversible: true,
    extracted: true,
    classified: false,
    confidence: 0
  };
}