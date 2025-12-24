/**
 * Tests pour le détecteur de langue SOTA (State-of-the-Art)
 */
import { LanguageDetector } from './LanguageDetector';

// Corpus de test avec précision attendue
const TEST_CORPUS = {
  fr: [
    "Bonjour, comment ça va aujourd'hui ?",
    "J'aimerais planifier une réunion pour demain matin.",
    "N'oubliez pas de vérifier les factures avant de partir.",
    "La présentation était excellente, félicitations à toute l'équipe.",
    "Le chat est sur la chaise.",
    "Je ne parle pas beaucoup français, mais j'essaie.",
    "C'est un petit pas pour l'homme, un bond de géant pour l'humanité."
  ],
  en: [
    "Hello, how are you today?",
    "I would like to schedule a meeting for tomorrow morning.",
    "Don't forget to check the invoices before you leave.",
    "The presentation was excellent, congratulations to the whole team.",
    "The cat is on the chair.",
    "I don't speak much English, but I'm trying.",
    "That's one small step for man, one giant leap for mankind."
  ],
  es: [
    "Hola, ¿cómo estás hoy?",
    "Me gustaría programar una reunión para mañana por la mañana.",
    "No olvides revisar las facturas antes de irte.",
    "La presentación fue excelente, felicidades a todo el equipo.",
    "El gato está en la silla.",
    "No hablo mucho español, pero lo intento.",
    "Es un pequeño paso para el hombre, un gran salto para la humanidad."
  ]
};

// Cas limites pour les tests
const EDGE_CASES = [
  { text: "Call Marc tomorrow urgent", expected: 'en' },
  { text: "Rapport", expected: 'fr' },
  { text: "Email Juan meeting", expected: 'en' },
  { text: "Le week-end, je fais du football", expected: 'fr' },
  { text: "Mi casa es tu casa", expected: 'es' },
  { text: "", expected: 'fr' } // Texte vide, fallback
];

// Fonction pour exécuter les tests
export function runLanguageDetectorTests() {
  console.log("--- Démarrage des tests du LanguageDetector SOTA ---");

  let totalTests = 0;
  let passedTests = 0;

  // Test du corpus principal
  for (const [lang, sentences] of Object.entries(TEST_CORPUS)) {
    console.log(`\nTesting language: ${lang.toUpperCase()}`);
    for (const sentence of sentences) {
      totalTests++;
      const result = LanguageDetector.detect(sentence);
      const passed = result.lang === lang;
      if (passed) {
        passedTests++;
      }
      console.log(
        `  [${passed ? '✅' : '❌'}] "${sentence}" -> ${result.lang} (conf: ${(result.confidence * 100).toFixed(1)}%)`
      );
    }
  }

  // Test des cas limites
  console.log("\nTesting edge cases:");
  for (const { text, expected } of EDGE_CASES) {
    totalTests++;
    const result = LanguageDetector.detect(text);
    const passed = result.lang === expected;
    if (passed) {
      passedTests++;
    }
    console.log(
      `  [${passed ? '✅' : '❌'}] "${text}" -> ${result.lang} (expected: ${expected})`
    );
  }

  // Affichage du résumé
  const accuracy = (passedTests / totalTests) * 100;
  console.log(`\n--- Résumé des tests ---`);
  console.log(`Total: ${totalTests}, Passés: ${passedTests}, Échoués: ${totalTests - passedTests}`);
  console.log(`Précision: ${accuracy.toFixed(2)}%`);
  console.log(`------------------------`);
}
