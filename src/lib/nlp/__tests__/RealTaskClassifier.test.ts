/**
 * Tests Phase 2: RealTaskClassifier
 */

import { classifyTask } from '../RealTaskClassifier';
import type { RawTaskWithContract } from '../NLPContract';

function makeRawTask(rawText: string): RawTaskWithContract {
  return {
    id: 't1',
    action: 'write',
    object: 'report',
    deadline: null,
    effortHint: 'M',
    rawText,
    sentence: rawText,
    confidence: 0.9,
    entities: {},
    metadata: {
      detectedLang: 'en',
      energyConfidence: 0,
      urgency: 0,
      rawAction: 'write',
      rawSentence: rawText,
      processingSteps: [],
      skippedSteps: [],
      guarantees: {
        inferred: false,
        decided: false,
        corrected: false,
        extracted: true,
        classified: false,
        confidence: 0.9,
      },
      flags: {},
    },
    contractVersion: '1.0.0',
  };
}

describe('RealTaskClassifier', () => {
  it('should mark classification unknown when confidence is below 0.7 (Phase 2 rule)', async () => {
    // Fallback classifier normalizes scores across ENERGY_LABELS (5 labels),
    // so even a strong match like 0.8 becomes < 0.7 after normalization.
    const rawTask = makeRawTask('write report');

    const result = await classifyTask(rawTask);

    expect(result.isUncertain).toBe(true);
    expect(result.unknown).toBe(true);
  });
});
