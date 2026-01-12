/**
 * SYSTÈME DE TYPE DE RÉSULTAT - CORRECTION DE LA PHASE 3
 * Remplace tangibleResult par OutcomeType pour une définition plus nuancée
 * 
 * CORRECTION DE LA FAILLE 3 : Redéfinition de tangibleResult avec OutcomeType
 */

// Définition des types de résultats possibles
export type OutcomeType = 
  | "DELIVERABLE"    // Résultat concret livrable (fichier, email, document)
  | "PROGRESS"       // Progrès vers un objectif (avancement, étape accomplie)
  | "PREPARATION"    // Préparation pour une action future (recherche, planification)
  | "LEARNING"       // Apprentissage/acquisition de connaissances
  | "REFLECTION"     // Réflexion, prise de conscience
  | "DESIGN"         // Conception, élaboration
  | "RESEARCH"       // Recherche, investigation
  | "CREATION"       // Création originale
  | "MAINTENANCE"    // Maintenance, routine
  | "BREAK"          // Pause, repos (résultat valide aussi)
  ;

// Interface pour les résultats de tâche avec le nouveau système
export interface OutcomeBasedTaskResult {
  taskId: string;
  completed: boolean;
  actualDuration: number;
  perceivedEffort: number;
  outcomeType: OutcomeType;
  outcomeDescription: string;      // Description du résultat obtenu
  outcomeValue: number;           // Valeur du résultat (0-1)
  outcomeConfidence: number;      // Niveau de confiance dans le type (0-1)
  declaredByUser?: boolean;       // Déclaré par l'utilisateur
  inferredBySystem?: boolean;     // Déduit par le système
  supportingEvidence?: string[];  // Preuves du résultat
}

// Interface pour les préférences utilisateur concernant les types de résultats
export interface OutcomePreferences {
  favoredOutcomes: OutcomeType[];     // Types de résultats préférés
  avoidedOutcomes: OutcomeType[];     // Types à éviter
  outcomeWeights: { [key in OutcomeType]?: number }; // Poids pour chaque type
  prioritizeFinitude: boolean;       // Favoriser la finitude vs le livrable
}

// Interface pour le classifieur de type de résultat
export interface OutcomeTypeClassifier {
  classifyTaskOutcome(taskDescription: string, taskAction: string, taskObject: string): OutcomeClassificationResult;
  updateClassificationModel(feedback: OutcomeFeedback): void;
}

// Résultat de classification
export interface OutcomeClassificationResult {
  outcomeType: OutcomeType;
  confidence: number;
  reasoning: string;
  alternativeTypes?: { type: OutcomeType; confidence: number }[];
}

// Feedback sur la classification
export interface OutcomeFeedback {
  taskId: string;
  predictedType: OutcomeType;
  actualType: OutcomeType;
  userCorrection: boolean;
  confidenceRating: number; // 1-5
}

