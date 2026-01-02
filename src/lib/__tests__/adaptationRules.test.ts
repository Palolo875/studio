// Tests pour les règles d'adaptation - Phase 6
import { applyAdjustmentRules } from '../adaptationRules';
import { ADAPTATION_CONSTRAINTS, type AdaptationAggregate, type Parameters } from '../adaptationMemory';

// Constantes pour les tests
const DEFAULT_PARAMS: Parameters = {
  maxTasks: 5,
  strictness: 0.6,
  coachFrequency: 1/30,
  coachEnabled: true,
  energyForecastMode: "ACCURATE" as const,
  defaultMode: "STRICT" as const,
  sessionBuffer: 10,
  estimationFactor: 1.0
};

function makeAggregate(forcedRatio: number, rejectedRatio?: number): AdaptationAggregate {
  return {
    week: 1,
    patterns: {
      forced_tasks: {
        count: Math.round(forcedRatio * 10),
        ratio: forcedRatio,
        by_energy: new Map(),
        by_mode: new Map(),
      },
      rejected_suggestions: {
        count: rejectedRatio ? Math.round(rejectedRatio * 10) : 0,
        ratio: rejectedRatio ?? 0,
        common_reasons: [],
      },
      overrun_sessions: {
        count: 0,
        avg_overrun_minutes: 0,
        typical_time_of_day: 'afternoon',
      },
      mode_overrides: {
        count: 0,
        from_to: new Map(),
      },
    },
    signals: {
      needs_more_flexibility: false,
      needs_more_structure: false,
      energy_estimates_off: false,
      mode_mismatch: false,
    },
  };
}

describe('Adaptation Rules', () => {
  test('High force ratio increases maxTasks', () => {
    const aggregate = makeAggregate(0.7);

    const newParams = applyAdjustmentRules(aggregate, DEFAULT_PARAMS);
    expect(newParams.maxTasks).toBeGreaterThan(DEFAULT_PARAMS.maxTasks);
  });

  test('High force ratio decreases strictness', () => {
    const aggregate = makeAggregate(0.7);

    const newParams = applyAdjustmentRules(aggregate, DEFAULT_PARAMS);
    expect(newParams.strictness).toBeLessThan(DEFAULT_PARAMS.strictness);
  });

  test('Parameters stay within bounds when adjusted', () => {
    const aggregate = makeAggregate(0.7);

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
    const aggregate = makeAggregate(0.5, 0.6);

    const newParams = applyAdjustmentRules(aggregate, DEFAULT_PARAMS);
    // Parameters should remain largely unchanged (except for clamping)
    expect(newParams.maxTasks).toBe(DEFAULT_PARAMS.maxTasks);
    expect(newParams.strictness).toBeCloseTo(DEFAULT_PARAMS.strictness);
  });
});