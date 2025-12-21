// Tests pour les règles d'adaptation - Phase 6
import { applyAdjustmentRules } from '../adaptationRules';
import { clampParameters, ADAPTATION_CONSTRAINTS } from '../adaptationMemory';

// Constantes pour les tests
const DEFAULT_PARAMS = {
  maxTasks: 5,
  strictness: 0.6,
  coachFrequency: 1/30,
  coachEnabled: true,
  energyForecastMode: "ACCURATE" as const,
  defaultMode: "STRICT" as const,
  sessionBuffer: 10,
  estimationFactor: 1.0
};

describe('Adaptation Rules', () => {
  test('High force ratio increases maxTasks', () => {
    const aggregate: any = {
      patterns: {
        forced_tasks: {
          ratio: 0.7 // > 0.6 trigger
        }
      },
      signals: {}
    };
    
    const newParams = applyAdjustmentRules(aggregate, DEFAULT_PARAMS);
    expect(newParams.maxTasks).toBeGreaterThan(DEFAULT_PARAMS.maxTasks);
  });
  
  test('High force ratio decreases strictness', () => {
    const aggregate: any = {
      patterns: {
        forced_tasks: {
          ratio: 0.7 // > 0.6 trigger
        }
      },
      signals: {}
    };
    
    const newParams = applyAdjustmentRules(aggregate, DEFAULT_PARAMS);
    expect(newParams.strictness).toBeLessThan(DEFAULT_PARAMS.strictness);
  });
  
  test('Parameters stay within bounds when adjusted', () => {
    const aggregate: any = {
      patterns: {
        forced_tasks: {
          ratio: 0.7
        }
      },
      signals: {}
    };
    
    // Set initial params near bounds
    const params = {
      ...DEFAULT_PARAMS,
      maxTasks: ADAPTATION_CONSTRAINTS.maxTasks.max - 1,
      strictness: ADAPTATION_CONSTRAINTS.strictness.min + 0.05
    };
    
    const newParams = applyAdjustmentRules(aggregate, params);
    
    // Should still be within bounds after adjustment
    expect(newParams.maxTasks).toBeLessThanOrEqual(ADAPTATION_CONSTRAINTS.maxTasks.max);
    expect(newParams.strictness).toBeGreaterThanOrEqual(ADAPTATION_CONSTRAINTS.strictness.min);
  });
  
  test('No adjustment when ratios are below thresholds', () => {
    const aggregate: any = {
      patterns: {
        forced_tasks: {
          ratio: 0.5 // < 0.6, no trigger
        },
        rejected_suggestions: {
          ratio: 0.6 // < 0.7, no trigger
        }
      },
      signals: {}
    };
    
    const newParams = applyAdjustmentRules(aggregate, DEFAULT_PARAMS);
    // Parameters should remain largely unchanged (except for clamping)
    expect(newParams.maxTasks).toBe(DEFAULT_PARAMS.maxTasks);
    expect(newParams.strictness).toBeCloseTo(DEFAULT_PARAMS.strictness);
  });
});