// Classeur de type de résultat
export class OutcomeTypeClassifierImpl implements OutcomeTypeClassifier {
  private readonly ACTION_OUTCOME_MAPPINGS: { [key: string]: OutcomeType[] } = {
    // Actions orientées livrables
    'envoyer': ['DELIVERABLE'],
    'envoi': ['DELIVERABLE'],
    'envoyé': ['DELIVERABLE'],
    'publier': ['DELIVERABLE'],
    'livrer': ['DELIVERABLE'],
    'soumettre': ['DELIVERABLE'],
    'finaliser': ['DELIVERABLE'],
    'produire': ['DELIVERABLE'],
    'générer': ['DELIVERABLE'],
    'créer': ['DELIVERABLE', 'CREATION'],
    'composer': ['DELIVERABLE', 'CREATION'],
    'écrire': ['DELIVERABLE', 'CREATION'],
    'concevoir': ['DELIVERABLE', 'DESIGN'],
    'fabriquer': ['DELIVERABLE'],
    
    // Actions orientées progrès
    'commencer': ['PROGRESS'],
    'démarrer': ['PROGRESS'],
    'initier': ['PROGRESS'],
    'avancer': ['PROGRESS'],
    'progresser': ['PROGRESS'],
    'continuer': ['PROGRESS'],
    'reprendre': ['PROGRESS'],
    
    // Actions de préparation
    'préparer': ['PREPARATION'],
    'organiser': ['PREPARATION'],
    'planifier': ['PREPARATION'],
    'prévoir': ['PREPARATION'],
    'rechercher': ['PREPARATION', 'RESEARCH'],
    'trouver': ['PREPARATION', 'RESEARCH'],
    'collecter': ['PREPARATION', 'RESEARCH'],
    'rassembler': ['PREPARATION', 'RESEARCH'],
    'étudier': ['PREPARATION', 'LEARNING'],
    'analyser': ['PREPARATION', 'LEARNING'],
    
    // Actions d'apprentissage
    'apprendre': ['LEARNING'],
    'lire': ['LEARNING', 'RESEARCH'],
    'former': ['LEARNING'],
    's\'instruire': ['LEARNING'],
    'découvrir': ['LEARNING', 'RESEARCH'],
    
    // Actions de réflexion
    'réfléchir': ['REFLECTION'],
    'méditer': ['REFLECTION'],
    'considérer': ['REFLECTION'],
    'réviser': ['REFLECTION'],
    'évaluer': ['REFLECTION'],
    'réviser': ['REFLECTION'],
    
    // Actions de conception
    'dessiner': ['DESIGN'],
    'modéliser': ['DESIGN'],
    'structurer': ['DESIGN'],
    'architecturer': ['DESIGN'],
    
    // Actions de recherche
    'chercher': ['RESEARCH'],
    'investiguer': ['RESEARCH'],
    'explorer': ['RESEARCH'],
    'approfondir': ['RESEARCH'],
    
    // Actions de création
    'innover': ['CREATION'],
    'imaginer': ['CREATION'],
    'composer': ['CREATION'],
    'générer': ['CREATION'],
    
    // Actions de maintenance
    'nettoyer': ['MAINTENANCE'],
    'organiser': ['MAINTENANCE'],
    'mettre à jour': ['MAINTENANCE'],
    'réparer': ['MAINTENANCE'],
    'entretenir': ['MAINTENANCE'],
    
    // Actions de pause
    'reposer': ['BREAK'],
    'détendre': ['BREAK'],
    'relaxer': ['BREAK'],
    'pause': ['BREAK'],
  };

  private readonly OBJECT_OUTCOME_MAPPINGS: { [key: string]: OutcomeType[] } = {
    // Objets livrables
    'rapport': ['DELIVERABLE'],
    'document': ['DELIVERABLE'],
    'email': ['DELIVERABLE'],
    'présentation': ['DELIVERABLE'],
    'code': ['DELIVERABLE'],
    'fichier': ['DELIVERABLE'],
    'projet': ['DELIVERABLE'],
    'article': ['DELIVERABLE'],
    'vidéo': ['DELIVERABLE'],
    'image': ['DELIVERABLE'],
    'design': ['DELIVERABLE', 'DESIGN'],
    'maquette': ['DELIVERABLE', 'DESIGN'],
    'facture': ['DELIVERABLE'],
    'contrat': ['DELIVERABLE'],
    'cahier': ['DELIVERABLE'],
    'spécification': ['DELIVERABLE'],
    
    // Objets liés à la progression
    'étape': ['PROGRESS'],
    'milestone': ['PROGRESS'],
    'objectif': ['PROGRESS'],
    'goal': ['PROGRESS'],
    'étape de projet': ['PROGRESS'],
    
    // Objets de préparation
    'recherche': ['PREPARATION', 'RESEARCH'],
    'étude': ['PREPARATION', 'RESEARCH'],
    'analyse': ['PREPARATION', 'LEARNING'],
    'plan': ['PREPARATION'],
    'stratégie': ['PREPARATION'],
    'préparation': ['PREPARATION'],
    
    // Objets d'apprentissage
    'cours': ['LEARNING'],
    'formation': ['LEARNING'],
    'connaissance': ['LEARNING'],
    'compétence': ['LEARNING'],
    'éducation': ['LEARNING'],
    
    // Objets de réflexion
    'idée': ['REFLECTION'],
    'stratégie': ['REFLECTION'],
    'plan': ['REFLECTION'],
    'réflexion': ['REFLECTION'],
    
    // Objets de conception
    'prototype': ['DESIGN'],
    'modèle': ['DESIGN'],
    'schéma': ['DESIGN'],
    'architecture': ['DESIGN'],
    
    // Objets de recherche
    'données': ['RESEARCH'],
    'informations': ['RESEARCH'],
    'sources': ['RESEARCH'],
    'documentation': ['RESEARCH'],
    
    // Objets de création
    'œuvre': ['CREATION'],
    'création': ['CREATION'],
    'conception': ['CREATION'],
    'invention': ['CREATION'],
    
    // Objets de maintenance
    'tâche routinière': ['MAINTENANCE'],
    'routine': ['MAINTENANCE'],
    'maintenance': ['MAINTENANCE'],
    
    // Objets de pause
    'repos': ['BREAK'],
    'pause': ['BREAK'],
    'soins': ['BREAK'],
  };

