/**
 * Détecteur de fatigue linguistique avancé
 * Implémente la détection concrète de la fatigue linguistique avec calculs précis
 * 
 * CORRECTION DE LA PHASE 2 : Détecteur de fatigue linguistique avec détection concrète
 */

// Interface pour les métriques de baseline
export interface BaselineMetrics {
  avgSentenceLength: number;
  avgVerbDensity: number;
  avgTypoRate: number;
  avgVocabularyRichness: number;
  avgPunctuationConsistency: number;
  calculatedAt: Date;
}

// Interface pour les métriques de fatigue
export interface FatigueMetrics {
  currentAvgSentenceLength: number;
  currentVerbDensity: number;
  currentTypoRate: number;
  currentVocabularyRichness: number;
  currentPunctuationConsistency: number;
  calculatedAt: Date;
}

// Interface pour les résultats de détection
export interface FatigueDetectionResult {
  fatigueLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  fatigueScore: number;
  baseline: BaselineMetrics;
  currentMetrics: FatigueMetrics;
  signals: string[];
  adaptationNeeded: boolean;
}

// Interface pour les paramètres de détection
export interface FatigueDetectionParams {
  baselineWindowDays: number;    // Fenêtre pour calculer la baseline (ex: 30 jours)
  currentWindowInputs: number;   // Nombre d'entrées récentes à analyser (ex: 5)
  fatigueThresholds: {
    low: number;     // 0.30
    medium: number;  // 0.60
    high: number;    // 0.80
  };
}

// Interface pour les paramètres NLP adaptatifs
export interface AdaptiveNLPConfig {
  confidenceThreshold: number;
  splitAggressive: boolean;
  requireVerb: boolean;
  message: string;
  processingTimeoutMs: number;
}

// Service de détection de fatigue linguistique avancé
export class LinguisticFatigueAdvancedDetector {
  private baseline: BaselineMetrics | null = null;
  private history: string[] = [];
  private params: FatigueDetectionParams;
  private initialized: boolean = false;

  constructor(params?: Partial<FatigueDetectionParams>) {
    this.params = {
      baselineWindowDays: params?.baselineWindowDays ?? 30,
      currentWindowInputs: params?.currentWindowInputs ?? 5,
      fatigueThresholds: params?.fatigueThresholds ?? {
        low: 0.30,
        medium: 0.60,
        high: 0.80
      }
    };
  }

  /**
   * Calcule la baseline à partir de l'historique des entrées utilisateur
   */
  public async calculateBaseline(userHistory: string[]): Promise<BaselineMetrics> {
    if (userHistory.length === 0) {
      // Retourner des valeurs par défaut si pas d'historique
      return {
        avgSentenceLength: 12, // Longueur moyenne typique
        avgVerbDensity: 0.3,   // 30% de mots sont des verbes typiquement
        avgTypoRate: 0.02,     // 2% de taux de faute typique
        avgVocabularyRichness: 0.6, // 60% de mots uniques typiquement
        avgPunctuationConsistency: 0.8, // 80% de cohérence typique
        calculatedAt: new Date()
      };
    }

    let totalSentenceLength = 0;
    let totalVerbDensity = 0;
    let totalTypoRate = 0;
    let totalVocabularyRichness = 0;
    let totalPunctuationConsistency = 0;

    for (const input of userHistory) {
      const metrics = this.analyzeInput(input);
      
      totalSentenceLength += metrics.avgSentenceLength;
      totalVerbDensity += metrics.verbDensity;
      totalTypoRate += metrics.typoRate;
      totalVocabularyRichness += metrics.vocabularyRichness;
      totalPunctuationConsistency += metrics.punctuationConsistency;
    }

    const count = userHistory.length;

    this.baseline = {
      avgSentenceLength: totalSentenceLength / count,
      avgVerbDensity: totalVerbDensity / count,
      avgTypoRate: totalTypoRate / count,
      avgVocabularyRichness: totalVocabularyRichness / count,
      avgPunctuationConsistency: totalPunctuationConsistency / count,
      calculatedAt: new Date()
    };

    this.initialized = true;
    return this.baseline;
  }

