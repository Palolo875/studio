// Tests pour le vérificateur d'invariants du Cerveau de KairuFlow - Phase 1

import {
  checkMaxTasksInvariant,
  checkMinQuickWinInvariant,
  checkTotalLoadInvariant,
  checkEnergyMismatchInvariant,
  checkCompletionRateInvariant,
  checkAllInvariants,
  validatePlaylist
} from '../invariantChecker';
import { Task, TaskPlaylist, EnergyState } from '../types';

describe('invariantChecker', () => {
  const mockEnergy: EnergyState = { level: 'high', stability: 'stable' };
  const now = new Date();
  const mockTasks: Task[] = [
    {
      id: '1',
      title: 'Task 1',
      duration: 30,
      effort: 'medium',
      urgency: 'medium',
      impact: 'medium',
      completionHistory: [],
      category: 'work',
      createdAt: now,
      origin: 'self_chosen',
      hasTangibleResult: true,
    },
    {
      id: '2',
      title: 'Task 2',
      duration: 45,
      effort: 'high',
      urgency: 'high',
      impact: 'high',
      completionHistory: [],
      category: 'personal',
      createdAt: now,
      origin: 'self_chosen',
      hasTangibleResult: true,
    },
    {
      id: '3',
      title: 'Quick Win',
      duration: 10,
      effort: 'low',
      urgency: 'low',
      impact: 'low',
      completionHistory: [],
      category: 'admin',
      createdAt: now,
      origin: 'self_chosen',
      hasTangibleResult: true,
    }
  ];

  describe('checkMaxTasksInvariant', () => {
    it('should return true when task count is within limit', () => {
      const result = checkMaxTasksInvariant(mockTasks, 5);
      expect(result).toBe(true);
    });

    it('should return false when task count exceeds limit', () => {
      const manyTasks = [...mockTasks, ...mockTasks, ...mockTasks]; // 9 tasks
      const result = checkMaxTasksInvariant(manyTasks, 5);
      expect(result).toBe(false);
    });
  });

  describe('checkMinQuickWinInvariant', () => {
    it('should return true when at least one quick win is present', () => {
      const result = checkMinQuickWinInvariant(mockTasks);
      expect(result).toBe(true);
    });

    it('should return false when no quick win is present', () => {
      const noQuickWinTasks = mockTasks.filter(task =>
        !(task.duration <= 15 && task.effort === 'low')
      );
      const result = checkMinQuickWinInvariant(noQuickWinTasks);
      expect(result).toBe(false);
    });
  });

  describe('checkTotalLoadInvariant', () => {
    it('should return true when total load is within limit', () => {
      const result = checkTotalLoadInvariant(mockTasks, 500, mockEnergy);
      expect(result).toBe(true);
    });

    it('should return false when total load exceeds limit', () => {
      const result = checkTotalLoadInvariant(mockTasks, 10, mockEnergy);
      expect(result).toBe(false);
    });
  });

  describe('checkEnergyMismatchInvariant', () => {
    it('should return true for high energy level with any tasks', () => {
      const result = checkEnergyMismatchInvariant(mockTasks, 'high');
      expect(result).toBe(true);
    });

    it('should return false when low energy level with high effort tasks', () => {
      const result = checkEnergyMismatchInvariant(mockTasks, 'low');
      expect(result).toBe(false);
    });

    it('should return true when low energy level with only low effort tasks', () => {
      const lowEffortTasks = mockTasks.filter(task => task.effort === 'low');
      const result = checkEnergyMismatchInvariant(lowEffortTasks, 'low');
      expect(result).toBe(true);
    });
  });

  describe('checkCompletionRateInvariant', () => {
    it('should return true for empty playlist', () => {
      const result = checkCompletionRateInvariant([]);
      expect(result).toBe(true);
    });

    it('should return true when tasks have >=70% completion rate based on proposals', () => {
      const tasksWithGoodHistory: Task[] = [
        {
          ...mockTasks[0],
          proposalHistory: [
            { date: new Date(), sessionId: 's1' },
            { date: new Date(), sessionId: 's2' },
            { date: new Date(), sessionId: 's3' },
            { date: new Date(), sessionId: 's4' },
            { date: new Date(), sessionId: 's5' }
          ],
          completionHistory: [
            { date: new Date(), actualDuration: 25, energy: { level: 'medium', stability: 'stable' } },
            { date: new Date(), actualDuration: 30, energy: { level: 'medium', stability: 'stable' } }
          ]
        }
      ];
      const result = checkCompletionRateInvariant(tasksWithGoodHistory);
      expect(result).toBe(true);
    });

    it('should return false when tasks have <70% completion rate based on proposals', () => {
      const tasksWithPoorHistory: Task[] = [
        {
          ...mockTasks[0],
          proposalHistory: [
            { date: new Date(), sessionId: 's1' },
            { date: new Date(), sessionId: 's2' },
            { date: new Date(), sessionId: 's3' },
            { date: new Date(), sessionId: 's4' },
            { date: new Date(), sessionId: 's5' }
          ],
          completionHistory: [
            { date: new Date(), actualDuration: 60, energy: { level: 'medium', stability: 'stable' } }, // 2x planned time
            { date: new Date(), actualDuration: 60, energy: { level: 'medium', stability: 'stable' } }
          ]
        }
      ];
      const result = checkCompletionRateInvariant(tasksWithPoorHistory);
      expect(result).toBe(false);
    });

    it('should fall back to duration heuristic when proposals are not available', () => {
      const tasks: Task[] = [
        {
          ...mockTasks[0],
          duration: 30,
          completionHistory: [
            { date: new Date(), actualDuration: 25, energy: { level: 'medium', stability: 'stable' } },
          ]
        }
      ];
      const result = checkCompletionRateInvariant(tasks);
      expect(result).toBe(true);
    });
  });

  describe('checkAllInvariants', () => {
    it('should return all valid when all invariants are satisfied', () => {
      const result = checkAllInvariants(mockTasks, mockEnergy, 500);

      expect(result.maxTasks).toBe(true);
      expect(result.minQuickWin).toBe(true);
      expect(result.totalLoad).toBe(true);
      expect(result.energyMismatch).toBe(true);
      expect(result.completionRate).toBe(true);
      expect(result.allValid).toBe(true);
    });

    it('should return not all valid when some invariants are violated', () => {
      const lowEnergy: EnergyState = { level: 'low', stability: 'stable' };
      const result = checkAllInvariants(mockTasks, lowEnergy, 10);

      expect(result.allValid).toBe(false);
      // Au moins une des vérifications doit être fausse
      expect(
        result.maxTasks &&
        result.minQuickWin &&
        result.totalLoad &&
        result.energyMismatch &&
        result.completionRate
      ).toBe(false);
    });
  });

  describe('validatePlaylist', () => {
    const mockPlaylist: TaskPlaylist = {
      tasks: mockTasks,
      generatedAt: new Date(),
      energyUsed: mockEnergy,
      explanation: 'Test playlist'
    };

    it('should return the playlist when all invariants are valid', () => {
      const result = validatePlaylist(mockPlaylist, mockEnergy, 500);

      expect(result).toEqual(mockPlaylist);
    });

    it('should return error object when invariants are violated', () => {
      const lowEnergy: EnergyState = { level: 'low', stability: 'stable' };
      const result = validatePlaylist(mockPlaylist, lowEnergy, 10);

      expect(result).toHaveProperty('error');
      expect(result).toHaveProperty('invalidInvariants');
      expect((result as any).invalidInvariants).toBeInstanceOf(Array);
    });

    it('should list specific invariant violations', () => {
      const lowEnergy: EnergyState = { level: 'low', stability: 'stable' };
      const result = validatePlaylist(mockPlaylist, lowEnergy, 10) as { error: string; invalidInvariants: string[] };

      expect(result.invalidInvariants.length).toBeGreaterThan(0);
      // Devrait contenir des messages spécifiques
      expect(result.invalidInvariants.some(inv => inv.includes('énergie'))).toBe(true);
      expect(result.invalidInvariants.some(inv => inv.includes('capacité'))).toBe(true);
    });
  });
});