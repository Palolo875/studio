// antiOverfitting.ts
// Implémentation du garde-fou contre la sur-adaptation

import { createLogger } from '@/lib/logger';

const logger = createLogger('AntiOverfitting');

export interface AntiOverfittingConfig {
  // Empêche la convergence trop rapide
  minSamplesBeforeAdaptation: number;
  
  // Test A/B implicite : garde 10% des décisions aléatoires
  randomPreservationRate: number;
  
  // Validation croisée temporelle
  temporalCrossValidation: {
    trainOn: string; // e.g., "last_60_days"
    testOn: string;   // e.g., "previous_30_days"
    minAccuracy: number;
  };
}

export interface AdaptationSample {
  id: string;
  timestamp: number;
  inputData: any;
  predictedOutput: any;
  actualOutput: any;
  accuracy: number;
}

export class AntiOverfittingEngine {
  private config: AntiOverfittingConfig;
  private adaptationSamples: AdaptationSample[] = [];
  
  constructor(config: Partial<AntiOverfittingConfig> = {}) {
    this.config = {
      minSamplesBeforeAdaptation: 50,
      randomPreservationRate: 0.1,
      temporalCrossValidation: {
        trainOn: "last_60_days",
        testOn: "previous_30_days",
        minAccuracy: 0.7
      },
      ...config
    };
  }
  
  // Vérifier si suffisamment d'échantillons ont été collectés
  hasSufficientSamples(): boolean {
    return this.adaptationSamples.length >= this.config.minSamplesBeforeAdaptation;
  }
  
  // Ajouter un échantillon d'adaptation
  addAdaptationSample(sample: AdaptationSample): void {
    this.adaptationSamples.push(sample);
    
    // Limiter la taille de l'historique pour éviter une accumulation infinie
    if (this.adaptationSamples.length > 1000) {
      this.adaptationSamples.shift();
    }
  }
  
  // Effectuer une validation croisée temporelle
  performTemporalCrossValidation(): boolean {
    if (this.adaptationSamples.length < 2) {
      return false;
    }
    
    // Simplification : dans une implémentation réelle, cela diviserait les données
    // en ensembles d'entraînement et de test selon les périodes spécifiées
    const recentSamples = this.adaptationSamples.slice(-30); // Simule "previous_30_days"
    const accuracy = this.calculateAverageAccuracy(recentSamples);
    
    logger.info('TEMPORAL_CROSS_VALIDATION', {
      accuracy: Number(accuracy.toFixed(2)),
      minRequired: this.config.temporalCrossValidation.minAccuracy,
    });
    
    return accuracy >= this.config.temporalCrossValidation.minAccuracy;
  }
  
  // Calculer la précision moyenne des échantillons
  private calculateAverageAccuracy(samples: AdaptationSample[]): number {
    if (samples.length === 0) return 0;
    
    const sum = samples.reduce((acc, sample) => acc + sample.accuracy, 0);
    return sum / samples.length;
  }
  
  // Décider de préserver certaines décisions
  shouldPreserveRandomly(): boolean {
    return this.config.randomPreservationRate >= 1;
  }
  
  // Obtenir la configuration actuelle
  getConfig(): AntiOverfittingConfig {
    return { ...this.config };
  }
  
  // Mettre à jour la configuration
  updateConfig(newConfig: Partial<AntiOverfittingConfig>): void {
    this.config = {
      ...this.config,
      ...newConfig
    };
  }
  
  // Obtenir les statistiques d'overfitting
  getOverfittingStats(): {
    sampleCount: number;
    averageAccuracy: number;
    sufficientSamples: boolean;
    validationPassed: boolean;
  } {
    const averageAccuracy = this.calculateAverageAccuracy(this.adaptationSamples);
    const sufficientSamples = this.hasSufficientSamples();
    const validationPassed = this.performTemporalCrossValidation();
    
    return {
      sampleCount: this.adaptationSamples.length,
      averageAccuracy,
      sufficientSamples,
      validationPassed
    };
  }
}