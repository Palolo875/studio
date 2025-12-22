// Overfitting Protection - Protection contre l'overfitting cognitif
// Implémentation de la protection contre l'apprentissage erroné de comportements temporaires

// Configuration pour la protection contre l'overfitting
export const OVERFITTING_PROTECTION = {
  minObservationWindow: 30 * 24 * 60 * 60 * 1000, // Minimum 30 jours d'observation
  maxStdDev: 0.3, // Si l'écart-type est trop élevé, aucune adaptation
  adaptationTTL: 60 * 24 * 60 * 60 * 1000, // Adaptations expirent après 60 jours
  forgettingFactor: 0.95, // Chaque jour les poids passés diminuent
};

// Classe pour l'apprentissage adaptatif
export class AdaptiveLearning {
  private weights: Map<string, number> = new Map();
  private lastUpdate: number = Date.now();
  
  // Appliquer le forgetting factor
  applyForgetting() {
    const daysSinceUpdate = (Date.now() - this.lastUpdate) / (24 * 60 * 60 * 1000);
    const factor = Math.pow(OVERFITTING_PROTECTION.forgettingFactor, daysSinceUpdate);
    
    // Dégrader tous les poids
    for (const [key, weight] of this.weights.entries()) {
      this.weights.set(key, weight * factor);
    }
    
    this.lastUpdate = Date.now();
  }
  
  // Mettre à jour un poids
  updateWeight(key: string, value: number) {
    // Apply forgetting avant update
    this.applyForgetting();
    
    // Update weight
    const current = this.weights.get(key) || 0;
    const updated = current * 0.7 + value * 0.3;  // Smooth
    this.weights.set(key, updated);
  }
  
  // Obtenir un poids
  getWeight(key: string): number {
    return this.weights.get(key) || 0;
  }
  
  // Obtenir tous les poids
  getAllWeights(): Record<string, number> {
    const result: Record<string, number> = {};
    for (const [key, value] of this.weights.entries()) {
      result[key] = value;
    }
    return result;
  }
}

// Interface pour les statistiques d'observation
export interface ObservationStats {
  mean: number;
  stdDev: number;
  sampleSize: number;
  observationPeriod: number; // en jours
}

// Interface pour une adaptation avec TTL
export interface TimedAdaptation {
  id: string;
  parameterChanges: any;
  createdAt: number;
  expiresAt: number;
  isValid: boolean;
}

// Classe pour gérer la protection contre l'overfitting
export class OverfittingProtectionManager {
  private config = OVERFITTING_PROTECTION;
  private adaptations: TimedAdaptation[] = [];
  private observationWindows: Map<string, number[]> = new Map();
  private adaptiveLearning: AdaptiveLearning;
  
  constructor(config: Partial<typeof OVERFITTING_PROTECTION> = {}) {
    this.config = {
      ...OVERFITTING_PROTECTION,
      ...config
    };
    this.adaptiveLearning = new AdaptiveLearning();
  }
  
  // Obtenir la configuration actuelle
  getConfig() {
    return { ...this.config };
  }
  
  // Mettre à jour la configuration
  updateConfig(newConfig: Partial<typeof OVERFITTING_PROTECTION>) {
    this.config = {
      ...this.config,
      ...newConfig
    };
  }
  
  // Ajouter une observation à une fenêtre
  addObservation(windowId: string, value: number) {
    if (!this.observationWindows.has(windowId)) {
      this.observationWindows.set(windowId, []);
    }
    
    const window = this.observationWindows.get(windowId)!;
    window.push(value);
    
    // Limiter la taille de la fenêtre pour éviter une accumulation infinie
    if (window.length > 1000) {
      window.shift();
    }
  }
  
  // Calculer les statistiques pour une fenêtre d'observation
  calculateObservationStats(windowId: string): ObservationStats | null {
    const window = this.observationWindows.get(windowId);
    if (!window || window.length === 0) {
      return null;
    }
    
    // Calculer la moyenne
    const mean = window.reduce((sum, value) => sum + value, 0) / window.length;
    
    // Calculer l'écart-type
    const squaredDiffs = window.map(value => Math.pow(value - mean, 2));
    const variance = squaredDiffs.reduce((sum, value) => sum + value, 0) / window.length;
    const stdDev = Math.sqrt(variance);
    
    return {
      mean,
      stdDev,
      sampleSize: window.length,
      observationPeriod: window.length // Simplification - en réalité, ce serait basé sur les timestamps
    };
  }
  
  // Vérifier si l'adaptation est autorisée selon les critères de overfitting
  isAdaptationAllowed(windowId: string): boolean {
    const stats = this.calculateObservationStats(windowId);
    
    if (!stats) {
      return false; // Pas de données suffisantes
    }
    
    // Vérifier la période d'observation minimale
    if (stats.observationPeriod < this.config.minObservationWindow) {
      return false;
    }
    
    // Vérifier l'écart-type
    if (stats.stdDev > this.config.maxStdDev) {
      return false;
    }
    
    return true;
  }
  
  // Ajouter une adaptation avec TTL
  addAdaptation(adaptation: Omit<TimedAdaptation, 'createdAt' | 'expiresAt' | 'isValid'>) {
    const now = Date.now();
    const timedAdaptation: TimedAdaptation = {
      ...adaptation,
      createdAt: now,
      expiresAt: now + this.config.adaptationTTL,
      isValid: true
    };
    
    this.adaptations.push(timedAdaptation);
  }
  
  // Nettoyer les adaptations expirées
  cleanupExpiredAdaptations() {
    const now = Date.now();
    this.adaptations = this.adaptations.filter(
      adaptation => adaptation.expiresAt > now
    );
  }
  
  // Obtenir les adaptations valides
  getValidAdaptations(): TimedAdaptation[] {
    const now = Date.now();
    return this.adaptations.filter(
      adaptation => adaptation.isValid && adaptation.expiresAt > now
    );
  }
  
  // Appliquer le facteur d'oubli aux poids passés
  applyForgettingFactor(weights: Record<string, number>, daysPassed: number): Record<string, number> {
    const adjustedWeights: Record<string, number> = {};
    
    for (const [key, weight] of Object.entries(weights)) {
      // Appliquer le facteur d'oubli : poids × (facteur)^jours
      adjustedWeights[key] = weight * Math.pow(this.config.forgettingFactor, daysPassed);
    }
    
    return adjustedWeights;
  }
  
  // Vérifier et invalider les adaptations trop anciennes
  invalidateOldAdaptations(maxAgeDays: number) {
    const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;
    const cutoffTime = Date.now() - maxAgeMs;
    
    this.adaptations.forEach(adaptation => {
      if (adaptation.createdAt < cutoffTime) {
        adaptation.isValid = false;
      }
    });
  }
}