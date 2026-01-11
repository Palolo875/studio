/**
 * Analyseur de cohésion des tâches avec algorithme opérationnel
 * Implémente l'algorithme de calcul du score de cohésion entre tâches
 * 
 * CORRECTION DE LA PHASE 2 : Algorithme de calcul du Task Cohesion Score opérationnalisé
 */

// Interface pour le score de cohésion
export interface CohesionScore {
  score: number;                    // Score de cohésion (0-1)
  sharedObject: boolean;            // Partage d'objet
  sharedContext: boolean;           // Contexte partagé
  emotionalWeight: number;          // Poids émotionnel (0-1)
  temporalProximity: number;        // Proximité temporelle (0-1)
  semanticSimilarity: number;       // Similarité sémantique (0-1)
  breakdownReason: string | null;   // Raison du découpage (si applicable)
  cohesionFactors: CohesionFactors; // Détail des facteurs
}

// Interface pour les facteurs de cohésion
export interface CohesionFactors {
  objectRelatedness: number;        // 40% du poids
  contextShared: number;            // 30% du poids
  temporalDependency: number;       // 20% du poids
  semanticProximity: number;        // 10% du poids
}

// Interface pour les tâches brutes
export interface RawTask {
  id: string;
  action: string;                   // "appeler", "écrire"
  object: string;                   // "Marc", "rapport Q4"
  rawText: string;
  sentence: string;
  deadline?: string | null;         // "demain 15h"
  entities?: Record<string, string>; // Entités extraites
  tags?: string[];
  confidence: number;
}

// Interface pour la stratégie de cohésion
export interface CohesionStrategy {
  shouldGroup: boolean;
  action: 'FORCE_GROUP' | 'SUGGEST_GROUP' | 'SPLIT_TASKS';
  confidence: number;
}

// Service d'analyse de cohésion des tâches
export class TaskCohesionAnalyzer {
  private readonly OBJECT_RELATEDNESS_WEIGHT: number = 0.40;  // 40% du poids
  private readonly CONTEXT_SHARED_WEIGHT: number = 0.30;      // 30% du poids
  private readonly TEMPORAL_DEPENDENCY_WEIGHT: number = 0.20; // 20% du poids
  private readonly SEMANTIC_PROXIMITY_WEIGHT: number = 0.10;  // 10% du poids
  
  private readonly COHESION_THRESHOLDS = {
    strong: 0.70,     // Cohésion forte → groupe obligatoire
    medium: 0.50,     // Cohésion moyenne → proposer groupe
    weak: 0.50        // Cohésion faible → séparer
  };

  /**
   * Analyse la cohésion entre deux tâches
   */
  public analyzeCohesion(taskA: RawTask, taskB: RawTask): CohesionScore {
    // Calculer les facteurs de cohésion
    const objectRelatedness = this.calculateObjectRelatedness(taskA, taskB);
    const contextShared = this.calculateContextShared(taskA, taskB);
    const temporalDependency = this.calculateTemporalDependency(taskA, taskB);
    const semanticProximity = this.calculateSemanticProximity(taskA, taskB);

    // Calculer le score global de cohésion
    const score = this.calculateOverallCohesionScore(
      objectRelatedness,
      contextShared,
      temporalDependency,
      semanticProximity
    );

    // Déterminer la raison du découpage si le score est faible
    const breakdownReason = score < this.COHESION_THRESHOLDS.weak 
      ? this.determineBreakdownReason(objectRelatedness, contextShared, temporalDependency, semanticProximity)
      : null;

    return {
      score,
      sharedObject: objectRelatedness > 0.5,
      sharedContext: contextShared > 0.5,
      emotionalWeight: 0, // Non applicable dans cette version
      temporalProximity: temporalDependency,
      semanticSimilarity: semanticProximity,
      breakdownReason,
      cohesionFactors: {
        objectRelatedness,
        contextShared,
        temporalDependency,
        semanticProximity
      }
    };
  }

