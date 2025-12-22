// comprehensiveGovernance.test.ts
// Tests complets pour la gouvernance adaptative corrigée

import { NonNegotiablesManager, calculateDynamicThresholds, ContextFactors } from '../nonNegotiables';
import { AbuseProtectionManager } from '../abuseProtection';
import { AdaptationRollbackManager } from '../adaptationRollback';
import { AdaptiveAuthorityManager } from '../adaptiveAuthority';
import { AntiOverfittingEngine } from '../antiOverfitting';
import { AdaptiveExplanationEngine } from '../adaptiveExplanation';

describe('Comprehensive Adaptive Governance', () => {
  test('Dynamic Thresholds Based on Context', () => {
    const baseValues = {
      maxDailyLoad: {
        value: 1.3,
        unit: "× charge soutenable",
        rationale: "Surcharge >30% = dégradation cognitive mesurable",
        source: "Cognitive Load Theory (Sweller, 1988)",
        url: "https://doi.org/10.1007/BF02504799",
        adjustable: false
      },
      burnoutSignalsLimit: {
        value: 3,
        unit: "signaux cumulés",
        rationale: "3+ dimensions = burnout clinique",
        source: "Maslach Burnout Inventory (MBI)",
        url: "https://doi.org/10.1002/job.4030020205",
        adjustable: false
      },
      minRecoveryTime: {
        value: 8,
        unit: "heures",
        rationale: "Minimum sommeil adulte recommandé",
        source: "Sleep Foundation",
        url: "https://www.sleepfoundation.org/how-sleep-works/how-much-sleep-do-we-really-need",
        adjustable: true,
        range: [7, 9]
      },
      ethicalRefusal: {
        value: true,
        rationale: "Système refuse d'aider à l'auto-destruction",
        source: "Principes éthiques de l'IA",
        url: "https://doi.org/10.1038/s4159 machine-intelligence-021-00023-3",
        adjustable: false
      }
    };

    // Contexte avec un événement de vie impactant
    const contextWithLifeEvent: ContextFactors = {
      lifeEventImpact: 0.8, // Fort impact
      projectIntensity: 0.2, // Projet peu intense
      seasonalVariation: 0.1, // Peu de variation saisonnière
      personalBaseline: 0.3 // Baseline personnel faible
    };

    const dynamicThresholds = calculateDynamicThresholds(baseValues, contextWithLifeEvent);
    
    // Vérifier que les seuils ont été ajustés selon le contexte
    expect(dynamicThresholds.maxDailyLoad.value).toBeGreaterThan(baseValues.maxDailyLoad.value);
    expect(dynamicThresholds.burnoutSignalsLimit.value).toBeLessThanOrEqual(baseValues.burnoutSignalsLimit.value);
    expect(dynamicThresholds.minRecoveryTime.value).toBeLessThanOrEqual(baseValues.minRecoveryTime.value);
  });

  test('Asymmetric Protection Principle - Depleted User', () => {
    const abuseProtection = new AbuseProtectionManager();
    
    // Espionner les méthodes
    const applyProtectiveChangesSpy = jest.spyOn(abuseProtection as any, 'applyProtectiveChanges');
    const showSimpleNotificationSpy = jest.spyOn(abuseProtection as any, 'showSimpleNotification');
    
    // Simuler la détection d'abus avec un utilisateur épuisé
    (abuseProtection as any).handlePotentialAbuse('DEPLETED');
    
    // Vérifier que les méthodes de protection automatique ont été appelées
    expect(applyProtectiveChangesSpy).toHaveBeenCalled();
    expect(showSimpleNotificationSpy).toHaveBeenCalledWith("Mode protecteur activé. Reposez-vous.");
  });

  test('Parameter Validation in Rollback', async () => {
    const rollbackManager = new AdaptationRollbackManager();
    
    // Simuler des deltas invalides
    const invalidDeltas = [
      {
        parameterName: 'maxTasks',
        oldValue: 5,
        newValue: 150 // Valeur invalide (> 100)
      }
    ];
    
    // Vérifier que la validation échoue
    await expect(rollbackManager.applyParametersWithValidation(invalidDeltas))
      .rejects
      .toThrow('Invalid maxTasks value: 150. Must be between 1 and 100.');
    
    // Simuler des deltas valides
    const validDeltas = [
      {
        parameterName: 'maxTasks',
        oldValue: 5,
        newValue: 7 // Valeur valide
      }
    ];
    
    // Vérifier que la validation réussit
    await expect(rollbackManager.applyParametersWithValidation(validDeltas))
      .resolves
      .not
      .toThrow();
  });

  test('Authority Mode Transitions Based on User State', () => {
    const authorityManager = new AdaptiveAuthorityManager();
    
    // Simuler un utilisateur en bonne santé
    const healthyContext = {
      cognitiveLoad: 0.2,
      isBurnoutDetected: false,
      isCurious: true,
      physiologicalSignals: {
        typingRhythmStability: 0.9,
        activityHoursVariance: 0.3
      },
      behavioralPatterns: {
        systematicReporting: false,
        cancelledTasksRate: 0.05
      }
    };
    
    const mode = authorityManager.updateAuthorityMode(healthyContext);
    expect(mode).toBe('NORMAL');
    
    const config = authorityManager.getCurrentModeConfig();
    expect(config.userCanOverride).toBe(true);
    expect(config.systemCanRefuse).toBe(false);
  });

  test('Anti-Overfitting with Random Preservation', () => {
    const antiOverfitting = new AntiOverfittingEngine({
      randomPreservationRate: 0.1
    });
    
    // Vérifier que la préservation aléatoire fonctionne
    let preservedCount = 0;
    const testCount = 1000;
    
    for (let i = 0; i < testCount; i++) {
      if (antiOverfitting.shouldPreserveRandomly()) {
        preservedCount++;
      }
    }
    
    const preservationRate = preservedCount / testCount;
    expect(preservationRate).toBeCloseTo(0.1, 1);
  });

  test('Adaptive Explanation Based on Cognitive Load', () => {
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
    
    // Simuler un utilisateur avec une charge cognitive normale et curieux
    const curiousContext = {
      cognitiveLoad: 0.3,
      isCurious: true,
      adaptationHistory: [adaptation]
    };
    
    const explanation = explanationEngine.getExplanation(adaptation, curiousContext);
    expect(explanation.level).toBe('DETAILED');
    expect(explanation.text).toContain('Ajusté car increased productivity');
  });
});