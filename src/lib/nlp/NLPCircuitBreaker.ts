/**
 * Mécanisme de dégradation automatique du NLP (circuit breaker)
 * Implémente un système de surveillance et d'adaptation automatique
 * du comportement du NLP basé sur les métriques de performance
 * 
 * CORRECTION DE LA PHASE 2 : Ajout du circuit breaker pour la dégradation automatique
 */

import { NLPTelemetryService, NLPTelemetryMetrics, TelemetryMode } from './TelemetryService';
import { createLogger } from '@/lib/logger';

const logger = createLogger('NLPCircuitBreaker');

// Interface pour les seuils du circuit breaker
export interface CircuitBreakerThresholds {
  warning: number;      // 20% unknown
  critical: number;     // 30% unknown
  emergency: number;    // 50% unknown
  confidenceMin: number; // Confiance minimale acceptable
  overrideMax: number;  // Taux max de remplacements utilisateur
  errorMax: number;     // Taux max d'erreurs de traitement
}

// Interface pour l'état du circuit breaker
export interface CircuitBreakerState {
  mode: 'HEALTHY' | 'DEGRADED' | 'EMERGENCY' | 'MAINTENANCE';
  lastCheck: Date;
  metrics: NLPTelemetryMetrics;
  reason: string;
  config: NLPAdaptationConfig;
}

// Interface pour la configuration d'adaptation
export interface NLPAdaptationConfig {
  ml_enabled: boolean;              // Activation du ML
  rule_based_only: boolean;         // Mode règles uniquement
  confidence_threshold: number;     // Seuil de confiance
  split_aggressive: boolean;        // Découpage agressif
  require_verb: boolean;            // Besoin de verbe
  fallback_mode: 'RAW_CAPTURE_ONLY' | 'STRICT_RULES_ONLY' | 'HYBRID';
  processing_timeout_ms: number;    // Timeout de traitement
}

// Service de circuit breaker pour le NLP
export class NLPCircuitBreaker {
  private telemetryService: NLPTelemetryService;
  private thresholds: CircuitBreakerThresholds;
  private currentState: CircuitBreakerState;
  private adaptationHistory: CircuitBreakerState[];

  constructor(telemetryService: NLPTelemetryService, thresholds?: Partial<CircuitBreakerThresholds>) {
    this.telemetryService = telemetryService;
    
    // Seuils par défaut
    this.thresholds = {
      warning: thresholds?.warning ?? 0.20,      // 20% unknown
      critical: thresholds?.critical ?? 0.30,     // 30% unknown
      emergency: thresholds?.emergency ?? 0.50,   // 50% unknown
      confidenceMin: thresholds?.confidenceMin ?? 0.65, // Confiance minimale
      overrideMax: thresholds?.overrideMax ?? 0.25,     // 25% de remplacements
      errorMax: thresholds?.errorMax ?? 0.10          // 10% d'erreurs
    };

    // État initial
    this.currentState = {
      mode: 'HEALTHY',
      lastCheck: new Date(),
      metrics: this.telemetryService.getMetrics(),
      reason: 'Initial state',
      config: this.getDefaultConfig()
    };

    this.adaptationHistory = [this.currentState];
  }

