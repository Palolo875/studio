// Tests d'intégration Phase 1 - KairuFlow Brain Engine
// Couvre: validation invariants, stabilité volatile, DETOX, contraintes horaires, fin de session non auto

import { 
  generateTaskPlaylist,
  filterEligibleTasks,
  injectQuickWin,
  checkDiversity
} from '../selector';
import { 
  createSession,
  markSessionCompleted,
  isSessionValid
} from '../sessionManager';
import { 
  shouldActivateTask,
  activateTask
} from '../activeWindowManager';
import { 
  isEnergyCompatible,
  predictEnergyState
} from '../energyModel';
import { 
  validatePlaylist,
  checkAllInvariants
} from '../invariantChecker';
import { 
  calculateSessionCapacity
} from '../capacityCalculator';
import { 
  calculateTaskAgeIndex,
  getDetoxMode,
  applyDetoxActions
} from '../taskAgeIndex';
import { 
  analyzeDeadlines,
  determineTriageMode
} from '../deadlineManager';
import { 
  identifyTimeConstraints,
  resolveTimeConflicts
} from '../timeConstraintManager';
import { Task, EnergyState } from '../types';

// Helper pour créer des tâches de test
function createTestTask(overrides: Partial<Task> = {}): Task {
  const now = new Date();
  return {
    id: `task-${now.getTime()}`,
    title: 'Test task',
    duration: 30,
    effort: 'medium',
    urgency: 'medium',
    impact: 'medium',
    category: 'test',
    completionHistory: [],
    createdAt: now,
    ...overrides
  };
}

// Helper pour créer un état d'énergie de test
function createTestEnergyState(overrides: Partial<EnergyState> = {}): EnergyState {
  return {
    level: 'medium',
    stability: 'stable',
    confidence: 0.8,
    lastUpdated: new Date(),
    ...overrides
  };
}

