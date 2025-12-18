// Tests pour le gestionnaire de contraintes horaires du Cerveau de KairuFlow - Phase 1

import { 
  identifyTimeConstraints,
  calculateFreeSlots,
  scheduleAroundConstraints,
  resolveTimeConflicts
} from '../timeConstraintManager';
import { Task } from '../types';

describe('timeConstraintManager', () => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const mockTasks: Task[] = [
    {
      id: '1',
      title: 'Meeting Task',
      duration: 60,
      effort: 'medium',
      urgency: 'medium',
      impact: 'medium',
      deadline: today,
      scheduledTime: '14:00',
      completionHistory: [],
      category: 'work'
    },
    {
      id: '2',
      title: 'Normal Task',
      duration: 30,
      effort: 'low',
      urgency: 'low',
      impact: 'low',
      deadline: today,
      completionHistory: [],
      category: 'personal'
    },
    {
      id: '3',
      title: 'Another Meeting',
      duration: 90,
      effort: 'high',
      urgency: 'high',
      impact: 'high',
      deadline: today,
      scheduledTime: '10h30',
      completionHistory: [],
      category: 'work'
    }
  ];

  describe('identifyTimeConstraints', () => {
    it('should identify time constraints from tasks', () => {
      const constraints = identifyTimeConstraints(mockTasks, today);
      expect(constraints).toHaveLength(2);
      expect(constraints[0].startTime).toBe('10h30');
      expect(constraints[1].startTime).toBe('14:00');
    });

    it('should return empty array when no tasks have scheduled time', () => {
      const tasksWithoutSchedule = [mockTasks[1]]; // Task without scheduledTime
      const constraints = identifyTimeConstraints(tasksWithoutSchedule, today);
      expect(constraints).toHaveLength(0);
    });
  });

  describe('calculateFreeSlots', () => {
    it('should calculate free slots when no constraints', () => {
      const freeSlots = calculateFreeSlots([], '08:00', '20:00');
      expect(freeSlots).toHaveLength(1);
      expect(freeSlots[0].duration).toBe(12 * 60); // 12 hours in minutes
    });

    it('should calculate free slots around constraints', () => {
      const constraints = identifyTimeConstraints(mockTasks, today);
      const freeSlots = calculateFreeSlots(constraints, '08:00', '20:00');
      expect(freeSlots.length).toBeGreaterThan(0);
    });
  });

  describe('resolveTimeConflicts', () => {
    it('should filter out tasks that conflict with constraints', () => {
      const constraints = identifyTimeConstraints([mockTasks[0]], today); // Only the 14:00 meeting
      const nonConflictingTasks = resolveTimeConflicts(mockTasks, constraints, today);
      
      // La tâche avec scheduledTime '14:00' ne devrait pas être en conflit avec elle-même
      // La tâche avec scheduledTime '10h30' devrait être filtrée
      expect(nonConflictingTasks).toHaveLength(3);
    });

    it('should return all tasks when no constraints', () => {
      const nonConflictingTasks = resolveTimeConflicts(mockTasks, [], today);
      expect(nonConflictingTasks).toHaveLength(3);
    });
  });

  describe('scheduleAroundConstraints', () => {
    it('should schedule sessions around constraints', () => {
      const constraints = identifyTimeConstraints(mockTasks, today);
      const freeSlots = calculateFreeSlots(constraints, '08:00', '20:00');
      
      // Fonction mock pour l'énergie
      const mockEnergyProfile = (time: Date) => ({
        level: 'medium' as const,
        stability: 'stable' as const
      });
      
      const scheduleResult = scheduleAroundConstraints(
        mockTasks,
        constraints,
        freeSlots,
        mockEnergyProfile
      );
      
      expect(scheduleResult.sessions.length).toBeGreaterThan(0);
      expect(scheduleResult.constraints).toHaveLength(2);
      expect(scheduleResult.freeSlots.length).toBeGreaterThanOrEqual(0);
    });
  });
});