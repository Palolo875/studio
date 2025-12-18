// Tests pour le gestionnaire de fenêtre active du Cerveau de KairuFlow - Phase 1

import { 
  createActiveWindowManager,
  shouldActivateTask,
  activateTask,
  freezeTask,
  unfreezeTask,
  updateActiveWindow,
  getTaskStatus,
  countActiveTasks,
  generateActiveWindowMessage
} from '../activeWindowManager';
import { Task } from '../types';

describe('activeWindowManager', () => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const mockTasks: Task[] = [
    {
      id: '1',
      title: 'Active Task',
      duration: 30,
      effort: 'medium',
      urgency: 'medium',
      impact: 'medium',
      deadline: today,
      completionHistory: [
        {
          date: today,
          actualDuration: 25,
          energy: { level: 'medium', stability: 'stable' }
        }
      ],
      category: 'work',
      status: 'active',
      activationCount: 1,
      lastActivated: today
    },
    {
      id: '2',
      title: 'Inactive Task',
      duration: 45,
      effort: 'high',
      urgency: 'high',
      impact: 'high',
      deadline: today,
      completionHistory: [],
      category: 'personal'
    },
    {
      id: '3',
      title: 'New Task',
      duration: 60,
      effort: 'low',
      urgency: 'low',
      impact: 'low',
      deadline: today,
      completionHistory: [
        {
          date: today,
          actualDuration: 40,
          energy: { level: 'high', stability: 'stable' }
        }
      ],
      category: 'work'
    }
  ];

  describe('createActiveWindowManager', () => {
    it('should create an active window manager with default values', () => {
      const manager = createActiveWindowManager();
      expect(manager.activeTasks).toHaveLength(0);
      expect(manager.frozenTasks).toHaveLength(0);
      expect(manager.maxActiveTasks).toBe(10);
      expect(manager.lastUpdated).toBeDefined();
    });

    it('should create an active window manager with custom max active tasks', () => {
      const manager = createActiveWindowManager(5);
      expect(manager.maxActiveTasks).toBe(5);
    });
  });

  describe('shouldActivateTask', () => {
    it('should activate task when user clicks start', () => {
      const shouldActivate = shouldActivateTask(mockTasks[1], 'user_clicked_start', today);
      expect(shouldActivate).toBe(true);
    });

    it('should activate task when auto-activated and created today', () => {
      const shouldActivate = shouldActivateTask(mockTasks[2], 'auto_activation', today);
      expect(shouldActivate).toBe(true);
    });

    it('should not activate task with no action', () => {
      const shouldActivate = shouldActivateTask(mockTasks[1], 'none', today);
      expect(shouldActivate).toBe(false);
    });
  });

  describe('activateTask', () => {
    it('should activate a task', () => {
      const manager = createActiveWindowManager();
      const updatedManager = activateTask(mockTasks[1], manager);
      expect(updatedManager.activeTasks).toHaveLength(1);
      expect(updatedManager.activeTasks[0].id).toBe('2');
    });

    it('should not duplicate active tasks', () => {
      const manager = createActiveWindowManager();
      const managerWithTask = activateTask(mockTasks[1], manager);
      const updatedManager = activateTask(mockTasks[1], managerWithTask);
      expect(updatedManager.activeTasks).toHaveLength(1);
    });
  });

  describe('freezeTask', () => {
    it('should freeze an active task', () => {
      const manager = createActiveWindowManager();
      const managerWithTask = activateTask(mockTasks[1], manager);
      const updatedManager = freezeTask(mockTasks[1], managerWithTask);
      expect(updatedManager.activeTasks).toHaveLength(0);
      expect(updatedManager.frozenTasks).toHaveLength(1);
      expect(updatedManager.frozenTasks[0].id).toBe('2');
    });
  });

  describe('unfreezeTask', () => {
    it('should unfreeze a frozen task', () => {
      const manager = createActiveWindowManager();
      const managerWithFrozenTask = freezeTask(mockTasks[1], manager);
      const updatedManager = unfreezeTask(mockTasks[1], managerWithFrozenTask);
      expect(updatedManager.frozenTasks).toHaveLength(0);
      
      // La tâche devrait être ajoutée aux tâches actives si la limite n'est pas dépassée
      expect(updatedManager.activeTasks).toHaveLength(1);
      expect(updatedManager.activeTasks[0].id).toBe('2');
    });
  });

  describe('updateActiveWindow', () => {
    it('should update active window with user actions', () => {
      const manager = createActiveWindowManager();
      const userActions = [
        { taskId: '2', action: 'start' as const }
      ];
      const updatedManager = updateActiveWindow(mockTasks, manager, userActions);
      expect(updatedManager.activeTasks).toHaveLength(1);
      expect(updatedManager.activeTasks[0].id).toBe('2');
    });

    it('should automatically freeze tasks when exceeding limit', () => {
      const manager = createActiveWindowManager(1); // Limite à 1 tâche
      const userActions = [
        { taskId: '1', action: 'start' as const },
        { taskId: '2', action: 'start' as const }
      ];
      const updatedManager = updateActiveWindow(mockTasks, manager, userActions);
      
      // Une tâche devrait être active et une gelée
      expect(updatedManager.activeTasks).toHaveLength(1);
      expect(updatedManager.frozenTasks).toHaveLength(1);
    });
  });

  describe('getTaskStatus', () => {
    it('should return correct status for active task', () => {
      const manager = createActiveWindowManager();
      const managerWithTask = activateTask(mockTasks[1], manager);
      const status = getTaskStatus(mockTasks[1], managerWithTask);
      expect(status).toBe('active');
    });

    it('should return correct status for frozen task', () => {
      const manager = createActiveWindowManager();
      const managerWithFrozenTask = freezeTask(mockTasks[1], manager);
      const status = getTaskStatus(mockTasks[1], managerWithFrozenTask);
      expect(status).toBe('frozen');
    });

    it('should return correct status for inactive task', () => {
      const manager = createActiveWindowManager();
      const status = getTaskStatus(mockTasks[1], manager);
      expect(status).toBe('inactive');
    });
  });

  describe('countActiveTasks', () => {
    it('should count active tasks correctly', () => {
      const manager = createActiveWindowManager();
      const managerWithTasks = activateTask(mockTasks[1], activateTask(mockTasks[0], manager));
      const count = countActiveTasks(managerWithTasks);
      expect(count).toBe(2);
    });
  });

  describe('generateActiveWindowMessage', () => {
    it('should generate appropriate message for normal state', () => {
      const manager = createActiveWindowManager();
      const managerWithTasks = activateTask(mockTasks[1], manager);
      const message = generateActiveWindowMessage(managerWithTasks);
      expect(message).toContain('1/10 tâches actives');
    });

    it('should generate appropriate message when limit is reached', () => {
      const manager = createActiveWindowManager(1);
      const managerWithTasks = activateTask(mockTasks[1], manager);
      const message = generateActiveWindowMessage(managerWithTasks);
      expect(message).toContain('atteint la limite');
    });
  });
});