  /**
   * Détecte la fatigue linguistique à partir des entrées récentes
   */
  public detectFatigue(recentInputs: string[]): FatigueDetectionResult {
    if (!this.baseline) {
      throw new Error('Baseline not calculated. Call calculateBaseline first.');
    }

    if (recentInputs.length === 0) {
      return {
        fatigueLevel: 'LOW',
        fatigueScore: 0,
        baseline: this.baseline,
        currentMetrics: this.getCurrentMetricsDefault(),
        signals: ['Aucune entrée récente à analyser'],
        adaptationNeeded: false
      };
    }

    // Calculer les métriques actuelles
    const currentMetrics = this.calculateCurrentMetrics(recentInputs);

    // Calculer le score de fatigue
    const fatigueScore = this.calculateFatigueScore(this.baseline, currentMetrics);

    // Déterminer le niveau de fatigue
    let fatigueLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    if (fatigueScore > this.params.fatigueThresholds.high) {
      fatigueLevel = 'HIGH';
    } else if (fatigueScore > this.params.fatigueThresholds.medium) {
      fatigueLevel = 'MEDIUM';
    }

    // Identifier les signaux de fatigue
    const signals = this.identifyFatigueSignals(this.baseline, currentMetrics);

    return {
      fatigueLevel,
      fatigueScore,
      baseline: this.baseline,
      currentMetrics,
      signals,
      adaptationNeeded: fatigueLevel !== 'LOW'
    };
  }

  /**
   * Analyse une entrée individuelle pour en extraire les métriques
   */
  private analyzeInput(input: string): {
    avgSentenceLength: number;
    verbDensity: number;
    typoRate: number;
    vocabularyRichness: number;
    punctuationConsistency: number;
  } {
    // Calculer la longueur moyenne des phrases
    const sentences = this.splitIntoSentences(input);
    const avgSentenceLength = sentences.length > 0 
      ? sentences.reduce((sum, sentence) => sum + this.countWords(sentence), 0) / sentences.length 
      : 0;

    // Calculer la densité de verbes (approximation simple)
    const verbDensity = this.estimateVerbDensity(input);

    // Calculer le taux de fautes
    const typoRate = this.calculateTypoRate(input);

    // Calculer la richesse du vocabulaire
    const vocabularyRichness = this.calculateVocabularyRichness(input);

    // Calculer la cohérence de la ponctuation
    const punctuationConsistency = this.calculatePunctuationConsistency(input);

    return {
      avgSentenceLength,
      verbDensity,
      typoRate,
      vocabularyRichness,
      punctuationConsistency
    };
  }

  /**
   * Calcule les métriques actuelles à partir des entrées récentes
   */
  private calculateCurrentMetrics(inputs: string[]): FatigueMetrics {
    let totalSentenceLength = 0;
    let totalVerbDensity = 0;
    let totalTypoRate = 0;
    let totalVocabularyRichness = 0;
    let totalPunctuationConsistency = 0;

    for (const input of inputs) {
      const metrics = this.analyzeInput(input);
      
      totalSentenceLength += metrics.avgSentenceLength;
      totalVerbDensity += metrics.verbDensity;
      totalTypoRate += metrics.typoRate;
      totalVocabularyRichness += metrics.vocabularyRichness;
      totalPunctuationConsistency += metrics.punctuationConsistency;
    }

    const count = inputs.length;

    return {
      currentAvgSentenceLength: totalSentenceLength / count,
      currentVerbDensity: totalVerbDensity / count,
      currentTypoRate: totalTypoRate / count,
      currentVocabularyRichness: totalVocabularyRichness / count,
      currentPunctuationConsistency: totalPunctuationConsistency / count,
      calculatedAt: new Date()
    };
  }

