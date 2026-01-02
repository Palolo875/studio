// Tests pour le contrôleur d'adaptation - Phase 6
import { describe, expect, test, vi, beforeEach } from 'vitest';
import type { Parameters, PersistedAdaptationChange } from '../adaptationMemory';
import type { DBAdaptationHistory } from '../database';

vi.mock('@/lib/logger', () => {
  return {
    createLogger: () => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    }),
  };
});

type StoredSetting = unknown;

let settings: Record<string, StoredSetting> = {};
let latestHistory: DBAdaptationHistory | undefined = undefined;

const setSettingMock = vi.fn(async (key: string, value: unknown) => {
  settings[key] = value;
});
const recordHistoryMock = vi.fn(async (entry: Omit<DBAdaptationHistory, 'id'>) => {
  latestHistory = { id: 123, ...entry };
  return 123;
});

const markRevertedMock = vi.fn(async (_id: number) => undefined);
const saveSnapshotMock = vi.fn(async () => 1);

vi.mock('../database/index', () => {
  return {
    getSetting: vi.fn(async (key: string) => settings[key]),
    setSetting: setSettingMock,
    recordAdaptationHistory: recordHistoryMock,
    getLatestAdaptationHistory: vi.fn(async () => latestHistory),
    markAdaptationHistoryReverted: markRevertedMock,
    getAdaptationSignalsByPeriod: vi.fn(async () => []),
    pruneAdaptationSignals: vi.fn(async () => 0),
    saveSnapshot: saveSnapshotMock,
  };
});

import {
  invertDelta,
  DriftMonitor,
  resetAdaptationToDefaults,
  rollbackLatestAdaptation,
  runAdaptationTransparencyAction,
  exportEncryptedArchive,
} from '../adaptationController';

describe('Adaptation Controller', () => {
  beforeEach(() => {
    settings = {};
    latestHistory = undefined;
    setSettingMock.mockClear();
    recordHistoryMock.mockClear();
    markRevertedMock.mockClear();
    saveSnapshotMock.mockClear();
  });

  test('invertDelta correctly inverts parameter changes', () => {
    const delta = [{
      parameterName: "maxTasks",
      oldValue: 3,
      newValue: 5
    }];

    const inverted = invertDelta(delta);
    expect(inverted[0].oldValue).toBe(5);
    expect(inverted[0].newValue).toBe(3);
  });

  test('invertDelta handles multiple parameter changes', () => {
    const delta = [
      {
        parameterName: "maxTasks",
        oldValue: 3,
        newValue: 5
      },
      {
        parameterName: "strictness",
        oldValue: 0.6,
        newValue: 0.8
      }
    ];

    const inverted = invertDelta(delta);
    expect(inverted[0].oldValue).toBe(5);
    expect(inverted[0].newValue).toBe(3);
    expect(inverted[1].oldValue).toBe(0.8);
    expect(inverted[1].newValue).toBe(0.6);
  });

  test('resetAdaptationToDefaults persists defaults and records history when deltas exist', async () => {
    settings['adaptation_parameters'] = {
      maxTasks: 9,
      strictness: 0.2,
      coachFrequency: 1 / 10,
      coachEnabled: false,
      energyForecastMode: 'ACCURATE',
      defaultMode: 'STRICT',
      sessionBuffer: 10,
      estimationFactor: 1.0,
    };

    await resetAdaptationToDefaults();

    expect(setSettingMock).toHaveBeenCalled();
    expect(recordHistoryMock).toHaveBeenCalledTimes(1);
    const recorded = recordHistoryMock.mock.calls[0]?.[0];
    expect(recorded?.change?.id).toMatch(/^adaptation_reset_/);
    expect(Array.isArray(recorded?.change?.parameterChanges)).toBe(true);
  });

  test('rollbackLatestAdaptation rolls back using persisted deltas and marks history reverted', async () => {
    settings['adaptation_parameters'] = {
      maxTasks: 5,
      strictness: 0.6,
      coachFrequency: 1 / 30,
      coachEnabled: true,
      energyForecastMode: 'ACCURATE',
      defaultMode: 'STRICT',
      sessionBuffer: 10,
      estimationFactor: 1.0,
    } satisfies Parameters;

    latestHistory = {
      id: 777,
      timestamp: Date.now(),
      reverted: false,
      change: {
        id: 'adaptation_123',
        timestamp: Date.now(),
        parameterChanges: [
          { parameterName: 'maxTasks', oldValue: 5, newValue: 7 },
        ],
        userConsent: 'ACCEPTED',
      },
    };

    // Simulate that the adaptation was applied (maxTasks=7). Rollback should bring it back to 5.
    settings['adaptation_parameters'] = {
      maxTasks: 7,
      strictness: 0.6,
      coachFrequency: 1 / 30,
      coachEnabled: true,
      energyForecastMode: 'ACCURATE',
      defaultMode: 'STRICT',
      sessionBuffer: 10,
      estimationFactor: 1.0,
    } satisfies Parameters;

    await rollbackLatestAdaptation();

    expect(setSettingMock).toHaveBeenCalled();
    expect(markRevertedMock).toHaveBeenCalledWith(777);
    const lastSet = setSettingMock.mock.calls[setSettingMock.mock.calls.length - 1];
    expect(lastSet?.[0]).toBe('adaptation_parameters');
    const payload = lastSet?.[1] as Parameters;
    expect(payload.maxTasks).toBe(5);
  });

  test('runAdaptationTransparencyAction dispatches resetAdaptation', async () => {
    settings['adaptation_parameters'] = {
      maxTasks: 6,
      strictness: 0.6,
      coachFrequency: 1 / 30,
      coachEnabled: true,
      energyForecastMode: 'ACCURATE',
      defaultMode: 'STRICT',
      sessionBuffer: 10,
      estimationFactor: 1.0,
    };

    await runAdaptationTransparencyAction('resetAdaptation');
    expect(setSettingMock).toHaveBeenCalled();
  });

  test('runAdaptationTransparencyAction dispatches rollbackLatest', async () => {
    settings['adaptation_parameters'] = {
      maxTasks: 7,
      strictness: 0.6,
      coachFrequency: 1 / 30,
      coachEnabled: true,
      energyForecastMode: 'ACCURATE',
      defaultMode: 'STRICT',
      sessionBuffer: 10,
      estimationFactor: 1.0,
    };

    latestHistory = {
      id: 999,
      timestamp: Date.now(),
      reverted: false,
      change: {
        id: 'adaptation_rollback_me',
        parameterChanges: [{ parameterName: 'maxTasks', oldValue: 5, newValue: 7 }],
      },
    };

    await runAdaptationTransparencyAction('rollbackLatest');
    expect(markRevertedMock).toHaveBeenCalledWith(999);
  });

  test('runAdaptationTransparencyAction ignores unknown action', async () => {
    await runAdaptationTransparencyAction('unknown');
    expect(setSettingMock).not.toHaveBeenCalled();
  });

  test('exportEncryptedArchive stores a snapshot', async () => {
    await exportEncryptedArchive([{ id: 1, timestamp: 123 }]);
    expect(saveSnapshotMock).toHaveBeenCalledTimes(1);
  });
});

