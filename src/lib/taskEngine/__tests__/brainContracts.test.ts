// Tests pour les contrats du cerveau décisionnel - Phase 3
import { 
  BrainInput, 
  BrainOutput, 
  DecisionPolicy, 
  BrainDecision, 
  BrainVersion,
  RejectionReason,
  SystemMode,
  Warning
} from '../brainContracts';
import { Task } from '../types';

describe('Brain Contracts - Phase 3', () => {
  // Données de test
  const mockTask: Task = {
    id: "task-1",
    title: "Tâche de test",
    description: undefined,
    duration: 30,
    effort: 'medium',
    urgency: 'high',
    impact: 'medium',
    deadline: undefined,
    scheduledTime: undefined,
    completionHistory: [],
    category: 'test',
    createdAt: new Date(),
    origin: 'self_chosen',
    hasTangibleResult: true,
  };

  describe('BrainInput', () => {
    it('devrait définir la structure correcte pour les entrées', () => {
      const input: BrainInput = {
        tasks: [mockTask],

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

      expect(input).toBeDefined();
      expect(input.tasks).toHaveLength(1);
      expect(input.userState.energy).toBe("medium");
      expect(input.temporal.availableTime).toBe(120);
    });
  });

  describe('BrainOutput', () => {
    it('devrait définir la structure correcte pour les sorties', () => {
      const output: BrainOutput = {
        session: {
          allowedTasks: [mockTask],
          maxTasks: 5,
          estimatedDuration: 30,
          budgetConsumed: 10
        },
        rejected: {
          tasks: [],
          reasons: new Map()
        },
        mode: {
          current: "NORMAL",
          reason: "Test"
        },
        warnings: [],
        explanations: {
          summary: "Test summary",
          perTask: new Map()
        },
        guarantees: {
          usedAIdecision: false,
          inferredUserIntent: false,
          optimizedForPerformance: false,
          overrodeUserChoice: false,
          forcedEngagement: false
        },
        metadata: {
          decisionId: "test-decision-123",
          timestamp: new Date(),
          brainVersion: "1.0.0",
          policy: {
            level: "STRICT",
            userConsent: true,
            overrideCostVisible: true
          },
          overrideEvents: []
        }
      };

      expect(output).toBeDefined();
      expect(output.session.allowedTasks).toHaveLength(1);
      expect(output.mode.current).toBe("NORMAL");
      expect(output.guarantees.usedAIdecision).toBe(false);
    });
  });

  describe('DecisionPolicy', () => {
    it('devrait définir les niveaux de politique corrects', () => {
      const policies: DecisionPolicy[] = [
        {
          level: "STRICT",
          userConsent: true,
          overrideCostVisible: true
        },
        {
          level: "ASSISTED",
          userConsent: true,
          overrideCostVisible: true
        },
        {
          level: "EMERGENCY",
          userConsent: true,
          overrideCostVisible: true
        }
      ];

      policies.forEach(policy => {
        expect(policy).toBeDefined();
        expect(['STRICT', 'ASSISTED', 'EMERGENCY']).toContain(policy.level);
        expect(policy.userConsent).toBe(true);
      });
    });
  });

  describe('Types d\'énumération', () => {
    it('devrait définir les raisons de rejet correctes', () => {
      const rejectionReasons: RejectionReason[] = [
        "energy_mismatch",
        "time_constraint",
        "budget_exceeded",
        "complexity_too_high",
        "deadline_conflict",
        "stability_violation",
        "diversity_violation",
        "user_override"
      ];

      rejectionReasons.forEach(reason => {
        expect(typeof reason).toBe("string");
      });
    });

    it('devrait définir les modes système corrects', () => {
      const systemModes: SystemMode[] = [
        "NORMAL",
        "SILENT",
        "EMERGENCY",
        "DETOX",
        "RECOVERY",
        "LOCK"
      ];

      systemModes.forEach(mode => {
        expect(typeof mode).toBe("string");
      });
    });
  });

  describe('BrainVersion', () => {
    it('devrait définir la structure de version correcte', () => {
      const version: BrainVersion = {
        id: "v1.0.0-test",
        algorithmVersion: "1.0.0",
        rulesHash: "abc123",
        modelId: "test-model",
        releasedAt: new Date()
      };

      expect(version).toBeDefined();
      expect(version.id).toBe("v1.0.0-test");
      expect(version.algorithmVersion).toBe("1.0.0");
    });
  });
});