  /**
   * Vérifie l'état du système NLP et adapte automatiquement si nécessaire
   */
  public checkAndAdapt(): NLPAdaptationConfig {
    const metrics = this.telemetryService.getMetrics();
    const recentMetrics = this.telemetryService.getRecentMetrics();
    
    // Calcul des taux
    const unknownRate = recentMetrics.totalTasks > 0 ? recentMetrics.unknownTasks / recentMetrics.totalTasks : 0;
    const ambiguousRate = recentMetrics.totalTasks > 0 ? recentMetrics.ambiguousTasks / recentMetrics.totalTasks : 0;
    const errorRate = recentMetrics.totalTasks > 0 ? recentMetrics.processingErrors / recentMetrics.totalTasks : 0;
    const overrideRate = recentMetrics.totalTasks > 0 ? recentMetrics.userOverrides / recentMetrics.totalTasks : 0;
    
    // Décision de l'état
    let newState: CircuitBreakerState;
    
    // Vérifier les conditions d'urgence en premier
    if (unknownRate >= this.thresholds.emergency || errorRate >= this.thresholds.errorMax) {
      newState = {
        mode: 'EMERGENCY',
        lastCheck: new Date(),
        metrics,
        reason: `Taux d'unknown trop élevé (${(unknownRate * 100).toFixed(1)}%) ou erreurs critiques (${(errorRate * 100).toFixed(1)}%)`,
        config: this.getEmergencyConfig()
      };
    }
    // Vérifier les conditions critiques
    else if (unknownRate >= this.thresholds.critical || 
             ambiguousRate >= this.thresholds.critical || 
             overrideRate >= this.thresholds.overrideMax) {
      newState = {
        mode: 'DEGRADED',
        lastCheck: new Date(),
        metrics,
        reason: `Taux d'unknown (${(unknownRate * 100).toFixed(1)}%), ambiguë (${(ambiguousRate * 100).toFixed(1)}%) ou remplacements (${(overrideRate * 100).toFixed(1)}%) trop élevés`,
        config: this.getDegradedConfig()
      };
    }
    // Vérifier les conditions d'avertissement
    else if (unknownRate >= this.thresholds.warning || 
             recentMetrics.averageConfidence < this.thresholds.confidenceMin) {
      newState = {
        mode: 'DEGRADED',
        lastCheck: new Date(),
        metrics,
        reason: `Taux d'unknown élevé (${(unknownRate * 100).toFixed(1)}%) ou confiance faible (${recentMetrics.averageConfidence.toFixed(2)})`,
        config: this.getWarningConfig()
      };
    }
    // Sinon, mode sain
    else {
      newState = {
        mode: 'HEALTHY',
        lastCheck: new Date(),
        metrics,
        reason: 'Taux dans les limites acceptables',
        config: this.getHealthyConfig()
      };
    }

    // Mettre à jour l'état
    this.currentState = newState;
    this.adaptationHistory.push(newState);

    // Logguer le changement d'état
    if (this.currentState.mode !== this.adaptationHistory[this.adaptationHistory.length - 2]?.mode) {
      logger.warn(`Circuit breaker state changed: ${this.currentState.reason}`, {
        previousMode: this.adaptationHistory[this.adaptationHistory.length - 2]?.mode || 'N/A',
        currentMode: this.currentState.mode,
        metrics: {
          unknownRate: (unknownRate * 100).toFixed(1),
          ambiguousRate: (ambiguousRate * 100).toFixed(1),
          errorRate: (errorRate * 100).toFixed(1),
          overrideRate: (overrideRate * 100).toFixed(1),
          avgConfidence: recentMetrics.averageConfidence.toFixed(2)
        }
      });
    }

    return this.currentState.config;
  }

  /**
   * Vérifie si le mode NLP doit être changé sans adaptation automatique
   */
  public checkStateOnly(): CircuitBreakerState {
    // Même logique que checkAndAdapt mais sans changer l'état interne
    const metrics = this.telemetryService.getMetrics();
    const recentMetrics = this.telemetryService.getRecentMetrics();
    
    // Calcul des taux
    const unknownRate = recentMetrics.totalTasks > 0 ? recentMetrics.unknownTasks / recentMetrics.totalTasks : 0;
    const ambiguousRate = recentMetrics.totalTasks > 0 ? recentMetrics.ambiguousTasks / recentMetrics.totalTasks : 0;
    const errorRate = recentMetrics.totalTasks > 0 ? recentMetrics.processingErrors / recentMetrics.totalTasks : 0;
    const overrideRate = recentMetrics.totalTasks > 0 ? recentMetrics.userOverrides / recentMetrics.totalTasks : 0;
    
    // Décision de l'état
    if (unknownRate >= this.thresholds.emergency || errorRate >= this.thresholds.errorMax) {
      return {
        mode: 'EMERGENCY',
        lastCheck: new Date(),
        metrics,
        reason: `Taux d'unknown trop élevé (${(unknownRate * 100).toFixed(1)}%) ou erreurs critiques (${(errorRate * 100).toFixed(1)}%)`,
        config: this.getEmergencyConfig()
      };
    }
    else if (unknownRate >= this.thresholds.critical || 
             ambiguousRate >= this.thresholds.critical || 
             overrideRate >= this.thresholds.overrideMax) {
      return {
        mode: 'DEGRADED',
        lastCheck: new Date(),
        metrics,
        reason: `Taux d'unknown (${(unknownRate * 100).toFixed(1)}%), ambiguë (${(ambiguousRate * 100).toFixed(1)}%) ou remplacements (${(overrideRate * 100).toFixed(1)}%) trop élevés`,
        config: this.getDegradedConfig()
      };
    }
    else if (unknownRate >= this.thresholds.warning || 
             recentMetrics.averageConfidence < this.thresholds.confidenceMin) {
      return {
        mode: 'DEGRADED',
        lastCheck: new Date(),
        metrics,
        reason: `Taux d'unknown élevé (${(unknownRate * 100).toFixed(1)}%) ou confiance faible (${recentMetrics.averageConfidence.toFixed(2)})`,
        config: this.getWarningConfig()
      };
    }
    else {
      return {
        mode: 'HEALTHY',
        lastCheck: new Date(),
        metrics,
        reason: 'Taux dans les limites acceptables',
        config: this.getHealthyConfig()
      };
    }
  }

  /**
   * Force le mode de dégradation (pour tests ou interventions manuelles)
   */
  public forceMode(mode: 'HEALTHY' | 'DEGRADED' | 'EMERGENCY' | 'MAINTENANCE', reason: string = 'Manual override'): NLPAdaptationConfig {
    let config: NLPAdaptationConfig;
    
    switch (mode) {
      case 'EMERGENCY':
        config = this.getEmergencyConfig();
        break;
      case 'DEGRADED':
        config = this.getDegradedConfig();
        break;
      case 'MAINTENANCE':
        config = this.getMaintenanceConfig();
        break;
      default:
        config = this.getHealthyConfig();
    }

    this.currentState = {
      mode,
      lastCheck: new Date(),
      metrics: this.telemetryService.getMetrics(),
      reason,
      config
    };

    this.adaptationHistory.push(this.currentState);

    logger.info(`Circuit breaker mode forced: ${mode} - ${reason}`);

    return config;
  }

