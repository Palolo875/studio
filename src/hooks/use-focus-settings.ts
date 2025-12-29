'use client';

import { useState, useEffect } from 'react';
import { FocusSettings } from '@/lib/types';
import { createLogger } from '@/lib/logger';
import { getSetting, setSetting } from '@/lib/database';

const logger = createLogger('useFocusSettings');

const DEFAULT_SETTINGS: FocusSettings = {
  workDuration: 25 * 60, // 25 minutes (en secondes)
  breakDuration: 5 * 60,  // 5 minutes (en secondes)
  autoSaveNotes: true,
  soundEnabled: true,
};

export function useFocusSettings() {
  const [settings, setSettings] = useState<FocusSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  // Charger les paramètres depuis Dexie (remplace localStorage)
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const saved = await getSetting<{ focusWorkDuration?: unknown; focusBreakDuration?: unknown; focusAutoSave?: unknown; focusSoundEnabled?: unknown }>('focusSettings');
        if (!saved) {
          return;
        }

        const validatedSettings: FocusSettings = {
          workDuration: typeof saved.focusWorkDuration === 'number'
            ? saved.focusWorkDuration
            : DEFAULT_SETTINGS.workDuration,
          breakDuration: typeof saved.focusBreakDuration === 'number'
            ? saved.focusBreakDuration
            : DEFAULT_SETTINGS.breakDuration,
          autoSaveNotes: typeof saved.focusAutoSave === 'boolean'
            ? saved.focusAutoSave
            : DEFAULT_SETTINGS.autoSaveNotes,
          soundEnabled: typeof saved.focusSoundEnabled === 'boolean'
            ? saved.focusSoundEnabled
            : DEFAULT_SETTINGS.soundEnabled,
        };

        if (!cancelled) {
          setSettings(validatedSettings);
        }
      } catch (error) {
        logger.error('Erreur lors du chargement des paramètres du mode focus', error as Error);
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
  const updateSettings = (newSettings: Partial<FocusSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    
    // Convertir les noms de champs pour correspondre au formulaire
    const formSettings = {
      focusWorkDuration: updatedSettings.workDuration,
      focusBreakDuration: updatedSettings.breakDuration,
      focusAutoSave: updatedSettings.autoSaveNotes,
      focusSoundEnabled: updatedSettings.soundEnabled,
    };

    void setSetting('focusSettings', formSettings).catch((error) => {
      logger.error('Erreur lors de la sauvegarde des paramètres du mode focus', error as Error);
    });
  };

  return {
    settings,
    updateSettings,
    isLoading,
    resetToDefault: () => updateSettings(DEFAULT_SETTINGS),
  };
}