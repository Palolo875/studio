// Tests pour le calculateur de capacité du Cerveau de KairuFlow - Phase 1

import { 
  calculateTaskCost, 
  initializeDailyCapacity, 
  updateDailyCapacity, 
  canAddTask, 
  isCapacityExhausted, 
  isCapacityNearExhaustion 
} from '../capacityCalculator';
import { Task, EnergyState } from '../types';

describe('capacityCalculator', () => {
  describe('calculateTaskCost', () => {
    it('should calculate cost correctly for low effort task with stable energy', () => {
      const task: Task = {
        id: '1',
        title: 'Test Task',
        duration: 30,
        effort: 'low',
        urgency: 'low',
        impact: 'low',
        completionHistory: []
      };
      
      const energy: EnergyState = { level: 'medium', stability: 'stable' };
      const cost = calculateTaskCost(task, energy);
      
      // Coût = durée × facteur effort × pénalité stabilité
      // Coût = 30 × 1.0 × 1.0 = 30
      expect(cost).toBe(30);
    });

    it('should calculate cost correctly for high effort task with volatile energy', () => {
      const task: Task = {
        id: '1',
        title: 'Test Task',
        duration: 60,
        effort: 'high',
        urgency: 'high',
        impact: 'high',
        completionHistory: []
      };
      
      const energy: EnergyState = { level: 'high', stability: 'volatile' };
      const cost = calculateTaskCost(task, energy);
      
      // Coût = durée × facteur effort × pénalité stabilité
      // Coût = 60 × 2.5 × 1.3 = 195
      expect(cost).toBe(195);
    });
  });

  describe('initializeDailyCapacity', () => {
    it('should initialize capacity with default max load', () => {
      const capacity = initializeDailyCapacity();
      expect(capacity.maxLoad).toBe(10);
      expect(capacity.usedLoad).toBe(0);
      expect(capacity.remaining).toBe(10);
      expect(capacity.tasksToday).toEqual([]);
    });

    it('should initialize capacity with custom max load', () => {
      const capacity = initializeDailyCapacity(20);
      expect(capacity.maxLoad).toBe(20);
      expect(capacity.usedLoad).toBe(0);
      expect(capacity.remaining).toBe(20);
    });
  });

  describe('updateDailyCapacity', () => {
    it('should update capacity correctly when adding a task', () => {
      const initialCapacity = initializeDailyCapacity(100);
      const task: Task = {
        id: '1',
        title: 'Test Task',
        duration: 30,
        effort: 'medium',
        urgency: 'medium',
        impact: 'medium',
        completionHistory: []
      };
      
      const updatedCapacity = updateDailyCapacity(initialCapacity, task, 45, 'planned');
      
      expect(updatedCapacity.usedLoad).toBe(45);
      expect(updatedCapacity.remaining).toBe(55);
      expect(updatedCapacity.tasksToday).toHaveLength(1);
      expect(updatedCapacity.tasksToday[0]).toEqual({ cost: 45, status: 'planned' });
    });
  });

  describe('canAddTask', () => {
    it('should return true when task can be added without exceeding capacity', () => {
      const capacity = initializeDailyCapacity(100);
      // Utilisation de 60, reste 40
      const updatedCapacity = { ...capacity, usedLoad: 60, remaining: 40 };
      
      expect(canAddTask(updatedCapacity, 30)).toBe(true);
    });

    it('should return false when task cannot be added without exceeding capacity', () => {
      const capacity = initializeDailyCapacity(100);
      // Utilisation de 80, reste 20
      const updatedCapacity = { ...capacity, usedLoad: 80, remaining: 20 };
      
      expect(canAddTask(updatedCapacity, 30)).toBe(false);
    });
  });

  describe('isCapacityExhausted', () => {
    it('should return true when capacity is below critical threshold', () => {
      const capacity = initializeDailyCapacity(100);
      // Utilisation de 85, reste 15 (15% < 20% seuil critique)
      const updatedCapacity = { ...capacity, usedLoad: 85, remaining: 15 };
      
      expect(isCapacityExhausted(updatedCapacity)).toBe(true);
    });

    it('should return false when capacity is above critical threshold', () => {
      const capacity = initializeDailyCapacity(100);
      // Utilisation de 75, reste 25 (25% > 20% seuil critique)
      const updatedCapacity = { ...capacity, usedLoad: 75, remaining: 25 };
      
      expect(isCapacityExhausted(updatedCapacity)).toBe(false);
    });
  });

  describe('isCapacityNearExhaustion', () => {
    it('should return true when capacity is below warning threshold', () => {
      const capacity = initializeDailyCapacity(100);
      // Utilisation de 65, reste 35 (35% < 40% seuil d'alerte)
      const updatedCapacity = { ...capacity, usedLoad: 65, remaining: 35 };
      
      expect(isCapacityNearExhaustion(updatedCapacity)).toBe(true);
    });

    it('should return false when capacity is above warning threshold', () => {
      const capacity = initializeDailyCapacity(100);
      // Utilisation de 55, reste 45 (45% > 40% seuil d'alerte)
      const updatedCapacity = { ...capacity, usedLoad: 55, remaining: 45 };
      
      expect(isCapacityNearExhaustion(updatedCapacity)).toBe(false);
    });
  });
});