  /**
   * Calcule le score de fatigue en comparant la baseline aux métriques actuelles
   */
  private calculateFatigueScore(baseline: BaselineMetrics, current: FatigueMetrics): number {
    // Calculer les écarts normalisés pour chaque métrique
    const lengthDrop = Math.max(0, (baseline.avgSentenceLength - current.currentAvgSentenceLength) / baseline.avgSentenceLength);
    const verbDrop = Math.max(0, (baseline.avgVerbDensity - current.currentVerbDensity) / Math.max(baseline.avgVerbDensity, 0.01));
    const typoIncrease = Math.max(0, (current.currentTypoRate - baseline.avgTypoRate) / Math.max(baseline.avgTypoRate, 0.01));
    const vocabularyDrop = Math.max(0, (baseline.avgVocabularyRichness - current.currentVocabularyRichness) / baseline.avgVocabularyRichness);
    const punctuationDrop = Math.max(0, (baseline.avgPunctuationConsistency - current.currentPunctuationConsistency) / baseline.avgPunctuationConsistency);

    // Calculer le score de fatigue pondéré
    const fatigueScore = (
      0.30 * lengthDrop +      // 30% poids pour longueur de phrase
      0.25 * verbDrop +        // 25% poids pour densité de verbes
      0.20 * typoIncrease +    // 20% poids pour augmentation des fautes
      0.15 * vocabularyDrop +  // 15% poids pour pauvreté du vocabulaire
      0.10 * punctuationDrop   // 10% poids pour incohérence de ponctuation
    );

    return Math.min(fatigueScore, 1.0);
  }

  /**
   * Identifie les signaux spécifiques de fatigue
   */
  private identifyFatigueSignals(baseline: BaselineMetrics, current: FatigueMetrics): string[] {
    const signals: string[] = [];

    // Signaux de fatigue linguistique
    if (current.currentAvgSentenceLength < baseline.avgSentenceLength * 0.7) {
      signals.push('Diminution significative de la longueur moyenne des phrases');
    }

    if (current.currentVerbDensity < baseline.avgVerbDensity * 0.7) {
      signals.push('Baisse de la densité de verbes dans les phrases');
    }

    if (current.currentTypoRate > baseline.avgTypoRate * 1.5) {
      signals.push('Augmentation des fautes de frappe ou orthographiques');
    }

    if (current.currentVocabularyRichness < baseline.avgVocabularyRichness * 0.8) {
      signals.push('Appauvrissement du vocabulaire utilisé');
    }

    if (current.currentPunctuationConsistency < baseline.avgPunctuationConsistency * 0.8) {
      signals.push('Moins de cohérence dans l\'utilisation de la ponctuation');
    }

    // Si aucun signal spécifique, indiquer qu'on est dans la normale
    if (signals.length === 0) {
      signals.push('Aucun signal de fatigue linguistique détecté');
    }

    return signals;
  }

  /**
   * Adapte les paramètres NLP en fonction du niveau de fatigue détecté
   */
  public adaptNLPParams(fatigueLevel: 'LOW' | 'MEDIUM' | 'HIGH'): AdaptiveNLPConfig {
    switch (fatigueLevel) {
      case 'HIGH':
        return {
          confidenceThreshold: 0.50,  // Plus permissif
          splitAggressive: false,     // Ne pas fragmenter
          requireVerb: false,         // Accepter phrases nominales
          message: "Mode capture simplifié activé. Exprimez-vous naturellement, je comprendrai.",
          processingTimeoutMs: 300    // Plus de temps pour le traitement
        };

      case 'MEDIUM':
        return {
          confidenceThreshold: 0.65,
          splitAggressive: false,
          requireVerb: true,
          message: "Je m'adapte à votre style d'expression. Continuez comme vous le sentez.",
          processingTimeoutMs: 250
        };

      default: // LOW
        return {
          confidenceThreshold: 0.70,
          splitAggressive: true,
          requireVerb: true,
          message: "Je suis pleinement opérationnel pour analyser vos tâches.",
          processingTimeoutMs: 200
        };
    }
  }

