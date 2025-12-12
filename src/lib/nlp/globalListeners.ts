/**
 * Écouteurs globaux pour les événements NLP
 * Gère les notifications et le rafraîchissement de l'UI
 */

// Simulation de la fonction toast
const toast = {
  success: (message: string) => console.log('Toast success:', message),
  error: (message: string) => console.log('Toast error:', message)
};

// Simulation de la fonction de rafraîchissement de la playlist
const refreshPlaylist = () => {
  console.log('Playlist rafraîchie');
};

export function setupNlpListeners() {
  window.addEventListener('nlptasks:processed', (e: any) => {
    toast.success(`${e.detail.count} tâches créées par IA ! ✨`);
  });
  
  window.addEventListener('nlptasks:added', () => {
    // Refresh playlist si ouvert
    if (window.location.pathname.includes('/daily')) {
      refreshPlaylist();
    }
  });
}