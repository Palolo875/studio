// Tests pour les métriques de progression - Phase 6
import { computeProgressMetrics, computeVariance } from '../progressMetrics';

describe('Progress Metrics', () => {
  test('computeVariance calculates variance correctly', () => {
    const values = [1, 2, 3, 4, 5];
    const variance = computeVariance(values);
    expect(variance).toBe(2); // Variance of [1,2,3,4,5] is 2
  });
  
  test('computeVariance returns 0 for single value', () => {
    const values = [5];
    const variance = computeVariance(values);
    expect(variance).toBe(0);
  });
  
  test('computeVariance returns 0 for empty array', () => {
    const values: number[] = [];
    const variance = computeVariance(values);
    expect(variance).toBe(0);
  });
  
  test('computeProgressMetrics with normal data', () => {
    // Créer des données de test
    const tasks: any[] = [
      {
        id: "1",
        userId: "test-user",
        title: "Task 1",
        description: "Description 1",
        createdAt: Date.now() - 8 * 24 * 3600000, // 8 jours ago
        updatedAt: Date.now(),
        status: "DONE",
        estimatedDuration: 30,
        actualDuration: 35,
        tangibleResult: true,
        taskType: "ROUTINE",
        energyRequired: "MEDIUM"
      }
    ];
    
    const sessions: any[] = [
      {
        id: "1",
        userId: "test-user",
        startTime: Date.now() - 3600000,
        endTime: Date.now(),
        plannedTasks: 5,
        completedTasks: 4,
        allowedTasks: [],
        rejectedTasks: [],
        completionRate: 0.8
      }
    ];
    
    const overrides: any[] = [];
    
    const metrics = computeProgressMetrics(tasks, sessions, overrides);
    
    expect(metrics.tangibleCompletionRate).toBeDefined();
    expect(metrics.sessionStabilityScore).toBeDefined();
    expect(metrics.overrideTrend).toBeDefined();
    expect(metrics.estimationAccuracy).toBeDefined();
    expect(metrics.longTermRecurrence).toBeDefined();
  });
  
  test('tangible completion rate calculation', () => {
    const tasks: any[] = [
      {
        id: "1",
        userId: "test-user",
        title: "Task 1",
        description: "Description 1",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        status: "DONE",
        tangibleResult: true,
        taskType: "ROUTINE",
        energyRequired: "MEDIUM"
      },
      {
        id: "2",
        userId: "test-user",
        title: "Task 2",
        description: "Description 2",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        status: "TODO",
        tangibleResult: true,
        taskType: "ROUTINE",
        energyRequired: "MEDIUM"
      },
      {
        id: "3",
        userId: "test-user",
        title: "Task 3",
        description: "Description 3",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        status: "DONE",
        tangibleResult: false, // Non tangible
        taskType: "ROUTINE",
        energyRequired: "MEDIUM"
      }
    ];
    
    const sessions: any[] = [];
    const overrides: any[] = [];
    
    const metrics = computeProgressMetrics(tasks, sessions, overrides);
    
    // 1 tangible task completed out of 2 tangible tasks total
    expect(metrics.tangibleCompletionRate).toBe(0.5);
  });
});