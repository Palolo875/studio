'use client';

import { useState, useEffect } from 'react';
import { FocusSettings } from '@/lib/types';

const DEFAULT_SETTINGS: FocusSettings = {
  workDuration: 25 * 60, // 25 minutes (en secondes)
  breakDuration: 5 * 60,  // 5 minutes (en secondes)
  autoSaveNotes: true,
  soundEnabled: true,
};

export function useFocusSettings() {
  const [settings, setSettings] = useState<FocusSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  // Charger les paramètres depuis localStorage
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('focusSettings');
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        
        // Valider les paramètres
        const validatedSettings: FocusSettings = {
          workDuration: typeof parsedSettings.focusWorkDuration === 'number' 
            ? parsedSettings.focusWorkDuration 
            : DEFAULT_SETTINGS.workDuration,
          breakDuration: typeof parsedSettings.focusBreakDuration === 'number' 
            ? parsedSettings.focusBreakDuration 
            : DEFAULT_SETTINGS.breakDuration,
          autoSaveNotes: typeof parsedSettings.focusAutoSave === 'boolean' 
            ? parsedSettings.focusAutoSave 
            : DEFAULT_SETTINGS.autoSaveNotes,
          soundEnabled: typeof parsedSettings.focusSoundEnabled === 'boolean' 
            ? parsedSettings.focusSoundEnabled 
            : DEFAULT_SETTINGS.soundEnabled,
        };
        
        setSettings(validatedSettings);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres du mode focus:', error);
      // Utiliser les paramètres par défaut en cas d'erreur
      setSettings(DEFAULT_SETTINGS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Sauvegarder les paramètres dans localStorage
  const updateSettings = (newSettings: Partial<FocusSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    
    try {
      // Convertir les noms de champs pour correspondre au formulaire
      const formSettings = {
        focusWorkDuration: updatedSettings.workDuration,
        focusBreakDuration: updatedSettings.breakDuration,
        focusAutoSave: updatedSettings.autoSaveNotes,
        focusSoundEnabled: updatedSettings.soundEnabled,
      };
      
      localStorage.setItem('focusSettings', JSON.stringify(formSettings));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des paramètres du mode focus:', error);
    }
  };

  return {
    settings,
    updateSettings,
    isLoading,
    resetToDefault: () => updateSettings(DEFAULT_SETTINGS),
  };
}