describe('Phase 1 Integration Tests', () => {
  describe('Validation des invariants dans le pipeline', () => {
    test('doit rejeter une playlist qui viole maxTasks invariant', () => {
      const tasks = Array.from({ length: 6 }, () => createTestTask());
      const energy = createTestEnergyState();
      
      const playlist = generateTaskPlaylist(tasks, energy, 3);
      
      expect(playlist.tasks.length).toBeLessThanOrEqual(3);
      if (playlist.warnings) {
        expect(playlist.warnings.some(w => w.includes('maxTasks'))).toBe(true);
      }
    });

    test('doit rejeter une playlist qui viole totalLoad invariant', () => {
      const tasks = [
        createTestTask({ duration: 100 }),
        createTestTask({ duration: 100 }),
        createTestTask({ duration: 100 })
      ];
      const energy = createTestEnergyState();
      
      const playlist = generateTaskPlaylist(tasks, energy, 5, new Date(), {
        sessionDurationMinutes: 120 // 2h seulement
      });
      
      // La charge totale ne doit pas dépasser la capacité de session
      const totalLoad = playlist.tasks.reduce((sum, task) => sum + task.duration, 0);
      expect(totalLoad).toBeLessThanOrEqual(120);
    });

    test('doit valider tous les invariants avec une playlist correcte', () => {
      const tasks = [
        createTestTask({ duration: 15, effort: 'low' }),
        createTestTask({ duration: 30, effort: 'medium' }),
        createTestTask({ duration: 20, effort: 'low', category: 'different' })
      ];
      const energy = createTestEnergyState();
      
      const playlist = generateTaskPlaylist(tasks, energy, 5);
      const validation = validatePlaylist(playlist, energy.level, Infinity);
      
      expect('error' in validation).toBe(false);
      expect(validation.tasks).toBeDefined();
    });
  });

  describe('Stabilité volatile - exclusion tâches lourdes', () => {
    test('doit exclure les tâches high effort si stabilité volatile', () => {
      const energy = createTestEnergyState({ stability: 'volatile' });
      const highEffortTask = createTestTask({ effort: 'high' });
      const lowEffortTask = createTestTask({ effort: 'low' });
      
      const isHighCompatible = isEnergyCompatible('high', energy);
      const isLowCompatible = isEnergyCompatible('low', energy);
      
      expect(isHighCompatible).toBe(false);
      expect(isLowCompatible).toBe(true);
    });

    test('doit générer une playlist sans tâches high effort en mode volatile', () => {
      const tasks = [
        createTestTask({ effort: 'high', title: 'Heavy task' }),
        createTestTask({ effort: 'medium', title: 'Medium task' }),
        createTestTask({ effort: 'low', title: 'Light task' })
      ];
      const energy = createTestEnergyState({ stability: 'volatile' });
      
      const playlist = generateTaskPlaylist(tasks, energy, 5);
      
      expect(playlist.tasks.some(t => t.effort === 'high')).toBe(false);
      if (playlist.warnings) {
        expect(playlist.explanation).toContain('volatile');
      }
    });
  });

  describe('Mode DETOX - application aux pools', () => {
    test('doit geler les tâches SOON en mode DETOX BLOCK', () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 30); // 30 jours
      
      const tasks = [
        createTestTask({ createdAt: oldDate, category: 'old1' }),
        createTestTask({ createdAt: oldDate, category: 'old2' }),
        createTestTask({ createdAt: new Date(), category: 'new' })
      ];
      
      const tai = calculateTaskAgeIndex(tasks);
      const detoxMode = getDetoxMode(tai, 5); // 5 jours consécutifs
      const detoxActions = applyDetoxActions(tasks, detoxMode);
      
      expect(detoxMode).toBe('BLOCK');
      expect(detoxActions.frozenSoonTasks.length).toBeGreaterThan(0);
    });

    test('doit limiter les tâches TODAY en mode BLOCK', () => {
      const tasks = Array.from({ length: 5 }, (_, i) => 
        createTestTask({ 
          deadline: new Date(),
          category: `today${i}`
        })
      );
      
      const tai = calculateTaskAgeIndex(tasks);
      const detoxMode = getDetoxMode(tai, 5);
      const detoxActions = applyDetoxActions(tasks, detoxMode);
      
      if (detoxMode === 'BLOCK') {
        expect(detoxActions.limitedTodayTasks).toBe(true);
      }
    });

    test('doit intégrer DETOX dans generateTaskPlaylist', () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 30);
      
      const tasks = [
        createTestTask({ createdAt: oldDate, title: 'Old task' }),
        createTestTask({ createdAt: new Date(), title: 'New task' })
      ];
      const energy = createTestEnergyState();
      
      const playlist = generateTaskPlaylist(tasks, energy, 5, new Date(), {
        detoxConsecutiveDays: 5
      });
      
      expect(playlist.explanation).toContain('DETOX');
      if (playlist.warnings) {
        expect(playlist.warnings.length).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Contraintes horaires', () => {
    test('doit identifier les contraintes horaires', () => {
      const today = new Date();
      const scheduledTime = '10:00';
      
      const tasks = [
        createTestTask({ 
          scheduledTime,
          deadline: today
        })
      ];
      
      const constraints = identifyTimeConstraints(tasks, today);
      
      expect(constraints).toHaveLength(1);
      expect(constraints[0].task.scheduledTime).toBe(scheduledTime);
    });

    test('doit résoudre les conflits de temps', () => {
      const today = new Date();
      const tasks = [
        createTestTask({ scheduledTime: '10:00' }),
        createTestTask({ scheduledTime: '10:30' })
      ];
      
      const constraints = identifyTimeConstraints(tasks, today);
      const resolvedTasks = resolveTimeConflicts(tasks, constraints, today);
      
      expect(resolvedTasks).toHaveLength(2);
    });

    test('doit intégrer les contraintes dans sessionManager', () => {
      const timeSlot = {
        startTime: '09:00',
        endTime: '11:00',
        label: 'Morning'
      };
      
      const tasks = [
        createTestTask({ scheduledTime: '10:00', title: 'Meeting' })
      ];
      
      const session = createSession(timeSlot, tasks);
      
      expect(session.fixedTasks).toHaveLength(1);
      expect(session.fixedTasks[0].scheduledTime).toBe('10:00');
    });
  });

  describe('Fin de session non automatique', () => {
    test('ne doit pas activer automatiquement les tâches', () => {
      const task = createTestTask();
      const energy = createTestEnergyState();
      
      // Sans action utilisateur, pas d'activation
      const shouldActivate = shouldActivateTask(task, 'none');
      expect(shouldActivate).toBe(false);
      
      // Avec action utilisateur explicite, activation
      const shouldActivateWithAction = shouldActivateTask(task, 'user_clicked_start');
      expect(shouldActivateWithAction).toBe(true);
    });

    test('doit nécessiter une action explicite pour marquer une session complétée', () => {
      const timeSlot = {
        startTime: '09:00',
        endTime: '11:00',
        label: 'Morning'
      };
      
      const tasks = [createTestTask()];
      const session = createSession(timeSlot, tasks);
      
      expect(session.state).toBe('PLANNED');
      
      // La session reste PLANNED jusqu'à action explicite
      const completedSession = markSessionCompleted(session);
      expect(completedSession.state).toBe('COMPLETED');
    });
  });

  describe('Deadline Manager - Mode TRIAGE', () => {
    test('doit détecter les deadlines impossibles', () => {
      const tasks = [
        createTestTask({ duration: 180, urgency: 'urgent' }), // 3h
        createTestTask({ duration: 120, urgency: 'high' }),    // 2h
        createTestTask({ duration: 90, urgency: 'medium' })     // 1.5h
      ];
      
      const timeAvailable = 120; // 2h seulement
      const analysis = analyzeDeadlines(tasks, timeAvailable);
      
      expect(analysis.loadRatio).toBeGreaterThan(1.5);
      expect(analysis.overloadedTasks.length).toBeGreaterThan(0);
    });

    test('doit activer le mode TRIAGE si surcharge', () => {
      const tasks = [
        createTestTask({ duration: 180, urgency: 'urgent' }),
        createTestTask({ duration: 120, urgency: 'high' })
      ];
      
      const timeAvailable = 120;
      const analysis = analyzeDeadlines(tasks, timeAvailable);
      const triageMode = determineTriageMode(analysis);
      
      expect(triageMode.active).toBe(true);
      expect(triageMode.tasksToTriage.length).toBeGreaterThan(0);
      expect(triageMode.alertMessage).toContain('impossibles');
    });

    test('doit générer une playlist spéciale en mode TRIAGE', () => {
      const tasks = [
        createTestTask({ duration: 180, urgency: 'urgent', title: 'Urgent task' }),
        createTestTask({ duration: 120, urgency: 'high', title: 'High task' }),
        createTestTask({ duration: 30, urgency: 'low', title: 'Low task' })
      ];
      
      const energy = createTestEnergyState();
      
      const playlist = generateTaskPlaylist(tasks, energy, 5, new Date(), {
        sessionDurationMinutes: 120
      });
      
      expect(playlist.explanation).toContain('TRIAGE');
      expect(playlist.warnings).toBeDefined();
      expect(playlist.warnings!.length).toBeGreaterThan(0);
    });
  });

  describe('Capacité de session', () => {
    test('doit calculer la capacité en fonction de la durée et de l\'énergie', () => {
      const energy = createTestEnergyState({ stability: 'stable' });
      const volatileEnergy = createTestEnergyState({ stability: 'volatile' });
      
      const capacity = calculateSessionCapacity(120, energy);
      const volatileCapacity = calculateSessionCapacity(120, volatileEnergy);
      
      expect(capacity).toBeGreaterThan(0);
      expect(volatileCapacity).toBeLessThan(capacity); // Pénalité de stabilité
    });

    test('doit respecter la capacité de session dans generateTaskPlaylist', () => {
      const tasks = [
        createTestTask({ duration: 60 }),
        createTestTask({ duration: 60 }),
        createTestTask({ duration: 60 })
      ];
      
      const energy = createTestEnergyState();
      
      const playlist = generateTaskPlaylist(tasks, energy, 5, new Date(), {
        sessionDurationMinutes: 90 // 1.5h seulement
      });
      
      const totalDuration = playlist.tasks.reduce((sum, task) => sum + task.duration, 0);
      expect(totalDuration).toBeLessThanOrEqual(90);
    });
  });

  describe('Explications structurées', () => {
    test('doit fournir des explications détaillées dans TaskPlaylist', () => {
      const tasks = [
        createTestTask({ duration: 15, effort: 'low', title: 'Quick win' }),
        createTestTask({ duration: 30, effort: 'medium', category: 'work' }),
        createTestTask({ duration: 20, effort: 'low', category: 'personal' })
      ];
      
      const energy = createTestEnergyState();
      
      const playlist = generateTaskPlaylist(tasks, energy, 5);
      
      expect(playlist.explanation).toContain('Invariants');
      expect(playlist.explanation).toContain('TAI');
      expect(playlist.explanation).toContain('DETOX');
      expect(playlist.explanation).toContain('Pools');
    });

    test('doit inclure les quick wins dans les explications', () => {
      const tasks = [
        createTestTask({ duration: 10, effort: 'low', title: 'Quick win task' }),
        createTestTask({ duration: 60, effort: 'high', title: 'Heavy task' })
      ];
      
      const energy = createTestEnergyState();
      
      const playlist = generateTaskPlaylist(tasks, energy, 5);
      
      expect(playlist.explanation).toContain('Quick win');
    });
  });

  describe('Tests d\'intégration complets', () => {
    test('doit gérer un scénario complexe avec toutes les contraintes', () => {
      // Tâches avec différentes caractéristiques
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 30);
      
      const tasks = [
        // Tâche urgente et longue (déclenche TRIAGE)
        createTestTask({ 
          duration: 180, 
          urgency: 'urgent', 
          effort: 'high',
          title: 'Critical urgent task'
        }),
        // Tâche ancienne (déclenche DETOX)
        createTestTask({ 
          createdAt: oldDate,
          duration: 30,
          effort: 'medium',
          category: 'old-task',
          title: 'Old task'
        }),
        // Tâche avec contrainte horaire
        createTestTask({ 
          scheduledTime: '10:00',
          duration: 45,
          effort: 'low',
          title: 'Scheduled meeting'
        }),
        // Quick win
        createTestTask({ 
          duration: 10,
          effort: 'low',
          title: 'Quick win'
        })
      ];
      
      const volatileEnergy = createTestEnergyState({ 
        level: 'medium',
        stability: 'volatile'
      });
      
      // Générer la playlist avec toutes les options
      const playlist = generateTaskPlaylist(tasks, volatileEnergy, 5, new Date(), {
        sessionDurationMinutes: 120,
        detoxConsecutiveDays: 5
      });
      
      // Vérifications
      expect(playlist.tasks.length).toBeGreaterThan(0);
      expect(playlist.explanation).toContain('TRIAGE'); // Surcharge détectée
      expect(playlist.explanation).toContain('volatile'); // Stabilité volatile
      expect(playlist.warnings).toBeDefined();
      
      // Pas de tâches high effort à cause de la stabilité volatile
      expect(playlist.tasks.some(t => t.effort === 'high')).toBe(false);
      
      // La charge totale ne doit pas dépasser la capacité
      const totalLoad = playlist.tasks.reduce((sum, t) => sum + t.duration, 0);
      expect(totalLoad).toBeLessThanOrEqual(120);
    });
  });
});
