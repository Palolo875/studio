/**
 * Tests pour l'extracteur de tâches SOTA (State-of-the-Art)
 */
import { extractTasks } from './TaskExtractor';

// Phrases de test
const TEST_PHRASES = [
  // Cas simples
  "Appeler Marc demain 15h",
  "Écrire le rapport pour le projet Alpha",
  "Envoyer un email à Sophie avant la fin de la journée",

  // Cas complexes
  "Préparer la présentation pour la réunion de mardi et réserver une salle",
  "Penser à acheter du lait en rentrant, puis faire la vaisselle",

  // Cas avec entités nommées
  "Discuter du budget avec Jean-Pierre la semaine prochaine",
  "Finaliser le document 'Spécifications v2' pour le client ACME",

  // Cas multilingues
  "Call John about the Q3 report",
  "Enviar el borrador a María antes del viernes",

  // Cas sans action claire
  "Réunion demain matin à 9h",
  "Le projet X est en retard"
];

// Fonction pour exécuter les tests
export function runTaskExtractorTests() {
  console.log("--- Démarrage des tests du TaskExtractor SOTA ---");

  TEST_PHRASES.forEach((phrase, index) => {
    console.log(`\n[Test ${index + 1}] Phrase: "${phrase}"`);
    
    try {
      const tasks = extractTasks(phrase);
      
      if (tasks.length > 0) {
        console.log(`  ✅ ${tasks.length} tâche(s) extraite(s):`);
        tasks.forEach((task, i) => {
          console.log(`    - Tâche ${i + 1}:`);
          console.log(`      Action: ${task.action}`);
          console.log(`      Objet: ${task.object}`);
          console.log(`      Deadline: ${task.deadline || 'N/A'}`);
          console.log(`      Effort: ${task.effortHint}`);
          console.log(`      Confiance: ${(task.confidence * 100).toFixed(1)}%`);
          console.log(`      Entités: ${JSON.stringify(task.entities)}`);
        });
      } else {
        console.log("  ⚠️ Aucune tâche claire extraite (comportement attendu pour certaines phrases).");
      }
    } catch (error) {
      console.error(`  ❌ Erreur lors de l'extraction:`, error);
    }
  });

  console.log("\n--- Tests du TaskExtractor terminés ---");
}
