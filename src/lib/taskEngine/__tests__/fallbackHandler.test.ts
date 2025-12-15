// Tests pour le gestionnaire de fallbacks du Cerveau de KairuFlow - Phase 1

import { 
  handleLowEnergyFallback,
  handleOverconstrainedFallback,
  handleInconsistentHistoryFallback,
  handleDefaultFallback
} from '../fallbackHandler';
import { Task } from '../types';

describe('fallbackHandler', () => {
  const mockTasks: Task[] = [
    {
      id: '1',
      title: 'Easy Task',
      duration: 10,
      effort: 'low',
      urgency: 'low',
      impact: 'low',
      completionHistory: [],
      category: 'admin'
    },
    {
      id: '2',
      title: 'Medium Task',
      duration: 30,
      effort: 'medium',
      urgency: 'medium',
      impact: 'medium',
      completionHistory: [],
      category: 'work'
    },
    {
      id: '3',
      title: 'Hard Task',
      duration: 60,
      effort: 'high',
      urgency: 'high',
      impact: 'high',
      completionHistory: [],
      category: 'personal'
    },
    {
      id: '4',
      title: 'Another Easy Task',
      duration: 15,
      effort: 'low',
      urgency: 'low',
      impact: 'low',
      completionHistory: [],
      category: 'learning'
    }
  ];

  describe('handleLowEnergyFallback', () => {
    it('should return a playlist with an easy task when low energy', () => {
      const result = handleLowEnergyFallback(mockTasks);
      
      expect(result).not.toBeNull();
      expect(result?.tasks).toHaveLength(1);
      expect(result?.tasks[0].effort).toBe('low');
      expect(result?.tasks[0].duration).toBeLessThanOrEqual(15);
      expect(result?.warnings).toContain('Énergie basse détectée. Une seule tâche facile recommandée.');
    });

    it('should return null when no easy tasks are available', () => {
      const hardTasks: Task[] = mockTasks.filter(task => task.effort !== 'low');
      const result = handleLowEnergyFallback(hardTasks);
      
      expect(result).toBeNull();
    });
  });

  describe('handleOverconstrainedFallback', () => {
    it('should return a playlist with compatible tasks when overconstrained', () => {
      const energy = { level: 'low', stability: 'stable' };
      const result = handleOverconstrainedFallback(mockTasks, energy);
      
      expect(result).not.toBeNull();
      // Devrait contenir uniquement des tâches compatibles avec l'énergie faible
      const allCompatible = result?.tasks.every(task => task.effort === 'low');
      expect(allCompatible).toBe(true);
      expect(result?.warnings).toContain('Trop de contraintes. Playlist réduite aux tâches les plus légères.');
    });

    it('should return null when no compatible tasks are available', () => {
      const energy = { level: 'low', stability: 'stable' };
      const hardTasks: Task[] = mockTasks.filter(task => task.effort === 'high');
      const result = handleOverconstrainedFallback(hardTasks, energy);
      
      expect(result).toBeNull();
    });
  });

  describe('handleInconsistentHistoryFallback', () => {
    it('should return a playlist filtering out inconsistent tasks', () => {
      // Créer des tâches avec historique incohérent
      const tasksWithInconsistentHistory: Task[] = [
        {
          ...mockTasks[0],
          completionHistory: [
            { date: new Date(), actualDuration: 60, energy: { level: 'medium', stability: 'stable' } }, // 6x planned time
            { date: new Date(), actualDuration: 60, energy: { level: 'medium', stability: 'stable' } }
          ]
        },
        ...mockTasks.slice(1)
      ];
      
      const result = handleInconsistentHistoryFallback(tasksWithInconsistentHistory);
      
      expect(result).not.toBeNull();
      expect(result?.warnings).toContain('Historique comportemental incohérent. Reset doux appliqué.');
    });

    it('should return a playlist with all tasks when no inconsistent history', () => {
      const result = handleInconsistentHistoryFallback(mockTasks);
      
      expect(result).not.toBeNull();
      // Devrait contenir 3 tâches aléatoires parmi les 4
      expect(result?.tasks.length).toBe(3);
    });
  });

  describe('handleDefaultFallback', () => {
    it('should return a playlist with random tasks', () => {
      const result = handleDefaultFallback(mockTasks);
      
      expect(result).not.toBeNull();
      expect(result?.tasks.length).toBe(3);
      expect(result?.warnings).toContain('Aucune règle de fallback spécifique appliquée.');
    });

    it('should handle empty task list', () => {
      const result = handleDefaultFallback([]);
      
      expect(result).not.toBeNull();
      expect(result?.tasks).toHaveLength(0);
      expect(result?.warnings).toContain('Aucune règle de fallback spécifique appliquée.');
    });
  });
});