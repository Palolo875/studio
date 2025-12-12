import { extractTasks } from './TaskExtractor';

/**
 * Tests pour l'extracteur de tâches SOTA
 */
function runTests() {
  console.log('=== Tests de l\'Extracteur de Tâches SOTA ===');
  
  // Test français
  console.log('\n--- Test français ---');
  const frenchText = "Appeler Marc demain 15h urgent, écrire rapport Q4 2h";
  const frenchTasks = extractTasks(frenchText, 'fr');
  console.log(`Texte: "${frenchText}"`);
  console.log('Tâches extraites:', frenchTasks);
  
  // Test anglais
  console.log('\n--- Test anglais ---');
  const englishText = "Call John tomorrow at 3pm urgent, write Q4 report 2h";
  const englishTasks = extractTasks(englishText, 'en');
  console.log(`Texte: "${englishText}"`);
  console.log('Tâches extraites:', englishTasks);
  
  // Test espagnol
  console.log('\n--- Test espagnol ---');
  const spanishText = "Llamar a Juan mañana a las 3pm urgente, escribir informe T4 2h";
  const spanishTasks = extractTasks(spanishText, 'es');
  console.log(`Texte: "${spanishText}"`);
  console.log('Tâches extraites:', spanishTasks);
  
  // Test avec plusieurs phrases
  console.log('\n--- Test plusieurs phrases ---');
  const multiSentenceText = "Préparer présentation lundi. Envoyer email à l'équipe. Terminer rapport annuel.";
  const multiTasks = extractTasks(multiSentenceText, 'fr');
  console.log(`Texte: "${multiSentenceText}"`);
  console.log('Tâches extraites:', multiTasks);
  
  // Test avec des indices d'effort
  console.log('\n--- Test indices d\'effort ---');
  const effortText = "Envoyer email rapide, Préparer présentation 2h, Développer nouveau module complexe";
  const effortTasks = extractTasks(effortText, 'fr');
  console.log(`Texte: "${effortText}"`);
  console.log('Tâches extraites:', effortTasks);
  
  // Test avec texte vide
  console.log('\n--- Test texte vide ---');
  const emptyTasks = extractTasks('', 'fr');
  console.log('Tâches extraites (texte vide):', emptyTasks);
  
  // Test avec texte long
  console.log('\n--- Test texte long ---');
  const longText = "Organiser réunion d'équipe mardi matin pour discuter du projet prioritaire. Préparer les documents nécessaires et envoyer les invitations à tous les participants. Après la réunion, écrire le compte rendu détaillé et le partager avec la direction.";
  const longTasks = extractTasks(longText, 'fr');
  console.log(`Texte long (${longText.length} caractères)`);
  console.log('Tâches extraites:', longTasks);
  
  // Test avec scores de confiance
  console.log('\n--- Test scores de confiance ---');
  const confidenceText = "Appeler Marc demain, écrire rapport Q4";
  const confidenceTasks = extractTasks(confidenceText, 'fr');
  console.log(`Texte: "${confidenceText}"`);
  console.log('Tâches avec scores de confiance:', confidenceTasks.map(t => ({
    action: t.action,
    object: t.object,
    confidence: t.confidence,
    entities: t.entities
  })));
  
  // Test avec entités nommées
  console.log('\n--- Test entités nommées ---');
  const entityText = "Envoyer email à Jean concernant le projet Alpha";
  const entityTasks = extractTasks(entityText, 'fr');
  console.log(`Texte: "${entityText}"`);
  console.log('Tâches avec entités:', entityTasks.map(t => ({
    action: t.action,
    object: t.object,
    entities: t.entities
  })));
}

// Exécuter les tests
runTests();

// Tests de performance
console.log('\n=== Tests de performance ===');
const startTime = performance.now();

// Tester avec beaucoup de textes
const testTexts = [
  "Appeler Marc demain 15h urgent, écrire rapport Q4 2h",
  "Call John tomorrow at 3pm urgent, write Q4 report 2h",
  "Llamar a Juan mañana a las 3pm urgente, escribir informe T4 2h",
  "Préparer présentation lundi. Envoyer email à l'équipe.",
  "Organiser réunion d'équipe mardi matin pour discuter du projet prioritaire."
];

for (let i = 0; i < 100; i++) {
  const text = testTexts[i % testTexts.length];
  const lang = ['fr', 'en', 'es'][i % 3] as 'fr' | 'en' | 'es';
  extractTasks(text, lang);
}

const endTime = performance.now();
console.log(`Temps pour 100 extractions: ${(endTime - startTime).toFixed(2)} ms`);
console.log(`Temps moyen par extraction: ${((endTime - startTime) / 100).toFixed(4)} ms`);

// Tests de précision
console.log('\n=== Tests de précision ===');
const precisionTests = [
  {
    input: "Appeler Marc demain 15h",
    expectedAction: "appeler",
    expectedObject: "Marc",
    lang: 'fr'
  },
  {
    input: "Write Q4 report",
    expectedAction: "write",
    expectedObject: "Q4 report",
    lang: 'en'
  },
  {
    input: "Enviar correo a Juan",
    expectedAction: "enviar",
    expectedObject: "correo a Juan",
    lang: 'es'
  }
];

let correct = 0;
for (const test of precisionTests) {
  const tasks = extractTasks(test.input, test.lang as 'fr' | 'en' | 'es');
  if (tasks.length > 0) {
    const task = tasks[0];
    if (task.action === test.expectedAction && task.object.includes(test.expectedObject.split(' ')[0])) {
      correct++;
    }
  }
}

const precision = (correct / precisionTests.length) * 100;
console.log(`Précision: ${precision.toFixed(1)}% (${correct}/${precisionTests.length} tests corrects)`);