import { useNLP } from './useNLP';

/**
 * Tests pour le hook useNLP SOTA
 */
export function testUseNLP() {
  const { processText, isProcessing, error, language } = useNLP();
  
  // Fonction pour tester le traitement de texte
  const testProcessText = async () => {
    console.log('=== Tests du hook useNLP SOTA ===');
    
    // Test avec texte français
    console.log('\n--- Test texte français ---');
    const frenchResult = await processText("Appeler Marc demain 15h urgent, écrire rapport Q4 2h");
    console.log('Résultat français:', frenchResult);
    
    // Test avec texte anglais
    console.log('\n--- Test texte anglais ---');
    const englishResult = await processText("Call John tomorrow at 3pm urgent, write Q4 report 2h");
    console.log('Résultat anglais:', englishResult);
    
    // Test avec texte espagnol
    console.log('\n--- Test texte espagnol ---');
    const spanishResult = await processText("Llamar a Juan mañana a las 3pm urgente, escribir informe T4 2h");
    console.log('Résultat espagnol:', spanishResult);
    
    // Test avec texte vide
    console.log('\n--- Test texte vide ---');
    const emptyResult = await processText("");
    console.log('Résultat texte vide:', emptyResult);
    
    // Test avec texte complexe
    console.log('\n--- Test texte complexe ---');
    const complexResult = await processText("Organiser réunion d'équipe mardi matin pour discuter du projet prioritaire. Préparer les documents nécessaires et envoyer les invitations à tous les participants. Après la réunion, écrire le compte rendu détaillé et le partager avec la direction.");
    console.log('Résultat texte complexe:', complexResult);
    
    // Test avec scores de confiance
    console.log('\n--- Test scores de confiance ---');
    const confidenceResult = await processText("Appeler Marc demain, écrire rapport Q4");
    console.log('Résultat avec scores de confiance:', {
      tasksCount: confidenceResult.tasks.length,
      averageConfidence: confidenceResult.tasks.reduce((acc, task) => acc + (task.confidence || 0), 0) / confidenceResult.tasks.length,
      tasksWithConfidence: confidenceResult.tasks.map(t => ({
        content: t.content,
        confidence: t.confidence
      }))
    });
    
    // Test avec classification mmBERT
    console.log('\n--- Test classification mmBERT ---');
    const classificationResult = await processText("Appeler client important demain, coder nouvelle fonctionnalité");
    console.log('Résultat avec classification:', {
      tasksCount: classificationResult.tasks.length,
      tasksWithClassification: classificationResult.tasks.map(t => ({
        content: t.content,
        energy: t.energy,
        effort: t.effort,
        urgency: t.urgency,
        tags: t.tags
      }))
    });
  };
  
  // Fonction pour tester l'état du hook
  const testHookState = () => {
    console.log('\n=== État du hook ===');
    console.log('Langue actuelle:', language);
    console.log('En cours de traitement:', isProcessing);
    console.log('Erreur:', error);
  };
  
  return {
    testProcessText,
    testHookState,
    processText,
    isProcessing,
    error,
    language
  };
}