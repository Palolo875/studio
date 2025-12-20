/**
 * Tests pour l'analyseur de cohésion
 */

import { CohesionAnalyzer } from '../CohesionAnalyzer';

describe('CohesionAnalyzer', () => {
  let cohesionAnalyzer: CohesionAnalyzer;

  beforeEach(() => {
    cohesionAnalyzer = new CohesionAnalyzer({
      minCohesionThreshold: 0.7,
      enableEmotionalWeight: true,
      enableTemporalProximity: true,
      enableSemanticSimilarity: true
    });
  });

  describe('analyzeCohesion', () => {
    it('devrait détecter une forte cohésion entre tâches avec objet partagé', () => {
      const task1 = {
        action: 'appeler',
        object: 'Marc',
        rawText: 'Appeler Marc demain',
        sentence: 'Appeler Marc demain',
        entities: { person: 'Marc' },
        tags: ['call', 'Marc'],
        deadline: 'demain'
      };

      const task2 = {
        action: 'envoyer',
        object: 'Marc',
        rawText: 'Envoyer email à Marc',
        sentence: 'Envoyer email à Marc',
        entities: { person: 'Marc' },
        tags: ['send', 'Marc'],
        deadline: 'demain'
      };

      const cohesion = cohesionAnalyzer.analyzeCohesion(task1, task2);

      expect(cohesion.sharedObject).toBe(true);
      expect(cohesion.sharedContext).toBe(true);
      expect(cohesion.score).toBeGreaterThan(0.5);
    });

    it('devrait détecter une faible cohésion entre tâches sans lien', () => {
      const task1 = {
        action: 'appeler',
        object: 'Marc',
        rawText: 'Appeler Marc demain',
        sentence: 'Appeler Marc demain'
      };

      const task2 = {
        action: 'acheter',
        object: 'pommes',
        rawText: 'Acheter des pommes',
        sentence: 'Acheter des pommes'
      };

      const cohesion = cohesionAnalyzer.analyzeCohesion(task1, task2);

      expect(cohesion.sharedObject).toBe(false);
      expect(cohesion.score).toBeLessThan(0.5);
    });
  });

  describe('shouldSplitTask', () => {
    it('devrait retourner false pour une seule sous-tâche', () => {
      const compoundTask = {
        action: 'préparer',
        object: 'présentation',
        rawText: 'Préparer présentation',
        sentence: 'Préparer présentation'
      };

      const result = cohesionAnalyzer.shouldSplitTask(compoundTask, [compoundTask]);
      expect(result).toBe(false);
    });

    it('devrait diviser les tâches avec forte cohésion', () => {
      const compoundTask = {
        action: 'préparer',
        object: 'réunion',
        rawText: 'Préparer réunion et envoyer agenda',
        sentence: 'Préparer réunion et envoyer agenda'
      };

      const subTasks = [
        {
          action: 'préparer',
          object: 'réunion',
          rawText: 'Préparer réunion',
          sentence: 'Préparer réunion'
        },
        {
          action: 'envoyer',
          object: 'agenda',
          rawText: 'envoyer agenda',
          sentence: 'envoyer agenda'
        }
      ];

      // Configurer un seuil bas pour forcer le découpage
      cohesionAnalyzer.updateConfig({ minCohesionThreshold: 0.1 });
      const result = cohesionAnalyzer.shouldSplitTask(compoundTask, subTasks);
      expect(result).toBe(true);
    });
  });
});