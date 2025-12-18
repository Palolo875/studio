// Tests pour le gestionnaire de deadlines du Cerveau de KairuFlow - Phase 1

import { 
  analyzeDeadlines,
  determineTriageMode,
  triageTasksByPriority,
  calculateOptimizedLoad
} from '../deadlineManager';
import { Task } from '../types';

describe('deadlineManager', () => {
  const mockTasks: Task[] = [
    {
      id: '1',
      title: 'Urgent Task',
      duration: 120,
      effort: 'high',
      urgency: 'urgent',
      impact: 'high',
      deadline: new Date(),
      completionHistory: [],
      category: 'work'
    },
    {
      id: '2',
      title: 'High Priority Task',
      duration: 90,
      effort: 'medium',
      urgency: 'high',
      impact: 'medium',
      deadline: new Date(),
      completionHistory: [],
      category: 'personal'
    },
    {
      id: '3',
      title: 'Medium Task',
      duration: 60,
      effort: 'low',
      urgency: 'medium',
      impact: 'low',
      deadline: new Date(),
      completionHistory: [],
      category: 'work'
    },
    {
      id: '4',
      title: 'Low Priority Task',
      duration: 30,
      effort: 'low',
      urgency: 'low',
      impact: 'low',
      deadline: new Date(),
      completionHistory: [],
      category: 'learning'
    }
  ];

  describe('analyzeDeadlines', () => {
    it('should analyze deadlines and calculate load ratio', () => {
      const analysis = analyzeDeadlines(mockTasks, 180); // 3 hours available
      expect(analysis.loadRatio).toBeCloseTo(300 / 180); // 5 hours required / 3 hours available
      expect(analysis.totalTimeRequired).toBe(300); // 120 + 90 + 60 + 30
      expect(analysis.timeAvailable).toBe(180);
    });

    it('should handle zero available time', () => {
      const analysis = analyzeDeadlines(mockTasks, 0);
      expect(analysis.loadRatio).toBe(Infinity);
    });
  });

  describe('determineTriageMode', () => {
    it('should activate triage mode when load ratio > 1.5', () => {
      const analysis = analyzeDeadlines(mockTasks, 180);
      const triageMode = determineTriageMode(analysis);
      expect(triageMode.active).toBe(true);
      expect(triageMode.tasksToTriage).toHaveLength(4);
    });

    it('should not activate triage mode when load ratio <= 1.5', () => {
      const analysis = analyzeDeadlines([mockTasks[3]], 60); // Only the 30-min task
      const triageMode = determineTriageMode(analysis);
      expect(triageMode.active).toBe(false);
      expect(triageMode.tasksToTriage).toHaveLength(0);
    });
  });

  describe('triageTasksByPriority', () => {
    it('should sort tasks by priority', () => {
      const sortedTasks = triageTasksByPriority(mockTasks);
      
      // La tâche urgente devrait être en premier
      expect(sortedTasks[0].urgency).toBe('urgent');
      
      // La tâche haute priorité devrait être en deuxième
      expect(sortedTasks[1].urgency).toBe('high');
    });
  });

  describe('calculateOptimizedLoad', () => {
    it('should calculate optimized load by selecting tasks within time limit', () => {
      const sortedTasks = triageTasksByPriority(mockTasks);
      const optimizedLoad = calculateOptimizedLoad(mockTasks, sortedTasks, 150); // 2.5 hours available
      
      // Devrait sélectionner les tâches jusqu'à saturation du temps
      expect(optimizedLoad.selectedTasks.length).toBeGreaterThan(0);
      expect(optimizedLoad.totalTime).toBeLessThanOrEqual(150);
      expect(optimizedLoad.remainingTime).toBeGreaterThanOrEqual(0);
    });
  });
});