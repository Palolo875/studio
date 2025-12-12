/**
 * Écouteurs globaux pour les événements NLP
 * Gère les notifications et le rafraîchissement de l'UI
 */

// Variable pour stocker si les écouteurs ont été configurés
let listenersSetup = false;

/**
 * Configure les écouteurs globaux pour les événements NLP
 */
export function setupNlpListeners() {
  // Empêcher la configuration multiple
  if (listenersSetup) {
    console.warn('Les écouteurs NLP sont déjà configurés');
    return;
  }

  // Écouteur pour les tâches NLP traitées
  window.addEventListener('nlptasks:processed', (e: any) => {
    const detail = e.detail || {};
    const count = detail.count || 0;
    
    // Afficher une notification de succès
    console.log(`✅ ${count} tâches créées par IA !`);
    
    // Dans une vraie application, vous pourriez utiliser un système de toast
    // toast.success(`${count} tâches créées par IA ! ✨`);
  });
  
  // Écouteur pour les tâches NLP ajoutées
  window.addEventListener('nlptasks:added', () => {
    // Rafraîchir la playlist si la page quotidienne est ouverte
    if (typeof window !== 'undefined' && window.location) {
      if (window.location.pathname.includes('/daily')) {
        console.log('🔄 Rafraîchissement de la playlist quotidienne');
        // refreshPlaylist();
      }
    }
  });
  
  // Marquer les écouteurs comme configurés
  listenersSetup = true;
  
  console.log('🎧 Écouteurs NLP configurés');
}

/**
 * Simule le rafraîchissement de la playlist
 */
export function refreshPlaylist() {
  console.log('🔄 Rafraîchissement de la playlist');
  // Dans une vraie implémentation, cela déclencherait un rechargement
  // des données de la playlist via le store Zustand ou un appel API
}

/**
 * Nettoie les écouteurs globaux (pour le développement/hot-reloading)
 */
export function cleanupNlpListeners() {
  if (!listenersSetup) return;
  
  window.removeEventListener('nlptasks:processed', () => {});
  window.removeEventListener('nlptasks:added', () => {});
  
  listenersSetup = false;
  console.log('🧹 Écouteurs NLP nettoyés');
}

// Configuration automatique lors de l'import (si dans un environnement navigateur)
if (typeof window !== 'undefined') {
  // Petit délai pour s'assurer que le DOM est prêt
  setTimeout(() => {
    setupNlpListeners();
  }, 0);
}