// Tests pour l'agrégation d'adaptation - Phase 6
import { aggregateWeek, getISOWeekNumber } from '../adaptationAggregator';
import { AdaptationSignal } from '../adaptationMemory';

describe('Adaptation Aggregator', () => {
  test('getISOWeekNumber returns correct week number', () => {
    // Test with a known date
    const date = new Date('2023-01-01'); // Sunday
    const week = getISOWeekNumber(date);
    expect(week).toBe(52); // 2023-01-01 is in week 52 of 2022
  });
  
  test('aggregateWeek correctly aggregates forced tasks', () => {
    const signals: AdaptationSignal[] = [
      {
        userId: "test-user",
        type: "FORCED_TASK",
        context: {
          energy: "HIGH",
          taskType: "CREATIVE",
          mode: "STRICT",
          duration: 30
        },
        timestamp: Date.now()
      },
      {
        userId: "test-user",
        type: "FORCED_TASK",
        context: {
          energy: "MEDIUM",
          taskType: "ROUTINE",
          mode: "ASSISTED",
          duration: 45
        },
        timestamp: Date.now()
      }
    ];
    
    const aggregate = aggregateWeek(signals);
    
    expect(aggregate.patterns.forced_tasks.count).toBe(2);
    expect(aggregate.patterns.forced_tasks.by_energy.get("HIGH")).toBe(1);
    expect(aggregate.patterns.forced_tasks.by_mode.get("STRICT")).toBe(1);
  });
  
  test('aggregateWeek calculates ratios correctly', () => {
    const signals: AdaptationSignal[] = [
      {
        userId: "test-user",
        type: "FORCED_TASK",
        context: {
          energy: "HIGH",
          taskType: "CREATIVE",
          mode: "STRICT",
          duration: 30
        },
        timestamp: Date.now()
      },
      {
        userId: "test-user",
        type: "REJECTED_SUGGESTION",
        context: {
          energy: "MEDIUM",
          taskType: "ROUTINE",
          mode: "ASSISTED"
        },
        timestamp: Date.now()
      }
    ];
    
    const aggregate = aggregateWeek(signals);
    
    expect(aggregate.patterns.forced_tasks.ratio).toBe(0.5); // 1 forced task out of 2 total
    expect(aggregate.patterns.rejected_suggestions.ratio).toBe(0.5); // 1 rejected suggestion out of 2 total
  });
});