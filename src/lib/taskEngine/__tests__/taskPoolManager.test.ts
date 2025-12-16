// Tests pour le gestionnaire de pools de tâches du Cerveau de KairuFlow - Phase 1

import { 
  createTaskPoolManager,
  assignTaskToPool,
  updateTaskPools,
  getEligibleTasks,
  calculateSoonScore,
  sortSoonTasks
} from '../taskPoolManager';
import { Task } from '../types';

describe('taskPoolManager', () => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const inTwoDays = new Date(today);
  inTwoDays.setDate(inTwoDays.getDate() + 2);
  
  const inFiveDays = new Date(today);
  inFiveDays.setDate(inFiveDays.getDate() + 5);
  
  const inTenDays = new Date(today);
  inTenDays.setDate(inTenDays.getDate() + 10);

  const mockTasks: Task[] = [
    {
      id: '1',
      title: 'Overdue Task',
      duration: 30,
      effort: 'medium',
      urgency: 'high',
      impact: 'medium',
      deadline: yesterday,
      completionHistory: [],
      category: 'work'
    },
    {
      id: '2',
      title: 'Today Task',
      duration: 45,
      effort: 'high',
      urgency: 'medium',
      impact: 'high',
      deadline: today,
      completionHistory: [],
      category: 'personal'
    },
    {
      id: '3',
      title: 'Soon Task',
      duration: 60,
      effort: 'low',
      urgency: 'low',
      impact: 'low',
      deadline: inTwoDays,
      completionHistory: [],
      category: 'work'
    },
    {
      id: '4',
      title: 'Future Task',
      duration: 20,
      effort: 'low',
      urgency: 'low',
      impact: 'low',
      deadline: inTenDays,
      completionHistory: [],
      category: 'learning'
    },
    {
      id: '5',
      title: 'No Deadline Task',
      duration: 10,
      effort: 'low',
      urgency: 'low',
      impact: 'low',
      completionHistory: [],
      category: 'admin'
    }
  ];

  describe('createTaskPoolManager', () => {
    it('should create a task pool manager with empty pools', () => {
      const manager = createTaskPoolManager(today);
      expect(manager.overdue).toHaveLength(0);
      expect(manager.today).toHaveLength(0);
      expect(manager.soon).toHaveLength(0);
      expect(manager.available).toHaveLength(0);
      expect(manager.referenceDate).toEqual(today);
    });
  });

  describe('assignTaskToPool', () => {
    it('should assign overdue task to OVERDUE pool', () => {
      const manager = createTaskPoolManager(today);
      const poolType = assignTaskToPool(mockTasks[0], manager);
      expect(poolType).toBe('OVERDUE');
    });

    it('should assign today task to TODAY pool', () => {
      const manager = createTaskPoolManager(today);
      const poolType = assignTaskToPool(mockTasks[1], manager);
      expect(poolType).toBe('TODAY');
    });

    it('should assign soon task to SOON pool', () => {
      const manager = createTaskPoolManager(today);
      const poolType = assignTaskToPool(mockTasks[2], manager);
      expect(poolType).toBe('SOON');
    });

    it('should assign future task to AVAILABLE pool', () => {
      const manager = createTaskPoolManager(today);
      const poolType = assignTaskToPool(mockTasks[3], manager);
      expect(poolType).toBe('AVAILABLE');
    });

    it('should assign no deadline task to AVAILABLE pool', () => {
      const manager = createTaskPoolManager(today);
      const poolType = assignTaskToPool(mockTasks[4], manager);
      expect(poolType).toBe('AVAILABLE');
    });
  });

  describe('calculateSoonScore', () => {
    it('should calculate soon score correctly', () => {
      const score = calculateSoonScore(mockTasks[2], today);
      expect(score.score).toBeGreaterThanOrEqual(0.1);
      expect(score.score).toBeLessThanOrEqual(1.0);
      expect(score.lastCalculated).toBeDefined();
    });
  });

  describe('sortSoonTasks', () => {
    it('should sort soon tasks by score', () => {
      const sortedTasks = sortSoonTasks([mockTasks[2]], today);
      expect(sortedTasks).toHaveLength(1);
    });
  });

  describe('updateTaskPools', () => {
    it('should distribute tasks to appropriate pools', () => {
      const manager = createTaskPoolManager(today);
      const updatedManager = updateTaskPools(mockTasks, manager);
      
      expect(updatedManager.overdue).toHaveLength(1);
      expect(updatedManager.today).toHaveLength(1);
      expect(updatedManager.soon).toHaveLength(1);
      expect(updatedManager.available).toHaveLength(2);
    });
  });

  describe('getEligibleTasks', () => {
    it('should return only OVERDUE and TODAY tasks when they exist', () => {
      const manager = createTaskPoolManager(today);
      const updatedManager = updateTaskPools(mockTasks, manager);
      const eligibleTasks = getEligibleTasks(updatedManager);
      
      // Doit retourner seulement les tâches OVERDUE et TODAY
      expect(eligibleTasks).toHaveLength(2);
      expect(eligibleTasks.some(task => task.id === '1')).toBe(true); // OVERDUE
      expect(eligibleTasks.some(task => task.id === '2')).toBe(true); // TODAY
    });

    it('should return SOON and AVAILABLE tasks when no OVERDUE or TODAY tasks', () => {
      const manager = createTaskPoolManager(today);
      // Créer des tâches sans deadlines passées ou d'aujourd'hui
      const futureTasks: Task[] = [
        mockTasks[2], // SOON
        mockTasks[3], // AVAILABLE
        mockTasks[4]  // AVAILABLE
      ];
      const updatedManager = updateTaskPools(futureTasks, manager);
      const eligibleTasks = getEligibleTasks(updatedManager);
      
      // Doit retourner les tâches SOON et AVAILABLE
      expect(eligibleTasks).toHaveLength(3);
    });
  });
});