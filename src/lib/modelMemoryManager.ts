/**
 * Gestionnaire de mémoire pour les modèles ML - Phase 4
 * Implémente le budget mémoire réaliste et la dégradation progressive
 */

import { createLogger } from '@/lib/logger';

const logger = createLogger('ModelMemoryManager');

// Interface pour le budget mémoire des modèles
export interface ModelMemoryBudget {
  mmBERT_INT8: number;        // classification uniquement
  NLP_RULES: number;           // heuristiques / regex
  COACH_MODEL_MAX: number;    // Qwen ≤1B quantifié
  TOTAL_MAX: number;           // plafond absolu
}

// Budget mémoire corrigé SOTA
export const MODEL_MEMORY_BUDGET: ModelMemoryBudget = {
  mmBERT_INT8: 45,        // classification uniquement
  NLP_RULES: 1,           // heuristiques / regex
  COACH_MODEL_MAX: 20,    // Qwen ≤1B quantifié
  TOTAL_MAX: 70           // plafond absolu
};

// Interface pour la configuration du gestionnaire
export interface MemoryManagerConfig {
  unloadModelAfterInference: boolean;
  maxLoadedModels: number;
}

// Interface pour les informations sur le device
export interface DeviceInfo {
  ram: number; // en GB
  cores: number;
}

/**
 * Classe de gestion de la mémoire pour les modèles
 */
export class ModelMemoryManager {
  private config: MemoryManagerConfig;
  private loadedModels: Set<string> = new Set();
  
  constructor(deviceInfo: DeviceInfo) {
    // Appliquer la règle d'or : un seul modèle chargé à la fois sur low-end
    this.config = {
      unloadModelAfterInference: deviceInfo.ram < 4,
      maxLoadedModels: deviceInfo.ram < 4 ? 1 : 3
    };
  }
  
  /**
   * Charge un modèle en mémoire
   * @param modelName Nom du modèle à charger
   * @returns true si le modèle a été chargé, false sinon
   */
  loadModel(modelName: string): boolean {
    // Vérifier si nous avons atteint la limite de modèles chargés
    if (this.loadedModels.size >= this.config.maxLoadedModels) {
      // Si nous devons décharger un modèle avant d'en charger un nouveau
      if (this.config.unloadModelAfterInference) {
        // Décharger le premier modèle chargé
        const firstModel = this.loadedModels.values().next().value;
        if (firstModel) {
          this.unloadModel(firstModel);
        }
      } else {
        // Ne pas charger de nouveau modèle si nous avons atteint la limite
        logger.warn('Limite de modèles chargés atteinte', { maxLoadedModels: this.config.maxLoadedModels });
        return false;
      }
    }
    
    // Charger le modèle
    this.loadedModels.add(modelName);
    logger.info('Modèle chargé', { modelName });
    return true;
  }
  
  /**
   * Décharge un modèle de la mémoire
   * @param modelName Nom du modèle à décharger
   */
  unloadModel(modelName: string): void {
    this.loadedModels.delete(modelName);
    logger.info('Modèle déchargé', { modelName });
  }
  
  /**
   * Décharge tous les modèles de la mémoire
   */
  unloadAllModels(): void {
    this.loadedModels.clear();
    logger.info('Tous les modèles ont été déchargés');
  }
  
  /**
   * Vérifie si un modèle est chargé
   * @param modelName Nom du modèle à vérifier
   * @returns true si le modèle est chargé, false sinon
   */
  isModelLoaded(modelName: string): boolean {
    return this.loadedModels.has(modelName);
  }
  
  /**
   * Obtient le nombre de modèles actuellement chargés
   * @returns Nombre de modèles chargés
   */
  getLoadedModelCount(): number {
    return this.loadedModels.size;
  }
  
  /**
   * Obtient la configuration actuelle
   * @returns Configuration actuelle
   */
  getConfig(): MemoryManagerConfig {
    return { ...this.config };
  }
  
  /**
   * Met à jour la configuration
   * @param newConfig Nouvelle configuration
   */
  updateConfig(newConfig: Partial<MemoryManagerConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

/**
 * Fonction helper pour obtenir les informations sur le device
 * @returns Informations sur le device
 */
export function getDeviceInfo(): DeviceInfo {
  // Dans un environnement navigateur, nous pouvons obtenir des informations sur le device
  // Note: Ces informations sont approximatives et peuvent ne pas être disponibles dans tous les cas
  let ram = 4; // Valeur par défaut
  let cores = 4; // Valeur par défaut
  
  // Essayer d'obtenir les informations de navigation
  if (typeof navigator !== 'undefined') {
    // Approximation de la RAM disponible
    if ('deviceMemory' in navigator) {
      // @ts-ignore
      ram = navigator.deviceMemory || ram;
    }
    
    // Nombre de cœurs
    if ('hardwareConcurrency' in navigator) {
      // @ts-ignore
      cores = navigator.hardwareConcurrency || cores;
    }
  }
  
  return { ram, cores };
}

// Instance singleton du gestionnaire de mémoire
export const modelMemoryManager = new ModelMemoryManager(getDeviceInfo());