// adaptiveGovernance.test.ts
// Tests pour les corrections critiques de gouvernance adaptative

import { AdaptiveAuthorityManager, AuthorityMode } from '../adaptiveAuthority';
import { AntiOverfittingEngine } from '../antiOverfitting';
import { AdaptiveExplanationEngine, ExplanationLevel } from '../adaptiveExplanation';

describe('Adaptive Governance Corrections', () => {
  test('Asymmetric Protection Principle - Burnout Detection', () => {
    const authorityManager = new AdaptiveAuthorityManager();
    
    // Simuler un utilisateur en état de burnout
    const burnoutContext = {
      cognitiveLoad: 0.8,
      isBurnoutDetected: true,
      isCurious: false,
      physiologicalSignals: {
        typingRhythmStability: 0.3,
        activityHoursVariance: 0.9
      },
      behavioralPatterns: {
        systematicReporting: true,
        cancelledTasksRate: 0.6
      }
    };
    
    const mode = authorityManager.updateAuthorityMode(burnoutContext);
    expect(mode).toBe('PROTECTIVE');
    
    // Vérifier que le mode protecteur empêche les overrides utilisateur
    const config = authorityManager.getCurrentModeConfig();
    expect(config.userCanOverride).toBe(false);
    expect(config.systemCanRefuse).toBe(true);
  });
  
  test('Dynamic Threshold Bands - Contextual Adjustment', () => {
    const antiOverfitting = new AntiOverfittingEngine({
      minSamplesBeforeAdaptation: 30, // Ajusté selon le contexte
      randomPreservationRate: 0.15,   // Ajusté selon le contexte
      temporalCrossValidation: {
        trainOn: "last_45_days",       // Ajusté selon le contexte
        testOn: "previous_20_days",    // Ajusté selon le contexte
        minAccuracy: 0.65              // Ajusté selon le contexte
      }
    });
    
    // Vérifier que la configuration est correctement appliquée
    const config = antiOverfitting.getConfig();
    expect(config.minSamplesBeforeAdaptation).toBe(30);
    expect(config.randomPreservationRate).toBe(0.15);
    expect(config.temporalCrossValidation.trainOn).toBe("last_45_days");
    expect(config.temporalCrossValidation.minAccuracy).toBe(0.65);
  });
  
  test('Adaptive Explanation Engine - Cognitive Load Awareness', () => {
    const explanationEngine = new AdaptiveExplanationEngine();
    
    const adaptation = {
      id: 'test-adaptation-1',
      timestamp: Date.now(),
      parameterChanged: 'maxTasks',
      oldValue: 5,
      newValue: 7,
      reason: 'increased productivity',
      impact: 'reduced cognitive overload'
    };
    
    // Simuler un utilisateur avec une charge cognitive élevée
    const highLoadContext = {
      cognitiveLoad: 0.8,
      isCurious: false,
      adaptationHistory: [adaptation]
    };
    
    const explanation = explanationEngine.getExplanation(adaptation, highLoadContext);
    expect(explanation.level).toBe('SIMPLE');
    expect(explanation.text).toBe('Ajusté pour protéger votre énergie.');
    
    // Simuler un utilisateur curieux avec une charge cognitive normale
    const curiousContext = {
      cognitiveLoad: 0.3,
      isCurious: true,
      adaptationHistory: [adaptation]
    };
    
    const detailedExplanation = explanationEngine.getExplanation(adaptation, curiousContext);
    expect(detailedExplanation.level).toBe('DETAILED');
    expect(detailedExplanation.text).toContain('Ajusté car increased productivity');
  });
  
  test('Anti-Overfitting Protection - Temporal Cross Validation', () => {
    const antiOverfitting = new AntiOverfittingEngine();
    
    // Ajouter des échantillons d'adaptation
    for (let i = 0; i < 10; i++) {
      antiOverfitting.addAdaptationSample({
        id: `sample-${i}`,
        timestamp: Date.now() - i * 86400000, // Un échantillon par jour
        inputData: {},
        predictedOutput: {},
        actualOutput: {},
        accuracy: 0.75 // Bonne précision
      });
    }
    
    // Vérifier les statistiques d'overfitting
    const stats = antiOverfitting.getOverfittingStats();
    expect(stats.sampleCount).toBe(10);
    expect(stats.averageAccuracy).toBeCloseTo(0.75);
    expect(stats.sufficientSamples).toBe(false); // Pas assez d'échantillons
    
    // Ajouter plus d'échantillons pour atteindre le seuil
    for (let i = 10; i < 50; i++) {
      antiOverfitting.addAdaptationSample({
        id: `sample-${i}`,
        timestamp: Date.now() - i * 86400000,
        inputData: {},
        predictedOutput: {},
        actualOutput: {},
        accuracy: 0.8
      });
    }
    
    const updatedStats = antiOverfitting.getOverfittingStats();
    expect(updatedStats.sufficientSamples).toBe(true);
  });
  
  test('Authority Mode Transitions - Physiological Signals', () => {
    const authorityManager = new AdaptiveAuthorityManager();
    
    // Simuler des signaux physiologiques instables
    const unstablePhysioContext = {
      cognitiveLoad: 0.4, // Charge normale
      isBurnoutDetected: false,
      isCurious: true,
      physiologicalSignals: {
        typingRhythmStability: 0.2, // Instable
        activityHoursVariance: 0.95  // Très variable
      },
      behavioralPatterns: {
        systematicReporting: false,
        cancelledTasksRate: 0.1
      }
    };
    
    const mode = authorityManager.updateAuthorityMode(unstablePhysioContext);
    expect(mode).toBe('PROTECTIVE');
  });
  
  test('Random Preservation Rate - Preventing Convergence', () => {
    const antiOverfitting = new AntiOverfittingEngine({
      randomPreservationRate: 0.2 // 20% de préservation aléatoire
    });
    
    // Vérifier plusieurs décisions aléatoires
    let preservedCount = 0;
    const testCount = 1000;
    
    for (let i = 0; i < testCount; i++) {
      if (antiOverfitting.shouldPreserveRandomly()) {
        preservedCount++;
      }
    }
    
    // Vérifier que le taux de préservation est proche de 20%
    const preservationRate = preservedCount / testCount;
    expect(preservationRate).toBeCloseTo(0.2, 1); // Tolérance de 10%
  });
});