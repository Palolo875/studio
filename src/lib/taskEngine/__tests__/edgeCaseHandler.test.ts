// Tests pour le gestionnaire de cas limites du Cerveau de KairuFlow - Phase 1

import { 
  handleEnergyMisreporting,
  handleNeverCompletes,
  handleVoluntaryOverload,
  handleAnxietyParalysis,
  handlePerfectionism,
  handleImpossibleDay
} from '../edgeCaseHandler';
import { Task } from '../types';

describe('edgeCaseHandler', () => {
  const mockTasks: Task[] = [
    {
      id: '1',
      title: 'Simple Task',
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
      title: 'Urgent Task',
      duration: 45,
      effort: 'medium',
      urgency: 'urgent',
      impact: 'high',
      deadline: new Date(Date.now() + 24 * 60 * 60 * 1000), // Dans 24 heures
      completionHistory: [],
      category: 'work'
    },
    {
      id: '5',
      title: 'Another Simple Task',
      duration: 15,
      effort: 'low',
      urgency: 'low',
      impact: 'low',
      completionHistory: [],
      category: 'learning'
    }
  ];

  describe('handleEnergyMisreporting', () => {
    it('should adjust for over-optimistic energy reporting', () => {
      const declaredEnergy = { level: 'high', stability: 'stable' };
      const actualPerformance = { avgDurationRatio: 2.0, completionRate: 0.5 };
      
      const result = handleEnergyMisreporting(mockTasks, declaredEnergy, actualPerformance);
      
      expect(result.warnings).toContain('Ajustement automatique : énergie déclarée trop optimiste');
    });

    it('should adjust for over-pessimistic energy reporting', () => {
      const declaredEnergy = { level: 'low', stability: 'stable' };
      const actualPerformance = { avgDurationRatio: 0.5, completionRate: 0.9 };
      
      const result = handleEnergyMisreporting(mockTasks, declaredEnergy, actualPerformance);
      
      expect(result.warnings).toContain('Ajustement automatique : énergie déclarée trop pessimiste');
    });

    it('should use default fallback when no adjustment needed', () => {
      const declaredEnergy = { level: 'medium', stability: 'stable' };
      const actualPerformance = { avgDurationRatio: 1.0, completionRate: 0.8 };
      
      const result = handleEnergyMisreporting(mockTasks, declaredEnergy, actualPerformance);
      
      expect(result.warnings).toContain('Aucune règle de fallback spécifique appliquée.');
    });
  });

  describe('handleNeverCompletes', () => {
    it('should filter out tasks with high attempt counts', () => {
      const completionHistory = [
        { taskId: '2', attempts: 5 },
        { taskId: '3', attempts: 2 }
      ];
      
      const result = handleNeverCompletes(mockTasks, completionHistory);
      
      expect(result.warnings).toContain('Certaines tâches ont été tentées plusieurs fois sans succès');
      // Devrait filtrer la tâche '2' qui a 5 tentatives
      expect(result.tasks.some(task => task.id === '2')).toBe(false);
    });

    it('should use default fallback when no problematic tasks', () => {
      const completionHistory = [
        { taskId: '2', attempts: 1 },
        { taskId: '3', attempts: 2 }
      ];
      
      const result = handleNeverCompletes(mockTasks, completionHistory);
      
      expect(result.warnings).toContain('Aucune règle de fallback spécifique appliquée.');
    });
  });

  describe('handleVoluntaryOverload', () => {
    it('should limit tasks when user requests too many', () => {
      const requestedTasks = mockTasks;
      const maxRecommended = 3;
      
      const result = handleVoluntaryOverload(mockTasks, requestedTasks, maxRecommended);
      
      expect(result.tasks).toHaveLength(maxRecommended);
      expect(result.warnings).toContain('Limite de 3 tâches appliquée');
    });

    it('should return requested tasks when within limit', () => {
      const requestedTasks = mockTasks.slice(0, 2);
      const maxRecommended = 3;
      
      const result = handleVoluntaryOverload(mockTasks, requestedTasks, maxRecommended);
      
      expect(result.tasks).toHaveLength(2);
      expect(result.warnings).toHaveLength(0);
    });
  });

  describe('handleAnxietyParalysis', () => {
    it('should return a single very simple task for anxiety', () => {
      const result = handleAnxietyParalysis(mockTasks);
      
      expect(result.tasks).toHaveLength(1);
      expect(result.tasks[0].effort).toBe('low');
      expect(result.tasks[0].duration).toBeLessThanOrEqual(10);
      expect(result.warnings).toContain('Une seule tâche très simple proposée pour briser la paralysie');
    });

    it('should use low energy fallback when no simple tasks', () => {
      const complexTasks: Task[] = mockTasks.filter(task => task.effort !== 'low' || task.duration > 10);
      const result = handleAnxietyParalysis(complexTasks);
      
      expect(result.warnings).toContain('Approche anti-paralysie appliquée');
    });
  });

  describe('handlePerfectionism', () => {
    it('should filter out perfectionist tasks', () => {
      const perfectionismHistory = [
        { taskId: '2', timeSpentRatio: 2.5 },
        { taskId: '3', timeSpentRatio: 1.2 }
      ];
      
      const result = handlePerfectionism(mockTasks, perfectionismHistory);
      
      expect(result.warnings).toContain('Certaines tâches ont été exclues en raison de tendances au perfectionnisme');
      // Devrait filtrer la tâche '2' qui a un ratio de 2.5
      expect(result.tasks.some(task => task.id === '2')).toBe(false);
    });

    it('should use default fallback when no perfectionist tasks', () => {
      const perfectionismHistory = [
        { taskId: '2', timeSpentRatio: 1.2 },
        { taskId: '3', timeSpentRatio: 1.1 }
      ];
      
      const result = handlePerfectionism(mockTasks, perfectionismHistory);
      
      expect(result.warnings).toContain('Aucune règle de fallback spécifique appliquée.');
    });
  });

  describe('handleImpossibleDay', () => {
    it('should limit urgent tasks for impossible day', () => {
      // Créer plus de tâches urgentes
      const urgentTasks: Task[] = Array(8).fill(null).map((_, i) => ({
        id: `urgent-${i}`,
        title: `Urgent Task ${i}`,
        duration: 30,
        effort: 'medium',
        urgency: 'urgent',
        impact: 'high',
        deadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
        completionHistory: [],
        category: 'work'
      }));
      
      const allTasks = [...mockTasks, ...urgentTasks];
      const result = handleImpossibleDay(allTasks);
      
      expect(result.tasks.length).toBeLessThanOrEqual(5);
      expect(result.warnings).toContain('Journée chargée détectée (plus de 5 tâches urgentes)');
    });

    it('should suggest splitting day when too many urgent tasks', () => {
      // Créer plus de 10 tâches urgentes
      const urgentTasks: Task[] = Array(12).fill(null).map((_, i) => ({
        id: `urgent-${i}`,
        title: `Urgent Task ${i}`,
        duration: 30,
        effort: 'medium',
        urgency: 'urgent',
        impact: 'high',
        deadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
        completionHistory: [],
        category: 'work'
      }));
      
      const allTasks = [...mockTasks, ...urgentTasks];
      const result = handleImpossibleDay(allTasks);
      
      expect(result.warnings).toContain('Considérez diviser cette journée en plusieurs sessions');
    });
  });
});