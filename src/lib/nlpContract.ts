/**
 * CONTRAT NLP - KairuFlow Phase 2
 * Garanties négatives explicites pour le moteur NLP
 */

export interface Modifier {
  type: 'time' | 'location' | 'frequency' | 'intensity' | 'condition';
  value: string;
  confidence: number;
}

export interface NLPFlag {
  type: 'AMBIGUOUS' | 'LOW_CONFIDENCE' | 'UNKNOWN_STRUCTURE' | 'MULTIPLE_ACTIONS';
  description: string;
}

export interface NLPContractGuarantees {
  not_inferred: boolean;      // Rien n'a été deviné
  not_corrected: boolean;     // Texte user non modifié
  not_decided: boolean;       // Aucune décision métier
  not_prioritized: boolean;   // Aucune priorité assignée
  reversible: boolean;        // Peut être défait
}

export interface NLPOutput {
  action: string | null;
  object: string | null;
  modifiers: Modifier[];
  confidence: number;
  flags: NLPFlag[];
  
  // Garanties négatives explicites
  guarantees: NLPContractGuarantees;
  
  // Traçabilité
  extraction_method: "rule_based" | "ml_assisted";
  processing_timestamp: string; // ISO8601
  nlp_version: string; // semver
}

/**
 * Valide le contrat de sortie NLP
 */
export function validateNlpOutput(output: NLPOutput): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Vérifier la présence des garanties
  if (!output.guarantees) {
    errors.push("Missing guarantees field");
  }
  
  // Vérifier la cohérence des garanties
  if (output.action && output.guarantees?.not_inferred === false) {
    errors.push("Action extracted but marked as inferred");
  }
  
  // Vérifier la traçabilité
  if (!output.extraction_method) {
    errors.push("Missing extraction_method");
  }
  
  if (!output.nlp_version) {
    errors.push("Missing nlp_version");
  }
  
  if (!output.processing_timestamp) {
    errors.push("Missing processing_timestamp");
  }
  
  // Vérifier que la confiance est dans les bornes
  if (output.confidence < 0 || output.confidence > 1) {
    errors.push("Confidence must be between 0 and 1");
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Crée un output NLP valide selon le contrat
 */
export function createValidNlpOutput(
  action: string | null,
  object: string | null,
  modifiers: Modifier[] = [],
  confidence: number,
  extractionMethod: "rule_based" | "ml_assisted" = "rule_based",
  flags: NLPFlag[] = []
): NLPOutput {
  return {
    action,
    object,
    modifiers,
    confidence,
    flags,
    guarantees: {
      not_inferred: true,
      not_corrected: true,
      not_decided: true,
      not_prioritized: true,
      reversible: true
    },
    extraction_method: extractionMethod,
    processing_timestamp: new Date().toISOString(),
    nlp_version: "2.0.0" // Version de la phase 2
  };
}

/**
 * Vérifie si un output NLP est suffisamment fiable
 */
export function isReliableOutput(output: NLPOutput, minConfidence: number = 0.7): boolean {
  const validation = validateNlpOutput(output);
  return validation.valid && output.confidence >= minConfidence;
}

/**
 * Transforme un output NLP en mode "fallback" pour garantir les contraintes
 */
export function createFallbackOutput(inputText: string): NLPOutput {
  return {
    action: null,
    object: null,
    modifiers: [],
    confidence: 0.0,
    flags: [{
      type: 'UNKNOWN_STRUCTURE',
      description: 'Texte non analysable, mode capture brute activé'
    }],
    guarantees: {
      not_inferred: true,
      not_corrected: true,
      not_decided: true,
      not_prioritized: true,
      reversible: true
    },
    extraction_method: "rule_based",
    processing_timestamp: new Date().toISOString(),
    nlp_version: "2.0.0"
  };
}