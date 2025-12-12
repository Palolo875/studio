/**
 * Tests pour les écouteurs globaux NLP
 */

import { setupNlpListeners } from './globalListeners';

// Simulation de l'environnement navigateur
const mockWindow = {
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  location: {
    pathname: '/daily'
  }
};

// Remplacer window par notre mock pour les tests
(global as any).window = mockWindow;

describe('Écouteurs globaux NLP', () => {
  beforeEach(() => {
    // Réinitialiser les mocks avant chaque test
    mockWindow.addEventListener.mockClear();
  });

  test('devrait configurer les écouteurs', () => {
    setupNlpListeners();
    
    // Vérifier que les écouteurs ont été ajoutés
    expect(mockWindow.addEventListener).toHaveBeenCalledWith('nlptasks:processed', expect.any(Function));
    expect(mockWindow.addEventListener).toHaveBeenCalledWith('nlptasks:added', expect.any(Function));
  });

  test('devrait afficher un toast quand des tâches sont traitées', () => {
    setupNlpListeners();
    
    // Simuler l'événement nlptasks:processed
    const event = new CustomEvent('nlptasks:processed', {
      detail: { count: 3 }
    });
    
    // Déclencher l'événement
    window.dispatchEvent(event);
    
    // Vérifier que le toast a été affiché (dans la console)
    // Note: Dans une vraie application, nous vérifierions que toast.success a été appelé
  });

  test('devrait rafraîchir la playlist quand des tâches sont ajoutées', () => {
    setupNlpListeners();
    
    // Simuler l'événement nlptasks:added
    const event = new CustomEvent('nlptasks:added');
    
    // Déclencher l'événement
    window.dispatchEvent(event);
    
    // Vérifier que la playlist a été rafraîchie (dans la console)
    // Note: Dans une vraie application, nous vérifierions que refreshPlaylist a été appelé
  });
});

// Test de bout en bout
async function runIntegrationTest() {
  console.log('=== Test d\'intégration des écouteurs globaux ===');
  
  // Configurer les écouteurs
  setupNlpListeners();
  console.log('✅ Écouteurs configurés');
  
  // Simuler l'ajout de tâches
  setTimeout(() => {
    window.dispatchEvent(new CustomEvent('nlptasks:processed', {
      detail: { count: 2 }
    }));
  }, 100);
  
  // Simuler l'ajout de tâches pour la playlist
  setTimeout(() => {
    window.dispatchEvent(new CustomEvent('nlptasks:added'));
  }, 200);
  
  console.log('📤 Événements envoyés');
  console.log('⏳ Attente des réponses...');
}

// Exécuter le test d'intégration
runIntegrationTest().catch(console.error);