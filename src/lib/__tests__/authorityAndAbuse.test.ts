// authorityAndAbuse.test.ts
// Tests unitaires bloquants pour l'autorité et la prévention de l'abus

import { describe, test, expect, vi } from 'vitest';

import { UserContractManager } from '../userFacingContract';
import { NonNegotiablesManager } from '../nonNegotiables';
import { AbuseProtectionManager } from '../abuseProtection';
import { AdaptationRollbackManager } from '../adaptationRollback';
import { compareBehaviorPatterns } from '../lifeChangeDetector';

// Test pour le contrat d'autorité
describe('Authority & Abuse', () => {
  test('Contract acceptance required on first use', async () => {
    const contractManager = new UserContractManager();
    expect(contractManager.isContractAccepted()).toBe(false);
    
    // Simuler l'acceptation du contrat
    contractManager.acceptContract();
    expect(contractManager.isContractAccepted()).toBe(true);
  });
  
  test('Burnout signals trigger protection', async () => {
    const nonNegotiablesManager = new NonNegotiablesManager();
    
    // Simuler 3 signaux de burnout détectés
    nonNegotiablesManager.updateBurnoutSignal('chronicOverload', true);
    nonNegotiablesManager.updateBurnoutSignal('sleepDebt', true);
    nonNegotiablesManager.updateBurnoutSignal('overrideAbuse', true);
    
    const burnoutLimitExceeded = nonNegotiablesManager.isBurnoutLimitExceeded();
    expect(burnoutLimitExceeded).toBe(true);
    
    // Vérifier que les règles de sécurité sont appliquées
    const securityRules = nonNegotiablesManager.enforceSecurityRules(3);
    expect(securityRules.refuse).toBe(true);
    expect(securityRules.suggest).toBe('Repos / décharge');
    expect(securityRules.lock).toBe('maxTasks');
  });
  
  test('Abuse detection freezes adaptation', async () => {
    const abuseProtectionManager = new AbuseProtectionManager();
    
    // Simuler des overrides fréquents
    for (let i = 0; i < 15; i++) {
      abuseProtectionManager.recordOverride({
        userId: 'test-user',
        timestamp: Date.now() - (i * 24 * 60 * 60 * 1000) // Un override par jour
      });
    }
    
    // Vérifier que les adaptations sont gelées
    expect(abuseProtectionManager.isAdaptationFrozen()).toBe(true);
  });
  
  test('Rollback restores previous state', async () => {
    const rollbackManager = new AdaptationRollbackManager();
    
    // Simuler un état initial
    const initialParamValue = 5;
    
    // Simuler une adaptation
    const adaptationId = 'test-adaptation-1';
    rollbackManager.recordAdaptation({
      id: adaptationId,
      timestamp: Date.now(),
      parameterChanges: [
        {
          parameterName: 'maxTasks',
          oldValue: initialParamValue,
          newValue: 7
        }
      ],
      qualityBefore: 0.5,
      qualityAfter: 0.7,
      userConsent: 'ACCEPTED'
    });
    
    // Effectuer le rollback
    const rollbackSuccess = await rollbackManager.rollbackAdaptation(adaptationId);
    expect(rollbackSuccess).toBe(true);
    
    // Vérifier que l'adaptation a été marquée comme rejetée
    const adaptation = rollbackManager.getAdaptationById(adaptationId);
    expect(adaptation?.userConsent).toBe('REJECTED');
  });
  
  test('Compare behavior patterns detects life changes', () => {
    // Simuler des données de comportement utilisateur
    const currentUserData = {
      userId: 'test-user',
      taskCompletionRate: 0.8,
      sessionDuration: 120,
      taskDifficultyPreference: 'medium',
      energyLevels: [8, 7, 6, 9, 5],
      taskTypes: ['work', 'learning'],
      dailySchedule: [9, 10, 11, 14, 15],
      weeklyPattern: [1, 1, 1, 1, 1, 0, 0]
    };
    
    const baselineData = {
      userId: 'test-user',
      baselineTaskCompletionRate: 0.4,
      baselineSessionDuration: 60,
      baselineEnergyLevels: [4, 3, 5, 2, 3],
      baselineTaskTypes: ['entertainment', 'social'],
      baselineDailySchedule: [18, 19, 20, 21, 22],
      baselineWeeklyPattern: [0, 0, 0, 0, 0, 1, 1]
    };
    
    // Comparer les comportements
    const changeMagnitude = compareBehaviorPatterns(currentUserData, baselineData);
    
    // Vérifier que le changement est détecté
    expect(changeMagnitude).toBeGreaterThan(0);
  });
  
  test('Invert delta correctly reverses parameter changes', () => {
    const rollbackManager = new AdaptationRollbackManager();
    
    // Simuler un delta de paramètre
    const delta = {
      parameterName: 'maxTasks',
      oldValue: 5,
      newValue: 7
    };
    
    // Inverser le delta
    const invertedDelta = rollbackManager.invertDelta(delta);
    
    // Vérifier que les valeurs sont correctement inversées
    expect(invertedDelta.parameterName).toBe('maxTasks');
    expect(invertedDelta.oldValue).toBe(7);
    expect(invertedDelta.newValue).toBe(5);
  });
  
  test('Benevolent messaging shows concern tone', () => {
    const abuseProtectionManager = new AbuseProtectionManager();
    
    // Espionner la méthode showBenevolentMessage
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    
    // Déclencher la détection d'abus
    (abuseProtectionManager as any).showBenevolentMessage({
      tone: 'concern',
      title: 'Pattern détecté',
      body: `J'ai remarqué que tu forces beaucoup de décisions depuis 2 semaines.\n\n**Deux possibilités :**\n1. Les règles par défaut ne te correspondent pas\n2. Tu traverses une période exceptionnelle\n\nQu'est-ce qui correspond le mieux ?`,
      actions: [
        { label: 'Ajuster les règles', action: vi.fn() },
        { label: 'Période temporaire', action: vi.fn() },
        { label: 'Passer en mode manuel', action: vi.fn() }
      ]
    });
    
    // Vérifier que le message est affiché avec le bon ton
    expect(consoleLogSpy).toHaveBeenCalledWith('MESSAGE_TO_USER (concern): Pattern détecté');
    
    // Restaurer console.log
    consoleLogSpy.mockRestore();
  });
  
  test('Justified thresholds have scientific sources', () => {
    const nonNegotiablesManager = new NonNegotiablesManager();
    const nonNegotiables = nonNegotiablesManager.getNonNegotiables();
    
    // Vérifier que les seuils ont des justifications scientifiques
    expect(nonNegotiables.maxDailyLoad.source).toBe('Cognitive Load Theory (Sweller, 1988)');
    expect(nonNegotiables.maxDailyLoad.url).toBe('https://doi.org/10.1007/BF02504799');
    expect(nonNegotiables.burnoutSignalsLimit.source).toBe('Maslach Burnout Inventory (MBI)');
    expect(nonNegotiables.burnoutSignalsLimit.url).toBe('https://doi.org/10.1002/job.4030020205');
    expect(nonNegotiables.minRecoveryTime.source).toBe('Sleep Foundation');
    expect(nonNegotiables.minRecoveryTime.url).toBe('https://www.sleepfoundation.org/how-sleep-works/how-much-sleep-do-we-really-need');
  });
});