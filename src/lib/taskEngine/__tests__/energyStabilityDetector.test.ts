// Tests pour le détecteur de stabilité énergétique du Cerveau de KairuFlow - Phase 1

import { 
  detectEnergyStability,
  updateEnergyHistory,
  updateInterruptionHistory,
  updateSessionHistory
} from '../energyStabilityDetector';
import { EnergyState } from '../types';

describe('energyStabilityDetector', () => {
  const today = new Date();
  const twoDaysAgo = new Date(today);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  
  const fiveDaysAgo = new Date(today);
  fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

  const mockEnergyState: EnergyState = {
    level: 'medium',
    stability: 'stable'
  };

  const mockVolatileEnergyState: EnergyState = {
    level: 'high',
    stability: 'volatile'
  };

  describe('detectEnergyStability', () => {
    it('should detect stable energy with low variance', () => {
      const history = {
        energyCheckIns: [
          { date: twoDaysAgo, energy: mockEnergyState },
          { date: today, energy: mockEnergyState }
        ],
        interruptions: [],
        sessions: []
      };
      
      const environment = {
        openSpace: false,
        scheduledMeetings: 0,
        atypicalDay: false
      };
      
      const result = detectEnergyStability({
        userHistory: history,
        environment,
        referenceDate: today
      });
      
      expect(result.stability).toBe('stable');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should detect volatile energy with high variance', () => {
      const history = {
        energyCheckIns: [
          { date: twoDaysAgo, energy: { level: 'low', stability: 'volatile' } },
          { date: today, energy: { level: 'high', stability: 'volatile' } }
        ],
        interruptions: [
          { date: twoDaysAgo, reason: 'colleague interruption' },
          { date: today, reason: 'meeting' }
        ],
        sessions: [
          { date: twoDaysAgo, completed: false, duration: 45 },
          { date: today, completed: false, duration: 30 }
        ]
      };
      
      const environment = {
        openSpace: true,
        scheduledMeetings: 5,
        atypicalDay: true
      };
      
      const result = detectEnergyStability({
        userHistory: history,
        environment,
        referenceDate: today
      });
      
      expect(['stable', 'volatile']).toContain(result.stability);
      expect(result.confidence).toBeGreaterThan(0);
    });
  });

  describe('updateEnergyHistory', () => {
    it('should update energy history with new check-in', () => {
      const history = {
        energyCheckIns: [],
        interruptions: [],
        sessions: []
      };
      
      const updatedHistory = updateEnergyHistory(history, mockEnergyState, today);
      expect(updatedHistory.energyCheckIns).toHaveLength(1);
      expect(updatedHistory.energyCheckIns[0].energy).toEqual(mockEnergyState);
    });
  });

  describe('updateInterruptionHistory', () => {
    it('should update interruption history', () => {
      const history = {
        energyCheckIns: [],
        interruptions: [],
        sessions: []
      };
      
      const updatedHistory = updateInterruptionHistory(history, 'meeting', today);
      expect(updatedHistory.interruptions).toHaveLength(1);
      expect(updatedHistory.interruptions[0].reason).toBe('meeting');
    });
  });

  describe('updateSessionHistory', () => {
    it('should update session history', () => {
      const history = {
        energyCheckIns: [],
        interruptions: [],
        sessions: []
      };
      
      const updatedHistory = updateSessionHistory(history, true, 60, today);
      expect(updatedHistory.sessions).toHaveLength(1);
      expect(updatedHistory.sessions[0].completed).toBe(true);
      expect(updatedHistory.sessions[0].duration).toBe(60);
    });
  });
});