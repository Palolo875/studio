/**
 * Service de télémétrie pour le suivi des performances et des échecs du NLP
 * Collecte des métriques d'échec et activation du mode RAW_CAPTURE_ONLY si nécessaire
 */

import { createLogger } from '@/lib/logger';

const logger = createLogger('NLPTelemetryService');

// Interface pour les métriques de télémétrie NLP
export interface NLPTelemetryMetrics {
  totalTasks: number;
  unknownTasks: number;
  ambiguousTasks: number;
  splitFailures: number;
  userOverrides: number;
  processingErrors: number;
  averageConfidence: number;
  languageDistribution: Record<string, number>;
  processingTimeMs: number;
}

// Interface pour les paramètres de télémétrie
export interface TelemetryConfig {
  maxUnknownRate: number;        // Seuil maximal pour unknown_rate (ex: 0.3 = 30%)
  maxAmbiguousRate: number;      // Seuil maximal pour ambiguous_rate
  minConfidenceThreshold: number; // Seuil minimal de confiance
  windowSize: number;            // Nombre de tâches dans la fenêtre de calcul
}

// États du service de télémétrie
export type TelemetryMode = 'NORMAL' | 'RAW_CAPTURE_ONLY' | 'DEGRADED';

// Service de télémétrie
export class NLPTelemetryService {
  private metrics: NLPTelemetryMetrics;
  private config: TelemetryConfig;
  private taskHistory: any[]; // Historique des tâches traitées
  private mode: TelemetryMode;
  
  constructor(config?: Partial<TelemetryConfig>) {
    this.config = {
      maxUnknownRate: config?.maxUnknownRate ?? 0.3,
      maxAmbiguousRate: config?.maxAmbiguousRate ?? 0.2,
      minConfidenceThreshold: config?.minConfidenceThreshold ?? 0.7,
      windowSize: config?.windowSize ?? 50
    };
    
    this.metrics = {
      totalTasks: 0,
      unknownTasks: 0,
      ambiguousTasks: 0,
      splitFailures: 0,
      userOverrides: 0,
      processingErrors: 0,
      averageConfidence: 0,
      languageDistribution: {},
      processingTimeMs: 0
    };
    
    this.taskHistory = [];
    this.mode = 'NORMAL';
  }
  
  // Enregistre une tâche traitée
  recordTask(task: any, processingTimeMs: number): void {
    this.metrics.totalTasks++;
    this.metrics.processingTimeMs += processingTimeMs;
    
    // Mettre à jour les compteurs selon les propriétés de la tâche
    if (task.metadata?.flags?.unknown) {
      this.metrics.unknownTasks++;
    }
    
    if (task.metadata?.flags?.ambiguous) {
      this.metrics.ambiguousTasks++;
    }
    
    if (task.metadata?.flags?.split_from_compound === false) {
      this.metrics.splitFailures++;
    }
    
    // Mettre à jour la confiance moyenne
    if (task.confidence !== undefined) {
      const currentSum = this.metrics.averageConfidence * (this.metrics.totalTasks - 1);
      this.metrics.averageConfidence = (currentSum + task.confidence) / this.metrics.totalTasks;
    }
    
    // Mettre à jour la distribution des langues
    const lang = task.metadata?.detectedLang || 'unknown';
    this.metrics.languageDistribution[lang] = (this.metrics.languageDistribution[lang] || 0) + 1;
    
    // Ajouter à l'historique
    this.taskHistory.push({
      task,
      processingTimeMs,
      timestamp: Date.now()
    });
    
    // Nettoyer l'historique pour ne garder que les tâches récentes
    if (this.taskHistory.length > this.config.windowSize) {
      this.taskHistory.shift();
    }
    
    // Vérifier si le mode doit être changé
    this.checkAndApplyMode();
  }
  
  // Enregistre un remplacement utilisateur
  recordUserOverride(): void {
    this.metrics.userOverrides++;
    this.checkAndApplyMode();
  }
  
  // Enregistre une erreur de traitement
  recordProcessingError(): void {
    this.metrics.processingErrors++;
    this.checkAndApplyMode();
  }
  