  /**
   * Classifie le type de résultat d'une tâche
   */
  classifyTaskOutcome(taskDescription: string, taskAction: string, taskObject: string): OutcomeClassificationResult {
    const description = (taskDescription + ' ' + taskAction + ' ' + taskObject).toLowerCase();
    
    // Compter les correspondances pour chaque type
    const typeScores: { [key in OutcomeType]?: number } = {};
    
    // Vérifier les actions
    const actionWords = taskAction.toLowerCase().split(/\s+/);
    for (const word of actionWords) {
      const possibleTypes = this.ACTION_OUTCOME_MAPPINGS[word];
      if (possibleTypes) {
        for (const type of possibleTypes) {
          typeScores[type] = (typeScores[type] || 0) + 1;
        }
      }
    }
    
    // Vérifier les objets
    const objectWords = taskObject.toLowerCase().split(/\s+/);
    for (const word of objectWords) {
      const possibleTypes = this.OBJECT_OUTCOME_MAPPINGS[word];
      if (possibleTypes) {
        for (const type of possibleTypes) {
          typeScores[type] = (typeScores[type] || 0) + 1;
        }
      }
    }
    
    // Vérifier la description complète
    for (const [word, possibleTypes] of Object.entries(this.ACTION_OUTCOME_MAPPINGS)) {
      if (description.includes(word)) {
        for (const type of possibleTypes) {
          typeScores[type] = (typeScores[type] || 0) + 0.5; // Moins de poids pour les correspondances dans la description
        }
      }
    }
    
    // Trouver le type avec le score le plus élevé
    let bestType: OutcomeType | null = null;
    let bestScore = 0;
    
    for (const [type, score] of Object.entries(typeScores)) {
      if (score > bestScore) {
        bestScore = score;
        bestType = type as OutcomeType;
      }
    }
    
    // Si aucun type trouvé, par défaut c'est PREPARATION
    if (!bestType) {
      bestType = 'PREPARATION';
      bestScore = 0.1; // Faible score
    }
    
    // Calculer la confiance (normalisée)
    const totalScore = Object.values(typeScores).reduce((sum, val) => sum + val, 0);
    const confidence = totalScore > 0 ? bestScore / totalScore : 0.1;
    
    // Obtenir les types alternatifs
    const alternativeTypes = Object.entries(typeScores)
      .filter(([type]) => type !== bestType)
      .sort(([, scoreA], [, scoreB]) => (scoreB || 0) - (scoreA || 0))
      .slice(0, 3) // Les 3 meilleurs alternatifs
      .map(([type, score]) => ({
        type: type as OutcomeType,
        confidence: score ? score / totalScore : 0
      }));
    
    return {
      outcomeType: bestType,
      confidence: Math.min(confidence, 1.0),
      reasoning: `Classé comme ${bestType} basé sur les mots-clés: action="${taskAction}", objet="${taskObject}"`,
      alternativeTypes
    };
  }
  
  /**
   * Met à jour le modèle de classification avec le feedback
   */
  updateClassificationModel(feedback: OutcomeFeedback): void {
    // Dans une implémentation complète, on mettrait à jour un modèle ML ici
    // Pour cette version, on enregistre juste le feedback pour référence
    console.log(`Feedback reçu pour la tâche ${feedback.taskId}: ${feedback.predictedType} -> ${feedback.actualType}`);
  }
}

// Interface pour le gestionnaire de résultats basé sur les résultats
export interface OutcomeBasedManager {
  processTaskOutcome(result: OutcomeBasedTaskResult): ProcessedOutcomeResult;
  calculateOutcomeValue(result: OutcomeBasedTaskResult, preferences: OutcomePreferences): number;
  getOutcomeRecommendations(preferences: OutcomePreferences, availableTasks: OutcomeBasedTaskResult[]): OutcomeRecommendation[];
}

