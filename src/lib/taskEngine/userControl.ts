// Contrôle utilisateur explicite - Phase 3.5
import { UserCognitiveSettings, DEFAULT_COGNITIVE_SETTINGS } from './cognitiveSecurity';
import { createLogger } from '@/lib/logger';

const logger = createLogger('UserControl');

/**
 * Gestion des paramètres cognitifs utilisateur
 */
class UserCognitiveControl {
  private settings: UserCognitiveSettings;
  
  constructor() {
    // Charger les paramètres depuis le stockage persistant
    // Pour l'instant, utiliser les paramètres par défaut
    this.settings = { ...DEFAULT_COGNITIVE_SETTINGS };
  }
  
  /**
   * Obtient les paramètres cognitifs actuels
   */
  getSettings(): UserCognitiveSettings {
    return { ...this.settings };
  }
  
  /**
   * Met à jour les paramètres cognitifs
   */
  updateSettings(newSettings: Partial<UserCognitiveSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    logger.debug('Paramètres cognitifs mis à jour', { settings: this.settings });
    // Dans une implémentation complète, cela sauvegarderait les paramètres
  }
  
  /**
   * Réinitialise les paramètres aux valeurs par défaut
   */
  resetToDefault(): void {
    this.settings = { ...DEFAULT_COGNITIVE_SETTINGS };
    logger.info('Paramètres réinitialisés aux valeurs par défaut');
  }
  
  /**
   * Vérifie si les suggestions sont autorisées
   */
  areSuggestionsAllowed(): boolean {
    return this.settings.allowSuggestions;
  }
  
  /**
   * Vérifie si l'optimisation est autorisée
   */
  isOptimizationAllowed(): boolean {
    return this.settings.allowOptimization;
  }
  
  /**
   * Obtient le niveau de nudging
   */
  getNudgeLevel(): number {
    return this.settings.nudgeLevel;
  }
  
  /**
   * Vérifie si les rapports d'influence doivent être affichés
   */
  shouldShowInfluenceReports(): boolean {
    return this.settings.showInfluenceReports;
  }
}

// Instance singleton pour la gestion des paramètres
export const userCognitiveControl = new UserCognitiveControl();

/**
 * Dashboard d'influence IA
 */
export interface InfluenceReport {
  timestamp: Date;
  nudgeCount: number;
  suggestionCount: number;
  overrideCount: number;
  autonomyScore: number; // 0.0 - 1.0
}

/**
 * Génère un rapport d'influence IA
 */
export function generateInfluenceReport(): InfluenceReport {
  // Dans une implémentation complète, cela utiliserait les données réelles
  return {
    timestamp: new Date(),
    nudgeCount: 0,
    suggestionCount: 0,
    overrideCount: 0,
    autonomyScore: 1.0 // Score maximal par défaut
  };
}

/**
 * Active/désactive l'IA
 */
export function toggleAI(enable: boolean): void {
  userCognitiveControl.updateSettings({ 
    allowSuggestions: enable,
    allowOptimization: enable
  });
  
  if (enable) {
    logger.info("IA activée par l'utilisateur");
  } else {
    logger.info("IA désactivée par l'utilisateur");
  }
}
