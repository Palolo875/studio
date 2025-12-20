/**
 * Analyseur de cohésion pour préserver l'unité cognitive des tâches
 * Empêche la fragmentation artificielle des tâches cognitivement liées
 */

// Interface pour le score de cohésion
export interface CohesionScore {
  score: number;           // Score de cohésion (0-1)
  sharedObject: boolean;   // Partage d'objet
  sharedContext: boolean;  // Contexte partagé
  emotionalWeight: number; // Poids émotionnel (0-1)
  temporalProximity: number; // Proximité temporelle (0-1)
  semanticSimilarity: number; // Similarité sémantique (0-1)
  breakdownReason: string | null; // Raison du découpage (si applicable)
}

// Interface pour les paramètres de l'analyseur de cohésion
export interface CohesionConfig {
  minCohesionThreshold: number; // Seuil minimal de cohésion (ex: 0.7)
  enableEmotionalWeight: boolean; // Activer le poids émotionnel
  enableTemporalProximity: boolean; // Activer la proximité temporelle
  enableSemanticSimilarity: boolean; // Activer la similarité sémantique
}

// Service d'analyse de cohésion
export class CohesionAnalyzer {
  private config: CohesionConfig;
  
  constructor(config?: Partial<CohesionConfig>) {
    this.config = {
      minCohesionThreshold: config?.minCohesionThreshold ?? 0.7,
      enableEmotionalWeight: config?.enableEmotionalWeight ?? true,
      enableTemporalProximity: config?.enableTemporalProximity ?? true,
      enableSemanticSimilarity: config?.enableSemanticSimilarity ?? true
    };
  }
  
  /**
   * Analyse la cohésion entre deux tâches
   * @param task1 Première tâche
   * @param task2 Deuxième tâche
   * @returns Score de cohésion
   */
  analyzeCohesion(task1: any, task2: any): CohesionScore {
    // Vérifier le partage d'objet
    const sharedObject = this.hasSharedObject(task1, task2);
    
    // Vérifier le contexte partagé
    const sharedContext = this.hasSharedContext(task1, task2);
    
    // Calculer le poids émotionnel
    let emotionalWeight = 0;
    if (this.config.enableEmotionalWeight) {
      emotionalWeight = this.calculateEmotionalWeight(task1, task2);
    }
    
    // Calculer la proximité temporelle
    let temporalProximity = 0;
    if (this.config.enableTemporalProximity) {
      temporalProximity = this.calculateTemporalProximity(task1, task2);
    }
    
    // Calculer la similarité sémantique
    let semanticSimilarity = 0;
    if (this.config.enableSemanticSimilarity) {
      semanticSimilarity = this.calculateSemanticSimilarity(task1, task2);
    }
    
    // Calculer le score global de cohésion
    const score = this.calculateOverallCohesionScore(
      sharedObject,
      sharedContext,
      emotionalWeight,
      temporalProximity,
      semanticSimilarity
    );
    
    // Déterminer la raison du découpage si le score est bas
    let breakdownReason: string | null = null;
    if (score < this.config.minCohesionThreshold) {
      breakdownReason = this.determineBreakdownReason(
        sharedObject,
        sharedContext,
        emotionalWeight,
        temporalProximity,
        semanticSimilarity
      );
    }
    
    return {
      score,
      sharedObject,
      sharedContext,
      emotionalWeight,
      temporalProximity,
      semanticSimilarity,
      breakdownReason
    };
  }
  
