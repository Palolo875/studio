// Tests pour le sélecteur de tâches du Cerveau de KairuFlow - Phase 1

import { 
  filterEligibleTasks,
  injectQuickWin,
  checkDiversity,
  generateTaskPlaylist,
  applyFallback
} from '../selector';
import { Task } from '../types';

describe('selector', () => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

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
      title: 'Future Task',
      duration: 60,
      effort: 'low',
      urgency: 'low',
      impact: 'low',
      deadline: tomorrow,
      completionHistory: [],
      category: 'work'
    },
    {
      id: '4',
      title: 'No Deadline Task',
      duration: 20,
      effort: 'low',
      urgency: 'low',
      impact: 'low',
      completionHistory: [{ date: new Date(), actualDuration: 15, energy: { level: 'medium', stability: 'stable' } }],
      category: 'learning'
    },
    {
      id: '5',
      title: 'Quick Win Task',
      duration: 10,
      effort: 'low',
      urgency: 'low',
      impact: 'low',
      completionHistory: [],
      category: 'admin'
    }
  ];

  describe('filterEligibleTasks', () => {
    it('should filter tasks correctly based on deadlines', () => {
      const eligibleTasks = filterEligibleTasks(mockTasks, today);
      
      // Devrait inclure:
      // - Tâche en retard (id: '1')
      // - Tâche d'aujourd'hui (id: '2')
      // - Tâche sans deadline mais avec historique (id: '4')
      expect(eligibleTasks).toHaveLength(3);
      expect(eligibleTasks.map(t => t.id)).toContain('1');
      expect(eligibleTasks.map(t => t.id)).toContain('2');
      expect(eligibleTasks.map(t => t.id)).toContain('4');
    });

    it('should exclude future tasks without history', () => {
      const eligibleTasks = filterEligibleTasks(mockTasks, today);
      expect(eligibleTasks.map(t => t.id)).not.toContain('3');
    });
  });

  describe('injectQuickWin', () => {
    it('should inject a quick win task when available', () => {
      const playlist: Task[] = [];
      const quickWin = injectQuickWin(mockTasks, playlist);
      
      expect(quickWin).not.toBeNull();
      expect(quickWin?.id).toBe('5');
      expect(quickWin?.duration).toBeLessThanOrEqual(15);
      expect(quickWin?.effort).toBe('low');
    });

    it('should not inject quick win when already present in playlist', () => {
      const playlist: Task[] = [mockTasks[4]]; // Quick win task
      const quickWin = injectQuickWin(mockTasks, playlist);
      
      expect(quickWin).toBeNull();
    });

    it('should not inject quick win when maximum reached', () => {
      const playlist: Task[] = [mockTasks[4]]; // Quick win task
      const quickWin = injectQuickWin(mockTasks, playlist, 1);
      
      expect(quickWin).toBeNull();
    });
  });

  describe('checkDiversity', () => {
    it('should return true when diversity is sufficient', () => {
      const playlist = [mockTasks[0], mockTasks[1], mockTasks[3]]; // Différentes catégories
      const isDiverse = checkDiversity(playlist, 2);
      expect(isDiverse).toBe(true);
    });

    it('should return false when diversity is insufficient', () => {
      const playlist = [mockTasks[0], mockTasks[2]]; // Même catégorie 'work'
      const isDiverse = checkDiversity(playlist, 1);
      expect(isDiverse).toBe(false);
    });
  });

  describe('generateTaskPlaylist', () => {
    it('should generate a playlist with correct number of tasks', () => {
      const energy = { level: 'high', stability: 'stable' };
      const playlist = generateTaskPlaylist(mockTasks, energy, 3, today);
      
      expect(playlist.tasks).toHaveLength(3);
      expect(playlist.generatedAt).toBeDefined();
      expect(playlist.energyUsed).toEqual(energy);
    });

    it('should inject a quick win when available', () => {
      const energy = { level: 'high', stability: 'stable' };
      const playlist = generateTaskPlaylist(mockTasks, energy, 5, today);
      
      // Vérifier qu'une tâche quick win est présente
      const hasQuickWin = playlist.tasks.some(task => 
        task.duration <= 15 && task.effort === 'low'
      );
      expect(hasQuickWin).toBe(true);
    });

    it('should respect energy compatibility', () => {
      const energy = { level: 'low', stability: 'stable' };
      const playlist = generateTaskPlaylist(mockTasks, energy, 5, today);
      
      // Vérifier que toutes les tâches sont compatibles avec l'énergie faible
      const allCompatible = playlist.tasks.every(task => 
        task.effort === 'low'
      );
      expect(allCompatible).toBe(true);
    });
  });

  describe('applyFallback', () => {
    it('should apply low energy fallback correctly', () => {
      const energy = { level: 'low', stability: 'stable' };
      const playlist = applyFallback(mockTasks, energy, 'Test reason');
      
      expect(playlist.tasks).toHaveLength(1);
      expect(playlist.tasks[0].effort).toBe('low');
      expect(playlist.tasks[0].duration).toBeLessThanOrEqual(15);
      expect(playlist.warnings).toContain('Énergie basse détectée. Une seule tâche facile recommandée.');
    });

    it('should apply survival mode fallback for urgent tasks', () => {
      const energy = { level: 'high', stability: 'stable' };
      const urgentTasks = mockTasks.map(task => ({ ...task, urgency: 'urgent' }));
      const playlist = applyFallback(urgentTasks, energy, 'Test reason');
      
      expect(playlist.tasks).toHaveLength(3); // Limite à 3 tâches urgentes
      expect(playlist.warnings).toContain('Mode survie activé : Test reason');
    });

    it('should apply default fallback when no other fallback applies', () => {
      const energy = { level: 'medium', stability: 'stable' };
      const playlist = applyFallback([], energy, 'Test reason');
      
      expect(playlist.tasks).toHaveLength(0);
      expect(playlist.warnings).toContain('Impossible de générer une playlist : Test reason');
    });
  });
});