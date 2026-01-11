/**
 * MONITEUR DE SANTÉ NLP - KairuFlow Phase 2
 * Circuit breaker et adaptation automatique
 */

export interface NLPFailureMetrics {
  unknown_rate: number;
  ambiguous_rate: number;
  user_override_rate: number;
  processing_errors: number;
  total_processed: number;
}

export interface NLPMonitorThresholds {
  warning: number;    // 20% unknown
  critical: number;   // 30% unknown
  emergency: number;  // 50% unknown
}

export type NLPState = "healthy" | "degraded" | "emergency";

export interface NLPAdaptationResult {
  mode: "NORMAL" | "STRICT_RULES_ONLY" | "RAW_CAPTURE_ONLY";
  message: string;
  ml_disabled: boolean;
  confidence_threshold: number;
  nlp_disabled: boolean;
}

export class NLPHealthMonitor {
  private metrics: NLPFailureMetrics = {
    unknown_rate: 0,
    ambiguous_rate: 0,
    user_override_rate: 0,
    processing_errors: 0,
    total_processed: 0
  };
  
  public thresholds: NLPMonitorThresholds = {
    warning: 0.20,
    critical: 0.30,
    emergency: 0.50
  };
  
  public state: NLPState = "healthy";
  
  /**
   * Met à jour les métriques avec un nouvel échantillon
   */
  updateMetrics(hasUnknown: boolean, isAmbiguous: boolean, wasUserOverridden: boolean, hadProcessingError: boolean): void {
    this.metrics.total_processed++;
    
    if (hasUnknown) this.metrics.unknown_rate = (this.metrics.unknown_rate * (this.metrics.total_processed - 1) + 1) / this.metrics.total_processed;
    if (isAmbiguous) this.metrics.ambiguous_rate = (this.metrics.ambiguous_rate * (this.metrics.total_processed - 1) + 1) / this.metrics.total_processed;
    if (wasUserOverridden) this.metrics.user_override_rate = (this.metrics.user_override_rate * (this.metrics.total_processed - 1) + 1) / this.metrics.total_processed;
    if (hadProcessingError) this.metrics.processing_errors++;
  }
  
  /**
   * Vérifie l'état et adapte le système NLP
   */
  checkAndAdapt(): NLPAdaptationResult {
    if (this.metrics.unknown_rate >= this.thresholds.emergency) {
      this.state = "emergency";
      return {
        mode: "RAW_CAPTURE_ONLY",
        message: "Je note exactement ce que tu écris. On structurera plus tard.",
        nlp_disabled: true,
        ml_disabled: true,
        confidence_threshold: 0.0
      };
    }
    
    if (this.metrics.unknown_rate >= this.thresholds.critical) {
      this.state = "degraded";
      return {
        mode: "STRICT_RULES_ONLY",
        message: "Mode capture simple activé.",
        ml_disabled: true,  // Désactive ML, garde les règles
        confidence_threshold: 0.85,  // Plus strict
        nlp_disabled: false
      };
    }
    
    // État sain
    this.state = "healthy";
    return {
      mode: "NORMAL",
      message: "",
      ml_disabled: false,
      confidence_threshold: 0.70,
      nlp_disabled: false
    };
  }
  
  /**
   * Réinitialise les métriques
   */
  resetMetrics(): void {
    this.metrics = {
      unknown_rate: 0,
      ambiguous_rate: 0,
      user_override_rate: 0,
      processing_errors: 0,
      total_processed: 0
    };
    this.state = "healthy";
  }
  
  /**
   * Obtient les métriques actuelles
   */
  getMetrics(): NLPFailureMetrics {
    return { ...this.metrics };
  }
  
  /**
   * Vérifie si le système est en mode dégradé
   */
  isDegraded(): boolean {
    return this.state !== "healthy";
  }
  
  /**
   * Ajuste les seuils (utile pour calibration empirique)
   */
  setThresholds(thresholds: NLPMonitorThresholds): void {
    this.thresholds = { ...thresholds };
  }
}

/**
 * Interface pour le gestionnaire de santé NLP
 */
export interface NLPHealthHandler {
  updateMetrics(hasUnknown: boolean, isAmbiguous: boolean, wasUserOverridden: boolean, hadProcessingError: boolean): void;
  checkAndAdapt(): NLPAdaptationResult;
  getCurrentState(): NLPState;
  getMetrics(): NLPFailureMetrics;
}

/**
 * Gestionnaire par défaut
 */
export class DefaultNLPHealthHandler implements NLPHealthHandler {
  private monitor: NLPHealthMonitor;
  
  constructor(initialThresholds?: NLPMonitorThresholds) {
    this.monitor = new NLPHealthMonitor();
    if (initialThresholds) {
      this.monitor.setThresholds(initialThresholds);
    }
  }
  
  updateMetrics(hasUnknown: boolean, isAmbiguous: boolean, wasUserOverridden: boolean, hadProcessingError: boolean): void {
    this.monitor.updateMetrics(hasUnknown, isAmbiguous, wasUserOverridden, hadProcessingError);
  }
  
  checkAndAdapt(): NLPAdaptationResult {
    return this.monitor.checkAndAdapt();
  }
  
  getCurrentState(): NLPState {
    return this.monitor.state;
  }
  
  getMetrics(): NLPFailureMetrics {
    return this.monitor.getMetrics();
  }
}

/**
 * Options de configuration du moniteur
 */
export interface HealthMonitorOptions {
  enableAutoAdaptation: boolean;
  warningThreshold: number;
  criticalThreshold: number;
  emergencyThreshold: number;
  resetInterval: number; // Minutes
}

/**
 * Configuration par défaut
 */
export const DEFAULT_HEALTH_MONITOR_OPTIONS: HealthMonitorOptions = {
  enableAutoAdaptation: true,
  warningThreshold: 0.20,
  criticalThreshold: 0.30,
  emergencyThreshold: 0.50,
  resetInterval: 1440 // 24 heures
};