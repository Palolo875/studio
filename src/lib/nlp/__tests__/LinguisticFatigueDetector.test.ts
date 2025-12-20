/**
 * Tests pour le détecteur de fatigue linguistique
 */

import { LinguisticFatigueDetector } from '../LinguisticFatigueDetector';

describe('LinguisticFatigueDetector', () => {
  let fatigueDetector: LinguisticFatigueDetector;

  beforeEach(() => {
    fatigueDetector = new LinguisticFatigueDetector({
      sentenceLengthThreshold: 15,
      confidenceThreshold: 0.8,
      typoRateThreshold: 0.05,
      vocabularyThreshold: 0.7,
      sensitivity: 0.5
    });
  });

  describe('detectFatigue', () => {
    it('devrait détecter une faible fatigue pour un texte normal', () => {
      const text = "Préparer la présentation pour la réunion de demain matin avec l'équipe de développement.";
      const confidenceScores = [0.9, 0.85, 0.92];

      const fatigueState = fatigueDetector.detectFatigue(text, confidenceScores);

      expect(fatigueState.level).toBe('LOW');
      expect(fatigueState.confidenceAdjustment).toBe(1.0);
      expect(fatigueState.recommendations).toHaveLength(1);
    });

    it('devrait détecter une fatigue élevée pour un texte avec de courtes phrases et faibles scores de confiance', () => {
      const text = "Trop fatigué. Ne peux pas. Trop difficile.";
      const confidenceScores = [0.3, 0.2, 0.1];

      const fatigueState = fatigueDetector.detectFatigue(text, confidenceScores);

      expect(fatigueState.level).toBe('HIGH');
      expect(fatigueState.confidenceAdjustment).toBe(0.7);
      expect(fatigueState.recommendations).toContain("Prenez une pause - votre concentration semble faible");
    });

    it('devrait détecter une fatigue moyenne pour un texte avec des fautes de frappe', () => {
      const text = "Ecrire rapp0rt 2mar1 mat1n equ1pe develepement pr3sentat10n reuni0n demain.";
      const confidenceScores = [0.6, 0.55, 0.65];

      const fatigueState = fatigueDetector.detectFatigue(text, confidenceScores);

      expect(fatigueState.level).toBe('MEDIUM');
      expect(fatigueState.confidenceAdjustment).toBe(0.85);
    });
  });

  describe('calculateMetrics', () => {
    it('devrait calculer correctement les métriques pour un texte donné', () => {
      // Accéder à la méthode privée via un cast pour les tests
      const detector = fatigueDetector as any;
      const text = "Préparer la présentation pour la réunion de demain matin avec l'équipe de développement.";
      const confidenceScores = [0.9, 0.85, 0.92];

      const metrics = detector.calculateMetrics(text, confidenceScores);

      expect(metrics.avgSentenceLength).toBeGreaterThan(0);
      expect(metrics.confidenceScore).toBeCloseTo(0.89, 2);
      expect(metrics.vocabularyRichness).toBeGreaterThan(0);
    });
  });

  describe('calculateTypoRate', () => {
    it('devrait détecter les fautes de frappe', () => {
      const detector = fatigueDetector as any;
      const text = "Ecrire rapp0rt 2mar1 mat1n equ1pe develepement pr3sentat10n reuni0n demain.";

      const typoRate = detector.calculateTypoRate(text);

      expect(typoRate).toBeGreaterThan(0);
    });

    it('devrait retourner un taux faible pour un texte sans fautes', () => {
      const detector = fatigueDetector as any;
      const text = "Écrire le rapport pour demain matin avec l'équipe de développement.";

      const typoRate = detector.calculateTypoRate(text);

      expect(typoRate).toBeLessThan(0.1);
    });
  });
});