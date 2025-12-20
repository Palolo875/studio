/**
 * Contrat de sortie NLP strict avec garanties explicites
 * Ce contrat définit le format de sortie du module NLP avec des garanties
 * explicites sur ce qui a été fait et ce qui n'a pas été fait.
 */

// Interface pour les garanties NLP
export interface NLPGuarantees {
  // Ce qui n'a PAS été fait
  inferred: boolean;      // Aucune inférence implicite
  decided: boolean;       // Aucune décision autonome
  corrected: boolean;     // Aucune correction de l'utilisateur
  
  // Ce qui a été fait
  extracted: boolean;     // Extraction structurelle effectuée
  classified: boolean;    // Classification effectuée (si applicable)
  confidence: number;     // Score de confiance global (0-1)
}

// Interface pour les flags NLP
export interface NLPFlags {
  // États d'erreur ou d'incertitude
  unknown?: boolean;      // Classification impossible
  ambiguous?: boolean;    // Ambiguïté détectée
  low_confidence?: boolean; // Confiance basse (< 0.7)
  split_from_compound?: boolean; // Tâche issue d'un découpage
  
  // Informations contextuelles
  mixed_language?: boolean; // Texte multilingue détecté
  linguistic_fatigue?: boolean; // Fatigue linguistique détectée
  cohesion_preserved?: boolean; // Cohésion préservée lors du split
}

// Interface pour les métadonnées NLP
export interface NLPMetadata {
  detectedLang: string;
  energyConfidence: number;
  urgency: number;
  rawAction: string;
  rawSentence: string;
  
  // Nouvelles métadonnées pour le contrat
  processingSteps: string[]; // Étapes de traitement effectuées
  skippedSteps: string[];    // Étapes de traitement ignorées
  guarantees: NLPGuarantees; // Garanties explicites
  flags: NLPFlags;          // Flags d'état
}

// Interface pour les tâches brutes avec contrat
export interface RawTaskWithContract {
  id: string;
  action: string;           // "appeler", "écrire"
  object: string;           // "Marc", "rapport Q4"
  deadline: string | null;  // "demain 15h"
  effortHint: 'S' | 'M' | 'L';
  rawText: string;
  sentence: string;
  confidence: number;       // Score de confiance de l'extraction
  entities: Record<string, string>; // Entités extraites
  
  // Nouveaux champs pour le contrat
  metadata: NLPMetadata;    // Métadonnées avec garanties
  contractVersion: string;  // Version du contrat
}

// Type pour le résultat du contrat NLP
export interface NLPContractResult {
  tasks: RawTaskWithContract[];
  guarantees: NLPGuarantees;
  flags: NLPFlags;
  metrics: {
    totalTasks: number;
    unknownRate: number;    // Taux de tâches non reconnues
    ambiguousRate: number;  // Taux de tâches ambiguës
    splitFailureRate: number; // Taux d'échec de découpage
    userOverrideRate: number; // Taux de remplacement utilisateur
  };
  mode: 'NORMAL' | 'RAW_CAPTURE_ONLY'; // Mode de fonctionnement
  contractVersion: string;
}

// Fonction pour créer une tâche avec contrat
export function createTaskWithContract(
  baseTask: Omit<RawTaskWithContract, 'metadata' | 'contractVersion'>,
  guarantees: NLPGuarantees,
  flags: NLPFlags = {}
): RawTaskWithContract {
  return {
    ...baseTask,
    metadata: {
      detectedLang: 'unknown',
      energyConfidence: 0,
      urgency: 0,
      rawAction: baseTask.action,
      rawSentence: baseTask.sentence,
      processingSteps: [],
      skippedSteps: [],
      guarantees,
      flags
    },
    contractVersion: '1.0.0'
  };
}

// Fonction pour créer un résultat de contrat NLP
export function createNLPContractResult(
  tasks: RawTaskWithContract[],
  mode: 'NORMAL' | 'RAW_CAPTURE_ONLY' = 'NORMAL'
): NLPContractResult {
  const totalTasks = tasks.length;
  const unknownTasks = tasks.filter(t => t.metadata.flags?.unknown).length;
  const ambiguousTasks = tasks.filter(t => t.metadata.flags?.ambiguous).length;
  
  return {
    tasks,
    guarantees: {
      inferred: false,
      decided: false,
      corrected: false,
      extracted: true,
      classified: tasks.some(t => t.metadata.energyConfidence > 0),
      confidence: tasks.reduce((sum, t) => sum + t.confidence, 0) / Math.max(1, totalTasks)
    },
    flags: {
      unknown: unknownTasks > 0,
      ambiguous: ambiguousTasks > 0
    },
    metrics: {
      totalTasks,
      unknownRate: totalTasks > 0 ? unknownTasks / totalTasks : 0,
      ambiguousRate: totalTasks > 0 ? ambiguousTasks / totalTasks : 0,
      splitFailureRate: 0, // À implémenter avec le cohesion score
      userOverrideRate: 0  // À implémenter avec le suivi utilisateur
    },
    mode,
    contractVersion: '1.0.0'
  };
}