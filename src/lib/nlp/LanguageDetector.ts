/**
 * Détecteur de langue SOTA (State-of-the-Art) pour l'analyse NLP
 * Utilise des techniques avancées pour une précision maximale
 */
export class LanguageDetector {

  // Modèles de langue basés sur des n-grammes et des caractéristiques linguistiques
  private static readonly LANGUAGE_MODELS = {
    fr: {
      // Trigrammes fréquents
      trigrams: new Set(['le ', ' de', 'ent', 'ion', 'des', 'que', 'est', 'ela', 'les', 'ela', 'our', 'ous', 'ave', 'par', 'tio']),
      // Bigrammes fréquents
      bigrams: new Set(['le', 'de', 'en', 're', 'on', 'er', 'es', 'nt', 'te', 'el', 'an', 'ou', 'se', 'ai', 'it']),
      // Caractères spécifiques
      chars: new Set(['à', 'â', 'ä', 'é', 'è', 'ê', 'ë', 'ï', 'î', 'ô', 'ö', 'ù', 'û', 'ü', 'ÿ', 'ç']),
      // Terminaisons fréquentes
      endings: new Set(['tion', 'sion', 'ment', 'ance', 'ence', 'ique', 'isme', 'iste', 'eur', 'eux']),
      // Articles et pronoms
      functionWords: new Set(['le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'et', 'ou', 'mais', 'car', 'donc', 'or', 'ni', 'ne'])
    },
    en: {
      // Trigrammes fréquents
      trigrams: new Set([' th', 'he ', 'ing', 'ent', 'ion', ' to', ' of', 'and', 'er ', 'ed ', ' in', 'on ', 'at ', 'ou', 'ha']),
      // Bigrammes fréquents
      bigrams: new Set(['th', 'he', 'in', 'er', 'an', 're', 'on', 'at', 'en', 'nd', 'ti', 'es', 'or', 'te', 'of']),
      // Caractères spécifiques
      chars: new Set(['a', 'e', 'i', 'o', 'u', 't', 'n', 's', 'r', 'h', 'l', 'd', 'c', 'u', 'm']),
      // Terminaisons fréquentes
      endings: new Set(['tion', 'sion', 'ness', 'ment', 'er', 'or', 'ly', 'ful', 'less', 'ing', 'ed', 'est']),
      // Articles et pronoms
      functionWords: new Set(['the', 'and', 'to', 'of', 'a', 'in', 'is', 'it', 'you', 'that', 'he', 'was', 'for', 'on', 'are'])
    },
    es: {
      // Trigrammes fréquents
      trigrams: new Set([' de', 'la ', 'que', 'ent', 'ion', ' el', ' en', 'ado', 'era', 'con', 'est', 'par', 'los', 'ara', 'per']),
      // Bigrammes fréquents
      bigrams: new Set(['de', 'la', 'en', 'el', 'er', 'es', 'on', 'as', 'ar', 'ad', 'an', 'al', 'or', 'nt', 'os']),
      // Caractères spécifiques
      chars: new Set(['á', 'é', 'í', 'ó', 'ú', 'ü', 'ñ', 'a', 'e', 'i', 'o', 'u', 'n', 'r', 's']),
      // Terminaisons fréquentes
      endings: new Set(['ción', 'sión', 'dad', 'tad', 'ción', 'sión', 'ismo', 'ista', 'dor', 'ora', 'ble', 'nte']),
      // Articles et pronoms
      functionWords: new Set(['el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'es', 'se', 'no', 'te', 'lo', 'le', 'da'])
    }
  };

  // Poids pour chaque type de caractéristique
  private static readonly WEIGHTS = {
    trigrams: 0.3,
    bigrams: 0.25,
    chars: 0.2,
    endings: 0.15,
    functionWords: 0.1
  };

  /**
   * Détecte la langue d'un texte avec une approche SOTA
   * @param text Le texte à analyser
   * @param uiLang Langue de l'interface utilisateur (fallback)
   * @returns Résultat avec langue, confiance et raison
   */
  static detect(text: string, uiLang: 'fr' | 'en' | 'es' = 'fr'): { lang: 'fr' | 'en' | 'es', confidence: number, reason: string } {
    if (!text.trim()) {
      return { lang: uiLang, confidence: 1.0, reason: "empty" };
    }

    // Nettoyer et normaliser le texte
    const cleanedText = this.cleanText(text);
    const words = this.tokenize(cleanedText);

    // Règle 1 : Si texte < 10 chars (Documentation Phase 2)
    if (cleanedText.length < 10) {
      return {
        lang: uiLang,
        confidence: 0.3,
        reason: "too_short"
      };
    }

    // Approche SOTA basée sur les modèles de langue
    const scores = this.modelBasedDetection(cleanedText, words);

    // Trouver la langue avec le meilleur score
    const best = (Object.entries(scores) as Array<['fr' | 'en' | 'es', number]>).reduce(
      (max, [lang, score]) => (score > max.score ? { lang, score } : max),
      { lang: uiLang, score: 0 }
    );

    // Règle 2 : Texte mixte ou confiance basse
    if (best.score < 0.3) {
      const charBestLang = this.characterBasedDetection(cleanedText);
      return {
        lang: charBestLang,
        confidence: 0.4,
        reason: "low_model_score_fallback_to_char"
      };
    }

    return {
      lang: best.lang,
      confidence: Math.min(1.0, best.score * 2), // Normalisation approximative
      reason: "model_match"
    };
  }

  /**
   * Nettoie et normalise le texte
   */
  private static cleanText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\sáéíóúüñàâäôöùûüÿç]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Tokenize le texte en mots
   */
  private static tokenize(text: string): string[] {
    return text.split(/\s+/).filter(token => token.length > 0);
  }

  /**
   * Détection basée sur les modèles de langue SOTA
   */
  private static modelBasedDetection(text: string, words: string[]): Record<string, number> {
    const scores: Record<string, number> = { fr: 0, en: 0, es: 0 };

    // Extraire les caractéristiques du texte
    const features = {
      trigrams: this.extractNGrams(text, 3),
      bigrams: this.extractNGrams(text, 2),
      chars: new Set(text.split('')),
      endings: this.extractEndings(words),
      functionWords: words.filter(word =>
        Object.values(this.LANGUAGE_MODELS).some(model =>
          model.functionWords.has(word)
        )
      )
    };

    // Calculer les scores pour chaque langue
    for (const lang of ['fr', 'en', 'es']) {
      const model = this.LANGUAGE_MODELS[lang as keyof typeof this.LANGUAGE_MODELS];

      // Score pour les trigrammes
      const trigramScore = this.calculateSimilarity(features.trigrams, model.trigrams);
      scores[lang] += trigramScore * this.WEIGHTS.trigrams;

      // Score pour les bigrammes
      const bigramScore = this.calculateSimilarity(features.bigrams, model.bigrams);
      scores[lang] += bigramScore * this.WEIGHTS.bigrams;

      // Score pour les caractères
      const charScore = this.calculateSimilarity(features.chars, model.chars);
      scores[lang] += charScore * this.WEIGHTS.chars;

      // Score pour les terminaisons
      const endingScore = this.calculateSimilarity(features.endings, model.endings);
      scores[lang] += endingScore * this.WEIGHTS.endings;

      // Score pour les mots fonctionnels
      const functionWordScore = features.functionWords.filter(word =>
        model.functionWords.has(word)
      ).length / Math.max(1, features.functionWords.length);
      scores[lang] += functionWordScore * this.WEIGHTS.functionWords;
    }

    return scores;
  }

  /**
   * Extraction des n-grammes
   */
  private static extractNGrams(text: string, n: number): Set<string> {
    const ngrams = new Set<string>();
    for (let i = 0; i <= text.length - n; i++) {
      ngrams.add(text.substring(i, i + n));
    }
    return ngrams;
  }

  /**
   * Extraction des terminaisons des mots
   */
  private static extractEndings(words: string[]): Set<string> {
    const endings = new Set<string>();
    for (const word of words) {
      if (word.length >= 3) {
        // Ajouter les terminaisons de 2 et 3 caractères
        endings.add(word.substring(Math.max(0, word.length - 3)));
        if (word.length >= 2) {
          endings.add(word.substring(Math.max(0, word.length - 2)));
        }
      }
    }
    return endings;
  }

  /**
   * Calcul de similarité entre deux ensembles
   */
  private static calculateSimilarity(set1: Set<string>, set2: Set<string>): number {
    if (set1.size === 0 || set2.size === 0) return 0;

    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return intersection.size / union.size;
  }

  /**
   * Détection basée sur les caractères pour les textes courts
   */
  private static characterBasedDetection(text: string): 'fr' | 'en' | 'es' {
    // Compter les caractères spécifiques à chaque langue
    const charCounts = {
      fr: 0,
      en: 0,
      es: 0
    };

    for (const char of text) {
      if (this.LANGUAGE_MODELS.fr.chars.has(char)) charCounts.fr++;
      if (this.LANGUAGE_MODELS.en.chars.has(char)) charCounts.en++;
      if (this.LANGUAGE_MODELS.es.chars.has(char)) charCounts.es++;
    }

    // Trouver la langue avec le plus de caractères correspondants
    const best = (Object.entries(charCounts) as Array<['fr' | 'en' | 'es', number]>).reduce(
      (max, [lang, count]) => (count > max.count ? { lang, count } : max),
      { lang: 'fr' as const, count: 0 }
    );

    return best.lang;
  }
}