// Tests pour le contrôleur d'adaptation - Phase 6
import { invertDelta, DriftMonitor } from '../adaptationController';
import { clampParameters } from '../adaptationMemory';

describe('Adaptation Controller', () => {
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
      monitor.track({ strictness: 0.6 + (Math.random() - 0.5) * 0.1, maxTasks: 5, coachFrequency: 1/30, coachEnabled: true, energyForecastMode: "ACCURATE", defaultMode: "STRICT", sessionBuffer: 10, estimationFactor: 1.0 }); // Small variations
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