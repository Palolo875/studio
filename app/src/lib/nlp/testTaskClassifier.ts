/**
 * Tests pour le classificateur de tâches mmBERT
 */
import { classifyTask, initClassifier } from './TaskClassifier';

// Exemple de tâche brute pour les tests
const mockRawTask = {
  id: 'test-task',
  action: 'appeler',
  object: 'client pour feedback',
  deadline: 'demain',
  effortHint: 'M',
  rawText: "Penser à appeler le client pour le feedback demain, c'est urgent",
  sentence: "Penser à appeler le client pour le feedback demain",
  confidence: 0.9,
  entities: { person: 'client' }
};

async function runTest() {
  try {
    console.log('--- Démarrage des tests du TaskClassifier ---');

    // Test 1: Initialisation du classificateur
    console.log('Test 1: Initialisation du classificateur...');
    await initClassifier();
    console.log('Test 1: Succès');

    // Test 2: Classification d'une tâche
    console.log('Test 2: Classification d\'une tâche...');
    const classification = await classifyTask(mockRawTask);

    console.log('Résultat de la classification :', classification);
    
    // Vérifications
    if (
      classification.energyType && 
      classification.effort &&
      classification.urgency > 0
    ) {
      console.log('Test 2: Succès');
    } else {
      console.error('Test 2: Échec - Classification incomplète');
    }

    console.log('--- Tests du TaskClassifier terminés ---');
  } catch (error) {
    console.error('Erreur lors des tests du TaskClassifier :', error);
  }
}

// Lancer les tests
runTest();
