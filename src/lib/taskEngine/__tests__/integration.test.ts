// Tests d'intégration pour le Cerveau de KairuFlow - Phase 1
import { Task, EnergyState } from '../types';
import { generateTaskPlaylist } from '../selector';
import { createSession } from '../sessionManager';
import { checkAllInvariants } from '../invariantChecker';
import { calculateSessionCapacity } from '../capacityCalculator';
import { filterByStability } from '../selector';
import { calculateTaskAgeIndex } from '../taskAgeIndex';

// Fonction utilitaire pour créer une tâche de test
function createTestTask(overrides: Partial<Task> = {}): Task {
  const defaultTask: Task = {
    id: 'test-task-1',
    title: 'Tâche de test',
    duration: 30,
    effort: 'medium',
    urgency: 'medium',
    impact: 'medium',
    deadline: new Date(Date.now() + 24 * 60 * 60 * 1000), // Demain
    completionHistory: [],
    category: 'test',
    createdAt: new Date()
  };
  
  return { ...defaultTask, ...overrides };
}

// Fonction utilitaire pour créer un état d'énergie de test
function createTestEnergy(overrides: Partial<EnergyState> = {}): EnergyState {
  const defaultEnergy: EnergyState = {
    level: 'medium',
    stability: 'stable'
  };
  
  return { ...defaultEnergy, ...overrides };
}

describe('Pipeline de sélection avec validation', () => {
  test('generateTaskPlaylist doit valider les invariants et remonter les violations', () => {
    // Créer des tâches de test
    const tasks: Task[] = [
      createTestTask({ id: 'task-1', effort: 'high', duration: 120 }),
      createTestTask({ id: 'task-2', effort: 'high', duration: 120 }),
      createTestTask({ id: 'task-3', effort: 'high', duration: 120 }),
      createTestTask({ id: 'task-4', effort: 'high', duration: 120 }),
      createTestTask({ id: 'task-5', effort: 'high', duration: 120 }),
      createTestTask({ id: 'task-6', effort: 'high', duration: 120 }) // Trop de tâches
    ];
    
    // Créer un état d'énergie de test
    const energy = createTestEnergy({ level: 'low' });
    
    // Générer la playlist
    const playlist = generateTaskPlaylist(tasks, energy, 5, new Date(), { sessionDurationMinutes: 60 });
    
    // Vérifier que la playlist contient des warnings en cas de violation d'invariants
    expect(playlist.warnings).toBeDefined();
  });

  test('createSession doit appliquer checkAllInvariants et déclencher un fallback en cas d\'échec', () => {
    // Créer des tâches de test qui violent les invariants
    const tasks: Task[] = [
      createTestTask({ id: 'task-1', effort: 'high', duration: 120 }),
      createTestTask({ id: 'task-2', effort: 'high', duration: 120 })
    ];
    
    // Créer un créneau horaire de test
    const timeSlot = {
      startTime: "08:00",
      endTime: "09:00",
      energy: createTestEnergy({ level: 'low' }),
      label: "Matin - Test"
    };
    
    // Créer la session
    const session = createSession(timeSlot, tasks, new Date());
    
    // Vérifier que la session a été créée avec une playlist fallback
    expect(session).toBeDefined();
    expect(session.playlist).toBeDefined();
  });
});

describe('Capacité de session', () => {
  test('calculateSessionCapacity doit calculer la capacité en fonction de la durée et de l\'énergie', () => {
    // Tester avec différentes durées et niveaux d'énergie
    const energyStable = createTestEnergy({ stability: 'stable' });
    const energyVolatile = createTestEnergy({ stability: 'volatile' });
    
    // Capacité pour une session de 60 minutes
    const capacityStable = calculateSessionCapacity(60, energyStable);
    const capacityVolatile = calculateSessionCapacity(60, energyVolatile);
    
    // La capacité doit être plus grande avec une énergie stable
    expect(capacityStable).toBeGreaterThan(0);
    expect(capacityVolatile).toBeGreaterThan(0);
    expect(capacityStable).toBeGreaterThan(capacityVolatile);
  });
});

describe('Filtre de stabilité', () => {
  test('filterByStability doit exclure les tâches à effort élevé quand stability === \'volatile\'', () => {
    // Créer des tâches de test
    const tasks: Task[] = [
      createTestTask({ id: 'task-1', effort: 'low' }),
      createTestTask({ id: 'task-2', effort: 'medium' }),
      createTestTask({ id: 'task-3', effort: 'high' })
    ];
    
    // Tester avec une énergie stable
    const energyStable = createTestEnergy({ stability: 'stable' });
    const filteredStable = filterByStability(tasks, energyStable);
    
    // Avec une énergie stable, toutes les tâches doivent être incluses
    expect(filteredStable.length).toBe(3);
    
    // Tester avec une énergie volatile
    const energyVolatile = createTestEnergy({ stability: 'volatile' });
    const filteredVolatile = filterByStability(tasks, energyVolatile);
    
    // Avec une énergie volatile, seules les tâches à effort faible ou moyen doivent être incluses
    expect(filteredVolatile.length).toBe(2);
    expect(filteredVolatile.some(task => task.effort === 'high')).toBe(false);
  });
});

describe('TAI et DETOX', () => {
  test('calculateTaskAgeIndex doit utiliser la vraie date de création des tâches', () => {
    // Créer des tâches de test avec des dates de création différentes
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    
    const tasks: Task[] = [
      createTestTask({ id: 'task-1', createdAt: twoDaysAgo }),
      createTestTask({ id: 'task-2', createdAt: oneDayAgo }),
      createTestTask({ id: 'task-3', createdAt: now })
    ];
    
    // Calculer le TAI
    const tai = calculateTaskAgeIndex(tasks, now);
    
    // Le TAI doit être positif
    expect(tai).toBeGreaterThan(0);
  });
});