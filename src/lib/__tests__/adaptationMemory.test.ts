// Tests pour la mémoire d'adaptation - Phase 6
import { clampParameters, ADAPTATION_CONSTRAINTS } from '../adaptationMemory';

describe('Adaptation Memory', () => {
  test('clampParameters respects bounds', () => {
    const params = { 
      maxTasks: 10, 
      strictness: 1.5, 
      coachFrequency: 10,
      coachEnabled: true,
      energyForecastMode: "ACCURATE" as const,
      defaultMode: "STRICT" as const,
      sessionBuffer: 10,
      estimationFactor: 1.0
    };
    const clamped = clampParameters(params);
    
    expect(clamped.maxTasks).toBe(ADAPTATION_CONSTRAINTS.maxTasks.max); // Max bound
    expect(clamped.strictness).toBe(ADAPTATION_CONSTRAINTS.strictness.max); // Max bound
    expect(clamped.coachFrequency).toBeLessThanOrEqual(ADAPTATION_CONSTRAINTS.coachFrequency.max); // Max bound
  });
  
  test('clampParameters does not change parameters within bounds', () => {
    const params = { 
      maxTasks: 5, 
      strictness: 0.6, 
      coachFrequency: 1/20,
      coachEnabled: true,
      energyForecastMode: "ACCURATE" as const,
      defaultMode: "STRICT" as const,
      sessionBuffer: 10,
      estimationFactor: 1.0
    };
    const clamped = clampParameters(params);
    
    expect(clamped.maxTasks).toBe(5);
    expect(clamped.strictness).toBe(0.6);
    expect(clamped.coachFrequency).toBe(1/20);
  });
});