  /**
   * Calcule la relation entre les objets des tâches
   */
  private calculateObjectRelatedness(taskA: RawTask, taskB: RawTask): number {
    if (!taskA.object || !taskB.object) {
      return 0;
    }

    const objA = taskA.object.toLowerCase().trim();
    const objB = taskB.object.toLowerCase().trim();

    // Égalité stricte
    if (objA === objB) {
      return 1.0;
    }

    // Vérifier si un objet contient l'autre
    if (objA.includes(objB) || objB.includes(objA)) {
      return 0.8;
    }

    // Vérifier les mots communs
    const wordsA = objA.split(/\s+/);
    const wordsB = objB.split(/\s+/);
    const commonWords = wordsA.filter(word => wordsB.includes(word.toLowerCase()));

    if (commonWords.length > 0) {
      // Plus de mots communs = meilleure relation
      const maxWords = Math.max(wordsA.length, wordsB.length);
      return Math.min(commonWords.length / maxWords, 0.7);
    }

    // Vérifier les objets sémantiquement proches
    if (this.areSemanticallyClose(objA, objB)) {
      return 0.6;
    }

    return 0;
  }

  /**
   * Calcule le partage de contexte entre les tâches
   */
  private calculateContextShared(taskA: RawTask, taskB: RawTask): number {
    let score = 0;

    // Vérifier les entités nommées communes
    if (taskA.entities && taskB.entities) {
      const entitiesA = Object.values(taskA.entities);
      const entitiesB = Object.values(taskB.entities);
      const commonEntities = entitiesA.filter(entity => entitiesB.includes(entity));
      
      if (commonEntities.length > 0) {
        const maxEntities = Math.max(entitiesA.length, entitiesB.length);
        score += (commonEntities.length / maxEntities) * 0.5;
      }
    }

    // Vérifier les tags communs
    if (taskA.tags && taskB.tags) {
      const commonTags = taskA.tags.filter(tag => taskB.tags.includes(tag));
      
      if (commonTags.length > 0) {
        const maxTags = Math.max(taskA.tags.length, taskB.tags.length);
        score += (commonTags.length / maxTags) * 0.3;
      }
    }

    // Vérifier les deadlines proches
    if (taskA.deadline && taskB.deadline) {
      if (taskA.deadline === taskB.deadline) {
        score += 0.2; // 20% pour deadline partagée
      }
    }

    return Math.min(score, 1.0);
  }

  /**
   * Calcule la dépendance temporelle entre les tâches
   */
  private calculateTemporalDependency(taskA: RawTask, taskB: RawTask): number {
    // Vérifier si les tâches ont des dépendances temporelles explicites
    const actionA = taskA.action.toLowerCase();
    const actionB = taskB.action.toLowerCase();

    // Exemples de dépendances temporelles
    const temporalDependencies = [
      ['préparer', 'envoyer'],    // On prépare avant d'envoyer
      ['écrire', 'envoyer'],      // On écrit avant d'envoyer
      ['réunir', 'analyser'],     // On réunit avant d'analyser
      ['collecter', 'traiter'],   // On collecte avant de traiter
      ['concevoir', 'implémenter'], // On conçoit avant d'implémenter
      ['préparer', 'présenter'],  // On prépare avant de présenter
    ];

    // Vérifier les dépendances directes
    for (const [first, second] of temporalDependencies) {
      if ((actionA.includes(first) && actionB.includes(second)) || 
          (actionA.includes(second) && actionB.includes(first))) {
        return 1.0;
      }
    }

    // Vérifier les dépendances inverses (B dépend de A)
    if (this.isTemporalDependency(actionB, actionA)) {
      return 0.8;
    }

    return 0.1; // Toutes les tâches ont un minimum de proximité temporelle
  }

