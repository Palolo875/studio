import { LanguageDetector } from './LanguageDetector';

/**
 * Tests unitaires pour le détecteur de langue SOTA
 */
function runTests() {
  console.log('=== Tests du Détecteur de Langue SOTA ===');
  
  // Test français
  console.log('\n--- Test français ---');
  console.log('"Le chat mange la souris" ->', LanguageDetector.detect("Le chat mange la souris"));
  console.log('"Bonjour, comment allez-vous?" ->', LanguageDetector.detect("Bonjour, comment allez-vous?"));
  console.log('"Je vais à l\'école" ->', LanguageDetector.detect("Je vais à l'école"));
  console.log('"Merci beaucoup pour votre aide" ->', LanguageDetector.detect("Merci beaucoup pour votre aide"));
  
  // Test anglais
  console.log('\n--- Test anglais ---');
  console.log('"The cat eats the mouse" ->', LanguageDetector.detect("The cat eats the mouse"));
  console.log('"Hello, how are you?" ->', LanguageDetector.detect("Hello, how are you?"));
  console.log('"I am going to school" ->', LanguageDetector.detect("I am going to school"));
  console.log('"Thank you very much for your help" ->', LanguageDetector.detect("Thank you very much for your help"));
  
  // Test espagnol
  console.log('\n--- Test espagnol ---');
  console.log('"El gato come el ratón" ->', LanguageDetector.detect("El gato come el ratón"));
  console.log('"Hola, ¿cómo estás?" ->', LanguageDetector.detect("Hola, ¿cómo estás?"));
  console.log('"Voy a la escuela" ->', LanguageDetector.detect("Voy a la escuela"));
  console.log('"Muchas gracias por tu ayuda" ->', LanguageDetector.detect("Muchas gracias por tu ayuda"));
  
  // Test avec accents
  console.log('\n--- Test avec accents ---');
  console.log('"Café français" ->', LanguageDetector.detect("Café français"));
  console.log('"Niño español" ->', LanguageDetector.detect("Niño español"));
  console.log('"Resume english" ->', LanguageDetector.detect("Resume english"));
  
  // Test fallback
  console.log('\n--- Test fallback ---');
  console.log('"Bonjour" ->', LanguageDetector.detect("Bonjour"));
  console.log('"Hello" ->', LanguageDetector.detect("Hello"));
  console.log('"" ->', LanguageDetector.detect(""));
  
  // Test mélange
  console.log('\n--- Test mélange ---');
  console.log('"Bonjour Hello" ->', LanguageDetector.detect("Bonjour Hello"));
  console.log('"Hola Hello" ->', LanguageDetector.detect("Hola Hello"));
  console.log('"Bonjour Hola" ->', LanguageDetector.detect("Bonjour Hola"));
  
  // Test courts
  console.log('\n--- Test textes courts ---');
  console.log('"urgent" ->', LanguageDetector.detect("urgent"));
  console.log('"tarea" ->', LanguageDetector.detect("tarea"));
  console.log('"task" ->', LanguageDetector.detect("task"));
  console.log('"à" ->', LanguageDetector.detect("à"));
  console.log('"ñ" ->', LanguageDetector.detect("ñ"));
  
  // Test longs
  console.log('\n--- Test textes longs ---');
  console.log('"Je dois absolument terminer ce projet important avant la réunion de lundi matin car c\'est très urgent et nécessite toute mon attention" ->', 
    LanguageDetector.detect("Je dois absolument terminer ce projet important avant la réunion de lundi matin car c'est très urgent et nécessite toute mon attention"));
  console.log('"I need to finish this important project before the Monday morning meeting because it\'s very urgent and requires all my attention" ->', 
    LanguageDetector.detect("I need to finish this important project before the Monday morning meeting because it's very urgent and requires all my attention"));
  console.log('"Necesito terminar este proyecto importante antes de la reunión del lunes por la mañana porque es muy urgente y requiere toda mi atención" ->', 
    LanguageDetector.detect("Necesito terminar este proyecto importante antes de la reunión del lunes por la mañana porque es muy urgente y requiere toda mi atención"));
  
  // Test avec des mots spécifiques à la productivité
  console.log('\n--- Test mots productivité ---');
  console.log('"Tâche urgente à terminer" ->', LanguageDetector.detect("Tâche urgente à terminer"));
  console.log('"Urgent task to complete" ->', LanguageDetector.detect("Urgent task to complete"));
  console.log('"Tarea urgente por terminar" ->', LanguageDetector.detect("Tarea urgente por terminar"));
  console.log('"Réunion importante demain" ->', LanguageDetector.detect("Réunion importante demain"));
  console.log('"Important meeting tomorrow" ->', LanguageDetector.detect("Important meeting tomorrow"));
  console.log('"Reunión importante mañana" ->', LanguageDetector.detect("Reunión importante mañana"));
}

// Exécuter les tests
runTests();

// Tests de performance
console.log('\n=== Tests de performance ===');
const startTime = performance.now();

// Tester avec beaucoup de textes
const testTexts = [
  "Le chat mange la souris",
  "The cat eats the mouse",
  "El gato come el ratón",
  "Bonjour, comment allez-vous?",
  "Hello, how are you?",
  "Hola, ¿cómo estás?",
  "Je vais à l'école",
  "I am going to school",
  "Voy a la escuela",
  "Merci beaucoup pour votre aide",
  "Thank you very much for your help",
  "Muchas gracias por tu ayuda",
  "Café français",
  "Niño español",
  "Resume english",
  "Tâche urgente à terminer",
  "Urgent task to complete",
  "Tarea urgente por terminar"
];

for (let i = 0; i < 1000; i++) {
  const text = testTexts[i % testTexts.length];
  LanguageDetector.detect(text);
}

const endTime = performance.now();
console.log(`Temps pour 1000 détections: ${(endTime - startTime).toFixed(2)} ms`);
console.log(`Temps moyen par détection: ${((endTime - startTime) / 1000).toFixed(4)} ms`);

// Tests de précision
console.log('\n=== Tests de précision ===');
const precisionTests = [
  { text: "Le chat mange la souris", expected: 'fr' },
  { text: "The cat eats the mouse", expected: 'en' },
  { text: "El gato come el ratón", expected: 'es' },
  { text: "Bonjour, comment allez-vous?", expected: 'fr' },
  { text: "Hello, how are you?", expected: 'en' },
  { text: "Hola, ¿cómo estás?", expected: 'es' },
  { text: "Je vais à l'école", expected: 'fr' },
  { text: "I am going to school", expected: 'en' },
  { text: "Voy a la escuela", expected: 'es' }
];

let correct = 0;
for (const test of precisionTests) {
  const result = LanguageDetector.detect(test.text);
  if (result === test.expected) {
    correct++;
  } else {
    console.log(`ERREUR: "${test.text}" détecté comme ${result}, attendu ${test.expected}`);
  }
}

console.log(`Précision: ${correct}/${precisionTests.length} (${(correct/precisionTests.length*100).toFixed(1)}%)`);