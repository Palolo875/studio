// Tests pour le calculateur du Task Age Index du Cerveau de KairuFlow - Phase 1

import { 
  calculateTaskAgeIndex,
  shouldActivateDetoxMode,
  getDetoxMode,
  applyDetoxActions
} from '../taskAgeIndex';
import { Task } from '../types';

describe('taskAgeIndex', () => {
  const today = new Date();
  const fiveDaysAgo = new Date(today);
  fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
  
  const tenDaysAgo = new Date(today);
  tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

  const mockTasks: Task[] = [
    {
      id: '1',
      title: 'Old Task',
      duration: 30,
      effort: 'medium',
      urgency: 'medium',
      impact: 'medium',
      deadline: fiveDaysAgo,
      completionHistory: [
        {
          date: tenDaysAgo,
          actualDuration: 25,
          energy: { level: 'medium', stability: 'stable' }
        }
      ],
      category: 'work'
    },
    {
      id: '2',
      title: 'New Task',
      duration: 45,
      effort: 'high',
      urgency: 'high',
      impact: 'high',
      deadline: today,
      completionHistory: [
        {
          date: today,
          actualDuration: 40,
          energy: { level: 'high', stability: 'stable' }
        }
      ],
      category: 'personal'
    },
    {
      id: '3',
      title: 'Task without history',
      duration: 60,
      effort: 'low',
      urgency: 'low',
      impact: 'low',
      deadline: today,
      completionHistory: [],
      category: 'work'
    }
  ];

  describe('calculateTaskAgeIndex', () => {
    it('should calculate TAI correctly', () => {
      const tai = calculateTaskAgeIndex(mockTasks, today);
      // Deux tâches avec historique, âges de 10 jours et 0 jour
      // Moyenne = (10 + 0) / 2 = 5
      expect(tai).toBeCloseTo(5, 1);
    });

    it('should return 0 for empty task list', () => {
      const tai = calculateTaskAgeIndex([]);
      expect(tai).toBe(0);
    });

    it('should return 0 for tasks without history', () => {
      const tai = calculateTaskAgeIndex([mockTasks[2]]);
      expect(tai).toBe(0);
    });
  });

  describe('shouldActivateDetoxMode', () => {
    it('should activate detox mode when TAI > 2 and consecutive days >= 3', () => {
      const shouldActivate = shouldActivateDetoxMode(3, 3);
      expect(shouldActivate).toBe(true);
    });

    it('should not activate detox mode when TAI <= 2', () => {
      const shouldActivate = shouldActivateDetoxMode(2, 3);
      expect(shouldActivate).toBe(false);
    });

    it('should not activate detox mode when consecutive days < 3', () => {
      const shouldActivate = shouldActivateDetoxMode(3, 2);
      expect(shouldActivate).toBe(false);
    });
  });

  describe('getDetoxMode', () => {
    it('should return NONE when TAI <= 2', () => {
      const mode = getDetoxMode(2, 0);
      expect(mode).toBe('NONE');
    });

    it('should return WARNING for low consecutive days', () => {
      const mode = getDetoxMode(3, 0);
      expect(mode).toBe('WARNING');
    });

    it('should return SUGGESTION for medium consecutive days', () => {
      const mode = getDetoxMode(3, 2);
      expect(mode).toBe('SUGGESTION');
    });

    it('should return BLOCK for high consecutive days', () => {
      const mode = getDetoxMode(3, 3);
      expect(mode).toBe('BLOCK');
    });
  });

  describe('applyDetoxActions', () => {
    it('should apply warning actions', () => {
      const actions = applyDetoxActions(mockTasks, 'WARNING');
      expect(actions.message).toBe('Beaucoup de vieilles tâches. Revue bientôt ?');
      expect(actions.frozenSoonTasks).toHaveLength(0);
    });

    it('should apply suggestion actions', () => {
      const actions = applyDetoxActions(mockTasks, 'SUGGESTION');
      expect(actions.message).toBe('Mode DETOX : session de revue suggérée');
    });

    it('should apply block actions', () => {
      const actions = applyDetoxActions(mockTasks, 'BLOCK');
      expect(actions.message).toBe('Mode DETOX : Revue obligatoire avant ajout');
    });
  });
});