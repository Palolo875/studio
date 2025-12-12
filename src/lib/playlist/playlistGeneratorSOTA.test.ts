/**
 * Tests pour le générateur de playlist SOTA
 */

import { PlaylistGeneratorSOTA, PlaylistTask } from './PlaylistGeneratorSOTA';

// Définition minimale des types pour les tests
interface Task {
  id: string;
  name?: string;
  tags?: string[];
  estimatedDuration?: number;
  effort?: string;
  completedAt?: string;
  lastAccessed?: string;
  completionRate?: number;
  energy?: number;
  deadline?: string;
  priority?: number;
}

interface KeystoneHabit {
  id: string;
  name: string;
  pattern: string;
  frequency: number;
  preferredDay?: number;
  preferredTime?: string;
  estimatedDuration: number;
  energyRequirement: 'low' | 'medium' | 'high';
}

interface MomentumData {
  taskId: string;
  completionSpeed: number;
  efficiencyScore: number;
  completionConsistency: number;
}

describe('PlaylistGeneratorSOTA', () => {
  let generator: PlaylistGeneratorSOTA;
  
  beforeEach(() => {
    generator = new PlaylistGeneratorSOTA();
  });

  describe('generatePlaylist', () => {
    it('devrait générer une playlist avec le bon nombre de tâches', () => {
      const tasks: Task[] = [
        { id: '1', name: 'Tâche 1' },
        { id: '2', name: 'Tâche 2' },
        { id: '3', name: 'Tâche 3' },
        { id: '4', name: 'Tâche 4' },
        { id: '5', name: 'Tâche 5' }
      ];

      const playlist = generator.generatePlaylist(tasks, 4);
      
      expect(playlist).toHaveLength(4);
      expect(playlist.every(task => task.score !== undefined)).toBe(true);
    });

    it('devrait trier les tâches par score décroissant', () => {
      // Créer un générateur avec des données spécifiques pour contrôler les scores
      const customGenerator = new PlaylistGeneratorSOTA([], [], new Map(), { energyLevel: 5 });
      
      const tasks: Task[] = [
        { id: '1', name: 'Tâche basse énergie', energy: 2 },
        { id: '2', name: 'Tâche moyenne énergie', energy: 5 },
        { id: '3', name: 'Tâche haute énergie', energy: 8 }
      ];

      const playlist = customGenerator.generatePlaylist(tasks);
      
      // Avec energyLevel = 5, la tâche avec energy = 5 devrait avoir le meilleur score
      expect(playlist[0].name).toContain('moyenne');
    });

    it('devrait exclure les tâches déjà achevées', () => {
      const tasks: Task[] = [
        { id: '1', name: 'Tâche achevée', completedAt: '2023-01-01' },
        { id: '2', name: 'Tâche en cours' },
        { id: '3', name: 'Autre tâche en cours' }
      ];

      const playlist = generator.generatePlaylist(tasks);
      
      expect(playlist).toHaveLength(2);
      expect(playlist.some(task => task.name?.includes('achevée'))).toBe(false);
    });
  });

  describe('calculateTaskScore', () => {
    it('devrait calculer un score basé sur tous les facteurs', () => {
      const task: Task = {
        id: 'test-1',
        name: 'Tâche de test',
        energy: 5,
        estimatedDuration: 60,
        priority: 3
      };

      // Accéder à la méthode privée via un cast (pour les tests uniquement)
      const generatorAsAny = generator as any;
      const playlistTask = generatorAsAny.calculateTaskScore(task) as PlaylistTask;
      
      expect(playlistTask.score).toBeGreaterThan(0);
      expect(playlistTask.factors.energy).toBeDefined();
      expect(playlistTask.factors.impact).toBeDefined();
      expect(playlistTask.factors.deadline).toBeDefined();
      expect(playlistTask.factors.effort).toBeDefined();
      expect(playlistTask.factors.pattern).toBeDefined();
    });

    it('devrait donner un score plus élevé aux tâches avec haute priorité', () => {
      const highPriorityTask: Task = {
        id: 'high-priority',
        name: 'Tâche haute priorité',
        priority: 5,
        energy: 5
      };

      const lowPriorityTask: Task = {
        id: 'low-priority',
        name: 'Tâche basse priorité',
        priority: 1,
        energy: 5
      };

      const generatorAsAny = generator as any;
      const highPriorityPlaylistTask = generatorAsAny.calculateTaskScore(highPriorityTask) as PlaylistTask;
      const lowPriorityPlaylistTask = generatorAsAny.calculateTaskScore(lowPriorityTask) as PlaylistTask;
      
      expect(highPriorityPlaylistTask.score).toBeGreaterThan(lowPriorityPlaylistTask.score);
    });
  });

  describe('ensureKeystoneHabit', () => {
    it('devrait ajouter une keystone habit si aucune n\'est présente', () => {
      const keystoneHabits: KeystoneHabit[] = [
        {
          id: 'deep-work',
          name: 'Deep Work',
          pattern: 'Travail concentré',
          frequency: 0.8,
          estimatedDuration: 90,
          energyRequirement: 'high'
        }
      ];

      const customGenerator = new PlaylistGeneratorSOTA([], keystoneHabits);
      
      const tasks: Task[] = [
        { id: '1', name: 'Tâche normale' },
        { id: '2', name: 'Autre tâche' }
      ];

      const playlist = customGenerator.generatePlaylist(tasks);
      
      // Devrait contenir la keystone habit
      expect(playlist.some(task => task.isKeystoneHabit)).toBe(true);
    });

    it('ne devrait pas ajouter de keystone habit si une est déjà présente', () => {
      const keystoneHabits: KeystoneHabit[] = [
        {
          id: 'deep-work',
          name: 'Deep Work',
          pattern: 'Travail concentré',
          frequency: 0.8,
          estimatedDuration: 90,
          energyRequirement: 'high'
        }
      ];

      const customGenerator = new PlaylistGeneratorSOTA([], keystoneHabits);
      
      const tasks: Task[] = [
        { id: '1', name: 'Tâche keystone', tags: ['deep work'] },
        { id: '2', name: 'Autre tâche' }
      ];

      const playlist = customGenerator.generatePlaylist(tasks);
      
      // Devrait y avoir exactement une keystone habit
      const keystoneHabitsInPlaylist = playlist.filter(task => task.isKeystoneHabit);
      expect(keystoneHabitsInPlaylist).toHaveLength(1);
      expect(keystoneHabitsInPlaylist[0].name).toBe('Tâche keystone');
    });
  });

  describe('calculateEnergyFactor', () => {
    it('devrait donner un score maximal quand l\'énergie correspond', () => {
      const customGenerator = new PlaylistGeneratorSOTA([], [], new Map(), { energyLevel: 7 });
      
      const task: Task = { id: 'test', name: 'Test', energy: 7 };
      
      const generatorAsAny = customGenerator as any;
      const energyFactor = generatorAsAny.calculateEnergyFactor(task);
      
      expect(energyFactor).toBeCloseTo(1.0, 2);
    });

    it('devrait donner un score plus bas quand l\'énergie ne correspond pas', () => {
      const customGenerator = new PlaylistGeneratorSOTA([], [], new Map(), { energyLevel: 3 });
      
      const task: Task = { id: 'test', name: 'Test', energy: 9 };
      
      const generatorAsAny = customGenerator as any;
      const energyFactor = generatorAsAny.calculateEnergyFactor(task);
      
      expect(energyFactor).toBeLessThan(0.5);
    });
  });

  describe('calculateDeadlineFactor', () => {
    it('devrait donner un score plus élevé pour les tâches urgentes', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1); // Demain
      
      const urgentTask: Task = {
        id: 'urgent',
        name: 'Tâche urgente',
        deadline: futureDate.toISOString(),
        priority: 5
      };

      const distantTask: Task = {
        id: 'distant',
        name: 'Tâche lointaine',
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Dans 30 jours
        priority: 3
      };

      const generatorAsAny = generator as any;
      const urgentFactor = generatorAsAny.calculateDeadlineFactor(urgentTask);
      const distantFactor = generatorAsAny.calculateDeadlineFactor(distantTask);
      
      expect(urgentFactor).toBeGreaterThan(distantFactor);
    });
  });
});