// Résultat traité
export interface ProcessedOutcomeResult {
  originalResult: OutcomeBasedTaskResult;
  calculatedValue: number;
  priorityScore: number;
  recommendation: string;
  alignsWithPreferences: boolean;
}

// Recommendation de résultat
export interface OutcomeRecommendation {
  taskId: string;
  outcomeType: OutcomeType;
  recommendation: string;
  priority: number; // 1-10
  alignmentWithFinitude: number; // 0-1, à quel point ça favorise la finitude
}

// Gestionnaire de résultats basé sur les résultats
export class OutcomeBasedManagerImpl implements OutcomeBasedManager {
  /**
   * Traitement d'un résultat de tâche
   */
  processTaskOutcome(result: OutcomeBasedTaskResult): ProcessedOutcomeResult {
    const processed: ProcessedOutcomeResult = {
      originalResult: result,
      calculatedValue: 0,
      priorityScore: 0,
      recommendation: '',
      alignsWithPreferences: false
    };
    
    // Calculer la valeur en fonction du type de résultat
    processed.calculatedValue = this.calculateOutcomeValue(result, { 
      favoredOutcomes: [result.outcomeType],
      avoidedOutcomes: [],
      outcomeWeights: { [result.outcomeType]: 1.0 },
      prioritizeFinitude: true
    });
    
    // Calculer le score de priorité
    processed.priorityScore = processed.calculatedValue * result.outcomeConfidence;
    
    // Générer une recommandation
    processed.recommendation = this.generateRecommendation(result);
    
    return processed;
  }
  
  /**
   * Calcul de la valeur d'un résultat en fonction des préférences
   */
  calculateOutcomeValue(result: OutcomeBasedTaskResult, preferences: OutcomePreferences): number {
    // Base sur la confiance
    let value = result.outcomeConfidence;
    
    // Pondérer par les préférences
    const weight = preferences.outcomeWeights[result.outcomeType] || 1.0;
    value *= weight;
    
    // Bonus pour les types favoris
    if (preferences.favoredOutcomes.includes(result.outcomeType)) {
      value *= 1.2; // 20% de bonus
    }
    
    // Malus pour les types évités
    if (preferences.avoidedOutcomes.includes(result.outcomeType)) {
      value *= 0.5; // 50% de réduction
    }
    
    // Bonus pour la finitude (si activé)
    if (preferences.prioritizeFinitude) {
      // Les types qui favorisent la finitude reçoivent un bonus
      const finitudeBonusTypes: OutcomeType[] = ['DELIVERABLE', 'PROGRESS', 'MAINTENANCE'];
      if (finitudeBonusTypes.includes(result.outcomeType)) {
        value *= 1.1; // 10% de bonus pour la finitude
      }
    }
    
    return Math.min(value, 1.0); // Limiter à 1.0
  }
  
  /**
   * Générer une recommandation basée sur le type de résultat
   */
  private generateRecommendation(result: OutcomeBasedTaskResult): string {
    switch (result.outcomeType) {
      case 'DELIVERABLE':
        return "Ceci est une tâche livrable - favorise la finitude";
      case 'PROGRESS':
        return "Ceci est une tâche de progrès - continue l'avancement";
      case 'PREPARATION':
        return "Ceci est une tâche de préparation - utile mais pas urgente";
      case 'LEARNING':
        return "Ceci est une tâche d'apprentissage - bénéfique à long terme";
      case 'REFLECTION':
        return "Ceci est une tâche de réflexion - importante pour la clarté";
      case 'DESIGN':
        return "Ceci est une tâche de conception - créative et structurante";
      case 'RESEARCH':
        return "Ceci est une tâche de recherche - informative mais pot. longue";
      case 'CREATION':
        return "Ceci est une tâche de création - originale et valorisante";
      case 'MAINTENANCE':
        return "Ceci est une tâche de maintenance - nécessaire mais routinière";
      case 'BREAK':
        return "Ceci est une pause - essentielle pour la récupération";
      default:
        return "Type de résultat non spécifié";
    }
  }
  