  /**
   * Méthodes utilitaires pour l'analyse linguistique
   */

  private splitIntoSentences(text: string): string[] {
    // Expression régulière pour séparer les phrases
    return text.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0);
  }

  private countWords(sentence: string): number {
    return sentence.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  private estimateVerbDensity(text: string): number {
    // Approximation simple : compter les mots qui pourraient être des verbes
    // Dans une langue typique, environ 30% des mots sont des verbes
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    if (words.length === 0) return 0;

    // Mots qui ressemblent à des verbes (finissent par des terminaisons de verbes)
    const verbLikePattern = /\w+(?:er|ez|é|ée|és|ées|ai|as|a|ons|ez|ont|e|es|ent|ais|ait|ions|iez|aient|ai|as|a|ons|ez|ont)$/g;
    const verbLikeMatches = text.toLowerCase().match(verbLikePattern) || [];
    
    // On retourne une estimation modeste pour éviter les fausses détections
    return Math.min(verbLikeMatches.length / Math.max(1, words.length), 0.4);
  }

  private calculateTypoRate(text: string): number {
    // Détecter des motifs de fautes typiques
    const typoPatterns = [
      /\w{2,}[^a-zA-Z\s]+\w{2,}/g,  // Caractères spéciaux au milieu des mots
      /\b\w*[0-9]+\w*\b/g,          // Nombres au milieu des mots
      /\s{3,}/g,                     // Plus de 2 espaces consécutifs
      /[^a-zA-Z\s]{4,}/g,            // Plusieurs caractères spéciaux ensemble
    ];

    let typoCount = 0;
    for (const pattern of typoPatterns) {
      const matches = text.match(pattern);
      typoCount += matches ? matches.length : 0;
    }

    // Normaliser par rapport à la longueur du texte
    return typoCount / Math.max(1, text.length / 10);
  }

  private calculateVocabularyRichness(text: string): number {
    // Extraire les mots uniques
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    const uniqueWords = new Set(words);

    // Calculer le ratio de mots uniques
    const richness = uniqueWords.size / Math.max(1, words.length);

    // Normaliser entre 0 et 1
    return Math.min(richness, 1);
  }

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
    const consistency = 1 - (variance / Math.max(1, totalPunctuation * 10));

    return Math.max(0, Math.min(1, consistency));
  }

  /**
   * Récupère les métriques par défaut (utilisé quand pas d'entrées récentes)
   */
  private getCurrentMetricsDefault(): FatigueMetrics {
    return {
      currentAvgSentenceLength: 0,
      currentVerbDensity: 0,
      currentTypoRate: 0,
      currentVocabularyRichness: 0,
      currentPunctuationConsistency: 0,
      calculatedAt: new Date()
    };
  }

  /**
   * Vérifie si le détecteur est initialisé
   */
  public isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Réinitialise le détecteur
   */
  public reset(): void {
    this.baseline = null;
    this.history = [];
    this.initialized = false;
  }
}

// Instance singleton du détecteur de fatigue avancé
export const linguisticFatigueAdvancedDetector = new LinguisticFatigueAdvancedDetector();

/**
 * Fonction utilitaire pour intégrer la détection de fatigue dans le flux NLP
 */
export async function integrateFatigueDetection(
  recentInputs: string[],
  baselineInputs: string[]
): Promise<{ fatigueResult: FatigueDetectionResult; adaptedConfig: AdaptiveNLPConfig }> {
  const detector = new LinguisticFatigueAdvancedDetector();
  
  // Calculer la baseline
  const baseline = await detector.calculateBaseline(baselineInputs);
  
  // Détecter la fatigue
  const fatigueResult = detector.detectFatigue(recentInputs);
  
  // Adapter la configuration NLP
  const adaptedConfig = detector.adaptNLPParams(fatigueResult.fatigueLevel);
  
  return { fatigueResult, adaptedConfig };
}