  /**
   * Calcule la similarité sémantique entre les tâches
   */
  private calculateSemanticProximity(taskA: RawTask, taskB: RawTask): number {
    // Mots d'action similaires
    const similarActions: Record<string, string[]> = {
      // Appel / Communication
      'appeler': ['téléphoner', 'contacter', 'joindre', 'appeler', 'rappeler'],
      'envoyer': ['email', 'message', 'transmettre', 'envoyer', 'envoi', 'envoyé'],
      'écrire': ['composer', 'rédiger', 'taper', 'écrire', 'écris', 'écrivain'],
      'envoyer': ['email', 'message', 'transmettre', 'envoyer', 'envoi', 'envoyé'],
      
      // Travail / Projet
      'préparer': ['prêt', 'installer', 'arranger', 'préparer', 'prévoit'],
      'organiser': ['planifier', 'structurer', 'organiser', 'ordonner'],
      'rechercher': ['chercher', 'trouver', 'recherche', 'investiguer'],
      'analyser': ['examiner', 'étudier', 'analyser', 'évaluer'],
      
      // Langues
      'appeler': ['phone', 'contact', 'reach', 'call', 'dial'],
      'write': ['compose', 'draft', 'type', 'write', 'author'],
      'send': ['email', 'message', 'transmit', 'send', 'deliver'],
      'prepare': ['ready', 'setup', 'arrange', 'prepare', 'ready'],
    };

    const actionA = taskA.action.toLowerCase();
    const actionB = taskB.action.toLowerCase();

    // Actions identiques
    if (actionA === actionB) {
      return 1.0;
    }

    // Actions similaires
    if (similarActions[actionA] && similarActions[actionA].includes(actionB)) {
      return 0.9;
    }

    if (similarActions[actionB] && similarActions[actionB].includes(actionA)) {
      return 0.9;
    }

    // Vérifier si les verbes sont dans des catégories similaires
    const actionCategories = [
      ['appeler', 'écrire', 'envoyer'], // Communication
      ['préparer', 'organiser', 'structurer'], // Organisation
      ['rechercher', 'analyser', 'étudier'], // Analyse
      ['créer', 'concevoir', 'développer'], // Création
    ];

    for (const category of actionCategories) {
      if (category.includes(actionA) && category.includes(actionB)) {
        return 0.7;
      }
    }

    // Similarité par contexte implicite
    if (this.hasImplicitSemanticConnection(taskA, taskB)) {
      return 0.5;
    }

    return 0.1; // Toutes les tâches ont un minimum de similarité
  }

  /**
   * Calcule le score global de cohésion
   */
  private calculateOverallCohesionScore(
    objectRelatedness: number,
    contextShared: number,
    temporalDependency: number,
    semanticProximity: number
  ): number {
    const weightedScore = 
      (objectRelatedness * this.OBJECT_RELATEDNESS_WEIGHT) +
      (contextShared * this.CONTEXT_SHARED_WEIGHT) +
      (temporalDependency * this.TEMPORAL_DEPENDENCY_WEIGHT) +
      (semanticProximity * this.SEMANTIC_PROXIMITY_WEIGHT);

    return Math.min(weightedScore, 1.0);
  }

  /**
   * Détermine la raison du découpage
   */
  private determineBreakdownReason(
    objectRelatedness: number,
    contextShared: number,
    temporalDependency: number,
    semanticProximity: number
  ): string {
    const reasons: string[] = [];

    if (objectRelatedness < 0.3) {
      reasons.push("pas d'objet partagé");
    }
    if (contextShared < 0.3) {
      reasons.push("pas de contexte partagé");
    }
    if (temporalDependency < 0.3) {
      reasons.push("dépendance temporelle faible");
    }
    if (semanticProximity < 0.3) {
      reasons.push("similarité sémantique faible");
    }

    return reasons.length > 0 ? reasons.join(", ") : "cohésion insuffisante";
  }

  /**
   * Détermine si une tâche composée doit être divisée
   */
  public shouldSplitTask(compoundTask: RawTask, subTasks: RawTask[]): CohesionStrategy {
    // Si une seule sous-tâche, ne pas diviser
    if (subTasks.length <= 1) {
      return {
        shouldGroup: true,
        action: 'FORCE_GROUP',
        confidence: 1.0
      };
    }

    // Calculer la cohésion moyenne entre les sous-tâches
    let totalCohesion = 0;
    let comparisonCount = 0;

    for (let i = 0; i < subTasks.length; i++) {
      for (let j = i + 1; j < subTasks.length; j++) {
        const cohesion = this.analyzeCohesion(subTasks[i], subTasks[j]);
        totalCohesion += cohesion.score;
        comparisonCount++;
      }
    }

    const averageCohesion = comparisonCount > 0 ? totalCohesion / comparisonCount : 0;

    // Décider de la stratégie en fonction de la cohésion moyenne
    if (averageCohesion > this.COHESION_THRESHOLDS.strong) {
      // Cohésion forte → forcer le groupement
      return {
        shouldGroup: true,
        action: 'FORCE_GROUP',
        confidence: averageCohesion
      };
    } else if (averageCohesion > this.COHESION_THRESHOLDS.medium) {
      // Cohésion moyenne → suggérer le groupement
      return {
        shouldGroup: true,
        action: 'SUGGEST_GROUP',
        confidence: averageCohesion
      };
    } else {
      // Cohésion faible → séparer les tâches
      return {
        shouldGroup: false,
        action: 'SPLIT_TASKS',
        confidence: 1 - averageCohesion
      };
    }
  }

