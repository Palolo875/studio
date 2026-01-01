'use client';

import { useState, useEffect } from 'react';
import { LanguageDetector } from '@/lib/nlp/LanguageDetector';
import { createLogger } from '@/lib/logger';
import { getSetting, setSetting } from '@/lib/database';

const logger = createLogger('useSettingsStore');

// Interface pour les paramètres de l'application
interface Settings {
  // Paramètres existants
  workDuration: number; // en secondes
  breakDuration: number; // en secondes
  autoSaveNotes: boolean;
  soundEnabled: boolean;
  
  // Nouveaux paramètres pour la détection de langue SOTA
  language: 'fr' | 'en' | 'es';
  autoDetectLanguage: boolean;
  // Paramètres avancés pour la détection SOTA
  languageConfidenceThreshold: number; // Seuil de confiance (0-1)
  preferredLanguages: ('fr' | 'en' | 'es')[]; // Langues préférées dans l'ordre
  enableAdvancedLanguageDetection: boolean; // Activer la détection SOTA
}

// Valeurs par défaut
const DEFAULT_SETTINGS: Settings = {
  workDuration: 25 * 60, // 25 minutes (en secondes)
  breakDuration: 5 * 60,  // 5 minutes (en secondes)
  autoSaveNotes: true,
  soundEnabled: true,
  language: 'fr', // Français par défaut
  autoDetectLanguage: true, // Détection automatique activée par défaut
  languageConfidenceThreshold: 0.75, // Seuil de confiance de 75%
  preferredLanguages: ['fr', 'en', 'es'], // Ordre de préférence
  enableAdvancedLanguageDetection: true, // Activer la détection SOTA par défaut
};

export function useSettingsStore() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  // Charger les paramètres depuis Dexie (remplace localStorage)
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const parsedSettings = await getSetting<Partial<Settings>>('appSettings');
        if (!parsedSettings) {
          return;
        }

        // Valider les paramètres
        const validatedSettings: Settings = {
          workDuration: typeof parsedSettings.workDuration === 'number'
            ? parsedSettings.workDuration
            : DEFAULT_SETTINGS.workDuration,
          breakDuration: typeof parsedSettings.breakDuration === 'number'
            ? parsedSettings.breakDuration
            : DEFAULT_SETTINGS.breakDuration,
          autoSaveNotes: typeof parsedSettings.autoSaveNotes === 'boolean'
            ? parsedSettings.autoSaveNotes
            : DEFAULT_SETTINGS.autoSaveNotes,
          soundEnabled: typeof parsedSettings.soundEnabled === 'boolean'
            ? parsedSettings.soundEnabled
            : DEFAULT_SETTINGS.soundEnabled,
          language: typeof parsedSettings.language === 'string' && ['fr', 'en', 'es'].includes(parsedSettings.language)
            ? (parsedSettings.language as 'fr' | 'en' | 'es')
            : DEFAULT_SETTINGS.language,
          autoDetectLanguage: typeof parsedSettings.autoDetectLanguage === 'boolean'
            ? parsedSettings.autoDetectLanguage
            : DEFAULT_SETTINGS.autoDetectLanguage,
          languageConfidenceThreshold: typeof parsedSettings.languageConfidenceThreshold === 'number'
            ? Math.max(0, Math.min(1, parsedSettings.languageConfidenceThreshold))
            : DEFAULT_SETTINGS.languageConfidenceThreshold,
          preferredLanguages: Array.isArray(parsedSettings.preferredLanguages)
            ? parsedSettings.preferredLanguages.filter((lang: string) => ['fr', 'en', 'es'].includes(lang)) as ('fr' | 'en' | 'es')[]
            : DEFAULT_SETTINGS.preferredLanguages,
          enableAdvancedLanguageDetection: typeof parsedSettings.enableAdvancedLanguageDetection === 'boolean'
            ? parsedSettings.enableAdvancedLanguageDetection
            : DEFAULT_SETTINGS.enableAdvancedLanguageDetection,
        };

        if (!cancelled) {
          setSettings(validatedSettings);
        }
      } catch (error) {
        logger.error('Erreur lors du chargement des paramètres', error as Error);
        if (!cancelled) {
          setSettings(DEFAULT_SETTINGS);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Sauvegarder les paramètres dans Dexie (remplace localStorage)
  const updateSettings = (newSettings: Partial<Settings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    
    void setSetting('appSettings', updatedSettings).catch((error) => {
      logger.error('Erreur lors de la sauvegarde des paramètres', error as Error);
    });
  };

  // Détecter la langue d'un texte avec paramètres SOTA
  const detectInputLanguage = (text: string) => {
    if (!settings.autoDetectLanguage) return settings.language;
    
    // Utiliser le détecteur SOTA
    return LanguageDetector.detect(text, settings.language).lang;
  };

  // Obtenir les langues préférées dans l'ordre
  const getPreferredLanguages = () => {
    return settings.preferredLanguages.length > 0 
      ? settings.preferredLanguages 
      : DEFAULT_SETTINGS.preferredLanguages;
  };

  return {
    settings,
    updateSettings,
    isLoading,
    resetToDefault: () => updateSettings(DEFAULT_SETTINGS),
    setLanguage: (lang: 'fr' | 'en' | 'es') => updateSettings({ language: lang }),
    detectInputLanguage,
    getPreferredLanguages,
    // Méthodes utilitaires
    isLanguageSupported: (lang: string) => ['fr', 'en', 'es'].includes(lang),
    setPreferredLanguages: (langs: ('fr' | 'en' | 'es')[]) => updateSettings({ preferredLanguages: langs }),
    setConfidenceThreshold: (threshold: number) => updateSettings({ 
      languageConfidenceThreshold: Math.max(0, Math.min(1, threshold)) 
    }),
    toggleAdvancedLanguageDetection: () => updateSettings({ 
      enableAdvancedLanguageDetection: !settings.enableAdvancedLanguageDetection 
    }),
  };
}