import { classifyTask } from './TaskClassifier';
import { RawTask } from './TaskExtractor';

/**
 * Tests pour le classificateur mmBERT
 */
async function runTests() {
  console.log('=== Tests du Classificateur mmBERT ===');
  
  // Test tâche relationnelle
  console.log('\n--- Test tâche relationnelle ---');
  const relationTask: RawTask = {
    id: 'test-1',
    action: 'appeler',
    object: 'Marc',
    deadline: 'demain 15h',
    effortHint: 'S',
    rawText: 'Appeler Marc demain 15h urgent',
    sentence: 'Appeler Marc demain 15h urgent',
    confidence: 0.95,
    entities: { person: 'Marc', date: 'demain', time: '15h' }
  };
  
  const relationClassification = await classifyTask(relationTask);
  console.log('Tâche relationnelle:', relationClassification);
  
  // Test tâche de focus
  console.log('\n--- Test tâche de focus ---');
  const focusTask: RawTask = {
    id: 'test-2',
    action: 'écrire',
    object: 'rapport Q4',
    deadline: null,
    effortHint: 'L',
    rawText: 'Écrire rapport Q4 complexe',
    sentence: 'Écrire rapport Q4 complexe',
    confidence: 0.87,
    entities: { project: 'rapport Q4' }
  };
  
  const focusClassification = await classifyTask(focusTask);
  console.log('Tâche de focus:', focusClassification);
  
  // Test tâche administrative
  console.log('\n--- Test tâche administrative ---');
  const adminTask: RawTask = {
    id: 'test-3',
    action: 'envoyer',
    object: 'email réunion',
    deadline: null,
    effortHint: 'S',
    rawText: 'Envoyer email pour la réunion de demain',
    sentence: 'Envoyer email pour la réunion de demain',
    confidence: 0.92,
    entities: {}
  };
  
  const adminClassification = await classifyTask(adminTask);
  console.log('Tâche administrative:', adminClassification);
  
  // Test tâche créative
  console.log('\n--- Test tâche créative ---');
  const creativeTask: RawTask = {
    id: 'test-4',
    action: 'design',
    object: 'nouvelle interface',
    deadline: null,
    effortHint: 'M',
    rawText: 'Design de la nouvelle interface utilisateur',
    sentence: 'Design de la nouvelle interface utilisateur',
    confidence: 0.88,
    entities: { project: 'interface utilisateur' }
  };
  
  const creativeClassification = await classifyTask(creativeTask);
  console.log('Tâche créative:', creativeClassification);
  
  // Test avec score d'urgence
  console.log('\n--- Test score d\'urgence ---');
  const urgentTask: RawTask = {
    id: 'test-5',
    action: 'terminer',
    object: 'projet urgent',
    deadline: 'aujourd hui',
    effortHint: 'L',
    rawText: 'Terminer le projet urgent aujourd hui asap',
    sentence: 'Terminer le projet urgent aujourd hui asap',
    confidence: 0.95,
    entities: { project: 'projet urgent', date: 'aujourd hui' }
  };
  
  const urgentClassification = await classifyTask(urgentTask);
  console.log('Tâche urgente:', urgentClassification);
  console.log('Score d\'urgence:', urgentClassification.urgency);
  
  // Test avec détection de sentiment
  console.log('\n--- Test détection de sentiment ---');
  const positiveTask: RawTask = {
    id: 'test-6',
    action: 'féliciter',
    object: 'équipe',
    deadline: null,
    effortHint: 'S',
    rawText: 'Féliciter l\'équipe pour ce excellent travail',
    sentence: 'Féliciter l\'équipe pour ce excellent travail',
    confidence: 0.90,
    entities: { person: 'équipe' }
  };
  
  const positiveClassification = await classifyTask(positiveTask);
  console.log('Tâche positive:', positiveClassification);
  console.log('Sentiment:', positiveClassification.sentiment);
}

// Tests de performance
async function performanceTests() {
  console.log('\n=== Tests de Performance ===');
  
  const testTask: RawTask = {
    id: 'perf-test',
    action: 'analyser',
    object: 'données',
    deadline: null,
    effortHint: 'M',
    rawText: 'Analyser les données du rapport mensuel',
    sentence: 'Analyser les données du rapport mensuel',
    confidence: 0.85,
    entities: { project: 'rapport mensuel' }
  };
  
  const startTime = performance.now();
  
  // Exécuter 10 classifications
  for (let i = 0; i < 10; i++) {
    await classifyTask(testTask);
  }
  
  const endTime = performance.now();
  console.log(`Temps pour 10 classifications: ${(endTime - startTime).toFixed(2)} ms`);
  console.log(`Temps moyen par classification: ${((endTime - startTime) / 10).toFixed(2)} ms`);
}

// Tests de précision
async function precisionTests() {
  console.log('\n=== Tests de Précision ===');
  
  // Tests avec résultats attendus
  const testCases = [
    {
      task: {
        id: 'prec-1',
        action: 'appeler',
        object: 'client',
        deadline: 'demain',
        effortHint: 'S',
        rawText: 'Appeler le client important demain',
        sentence: 'Appeler le client important demain',
        confidence: 0.95,
        entities: { person: 'client' }
      },
      expectedEnergy: 'relationnel'
    },
    {
      task: {
        id: 'prec-2',
        action: 'coder',
        object: 'nouvelle fonction',
        deadline: null,
        effortHint: 'L',
        rawText: 'Coder la nouvelle fonctionnalité complexe',
        sentence: 'Coder la nouvelle fonctionnalité complexe',
        confidence: 0.90,
        entities: { project: 'fonctionnalité' }
      },
      expectedEnergy: 'focus'
    }
  ];
  
  let correct = 0;
  for (const testCase of testCases) {
    const classification = await classifyTask(testCase.task);
    console.log(`Tâche: ${testCase.task.rawText}`);
    console.log(`Énergie détectée: ${classification.energyType}`);
    console.log(`Confiance: ${classification.energyConfidence.toFixed(2)}`);
    console.log('---');
  }
  
  console.log(`Précision: ${(correct / testCases.length * 100).toFixed(1)}%`);
}

// Exécuter tous les tests
async function runAllTests() {
  await runTests();
  await performanceTests();
  await precisionTests();
}

runAllTests().catch(console.error);