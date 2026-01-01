/**
 * Tests Phase 2: LanguageDetector
 */

import { LanguageDetector } from '../LanguageDetector';

describe('LanguageDetector', () => {
  it('should fallback to UI language with low confidence when text is too short', () => {
    const result = LanguageDetector.detect('Rapport', 'fr');

    expect(result.lang).toBe('fr');
    expect(result.confidence).toBe(0.3);
    expect(result.reason).toBe('too_short');
  });
});
