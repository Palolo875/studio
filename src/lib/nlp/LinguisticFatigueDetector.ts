/**
 * Détecteur de fatigue linguistique pour adapter les seuils NLP
 * Adapte le comportement du NLP en fonction de l'état de l'utilisateur
 */

// Interface pour les métriques de fatigue linguistique
export interface LinguisticFatigueMetrics {
  avgSentenceLength: number;  // Longueur moyenne des phrases
  confidenceScore: number;    // Score de confiance moyen
  typoRate: number;           // Taux de fautes de frappe
  vocabularyRichness: number; // Richesse du vocabulaire (0-1)
  punctuationConsistency: number; // Cohérence de la ponctuation (0-1)
  abbreviationRate: number;   // Taux d'abréviations
  repetitionRate: number;     // Taux de répétitions
}

// Interface pour l'état de fatigue
export interface FatigueState {
  level: 'LOW' | 'MEDIUM' | 'HIGH'; // Niveau de fatigue
  confidenceAdjustment: number;      // Facteur d'ajustement de confiance
  splitRelaxation: number;          // Relaxation du découpage
  processingThreshold: number;       // Seuil de traitement
  recommendations: string[];         // Recommandations
}

// Interface pour la configuration du détecteur
export interface FatigueConfig {
  sentenceLengthThreshold: number;   // Seuil de longueur de phrase
  confidenceThreshold: number;       // Seuil de confiance
  typoRateThreshold: number;         // Seuil de taux de fautes
  vocabularyThreshold: number;       // Seuil de richesse du vocabulaire
  sensitivity: number;              // Sensibilité de la détection (0-1)
}

// Service de détection de fatigue linguistique
export class LinguisticFatigueDetector {
  private config: FatigueConfig;
  private history: LinguisticFatigueMetrics[];
  private windowSize: number;
  
  constructor(config?: Partial<FatigueConfig>, windowSize: number = 10) {
    this.config = {
      sentenceLengthThreshold: config?.sentenceLengthThreshold ?? 15,
      confidenceThreshold: config?.confidenceThreshold ?? 0.8,
      typoRateThreshold: config?.typoRateThreshold ?? 0.05,
      vocabularyThreshold: config?.vocabularyThreshold ?? 0.7,
      sensitivity: config?.sensitivity ?? 0.5
    };
    
    this.history = [];
    this.windowSize = windowSize;
  }
  
  /**
   * Analyse le texte pour détecter la fatigue linguistique
   * @param text Texte à analyser
   * @param confidenceScores Scores de confiance associés
   * @returns État de fatigue détecté
   */
  detectFatigue(text: string, confidenceScores: number[] = []): FatigueState {
    // Calculer les métriques
    const metrics = this.calculateMetrics(text, confidenceScores);
    
    // Ajouter aux historiques
    this.history.push(metrics);
    if (this.history.length > this.windowSize) {
      this.history.shift();
    }
    
    // Déterminer le niveau de fatigue
    return this.determineFatigueLevel(metrics);
  }
  
  /**
   * Calcule les métriques de fatigue linguistique
   */
  private calculateMetrics(text: string, confidenceScores: number[]): LinguisticFatigueMetrics {
    // Séparer en phrases
    const sentences = this.splitIntoSentences(text);
    
    // Calculer la longueur moyenne des phrases
    const avgSentenceLength = sentences.reduce((sum, sentence) => 
      sum + sentence.split(/\s+/).length, 0) / Math.max(1, sentences.length);
    
    // Calculer le score de confiance moyen
    const avgConfidence = confidenceScores.length > 0 ? 
      confidenceScores.reduce((sum, score) => sum + score, 0) / confidenceScores.length : 0.5;
    
    // Calculer le taux de fautes de frappe
    const typoRate = this.calculateTypoRate(text);
    
    // Calculer la richesse du vocabulaire
    const vocabularyRichness = this.calculateVocabularyRichness(text);
    
    // Calculer la cohérence de la ponctuation
    const punctuationConsistency = this.calculatePunctuationConsistency(text);
    
    // Calculer le taux d'abréviations
    const abbreviationRate = this.calculateAbbreviationRate(text);
    
    // Calculer le taux de répétitions
    const repetitionRate = this.calculateRepetitionRate(text);
    
    return {
      avgSentenceLength,
      confidenceScore: avgConfidence,
      typoRate,
      vocabularyRichness,
      punctuationConsistency,
      abbreviationRate,
      repetitionRate
    };
  }
  