  /**
   * Vérifie si deux verbes ont une dépendance temporelle
   */
  private isTemporalDependency(actionA: string, actionB: string): boolean {
    const dependencies: Record<string, string[]> = {
      'préparer': ['envoyer', 'présenter', 'utiliser'],
      'écrire': ['envoyer', 'publier', 'réviser'],
      'réunir': ['analyser', 'synthétiser', 'rapporter'],
      'collecter': ['traiter', 'analyser', 'organiser'],
      'concevoir': ['implémenter', 'tester', 'valider'],
      'installer': ['configurer', 'tester', 'utiliser'],
    };

    return dependencies[actionA]?.includes(actionB) || dependencies[actionB]?.includes(actionA);
  }

  /**
   * Vérifie si deux chaînes sont sémantiquement proches
   */
  private areSemanticallyClose(objA: string, objB: string): boolean {
    // Vérifier les synonymes ou termes liés
    const semanticPairs: [string, string[]][] = [
      ['dossier', ['fichier', 'document', 'rapport']],
      ['rapport', ['document', 'dossier', 'présentation']],
      ['email', ['message', 'courriel', 'courrier']],
      ['réunion', ['meeting', 'conférence', 'discussion']],
      ['projet', ['tâche', 'activité', 'mission']],
    ];

    for (const [base, related] of semanticPairs) {
      if ((objA.includes(base) || related.includes(objA)) && 
          (objB.includes(base) || related.includes(objB))) {
        return true;
      }
    }

    return false;
  }

  /**
   * Vérifie s'il y a une connexion sémantique implicite
   */
  private hasImplicitSemanticConnection(taskA: RawTask, taskB: RawTask): boolean {
    // Exemples de connexions implicites
    const implicitConnections: [string, string][] = [
      ['dossier', 'envoyer'],   // Envoyer un dossier
      ['rapport', 'envoyer'],   // Envoyer un rapport
      ['présentation', 'envoyer'], // Envoyer une présentation
      ['document', 'envoyer'],  // Envoyer un document
      ['email', 'envoyer'],     // Envoyer un email
      ['message', 'envoyer'],   // Envoyer un message
    ];

    const objA = taskA.object.toLowerCase();
    const objB = taskB.object.toLowerCase();
    const actionA = taskA.action.toLowerCase();
    const actionB = taskB.action.toLowerCase();

    // Vérifier si les tâches partagent un objet-action implicite
    for (const [obj, action] of implicitConnections) {
      if ((objA.includes(obj) && actionB.includes(action)) ||
          (objB.includes(obj) && actionA.includes(action))) {
        return true;
      }
    }

    return false;
  }

  /**
   * Calcule la cohésion moyenne pour un groupe de tâches
   */
  public calculateGroupCohesion(tasks: RawTask[]): number {
    if (tasks.length <= 1) {
      return 1.0;
    }

    let totalCohesion = 0;
    let comparisonCount = 0;

    for (let i = 0; i < tasks.length; i++) {
      for (let j = i + 1; j < tasks.length; j++) {
        const cohesion = this.analyzeCohesion(tasks[i], tasks[j]);
        totalCohesion += cohesion.score;
        comparisonCount++;
      }
    }

    return comparisonCount > 0 ? totalCohesion / comparisonCount : 0;
  }
}

// Instance singleton de l'analyseur de cohésion
export const taskCohesionAnalyzer = new TaskCohesionAnalyzer();

/**
 * Fonction utilitaire pour déterminer la stratégie de cohésion pour un groupe de tâches
 */
export function determineCohesionStrategy(compoundTask: RawTask, subTasks: RawTask[]): CohesionStrategy {
  return taskCohesionAnalyzer.shouldSplitTask(compoundTask, subTasks);
}

/**
 * Exemple d'utilisation
 * 
 * // Exemple concret
 * const task1: RawTask = {
 *   id: '1',
 *   action: 'préparer',
 *   object: 'dossier',
 *   rawText: 'préparer le dossier client',
 *   sentence: 'Je dois préparer le dossier client',
 *   confidence: 0.85
 * };
 * 
 * const task2: RawTask = {
 *   id: '2',
 *   action: 'envoyer',
 *   object: 'dossier',
 *   rawText: 'envoyer le dossier',
 *   sentence: 'J\'envoie le dossier au client',
 *   confidence: 0.78
 * };
 * 
 * const cohesion = taskCohesionAnalyzer.analyzeCohesion(task1, task2);
 * console.log(`Cohesion score: ${cohesion.score}`); // ~0.60 (0.40 pour objet + 0.20 pour dépendance temporelle)
 */