  /**
   * Obtenir des recommandations basées sur les préférences
   */
  getOutcomeRecommendations(
    preferences: OutcomePreferences, 
    availableTasks: OutcomeBasedTaskResult[]
  ): OutcomeRecommendation[] {
    return availableTasks
      .map(task => {
        const value = this.calculateOutcomeValue(task, preferences);
        const finitudeAlignment = this.calculateFinitudeAlignment(task.outcomeType);
        
        return {
          taskId: task.taskId,
          outcomeType: task.outcomeType,
          recommendation: this.generateRecommendation(task),
          priority: Math.round(value * 10), // 1-10
          alignmentWithFinitude: finitudeAlignment
        };
      })
      .sort((a, b) => b.priority - a.priority);
  }
  
  /**
   * Calculer l'alignement avec la finitude pour un type de résultat
   */
  private calculateFinitudeAlignment(outcomeType: OutcomeType): number {
    // Les types qui favorisent la finitude
    const highFinitudeTypes: OutcomeType[] = ['DELIVERABLE', 'PROGRESS', 'MAINTENANCE'];
    const mediumFinitudeTypes: OutcomeType[] = ['PREPARATION', 'CREATION'];
    const lowFinitudeTypes: OutcomeType[] = ['LEARNING', 'REFLECTION', 'RESEARCH'];
    const breakType: OutcomeType[] = ['BREAK'];
    
    if (highFinitudeTypes.includes(outcomeType)) return 0.9;
    if (mediumFinitudeTypes.includes(outcomeType)) return 0.6;
    if (lowFinitudeTypes.includes(outcomeType)) return 0.3;
    if (breakType.includes(outcomeType)) return 0.7; // La pause favorise la finitude à long terme
    
    return 0.5; // Valeur par défaut
  }
}

// Constantes pour les préférences par défaut
export const DEFAULT_OUTCOME_PREFERENCES: OutcomePreferences = {
  favoredOutcomes: ['DELIVERABLE', 'PROGRESS'],
  avoidedOutcomes: ['RESEARCH'], // Pas éviter mais moins prioritaire
  outcomeWeights: {
    'DELIVERABLE': 1.0,
    'PROGRESS': 0.9,
    'PREPARATION': 0.7,
    'LEARNING': 0.6,
    'REFLECTION': 0.5,
    'DESIGN': 0.8,
    'RESEARCH': 0.4,
    'CREATION': 0.85,
    'MAINTENANCE': 0.6,
    'BREAK': 0.7
  },
  prioritizeFinitude: true
};

// Fonction utilitaire pour convertir un ancien résultat tangible en nouveau format
export function convertTangibleResult(
  taskId: string,
  tangibleResult: boolean,
  taskDescription: string,
  taskAction: string,
  taskObject: string
): OutcomeBasedTaskResult {
  // Si c'était marqué comme tangible, on suppose que c'est un DELIVERABLE
  // Sinon, on essaie de classifier intelligemment
  let outcomeType: OutcomeType = 'PREPARATION'; // Valeur par défaut
  
  if (tangibleResult) {
    outcomeType = 'DELIVERABLE';
  } else {
    const classifier = new OutcomeTypeClassifierImpl();
    const classification = classifier.classifyTaskOutcome(taskDescription, taskAction, taskObject);
    outcomeType = classification.outcomeType;
  }
  
  return {
    taskId,
    completed: false, // À mettre à jour plus tard
    actualDuration: 0, // À mettre à jour plus tard
    perceivedEffort: 0, // À mettre à jour plus tard
    outcomeType,
    outcomeDescription: `Résultat de type ${outcomeType}`,
    outcomeValue: 0.5, // Valeur moyenne par défaut
    outcomeConfidence: 0.7, // Confiance moyenne par défaut
    declaredByUser: tangibleResult // Provenance de la classification initiale
  };
}

// Exemple d'utilisation
/*
const classifier = new OutcomeTypeClassifierImpl();
const result = classifier.classifyTaskOutcome(
  "Rédiger le rapport mensuel pour le client", 
  "rédiger", 
  "rapport"
);
console.log(result); // { outcomeType: 'DELIVERABLE', confidence: 0.8, ... }

const manager = new OutcomeBasedManagerImpl();
const preferences = DEFAULT_OUTCOME_PREFERENCES;
const recommendations = manager.getOutcomeRecommendations(preferences, [result]);
console.log(recommendations);
*/