  /**
   * Récupère la configuration par défaut
   */
  private getDefaultConfig(): NLPAdaptationConfig {
    return {
      ml_enabled: true,
      rule_based_only: false,
      confidence_threshold: 0.70,
      split_aggressive: true,
      require_verb: true,
      fallback_mode: 'HYBRID',
      processing_timeout_ms: 200
    };
  }

  /**
   * Récupère la configuration pour le mode sain
   */
  private getHealthyConfig(): NLPAdaptationConfig {
    return {
      ml_enabled: true,
      rule_based_only: false,
      confidence_threshold: 0.70,
      split_aggressive: true,
      require_verb: true,
      fallback_mode: 'HYBRID',
      processing_timeout_ms: 200
    };
  }

  /**
   * Récupère la configuration pour le mode avertissement
   */
  private getWarningConfig(): NLPAdaptationConfig {
    return {
      ml_enabled: true,
      rule_based_only: false,
      confidence_threshold: 0.75, // Seuil plus strict
      split_aggressive: false,    // Moins de découpage
      require_verb: false,        // Accepter phrases nominales
      fallback_mode: 'STRICT_RULES_ONLY',
      processing_timeout_ms: 300  // Plus de temps pour les règles
    };
  }

  /**
   * Récupère la configuration pour le mode dégradé
   */
  private getDegradedConfig(): NLPAdaptationConfig {
    return {
      ml_enabled: false,          // Désactiver ML
      rule_based_only: true,
      confidence_threshold: 0.80, // Seuil très strict
      split_aggressive: false,
      require_verb: false,
      fallback_mode: 'RAW_CAPTURE_ONLY',
      processing_timeout_ms: 150
    };
  }

  /**
   * Récupère la configuration pour le mode urgence
   */
  private getEmergencyConfig(): NLPAdaptationConfig {
    return {
      ml_enabled: false,          // Désactiver complètement ML
      rule_based_only: false,     // Mode capture brute
      confidence_threshold: 0.50, // Accepter plus de tâches
      split_aggressive: false,
      require_verb: false,
      fallback_mode: 'RAW_CAPTURE_ONLY', // Mode capture brute
      processing_timeout_ms: 100
    };
  }

  /**
   * Récupère la configuration pour le mode maintenance
   */
  private getMaintenanceConfig(): NLPAdaptationConfig {
    return {
      ml_enabled: false,
      rule_based_only: false,
      confidence_threshold: 0.0, // Accepter tout
      split_aggressive: false,
      require_verb: false,
      fallback_mode: 'RAW_CAPTURE_ONLY',
      processing_timeout_ms: 50
    };
  }

  /**
   * Récupère l'état actuel du circuit breaker
   */
  public getState(): CircuitBreakerState {
    return { ...this.currentState };
  }

  /**
   * Récupère l'historique des adaptations
   */
  public getAdaptationHistory(): CircuitBreakerState[] {
    return [...this.adaptationHistory];
  }

  /**
   * Réinitialise l'historique
   */
  public resetHistory(): void {
    this.adaptationHistory = [this.currentState];
  }

  /**
   * Met à jour les seuils
   */
  public updateThresholds(newThresholds: Partial<CircuitBreakerThresholds>): void {
    this.thresholds = { ...this.thresholds, ...newThresholds };
    logger.info('Circuit breaker thresholds updated', this.thresholds);
  }

  /**
   * Vérifie si le système est dans un mode dégradé
   */
  public isDegraded(): boolean {
    return this.currentState.mode !== 'HEALTHY';
  }

  /**
   * Récupère le message à afficher à l'utilisateur en fonction du mode
   */
  public getUserMessage(): string {
    switch (this.currentState.mode) {
      case 'EMERGENCY':
        return "Je note exactement ce que tu écris. On structurera plus tard.";
      case 'DEGRADED':
        return "Mode capture simple activé. Je m'adapterai à mesure que tu progresses.";
      case 'MAINTENANCE':
        return "Système en maintenance. Veuillez réessayer plus tard.";
      default:
        return "Je suis pleinement opérationnel pour t'aider à organiser tes tâches.";
    }
  }
}

// Instance singleton du circuit breaker
let nlpCircuitBreakerInstance: NLPCircuitBreaker | null = null;

export function getNLPCircuitBreaker(telemetryService: NLPTelemetryService): NLPCircuitBreaker {
  if (!nlpCircuitBreakerInstance) {
    nlpCircuitBreakerInstance = new NLPCircuitBreaker(telemetryService);
  }
  return nlpCircuitBreakerInstance;
}