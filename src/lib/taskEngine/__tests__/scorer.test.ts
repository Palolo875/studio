// Tests pour le système de scoring du Cerveau de KairuFlow - Phase 1

import { 
  calculateEnergyAlignmentScore,
  calculateUrgencyScore,
  calculateImpactScore,
  calculateEffortBalanceScore,
  calculateBehavioralPatternScore,
  calculateDiversityScore,
  calculateTaskScore,
  sortTasksByScore
} from '../scorer';
import { Task, CompletionRecord } from '../types';

describe('scorer', () => {
  const mockTask: Task = {
    id: '1',
    title: 'Test Task',
    duration: 30,
    effort: 'medium',
    urgency: 'medium',
    impact: 'medium',
    completionHistory: [],
    category: 'test'
  };

  const mockCompletionRecord: CompletionRecord = {
    date: new Date(),
    actualDuration: 25,
    energy: { level: 'medium', stability: 'stable' }
  };

  describe('calculateEnergyAlignmentScore', () => {
    it('should return high score for compatible task with stable energy', () => {
      const energy = { level: 'high', stability: 'stable' };
      const task: Task = { ...mockTask, effort: 'high' };
      const score = calculateEnergyAlignmentScore(task, energy);
      expect(score).toBeCloseTo(0.9);
    });

    it('should return low score for incompatible task', () => {
      const energy = { level: 'low', stability: 'stable' };
      const task: Task = { ...mockTask, effort: 'high' };
      const score = calculateEnergyAlignmentScore(task, energy);
      expect(score).toBeCloseTo(0.1);
    });

    it('should return medium score for compatible task with volatile energy', () => {
      const energy = { level: 'medium', stability: 'volatile' };
      const task: Task = { ...mockTask, effort: 'medium' };
      const score = calculateEnergyAlignmentScore(task, energy);
      expect(score).toBeCloseTo(0.7);
    });
  });

  describe('calculateUrgencyScore', () => {
    it('should return 1.0 for urgent tasks', () => {
      const task: Task = { ...mockTask, urgency: 'urgent' };
      const score = calculateUrgencyScore(task);
      expect(score).toBe(1.0);
    });

    it('should return 0.5 for medium urgency tasks', () => {
      const task: Task = { ...mockTask, urgency: 'medium' };
      const score = calculateUrgencyScore(task);
      expect(score).toBe(0.5);
    });

    it('should return 0.2 for low urgency tasks', () => {
      const task: Task = { ...mockTask, urgency: 'low' };
      const score = calculateUrgencyScore(task);
      expect(score).toBe(0.2);
    });
  });

  describe('calculateImpactScore', () => {
    it('should return 1.0 for high impact tasks', () => {
      const task: Task = { ...mockTask, impact: 'high' };
      const score = calculateImpactScore(task);
      expect(score).toBe(1.0);
    });

    it('should return 0.6 for medium impact tasks', () => {
      const task: Task = { ...mockTask, impact: 'medium' };
      const score = calculateImpactScore(task);
      expect(score).toBe(0.6);
    });

    it('should return 0.3 for low impact tasks', () => {
      const task: Task = { ...mockTask, impact: 'low' };
      const score = calculateImpactScore(task);
      expect(score).toBe(0.3);
    });
  });

  describe('calculateEffortBalanceScore', () => {
    it('should return high score for good effort/impact balance', () => {
      const task: Task = { ...mockTask, effort: 'low', impact: 'high' };
      const score = calculateEffortBalanceScore(task);
      // Ratio = 3/1 = 3, normalisé = min(1, 3/3) = 1
      expect(score).toBe(1);
    });

    it('should return low score for poor effort/impact balance', () => {
      const task: Task = { ...mockTask, effort: 'high', impact: 'low' };
      const score = calculateEffortBalanceScore(task);
      // Ratio = 1/3 ≈ 0.33, normalisé = min(1, 0.33/3) ≈ 0.11
      expect(score).toBeCloseTo(0.11, 2);
    });
  });

  describe('calculateBehavioralPatternScore', () => {
    it('should return 0.5 for tasks with no history', () => {
      const task: Task = { ...mockTask, completionHistory: [] };
      const score = calculateBehavioralPatternScore(task);
      expect(score).toBe(0.5);
    });

    it('should return high score for tasks completed faster than planned', () => {
      const task: Task = { 
        ...mockTask, 
        duration: 30,
        completionHistory: [{ ...mockCompletionRecord, actualDuration: 20 }]
      };
      const score = calculateBehavioralPatternScore(task);
      expect(score).toBe(0.9);
    });

    it('should return low score for tasks taking longer than planned', () => {
      const task: Task = { 
        ...mockTask, 
        duration: 30,
        completionHistory: [{ ...mockCompletionRecord, actualDuration: 40 }]
      };
      const score = calculateBehavioralPatternScore(task);
      expect(score).toBe(0.3);
    });
  });

  describe('calculateDiversityScore', () => {
    it('should return 1.0 when no recent tasks', () => {
      const score = calculateDiversityScore(mockTask, []);
      expect(score).toBe(1.0);
    });

    it('should return low score when recent tasks have same category', () => {
      const recentTasks: Task[] = [
        { ...mockTask, id: '2', category: 'test' },
        { ...mockTask, id: '3', category: 'test' }
      ];
      const score = calculateDiversityScore(mockTask, recentTasks);
      expect(score).toBe(0.1); // 1 - (2/2) = 0, avec plancher à 0.1
    });

    it('should return high score when recent tasks have different categories', () => {
      const recentTasks: Task[] = [
        { ...mockTask, id: '2', category: 'other1' },
        { ...mockTask, id: '3', category: 'other2' }
      ];
      const score = calculateDiversityScore(mockTask, recentTasks);
      expect(score).toBe(1.0); // 1 - (0/2) = 1
    });
  });

  describe('calculateTaskScore', () => {
    it('should calculate total score correctly using canonical formula', () => {
      const energy = { level: 'high', stability: 'stable' };
      const task: Task = { 
        ...mockTask, 
        effort: 'medium',
        urgency: 'high',
        impact: 'medium',
        completionHistory: [{ ...mockCompletionRecord, actualDuration: 25 }]
      };
      
      const score = calculateTaskScore(task, energy);
      
      // Vérifier la structure du résultat
      expect(score.task).toBe(task);
      expect(score.totalScore).toBeGreaterThan(0);
      expect(score.totalScore).toBeLessThanOrEqual(1);
      expect(score.confidence).toBe(0.9);
      
      // Vérifier les composants du score
      expect(score.breakdown).toHaveProperty('energyAlignment');
      expect(score.breakdown).toHaveProperty('urgency');
      expect(score.breakdown).toHaveProperty('impact');
      expect(score.breakdown).toHaveProperty('effortBalance');
      expect(score.breakdown).toHaveProperty('behavioralPattern');
      expect(score.breakdown).toHaveProperty('diversity');
    });
  });

  describe('sortTasksByScore', () => {
    it('should sort tasks by score in descending order', () => {
      const taskScores = [
        { task: mockTask, totalScore: 0.5, breakdown: {}, confidence: 0.9 },
        { task: { ...mockTask, id: '2' }, totalScore: 0.8, breakdown: {}, confidence: 0.9 },
        { task: { ...mockTask, id: '3' }, totalScore: 0.3, breakdown: {}, confidence: 0.9 }
      ];
      
      const sorted = sortTasksByScore(taskScores);
      
      expect(sorted[0].totalScore).toBe(0.8);
      expect(sorted[1].totalScore).toBe(0.5);
      expect(sorted[2].totalScore).toBe(0.3);
    });
  });
});