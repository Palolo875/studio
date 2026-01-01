/**
 * Tests Phase 2: TaskFactory conservative merge
 */

import { createFullTask } from '../TaskFactory';
import type { RawTaskWithContract } from '../NLPContract';

describe('TaskFactory', () => {
  it('should create neutral DBTask values when classification is uncertain/unknown', () => {
    const rawTask: RawTaskWithContract = {
      id: 't1',
      action: 'appeler',
      object: 'Marc',
      deadline: null,
      effortHint: 'M',
      rawText: 'Appeler Marc',
      sentence: 'Appeler Marc',
      confidence: 0.8,
      entities: {},
      metadata: {
        detectedLang: 'fr',
        energyConfidence: 0,
        urgency: 0,
        rawAction: 'appeler',
        rawSentence: 'Appeler Marc',
        processingSteps: [],
        skippedSteps: [],
        guarantees: {
          inferred: false,
          decided: false,
          corrected: false,
          extracted: true,
          classified: false,
          confidence: 0.8,
        },
        flags: {},
      },
      contractVersion: '1.0.0',
    };

    const task = createFullTask(rawTask, {
      energyType: 'creative',
      energyConfidence: 0.2,
      effort: 'L',
      effortConfidence: 0.2,
      sentiment: 'neutral',
      urgency: 1,
      autoTags: ['x'],
      isUncertain: true,
      unknown: true,
    });

    expect(task.duration).toBe(30);
    expect(task.effort).toBe('medium');
    expect(task.urgency).toBe('medium');
    expect(task.category).toBe('capture');

    expect(task.nlpHints).toBeDefined();
    expect(task.nlpHints?.rawText).toBe('Appeler Marc');
    expect(task.nlpHints?.isUncertain).toBe(true);
  });
});
