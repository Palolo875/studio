import { 
  TaskWithContext, 
  TaskPool, 
  TaskStatus, 
  EnergyStability, 
  Capacity 
} from '../types';
import { 
  isTaskActive, 
  assignTaskToPool, 
  calculateTaskAgeIndex, 
  determineDetoxPhase, 
  detectImpossibleDay, 
  detectStability, // Use the original function from taskManagement
  calculateCapacity,
  isQuickWin,
  filterEligibleTasks
} from '../taskManagement';
import { 
  generateSession, 
  validateSession,
  generateDailyPlan
} from '../sessionManagement';
import {
  validateAllInvariants,
  applyPhase1Rules
} from '../phase1Invariants';
import {
  validateSystemState,
  HARD_RULES,
  GUARDRAIL_RULES,
  ADAPTIVE_RULES
} from '../ruleClassification';
import {
  translateMoralLanguage,
  containsMoralLanguage,
  DEFAULT_FAILURE_POLICY
} from '../moralLanguageFilter';
import {
  MorningRitual,
  EveningRitual,
  DefaultRitualHandler
} from '../morningEveningRituals';
import {
  INVARIANT_HIERARCHY,
  getInvariantPriority,
  resolveInvariantConflict,
  validateAgainstAllInvariants
} from '../invariantHierarchy';
import {
  validateAndCleanText,
  containsForbiddenTerms,
  FORBIDDEN_TERMS
} from '../languageFilter';
import {
  DetoxMode,
  DefaultDetoxHandler
} from '../detoxMode';
import {
  DefaultStabilityService
} from '../stabilityDetection';
import {
  resolveTemporalConflict,
  detectImpossibleDay as detectImpossible,
} from '../temporalConflictResolver';

// Tests pour simuler Jest sans les fonctions non définies
function test(description: string, fn: () => void) {
  try {
    fn();
    console.log(`✓ ${description}`);
  } catch (error) {
    console.error(`✗ ${description}: ${error}`);
  }
}

function describe(description: string, fn: () => void) {
  console.log(`\n${description}:`);
  fn();
}

