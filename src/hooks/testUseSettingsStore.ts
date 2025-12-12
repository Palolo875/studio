import { useSettingsStore } from './useSettingsStore';

/**
 * Fonction de test pour le hook useSettingsStore avec détection SOTA
 * Note: Ce fichier est destiné à être utilisé dans un composant React
 */
export function TestUseSettingsStore() {
  const {
    settings,
    updateSettings,
    isLoading,
    resetToDefault,
    setLanguage,
    detectInputLanguage,
    getPreferredLanguages,
    isLanguageSupported,
    setPreferredLanguages,
    setConfidenceThreshold,
    toggleAdvancedLanguageDetection
  } = useSettingsStore();

  // Fonction pour tester la détection de langue SOTA
  const testLanguageDetection = () => {
    console.log('=== Test de détection de langue SOTA ===');
    
    const texts = [
      "Le chat mange la souris",
      "The cat eats the mouse",
      "El gato come el ratón",
      "Bonjour, comment allez-vous?",
      "Hello, how are you?",
      "Hola, ¿cómo estás?",
      "Bonjour",
      "Hello",
      "",
      "Bonjour Hello",
      "urgent",
      "tarea",
      "task",
      "à",
      "ñ",
      "Je dois absolument terminer ce projet important",
      "I need to finish this important project",
      "Necesito terminar este proyecto importante"
    ];
    
    texts.forEach(text => {
      const detectedLang = detectInputLanguage(text);
      console.log(`Texte: "${text}" -> Langue détectée: ${detectedLang}`);
    });
  };

  // Fonction pour tester la mise à jour des paramètres SOTA
  const testSettingsUpdate = () => {
    console.log('=== Test de mise à jour des paramètres SOTA ===');
    
    // Mettre à jour la langue
    setLanguage('en');
    console.log('Langue mise à jour:', settings.language);
    
    // Désactiver la détection automatique
    updateSettings({ autoDetectLanguage: false });
    console.log('Détection automatique:', settings.autoDetectLanguage);
    
    // Réactiver la détection automatique
    updateSettings({ autoDetectLanguage: true });
    console.log('Détection automatique réactivée:', settings.autoDetectLanguage);
    
    // Mettre à jour le seuil de confiance
    setConfidenceThreshold(0.8);
    console.log('Seuil de confiance:', settings.languageConfidenceThreshold);
    
    // Mettre à jour les langues préférées
    setPreferredLanguages(['en', 'fr', 'es']);
    console.log('Langues préférées:', getPreferredLanguages());
    
    // Activer/désactiver la détection SOTA
    toggleAdvancedLanguageDetection();
    console.log('Détection SOTA activée:', settings.enableAdvancedLanguageDetection);
    
    // Réinitialiser aux valeurs par défaut
    resetToDefault();
    console.log('Paramètres réinitialisés');
  };

  // Fonction pour tester la validation des langues
  const testLanguageValidation = () => {
    console.log('=== Test de validation des langues ===');
    
    const testLanguages = ['fr', 'en', 'es', 'de', 'it', 'pt'];
    testLanguages.forEach(lang => {
      console.log(`Langue "${lang}" supportée:`, isLanguageSupported(lang));
    });
  };

  return {
    settings,
    testLanguageDetection,
    testSettingsUpdate,
    testLanguageValidation,
    isLoading
  };
}