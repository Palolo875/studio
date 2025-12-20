/**
 * Tests pour le contrat de sortie NLP
 */

import { createTaskWithContract, createNLPContractResult } from '../NLPContract';

describe('NLPContract', () => {
  describe('createTaskWithContract', () => {
    it('devrait créer une tâche avec les garanties appropriées', () => {
      const baseTask = {
        id: 'test-1',
        action: 'appeler',
        object: 'Marc',
        deadline: 'demain 15h',
        effortHint: 'S' as const,
        rawText: 'Appeler Marc demain 15h',
        sentence: 'Appeler Marc demain 15h',
        confidence: 0.95,
        entities: { person: 'Marc', time: '15h' }
      };

      const guarantees = {
        inferred: false,
        decided: false,
        corrected: false,
        extracted: true,
        classified: true,
        confidence: 0.95
      };

      const taskWithContract = createTaskWithContract(baseTask, guarantees);

      expect(taskWithContract.id).toBe('test-1');
      expect(taskWithContract.action).toBe('appeler');
      expect(taskWithContract.metadata.guarantees).toEqual(guarantees);
      expect(taskWithContract.contractVersion).toBe('1.0.0');
    });
  });

  describe('createNLPContractResult', () => {
    it('devrait créer un résultat de contrat avec les métriques appropriées', () => {
      const task = createTaskWithContract(
        {
          id: 'test-1',
          action: 'appeler',
          object: 'Marc',
          deadline: 'demain 15h',
          effortHint: 'S' as const,
          rawText: 'Appeler Marc demain 15h',
          sentence: 'Appeler Marc demain 15h',
          confidence: 0.95,
          entities: { person: 'Marc', time: '15h' }
        },
        {
          inferred: false,
          decided: false,
          corrected: false,
          extracted: true,
          classified: true,
          confidence: 0.95
        }
      );

      const contractResult = createNLPContractResult([task]);

      expect(contractResult.tasks).toHaveLength(1);
      expect(contractResult.mode).toBe('NORMAL');
      expect(contractResult.contractVersion).toBe('1.0.0');
      expect(contractResult.metrics.totalTasks).toBe(1);
    });

    it('devrait détecter les tâches unknown et ambiguous', () => {
      const task1 = createTaskWithContract(
        {
          id: 'test-1',
          action: 'appeler',
          object: 'Marc',
          deadline: 'demain 15h',
          effortHint: 'S' as const,
          rawText: 'Appeler Marc demain 15h',
          sentence: 'Appeler Marc demain 15h',
          confidence: 0.95,
          entities: { person: 'Marc', time: '15h' }
        },
        {
          inferred: false,
          decided: false,
          corrected: false,
          extracted: true,
          classified: true,
          confidence: 0.95
        }
      );

      const task2 = createTaskWithContract(
        {
          id: 'test-2',
          action: '',
          object: '',
          deadline: null,
          effortHint: 'M' as const,
          rawText: 'xyz abc def',
          sentence: 'xyz abc def',
          confidence: 0.1,
          entities: {}
        },
        {
          inferred: false,
          decided: false,
          corrected: false,
          extracted: true,
          classified: false,
          confidence: 0.1
        },
        {
          unknown: true,
          ambiguous: true
        }
      );

      const contractResult = createNLPContractResult([task1, task2]);

      expect(contractResult.metrics.unknownRate).toBe(0.5);
      expect(contractResult.metrics.ambiguousRate).toBe(0.5);
      expect(contractResult.flags.unknown).toBe(true);
      expect(contractResult.flags.ambiguous).toBe(true);
    });
  });
});