describe('Phase 1 - Tests des composants critiques', () => {
  describe('Gestion des tâches actives', () => {
    test('should correctly identify active tasks', () => {
      const today = new Date();
      const pastDate = new Date();
      pastDate.setDate(today.getDate() - 1);
      
      const task1: TaskWithContext = {
        id: '1',
        title: 'Task 1',
        description: 'Test task',
        duration: 30,
        effort: 'medium',
        urgency: 'medium',
        impact: 'medium',
        category: 'work',
        status: 'active',
        pool: 'TODAY',
        activationCount: 1,
        createdAt: today,
        updatedAt: today
      };
      
      const task2: TaskWithContext = {
        id: '2',
        title: 'Task 2',
        description: 'Test task',
        duration: 30,
        effort: 'medium',
        urgency: 'medium',
        impact: 'medium',
        category: 'work',
        status: 'done',
        pool: 'TODAY',
        activationCount: 1,
        createdAt: today,
        updatedAt: today
      };
      
      if (isTaskActive(task1, today) !== true) {
        throw new Error('Expected task1 to be active');
      }
      if (isTaskActive(task2, today) !== false) {
        throw new Error('Expected task2 to not be active');
      }
    });

    test('should assign tasks to correct pools', () => {
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);
      
      const overdueTask: TaskWithContext = {
        id: 'overdue',
        title: 'Overdue Task',
        description: 'Test task',
        duration: 30,
        effort: 'medium',
        urgency: 'high',
        impact: 'high',
        deadline: yesterday,
        category: 'work',
        status: 'todo',
        pool: 'AVAILABLE', // Will be reassigned
        activationCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const todayTask: TaskWithContext = {
        id: 'today',
        title: 'Today Task',
        description: 'Test task',
        duration: 30,
        effort: 'medium',
        urgency: 'high',
        impact: 'high',
        deadline: today,
        category: 'work',
        status: 'todo',
        pool: 'AVAILABLE', // Will be reassigned
        activationCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      if (assignTaskToPool(overdueTask, today) !== 'OVERDUE') {
        throw new Error('Expected overdue task to be assigned to OVERDUE pool');
      }
      if (assignTaskToPool(todayTask, today) !== 'TODAY') {
        throw new Error('Expected today task to be assigned to TODAY pool');
      }
    });

    test('should calculate task age index correctly', () => {
      const today = new Date();
      const tasks: TaskWithContext[] = [
        {
          id: '1',
          title: 'Task 1',
          description: 'Test task',
          duration: 30,
          effort: 'medium',
          urgency: 'high',
          impact: 'high',
          category: 'work',
          status: 'todo',
          pool: 'AVAILABLE',
          activationCount: 0,
          createdAt: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
          updatedAt: today
        },
        {
          id: '2',
          title: 'Task 2',
          description: 'Test task',
          duration: 30,
          effort: 'medium',
          urgency: 'high',
          impact: 'high',
          category: 'work',
          status: 'todo',
          pool: 'AVAILABLE',
          activationCount: 0,
          createdAt: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
          updatedAt: today
        }
      ];
      
      const tai = calculateTaskAgeIndex(tasks, today);
      if (Math.abs(tai.averageAge - 3.5) > 0.1) {
        throw new Error(`Expected average age to be close to 3.5, got ${tai.averageAge}`);
      }
      if (tai.count !== 2) {
        throw new Error(`Expected count to be 2, got ${tai.count}`);
      }
    });

    test('should determine detox phase correctly', () => {
      const tai = {
        averageAge: 2.5,
        totalAge: 10,
        count: 4,
        calculationDate: new Date()
      };
      
      // Test with 5 days since last phase (should be GUIDED_REVIEW)
      const detoxPhase = determineDetoxPhase(tai, 5);
      if (detoxPhase?.phase !== 'GUIDED_REVIEW') {
        throw new Error('Expected detox phase to be GUIDED_REVIEW');
      }
    });

    test('should detect impossible day correctly', () => {
      const tasks: TaskWithContext[] = [
        {
          id: '1',
          title: 'Task 1',
          description: 'Test task',
          duration: 120, // 2 hours
          effort: 'high',
          urgency: 'urgent',
          impact: 'high',
          category: 'work',
          status: 'todo',
          pool: 'OVERDUE',
          activationCount: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '2',
          title: 'Task 2',
          description: 'Test task',
          duration: 120, // 2 hours
          effort: 'high',
          urgency: 'urgent',
          impact: 'high',
          category: 'work',
          status: 'todo',
          pool: 'OVERDUE',
          activationCount: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      
      // Available time is only 90 minutes, but tasks require 240 minutes
      if (detectImpossible(tasks, 90) !== true) {
        throw new Error('Expected impossible day to be detected');
      }
      if (detectImpossible(tasks, 300) !== false) {
        throw new Error('Expected possible day to not be flagged as impossible');
      }
    });
  });

  describe('Gestion des sessions', () => {
    test('should generate session with correct parameters', () => {
      const tasks: TaskWithContext[] = [
        {
          id: '1',
          title: 'Task 1',
          description: 'Test task',
          duration: 30,
          effort: 'medium',
          urgency: 'high',
          impact: 'high',
          category: 'work',
          status: 'todo',
          pool: 'TODAY',
          activationCount: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      
      const energyState = {
        level: 'high' as const,
        stability: 'stable' as const,
        confidence: 0.9
      };
      
      const session = generateSession(tasks, energyState, new Date(), 120, 5);
      
      if (session.plannedTasks < 0) {
        throw new Error('Expected planned tasks to be non-negative');
      }
      if (session.state !== 'PLANNED') {
        throw new Error('Expected session state to be PLANNED');
      }
      if (session.energyLevel !== 'high') {
        throw new Error('Expected energy level to be high');
      }
    });

    test('should validate session correctly', () => {
      const tasks: TaskWithContext[] = [
        {
          id: '1',
          title: 'Task 1',
          description: 'Test task',
          duration: 30,
          effort: 'medium',
          urgency: 'high',
          impact: 'high',
          category: 'work',
          status: 'todo',
          pool: 'TODAY',
          activationCount: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      
      const session = {
        id: 'session-1',
        timestamp: Date.now(),
        startTime: Date.now(),
        plannedTasks: 1,
        completedTasks: 0,
        state: 'PLANNED' as const,
        taskIds: ['1'],
        createdAt: new Date()
      };
      
      const isValid = validateSession(session, tasks);
      if (isValid !== true) {
        throw new Error('Expected session to be valid');
      }
    });
  });

  describe('Invariants de la Phase 1', () => {
    test('should validate all invariants correctly', () => {
      const tasks: TaskWithContext[] = [
        {
          id: '1',
          title: 'Task 1',
          description: 'Test task',
          duration: 30,
          effort: 'medium',
          urgency: 'high',
          impact: 'high',
          category: 'work',
          status: 'todo',
          pool: 'TODAY',
          activationCount: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      
      const capacity: Capacity = {
        maxTasks: 5,
        maxEffort: 10,
        availableMinutes: 120
      };
      
      const result = validateAllInvariants(tasks, capacity, 'IN_PROGRESS', 'stable', 120);
      if (result.valid !== true) {
        throw new Error('Expected all invariants to be valid');
      }
      if (result.violations.length !== 0) {
        throw new Error('Expected no invariant violations');
      }
    });

    test('should detect invariant violations', () => {
      // Create 6 tasks to violate the max 5 tasks invariant
      const tasks: TaskWithContext[] = Array.from({ length: 6 }, (_, i) => ({
        id: `${i}`,
        title: `Task ${i}`,
        description: 'Test task',
        duration: 30,
        effort: 'medium',
        urgency: 'high',
        impact: 'high',
        category: 'work',
        status: 'todo',
        pool: 'TODAY' as TaskPool,
        activationCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }));
      
      const capacity: Capacity = {
        maxTasks: 5,
        maxEffort: 10,
        availableMinutes: 120
      };
      
      const result = validateAllInvariants(tasks, capacity, 'IN_PROGRESS', 'stable', 120);
      if (result.valid !== false) {
        throw new Error('Expected invariants to be invalid');
      }
      if (result.violations.length === 0) {
        throw new Error('Expected invariant violations');
      }
    });

    test('should apply phase 1 rules correctly', () => {
      const tasks: TaskWithContext[] = [
        {
          id: '1',
          title: 'Task 1',
          description: 'Test task',
          duration: 30,
          effort: 'medium',
          urgency: 'high',
          impact: 'high',
          category: 'work',
          status: 'todo',
          pool: 'TODAY',
          activationCount: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      
      const result = applyPhase1Rules(tasks, 'high', 'stable', new Date(), 120);
      
      if (!Array.isArray(result.filteredTasks)) {
        throw new Error('Expected filteredTasks to be an array');
      }
      if (typeof result.invariantsValid !== 'boolean') {
        throw new Error('Expected invariantsValid to be a boolean');
      }
      if (!Array.isArray(result.violations)) {
        throw new Error('Expected violations to be an array');
      }
    });
  });

  describe('Fonctions utilitaires', () => {
    test('should detect stability correctly', () => {
      // High instability scenario
      const stability1 = detectStability(5, 0.8, 0.7, true, true, true);
      if (stability1 !== 'volatile') {
        throw new Error('Expected stability to be volatile in high instability scenario');
      }
      
      // Low instability scenario
      const stability2 = detectStability(1, 0.1, 0.1, false, false, false);
      if (stability2 !== 'stable') {
        throw new Error('Expected stability to be stable in low instability scenario');
      }
    });

    test('should calculate capacity correctly', () => {
      const capacityHigh = calculateCapacity('high', 'stable', 120);
      if (capacityHigh.maxTasks < 3) {
        throw new Error('Expected high energy to allow more tasks');
      }
      
      const capacityLow = calculateCapacity('low', 'volatile', 120);
      if (capacityLow.maxTasks > 2) {
        throw new Error('Expected low energy in volatile state to allow fewer tasks');
      }
    });

    test('should identify quick wins correctly', () => {
      const quickWinTask: TaskWithContext = {
        id: '1',
        title: 'Quick Win',
        description: 'Test task',
        duration: 10, // Less than 15 min
        effort: 'low',
        urgency: 'low',
        impact: 'low',
        category: 'personal',
        status: 'todo',
        pool: 'AVAILABLE',
        activationCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const notQuickWinTask: TaskWithContext = {
        id: '2',
        title: 'Not Quick Win',
        description: 'Test task',
        duration: 45, // More than 15 min
        effort: 'high',
        urgency: 'high',
        impact: 'high',
        category: 'work',
        status: 'todo',
        pool: 'AVAILABLE',
        activationCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      if (isQuickWin(quickWinTask) !== true) {
        throw new Error('Expected quick win task to be identified as quick win');
      }
      if (isQuickWin(notQuickWinTask) !== false) {
        throw new Error('Expected non-quick win task to not be identified as quick win');
      }
    });

    test('should filter eligible tasks correctly', () => {
      const tasks: TaskWithContext[] = [
        {
          id: '1',
          title: 'Overdue Task',
          description: 'Test task',
          duration: 30,
          effort: 'medium',
          urgency: 'urgent',
          impact: 'high',
          category: 'work',
          status: 'todo',
          pool: 'OVERDUE',
          activationCount: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '2',
          title: 'Today Task',
          description: 'Test task',
          duration: 30,
          effort: 'medium',
          urgency: 'high',
          impact: 'high',
          category: 'work',
          status: 'todo',
          pool: 'TODAY',
          activationCount: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '3',
          title: 'Soon Task',
          description: 'Test task',
          duration: 30,
          effort: 'medium',
          urgency: 'medium',
          impact: 'medium',
          category: 'personal',
          status: 'todo',
          pool: 'SOON',
          activationCount: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      
      // When there are OVERDUE or TODAY tasks, SOON tasks should be hidden
      const eligibleTasks = filterEligibleTasks(tasks, new Date());
      if (eligibleTasks.length !== 2) {
        throw new Error(`Expected 2 eligible tasks (OVERDUE and TODAY), got ${eligibleTasks.length}`);
      }
      if (eligibleTasks.some(t => t.pool === 'SOON')) {
        throw new Error('Expected no SOON tasks to be in eligible tasks when OVERDUE/TODAY exist');
      }
    });
  });
});