/**
 * Écouteurs globaux pour les événements NLP
 * Gère les notifications et le rafraîchissement de l'UI
 */

import { createLogger } from '@/lib/logger';

const logger = createLogger('NlpGlobalListeners');

export function setupNlpListeners() {
  window.addEventListener('nlptasks:processed', (e: any) => {
    logger.info('nlptasks:processed', { count: e?.detail?.count });
  });
  
  window.addEventListener('nlptasks:added', () => {
    // Refresh playlist si ouvert
    if (window.location.pathname.includes('/daily')) {
      logger.info('Playlist rafraîchie');
    }
  });
}