  /**
   * Sépare le texte en phrases
   */
  private splitIntoSentences(text: string): string[] {
    // Utiliser une expression régulière simple pour séparer les phrases
    return text.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0);
  }
  
  /**
   * Calcule le taux de fautes de frappe
   */
  private calculateTypoRate(text: string): number {
    // Expressions régulières pour détecter des motifs de fautes courantes
    const typoPatterns = [
      /\w{2,}[^a-zA-Z\s]+\w{2,}/g, // Caractères spéciaux au milieu des mots
      /\b\w*[0-9]+\w*\b/g,         // Nombres au milieu des mots
      /\s{3,}/g                    // Plus de 2 espaces consécutifs
    ];
    
    let typoCount = 0;
    for (const pattern of typoPatterns) {
      const matches = text.match(pattern);
      typoCount += matches ? matches.length : 0;
    }
    
    // Normaliser par rapport à la longueur du texte
    return typoCount / Math.max(1, text.length / 10);
  }
  
  /**
   * Calcule la richesse du vocabulaire
   */
  private calculateVocabularyRichness(text: string): number {
    // Extraire les mots uniques
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    const uniqueWords = new Set(words);
    
    // Calculer le ratio de mots uniques
    const richness = uniqueWords.size / Math.max(1, words.length);
    
    // Normaliser entre 0 et 1
    return Math.min(richness, 1);
  }
  
  /**
   * Calcule la cohérence de la ponctuation
   */
  private calculatePunctuationConsistency(text: string): number {
    // Compter les différents types de ponctuation
    const periods = (text.match(/\./g) || []).length;
    const commas = (text.match(/,/g) || []).length;
    const exclamation = (text.match(/!/g) || []).length;
    const question = (text.match(/\?/g) || []).length;
    
    const totalPunctuation = periods + commas + exclamation + question;
    
    // Si peu de ponctuation, considérer comme inconsistante
    if (totalPunctuation < text.length / 50) {
      return 0.3; // Faible cohérence
    }
    
    // Calculer la distribution équilibrée
    const avg = totalPunctuation / 4;
    const variance = Math.pow(periods - avg, 2) + 
                    Math.pow(commas - avg, 2) + 
                    Math.pow(exclamation - avg, 2) + 
                    Math.pow(question - avg, 2);
    
    // Plus la variance est faible, plus la ponctuation est cohérente
    const consistency = 1 - (variance / (totalPunctuation * 10));
    
    return Math.max(0, Math.min(1, consistency));
  }
  
  /**
   * Calcule le taux d'abréviations
   */
  private calculateAbbreviationRate(text: string): number {
    // Expressions régulières pour détecter les abréviations courantes
    const abbreviations = /\b(?:[A-Z]{2,}|[A-Z]\.[A-Z]\.?|[A-Z][a-z]{1,2}\.)\b/g;
    const matches = text.match(abbreviations) || [];
    
    // Compter les mots
    const words = text.match(/\b\w+\b/g) || [];
    
    return matches.length / Math.max(1, words.length);
  }
  
  /**
   * Calcule le taux de répétitions
   */
  private calculateRepetitionRate(text: string): number {
    // Extraire les mots
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    
    // Compter les occurrences de chaque mot
    const wordCount: Record<string, number> = {};
    for (const word of words) {
      wordCount[word] = (wordCount[word] || 0) + 1;
    }
    
    // Compter les répétitions (mots apparaissant plus d'une fois)
    let repetitions = 0;
    for (const count of Object.values(wordCount)) {
      if (count > 1) {
        repetitions += count - 1;
      }
    }
    
    return repetitions / Math.max(1, words.length);
  }
  
  /**
   * Détermine le niveau de fatigue à partir des métriques
   */
  private determineFatigueLevel(metrics: LinguisticFatigueMetrics): FatigueState {
    // Calculer un score de fatigue global
    let fatigueScore = 0;
    let weightSum = 0;
    
    // Pondérations ajustables selon la sensibilité
    const weights = {
      sentenceLength: 0.2,
      confidence: 0.25,
      typoRate: 0.15,
      vocabulary: 0.1,
      punctuation: 0.1,
      abbreviation: 0.1,
      repetition: 0.1
    };
    
    // Ajuster les pondérations selon la sensibilité
    Object.keys(weights).forEach(key => {
      weights[key as keyof typeof weights] *= this.config.sensitivity;
    });
    
    // Calculer le score de fatigue
    if (metrics.avgSentenceLength < this.config.sentenceLengthThreshold) {
      fatigueScore += (1 - metrics.avgSentenceLength / this.config.sentenceLengthThreshold) * weights.sentenceLength;
    }
    weightSum += weights.sentenceLength;
    
    if (metrics.confidenceScore < this.config.confidenceThreshold) {
      fatigueScore += (1 - metrics.confidenceScore / this.config.confidenceThreshold) * weights.confidence;
    }
    weightSum += weights.confidence;
    
    if (metrics.typoRate > this.config.typoRateThreshold) {
      fatigueScore += (metrics.typoRate / (this.config.typoRateThreshold * 2)) * weights.typoRate;
    }
    weightSum += weights.typoRate;
    
    if (metrics.vocabularyRichness < this.config.vocabularyThreshold) {
      fatigueScore += (1 - metrics.vocabularyRichness / this.config.vocabularyThreshold) * weights.vocabulary;
    }
    weightSum += weights.vocabulary;
    
    // Inverser la logique pour la ponctuation (plus c'est cohérent, moins c'est fatiguant)
    fatigueScore += (1 - metrics.punctuationConsistency) * weights.punctuation;
    weightSum += weights.punctuation;
    
    // Normaliser le score
    fatigueScore = weightSum > 0 ? fatigueScore / weightSum : 0;
    
    // Déterminer le niveau de fatigue
    let level: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    if (fatigueScore > 0.7) {
      level = 'HIGH';
    } else if (fatigueScore > 0.4) {
      level = 'MEDIUM';
    }
    
    // Calculer les ajustements
    const confidenceAdjustment = this.calculateConfidenceAdjustment(level);
    const splitRelaxation = this.calculateSplitRelaxation(level);
    const processingThreshold = this.calculateProcessingThreshold(level);
    const recommendations = this.generateRecommendations(level, metrics);
    
    return {
      level,
      confidenceAdjustment,
      splitRelaxation,
      processingThreshold,
      recommendations
    };
  }
  
  /**
   * Calcule l'ajustement de confiance selon le niveau de fatigue
   */
  private calculateConfidenceAdjustment(level: 'LOW' | 'MEDIUM' | 'HIGH'): number {
    switch (level) {
      case 'HIGH':
        return 0.7; // Être plus permissif
      case 'MEDIUM':
        return 0.85;
      default:
        return 1.0; // Comportement normal
    }
  }
  
  /**
   * Calcule la relaxation du découpage selon le niveau de fatigue
   */
  private calculateSplitRelaxation(level: 'LOW' | 'MEDIUM' | 'HIGH'): number {
    switch (level) {
      case 'HIGH':
        return 1.5; // Être plus indulgent sur le découpage
      case 'MEDIUM':
        return 1.2;
      default:
        return 1.0; // Comportement normal
    }
  }
  
  /**
   * Calcule le seuil de traitement selon le niveau de fatigue
   */
  private calculateProcessingThreshold(level: 'LOW' | 'MEDIUM' | 'HIGH'): number {
    switch (level) {
      case 'HIGH':
        return 0.5; // Abaisser le seuil pour être plus tolérant
      case 'MEDIUM':
        return 0.6;
      default:
        return 0.7; // Seuil normal
    }
  }
  
  /**
   * Génère des recommandations selon le niveau de fatigue
   */
  private generateRecommendations(level: 'LOW' | 'MEDIUM' | 'HIGH', metrics: LinguisticFatigueMetrics): string[] {
    const recommendations: string[] = [];
    
    switch (level) {
      case 'HIGH':
        recommendations.push("Prenez une pause - votre concentration semble faible");
        recommendations.push("Exprimez-vous simplement, je comprendrai");
        recommendations.push("Pas besoin d'être parfait, je suis là pour vous aider");
        break;
      case 'MEDIUM':
        recommendations.push("Continuez comme ça, mais n'hésitez pas à faire des pauses");
        recommendations.push("Soyez naturel dans votre formulation");
        break;
      default:
        recommendations.push("Continuez à exprimer vos tâches librement");
        break;
    }
    
    // Recommandations spécifiques basées sur les métriques
    if (metrics.avgSentenceLength < this.config.sentenceLengthThreshold * 0.5) {
      recommendations.push("Vous pouvez utiliser des phrases plus longues si vous le souhaitez");
    }
    
    if (metrics.typoRate > this.config.typoRateThreshold * 1.5) {
      recommendations.push("Ne vous inquiétez pas des petites fautes de frappe");
    }
    
    return recommendations;
  }
  
  /**
   * Met à jour la configuration
   */
  updateConfig(newConfig: Partial<FatigueConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
  
  /**
   * Obtient la configuration actuelle
   */
  getConfig(): FatigueConfig {
    return { ...this.config };
  }
  
  /**
   * Obtient l'historique des métriques
   */
  getHistory(): LinguisticFatigueMetrics[] {
    return [...this.history];
  }
  
  /**
   * Réinitialise l'historique
   */
  resetHistory(): void {
    this.history = [];
  }
}

// Instance singleton du détecteur de fatigue linguistique
export const linguisticFatigueDetector = new LinguisticFatigueDetector();