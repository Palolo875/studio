// Tests pour le moteur décisionnel du cerveau - Phase 3
import { decideSession, decideSessionWithTrace, replayDecisionAsync } from '../brainEngine';

import { BrainInput, BrainOutput } from '../brainContracts';
import { Task } from '../types';

describe('Brain Engine - Phase 3', () => {
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
    },
    {
      id: "task-2",
      title: "Tâche simple",
      description: undefined,
      duration: 10,
      effort: 'low',
      urgency: 'low',
      impact: 'low',
      deadline: undefined,
      scheduledTime: undefined,
      completionHistory: [],
      category: 'personal',
      createdAt: new Date(),
      origin: 'self_chosen',
      hasTangibleResult: false,
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

  describe('decideSession', () => {
    it('devrait retourner un BrainOutput valide', () => {
      const result: BrainOutput = decideSession(mockInput);
      
      // Vérifier la structure de base
      expect(result).toHaveProperty('session');
      expect(result).toHaveProperty('rejected');
      expect(result).toHaveProperty('mode');
      expect(result).toHaveProperty('warnings');
      expect(result).toHaveProperty('explanations');
      expect(result).toHaveProperty('guarantees');
      expect(result).toHaveProperty('metadata');
      
      // Vérifier les garanties
      expect(result.guarantees.usedAIdecision).toBe(false);
      expect(result.guarantees.inferredUserIntent).toBe(false);
      expect(result.guarantees.optimizedForPerformance).toBe(false);
      expect(result.guarantees.overrodeUserChoice).toBe(false);
      expect(result.guarantees.forcedEngagement).toBe(false);
    });

    it('devrait respecter la limite de tâches', () => {
      const result: BrainOutput = decideSession(mockInput);
      expect(result.session.maxTasks).toBeLessThanOrEqual(5);
    });

    it('devrait fonctionner avec différents niveaux d\'énergie', () => {
      const inputs = [
        { ...mockInput, userState: { ...mockInput.userState, energy: "high" } },
        { ...mockInput, userState: { ...mockInput.userState, energy: "medium" } },
        { ...mockInput, userState: { ...mockInput.userState, energy: "low" } }
      ];
      
      inputs.forEach(input => {
        const result: BrainOutput = decideSession(input);
        expect(result).toBeDefined();
      });
    });
  });

  describe('decideSessionWithTrace', () => {
    it('devrait retourner un BrainDecision avec traçabilité', () => {
      const result = decideSessionWithTrace(mockInput);
      
      // Vérifier la structure de base
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('brainVersion');
      expect(result).toHaveProperty('decisionType');
      expect(result).toHaveProperty('inputs');
      expect(result).toHaveProperty('outputs');
      expect(result).toHaveProperty('invariantsChecked');
      expect(result).toHaveProperty('explanationId');
      
      // Vérifier le type de décision
      expect(result.decisionType).toBe("TASK_SELECTION");
      
      // Vérifier que les entrées correspondent
      expect(result.inputs).toEqual(mockInput);
    });
  });

  describe('Performance', () => {
    it('devrait s\'exécuter en moins de 100ms', () => {
      const start = performance.now();
      decideSession(mockInput);
      const end = performance.now();
      
      expect(end - start).toBeLessThan(100);
    });
  });
});