/**
 * Initialisation du module NLP
 * Configure les écouteurs globaux et autres initialisations
 */
import { setupNlpListeners } from './globalListeners';

/**
 * Initialise le module NLP
 * Cette fonction doit être appelée une seule fois au démarrage de l'application
 */
export function initNlpModule() {
  // Configurer les écouteurs globaux
  setupNlpListeners();
  console.log('🚀 Module NLP initialisé');
}

// Initialisation automatique si nous sommes dans un environnement navigateur
if (typeof window !== 'undefined') {
  // Attendre que le DOM soit chargé
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNlpModule);
  } else {
    // DOM déjà chargé
    initNlpModule();
  }
}