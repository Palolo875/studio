// Tests pour l'évaluation de la qualité du cerveau - Phase 6
import { computeBrainQuality, enterConservativeMode } from '../brainQuality';

describe('Brain Quality', () => {
  test('perfect brain quality', () => {
    // Créer des sessions parfaites
    const perfectSessions: any[] = [
      {
        id: "1",
        userId: "test-user",
        startTime: Date.now() - 3600000,
        endTime: Date.now(),
        plannedTasks: 5,
        completedTasks: 5,
        allowedTasks: [],
        rejectedTasks: [],
        completionRate: 1.0
      }
    ];
    
    const quality = computeBrainQuality(perfectSessions, [], []);
    // With completionAccuracy = 1, overridePenalty = 1, userAlignmentScore = 0 (no mode transitions)
    // Result should be: 0.4 * 1 + 0.3 * 1 + 0.3 * 0 = 0.7
    expect(quality).toBeCloseTo(0.7);
  });
  
  test('poor brain quality triggers conservative mode', () => {
    // Créer des sessions de mauvaise qualité
    const poorSessions: any[] = [
      {
        id: "1",
        userId: "test-user",
        startTime: Date.now() - 3600000,
        endTime: Date.now(),
        plannedTasks: 10,
        completedTasks: 2,
        allowedTasks: [],
        rejectedTasks: [],
        completionRate: 0.2
      }
    ];
    
    const manyOverrides: any[] = [
      { id: "1", userId: "test-user", timestamp: Date.now() }
    ];
    
    const quality = computeBrainQuality(poorSessions, manyOverrides, []);
    // With completionAccuracy = 0 (0 sessions with >70% completion out of 1 session)
    // overridePenalty = 1 - (1 override / 0 decisions) = 1 - Infinity = 1 (handled by Math.max)
    // But since we have overrides, it should be less than 1
    // Actually: overridePenalty = 1 - (1 / max(0, 1)) = 1 - 1 = 0
    // userAlignmentScore = 0 (no mode transitions)
    // Result: 0.4 * 0 + 0.3 * 0 + 0.3 * 0 = 0
    expect(quality).toBeLessThan(0.5);
    
    const conservativeParams = enterConservativeMode();
    expect(conservativeParams.maxTasks).toBe(3);
    expect(conservativeParams.strictness).toBe(0.5);
    expect(conservativeParams.coachEnabled).toBe(false);
  });
  
  test('brain quality with good completion but many overrides', () => {
    // Créer des sessions avec bonne complétion
    const goodSessions: any[] = [
      {
        id: "1",
        userId: "test-user",
        startTime: Date.now() - 3600000,
        endTime: Date.now(),
        plannedTasks: 5,
        completedTasks: 4, // 80% completion rate > 70%
        allowedTasks: [],
        rejectedTasks: [],
        completionRate: 0.8
      },
      {
        id: "2",
        userId: "test-user",
        startTime: Date.now() - 7200000,
        endTime: Date.now() - 3600000,
        plannedTasks: 3,
        completedTasks: 3, // 100% completion rate > 70%
        allowedTasks: [],
        rejectedTasks: [],
        completionRate: 1.0
      }
    ];
    
    // Mais beaucoup d'overrides
    const manyOverrides: any[] = [
      { id: "1", userId: "test-user", timestamp: Date.now() - 1000 },
      { id: "2", userId: "test-user", timestamp: Date.now() - 2000 },
      { id: "3", userId: "test-user", timestamp: Date.now() - 3000 }
    ];
    
    // Et quelques transitions de mode acceptées
    const modeTransitions: any[] = [
      {
        id: "1",
        userId: "test-user",
        fromMode: "STRICT",
        toMode: "ASSISTED",
        triggeredBy: "SYSTEM",
        userConfirmed: true,
        timestamp: Date.now()
      },
      {
        id: "2",
        userId: "test-user",
        fromMode: "ASSISTED",
        toMode: "STRICT",
        triggeredBy: "SYSTEM",
        userConfirmed: true,
        timestamp: Date.now()
      }
    ];
    
    const quality = computeBrainQuality(goodSessions, manyOverrides, modeTransitions);
    
    // completionAccuracy = 1 (2 good sessions out of 2 sessions)
    // overridePenalty = 1 - (3 overrides / 0 decisions) = 1 (since no allowed/rejected tasks)
    // userAlignmentScore = (modeAcceptance + suggestionAcceptance) / 2
    // modeAcceptance = 2/2 = 1 (both system triggers accepted)
    // suggestionAcceptance = (4/0 + 3/0) / 2 = 0 (since no allowed tasks)
    // userAlignmentScore = (1 + 0) / 2 = 0.5
    // Result: 0.4 * 1 + 0.3 * 1 + 0.3 * 0.5 = 0.4 + 0.3 + 0.15 = 0.85
    
    // Actually, with no allowed/rejected tasks, overridePenalty will be 1
    // and suggestionAcceptance will be 0
    expect(quality).toBeGreaterThan(0.5);
  });
});