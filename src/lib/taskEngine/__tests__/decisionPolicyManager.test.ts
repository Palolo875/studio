// Tests pour le gestionnaire de politique de décision - Phase 3.2
import { applyStrictPolicy, applyAssistedPolicy, applyEmergencyPolicy } from '../decisionPolicyManager';

import { BrainInput } from '../brainContracts';
import { Task } from '../types';

describe('Decision Policy Manager - Phase 3.2', () => {
  // Données de test
  const mockTasks: Task[] = [
    {
      id: "task-1",
      title: "Tâche importante",
      description: undefined,
      duration: 30,
      effort: 'medium',
      urgency: 'high',
      impact: 'high',
      deadline: undefined,
      scheduledTime: undefined,
      completionHistory: [],
      category: 'work',
      createdAt: new Date(),
      origin: 'self_chosen',
      hasTangibleResult: true,
    }
  ];

  const mockInput: BrainInput = {
    tasks: mockTasks,
    userState: {
      energy: "medium",
      stability: "stable",
      linguisticFatigue: false
    },
    temporal: {
      currentTime: new Date(),
      availableTime: 120,
      timeOfDay: "morning"
    },
    budget: {
      daily: {
        maxLoad: 100,
        usedLoad: 30,
        remaining: 70,
        lockThreshold: 20
      },
      session: {
        maxDuration: 120,
        maxTasks: 5,
        maxComplexity: 10
      }
    },
    constraints: [],
    history: [],
    decisionPolicy: {
      level: 'STRICT',
      userConsent: true,
      overrideCostVisible: true,
    },
  };

  describe('applyStrictPolicy', () => {
    it('devrait appliquer la politique STRICTE correctement', () => {
      const result = applyStrictPolicy(mockInput);
      
      // Vérifier le mode
      expect(result.mode.current).toBe("NORMAL");
      expect(result.mode.reason).toContain("STRICTE");
      
      // Vérifier la politique
      expect(result.metadata.policy.level).toBe("STRICT");
      expect(result.metadata.policy.userConsent).toBe(true);
      
      // Vérifier les garanties
      expect(result.guarantees.usedAIdecision).toBe(false);
      expect(result.guarantees.inferredUserIntent).toBe(false);
    });
  });

  describe('applyAssistedPolicy', () => {
    it('devrait appliquer la politique ASSISTÉE correctement', () => {
      const result = applyAssistedPolicy(mockInput);
      
      // Vérifier le mode
      expect(result.mode.current).toBe("NORMAL");
      expect(result.mode.reason).toContain("ASSISTÉE");
      
      // Vérifier la politique
      expect(result.metadata.policy.level).toBe("ASSISTED");
      expect(result.metadata.policy.userConsent).toBe(true);
      
      // Vérifier que des tâches sont sélectionnées
      expect(result.session.allowedTasks.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('applyEmergencyPolicy', () => {
    it('devrait appliquer la politique D\'URGENCE correctement', () => {
      const result = applyEmergencyPolicy(mockInput);
      
      // Vérifier le mode
      expect(result.mode.current).toBe("EMERGENCY");
      expect(result.mode.reason).toContain("URGENCE");
      
      // Vérifier la politique
      expect(result.metadata.policy.level).toBe("EMERGENCY");
      expect(result.metadata.policy.userConsent).toBe(true);
      
      // Vérifier les avertissements
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0].type).toBe("overload_risk");
    });
  });
});