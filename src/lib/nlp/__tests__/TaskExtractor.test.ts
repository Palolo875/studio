/**
 * Tests Phase 2: TaskExtractor (capteur structurant)
 */

import { describe, it, expect } from 'vitest';
import { extractTasks } from '../TaskExtractor';

describe('TaskExtractor', () => {
  it('should return empty array on empty input', () => {
    expect(extractTasks('')).toEqual([]);
    expect(extractTasks('   ')).toEqual([]);
  });

  it('should split compound tasks into multiple RawTasks', () => {
    const tasks = extractTasks('Appeler Marc et écrire le rapport', 'fr');

    expect(tasks.length).toBeGreaterThanOrEqual(2);
    expect(tasks.some((t) => t.action === 'appeler')).toBe(true);
    expect(tasks.some((t) => t.action === 'écrire')).toBe(true);
    expect(tasks.some((t) => t.metadata.flags?.split_from_compound)).toBe(true);
  });

  it('should handle emojis/urls without throwing and keep max 5 tasks', () => {
    const tasks = extractTasks('📧 Envoyer email à john@example.com puis appeler Marc. https://example.com', 'fr');

    expect(tasks.length).toBeLessThanOrEqual(5);
  });
});