  /**
   * Détermine si une tâche composée doit être divisée
   * @param compoundTask Tâche composée
   * @param subTasks Sous-tâches potentielles
   * @returns true si la tâche doit être divisée, false sinon
   */
  shouldSplitTask(compoundTask: any, subTasks: any[]): boolean {
    // Si une seule sous-tâche, ne pas diviser
    if (subTasks.length <= 1) {
      return false;
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
    
    // Diviser si la cohésion moyenne est supérieure au seuil
    return averageCohesion > this.config.minCohesionThreshold;
  }
  
  /**
   * Vérifie si deux tâches partagent un objet
   */
  private hasSharedObject(task1: any, task2: any): boolean {
    if (!task1.object || !task2.object) return false;
    
    // Convertir en minuscules pour la comparaison
    const obj1 = task1.object.toLowerCase();
    const obj2 = task2.object.toLowerCase();
    
    // Vérifier l'égalité stricte
    if (obj1 === obj2) return true;
    
    // Vérifier si un objet contient l'autre
    if (obj1.includes(obj2) || obj2.includes(obj1)) return true;
    
    // Vérifier les mots communs
    const words1 = obj1.split(/\s+/);
    const words2 = obj2.split(/\s+/);
    const commonWords = words1.filter(word => words2.includes(word));
    
    return commonWords.length > 0;
  }
  
  /**
   * Vérifie si deux tâches partagent un contexte
   */
  private hasSharedContext(task1: any, task2: any): boolean {
    // Vérifier les entités nommées communes
    if (task1.entities && task2.entities) {
      const entities1 = Object.values(task1.entities);
      const entities2 = Object.values(task2.entities);
      const commonEntities = entities1.filter(entity => entities2.includes(entity));
      if (commonEntities.length > 0) return true;
    }
    
    // Vérifier les tags communs
    if (task1.tags && task2.tags) {
      const commonTags = task1.tags.filter((tag: string) => task2.tags.includes(tag));
      if (commonTags.length > 0) return true;
    }
    
    // Vérifier les deadlines proches
    if (task1.deadline && task2.deadline) {
      // Implémentation simplifiée - à améliorer
      return task1.deadline === task2.deadline;
    }
    
    return false;
  }
  
  /**
   * Calcule le poids émotionnel entre deux tâches
   */
  private calculateEmotionalWeight(task1: any, task2: any): number {
    // Mots indicatifs d'émotion
    const emotionalWords = [
      'important', 'urgent', 'stress', 'anxiety', 'panic', 'emergency',
      'important', 'urgent', 'stress', 'angoisse', 'panique', 'urgence',
      'importante', 'urgente', 'estrés', 'pánico', 'emergencia'
    ];
    
    let emotionalCount = 0;
    const text1 = (task1.rawText || task1.sentence || '').toLowerCase();
    const text2 = (task2.rawText || task2.sentence || '').toLowerCase();
    
    for (const word of emotionalWords) {
      if (text1.includes(word) || text2.includes(word)) {
        emotionalCount++;
      }
    }
    
    // Normaliser le score (0-1)
    return Math.min(emotionalCount / 5, 1);
  }
  
  /**
   * Calcule la proximité temporelle entre deux tâches
   */
  private calculateTemporalProximity(task1: any, task2: any): number {
    // Si les deux ont des deadlines, comparer les délais
    if (task1.deadline && task2.deadline) {
      // Implémentation simplifiée - à améliorer
      if (task1.deadline === task2.deadline) return 1;
      return 0.5; // Proximité partielle
    }
    
    // Si une seule a un deadline, proximité moyenne
    if (task1.deadline || task2.deadline) {
      return 0.3;
    }
    
    // Aucun deadline, proximité faible
    return 0.1;
  }
  
  /**
   * Calcule la similarité sémantique entre deux tâches
   */
  private calculateSemanticSimilarity(task1: any, task2: any): number {
    // Mots d'action similaires
    const similarActions: Record<string, string[]> = {
      'call': ['phone', 'contact', 'reach'],
      'write': ['compose', 'draft', 'type'],
      'send': ['email', 'message', 'transmit'],
      'prepare': ['ready', 'setup', 'arrange'],
      'appeler': ['téléphoner', 'contacter', 'joindre'],
      'écrire': ['composer', 'rédiger', 'taper'],
      'envoyer': ['email', 'message', 'transmettre'],
      'préparer': ['prêt', 'installer', 'arranger']
    };
    
    const action1 = (task1.action || '').toLowerCase();
    const action2 = (task2.action || '').toLowerCase();
    
    // Actions identiques
    if (action1 === action2) return 1;
    
    // Actions similaires
    if (similarActions[action1] && similarActions[action1].includes(action2)) {
      return 0.8;
    }
    
    if (similarActions[action2] && similarActions[action2].includes(action1)) {
      return 0.8;
    }
    
    // Aucune similarité détectée
    return 0.2;
  }
  
  /**
   * Calcule le score global de cohésion
   */
  private calculateOverallCohesionScore(
    sharedObject: boolean,
    sharedContext: boolean,
    emotionalWeight: number,
    temporalProximity: number,
    semanticSimilarity: number
  ): number {
    // Pondérations
    const weights = {
      sharedObject: 0.3,
      sharedContext: 0.25,
      emotionalWeight: 0.2,
      temporalProximity: 0.15,
      semanticSimilarity: 0.1
    };
    
    // Calcul du score pondéré
    let score = 0;
    score += (sharedObject ? 1 : 0) * weights.sharedObject;
    score += (sharedContext ? 1 : 0) * weights.sharedContext;
    score += emotionalWeight * weights.emotionalWeight;
    score += temporalProximity * weights.temporalProximity;
    score += semanticSimilarity * weights.semanticSimilarity;
    
    return Math.min(score, 1);
  }
  
  /**
   * Détermine la raison du découpage
   */
  private determineBreakdownReason(
    sharedObject: boolean,
    sharedContext: boolean,
    emotionalWeight: number,
    temporalProximity: number,
    semanticSimilarity: number
  ): string {
    const reasons: string[] = [];
    
    if (!sharedObject) reasons.push("pas d'objet partagé");
    if (!sharedContext) reasons.push("pas de contexte partagé");
    if (emotionalWeight < 0.3) reasons.push("poids émotionnel faible");
    if (temporalProximity < 0.3) reasons.push("proximité temporelle faible");
    if (semanticSimilarity < 0.3) reasons.push("similarité sémantique faible");
    
    return reasons.length > 0 ? reasons.join(", ") : "cohésion insuffisante";
  }
  
  /**
   * Met à jour la configuration
   */
  updateConfig(newConfig: Partial<CohesionConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
  
  /**
   * Obtient la configuration actuelle
   */
  getConfig(): CohesionConfig {
    return { ...this.config };
  }
}

// Instance singleton de l'analyseur de cohésion
export const cohesionAnalyzer = new CohesionAnalyzer();