  // Vérifie les seuils et applique le mode approprié
  private checkAndApplyMode(): void {
    const recentTasks = this.getRecentTasks();
    const metrics = this.calculateMetrics(recentTasks);
    
    // Vérifier si le taux d'unknown est trop élevé
    if (metrics.unknownRate > this.config.maxUnknownRate) {
      this.mode = 'RAW_CAPTURE_ONLY';
      logger.warn("Mode RAW_CAPTURE_ONLY activé : taux d'unknown trop élevé");
      return;
    }
    
    // Vérifier si le taux d'ambiguous est trop élevé
    if (metrics.ambiguousRate > this.config.maxAmbiguousRate) {
      this.mode = 'RAW_CAPTURE_ONLY';
      logger.warn("Mode RAW_CAPTURE_ONLY activé : taux d'ambiguous trop élevé");
      return;
    }
    
    // Vérifier si la confiance moyenne est trop basse
    if (metrics.averageConfidence < this.config.minConfidenceThreshold) {
      this.mode = 'DEGRADED';
      logger.warn('Mode DEGRADED activé : confiance moyenne trop basse');
      return;
    }
    
    // Sinon, mode normal
    this.mode = 'NORMAL';
  }
  
  // Obtient les tâches récentes dans la fenêtre de calcul
  private getRecentTasks(): any[] {
    return this.taskHistory.slice(-this.config.windowSize);
  }
  
  // Calcule les métriques à partir d'un ensemble de tâches
  private calculateMetrics(tasks: any[]): NLPTelemetryMetrics {
    const total = tasks.length;
    if (total === 0) {
      return { ...this.metrics };
    }
    
    let unknownCount = 0;
    let ambiguousCount = 0;
    let splitFailures = 0;
    let confidenceSum = 0;
    const languageDist: Record<string, number> = {};
    let totalTime = 0;
    
    for (const entry of tasks) {
      const task = entry.task;
      
      if (task.metadata?.flags?.unknown) unknownCount++;
      if (task.metadata?.flags?.ambiguous) ambiguousCount++;
      if (task.metadata?.flags?.split_from_compound === false) splitFailures++;
      
      if (task.confidence !== undefined) {
        confidenceSum += task.confidence;
      }
      
      const lang = task.metadata?.detectedLang || 'unknown';
      languageDist[lang] = (languageDist[lang] || 0) + 1;
      
      totalTime += entry.processingTimeMs;
    }
    
    return {
      totalTasks: total,
      unknownTasks: unknownCount,
      ambiguousTasks: ambiguousCount,
      splitFailures,
      userOverrides: this.metrics.userOverrides,
      processingErrors: this.metrics.processingErrors,
      averageConfidence: confidenceSum / total,
      languageDistribution: languageDist,
      processingTimeMs: totalTime
    };
  }
  
  // Obtient les métriques actuelles
  getMetrics(): NLPTelemetryMetrics {
    return { ...this.metrics };
  }
  
  // Obtient les métriques calculées pour la fenêtre récente
  getRecentMetrics(): NLPTelemetryMetrics {
    const recentTasks = this.getRecentTasks();
    return this.calculateMetrics(recentTasks);
  }
  
  // Obtient le mode actuel
  getMode(): TelemetryMode {
    return this.mode;
  }
  
  // Force le mode (pour les tests ou interventions manuelles)
  setMode(mode: TelemetryMode): void {
    this.mode = mode;
  }
  
  // Réinitialise les métriques
  reset(): void {
    this.metrics = {
      totalTasks: 0,
      unknownTasks: 0,
      ambiguousTasks: 0,
      splitFailures: 0,
      userOverrides: 0,
      processingErrors: 0,
      averageConfidence: 0,
      languageDistribution: {},
      processingTimeMs: 0
    };
    this.taskHistory = [];
    this.mode = 'NORMAL';
  }
  
  // Exporte les métriques pour l'analyse
  exportMetrics(): string {
    return JSON.stringify({
      metrics: this.metrics,
      mode: this.mode,
      config: this.config,
      recentMetrics: this.getRecentMetrics()
    }, null, 2);
  }
}

// Instance singleton du service de télémétrie
export const nlpTelemetryService = new NLPTelemetryService();