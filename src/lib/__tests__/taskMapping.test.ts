/**
 * Non-regression: taskMapping should roundtrip nlpHints between DBTask and UI Task
 */

import { describe, it, expect } from 'vitest';
import { dbTaskToUiTask, uiTaskToDbTask } from '../taskMapping';
import type { DBTask } from '../database';

describe('taskMapping', () => {
  it('should map nlpHints DBTask <-> UI Task', () => {
    const now = new Date();

    const dbTask: DBTask = {
      id: 't1',
      title: 'Appeler Marc',
      description: 'desc',
      nlpHints: {
        detectedLang: 'fr',
        confidence: 0.5,
        isUncertain: true,
        rawText: 'Appeler Marc',
        energySuggestion: 'relationnel',
        effortSuggestion: 'M',
      },
      duration: 30,
      effort: 'medium',
      urgency: 'medium',
      impact: 'medium',
      deadline: undefined,
      scheduledTime: undefined,
      category: 'capture',
      status: 'todo',
      activationCount: 0,
      lastActivated: now,
      createdAt: now,
      updatedAt: now,
      completedAt: undefined,
      tags: ['x'],
    };

    const ui = dbTaskToUiTask(dbTask);
    expect(ui.nlpHints?.rawText).toBe('Appeler Marc');
    expect(ui.nlpHints?.isUncertain).toBe(true);

    const db2 = uiTaskToDbTask(ui, now);
    expect(db2.nlpHints?.rawText).toBe('Appeler Marc');
    expect(db2.nlpHints?.energySuggestion).toBe('relationnel');
  });
});