describe('Drift Monitor', () => {
  test('detects parameter drift over time', () => {
    const monitor = new DriftMonitor();

    // Simulate stable parameters for 20 days
    for (let i = 0; i < 20; i++) {
      monitor.track({ strictness: 0.6, maxTasks: 5, coachFrequency: 1/30, coachEnabled: true, energyForecastMode: "ACCURATE", defaultMode: "STRICT", sessionBuffer: 10, estimationFactor: 1.0 });
    }
    
    // Then drift occurs
    for (let i = 0; i < 10; i++) {
      monitor.track({ strictness: 0.8, maxTasks: 5, coachFrequency: 1/30, coachEnabled: true, energyForecastMode: "ACCURATE", defaultMode: "STRICT", sessionBuffer: 10, estimationFactor: 1.0 });
    }
    
    const drift = monitor.detectDrift();
    expect(drift).not.toBeNull();
    if (drift) {
      expect(drift.direction).toBe("UP");
    }
  });
  
  test('no drift detected with stable parameters', () => {
    const monitor = new DriftMonitor();
    
    // Simulate stable parameters for 30 days
    for (let i = 0; i < 30; i++) {
      monitor.track({ strictness: 0.6 + ((i % 3) - 1) * 0.02, maxTasks: 5, coachFrequency: 1/30, coachEnabled: true, energyForecastMode: "ACCURATE", defaultMode: "STRICT", sessionBuffer: 10, estimationFactor: 1.0 });
    }
    
    const drift = monitor.detectDrift();
    expect(drift).toBeNull();
  });
  
  test('drift detection for multiple parameters', () => {
    const monitor = new DriftMonitor();
    
    // Simulate stable parameters for 20 days
    for (let i = 0; i < 20; i++) {
      monitor.track({ strictness: 0.6, maxTasks: 5, coachFrequency: 1/30, coachEnabled: true, energyForecastMode: "ACCURATE", defaultMode: "STRICT", sessionBuffer: 10, estimationFactor: 1.0 });
    }
    
    // Then drift occurs in maxTasks
    for (let i = 0; i < 10; i++) {
      monitor.track({ strictness: 0.6, maxTasks: 7, coachFrequency: 1/30, coachEnabled: true, energyForecastMode: "ACCURATE", defaultMode: "STRICT", sessionBuffer: 10, estimationFactor: 1.0 });
    }
    
    const drift = monitor.detectDrift();
    expect(drift).not.toBeNull();
    if (drift) {
      expect(drift.parameter).toBe("maxTasks");
    }
  });
  
  test('progressive drift detection', () => {
    const monitor = new DriftMonitor();
    
    // Simulate increasing strictness over 4 weeks
    const baseStrictness = 0.4;
    for (let week = 0; week < 4; week++) {
      for (let day = 0; day < 7; day++) {
        monitor.track({ 
          strictness: baseStrictness + week * 0.15, 
          maxTasks: 5,
          coachFrequency: 1/30,
          coachEnabled: true,
          energyForecastMode: "ACCURATE",
          defaultMode: "STRICT",
          sessionBuffer: 10,
          estimationFactor: 1.0
        });
      }
    }
    
    const drift = monitor.detectProgressiveDrift();
    expect(drift).not.toBeNull();
    if (drift) {
      expect(drift.direction).toBe("UP");
    }
  });
});