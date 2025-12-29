/**
 * Système de fallbacks progressifs - Phase 4
 * Implémente une dégradation graduelle des fonctionnalités en cas de problème
 */

import { createLogger } from '@/lib/logger';

const logger = createLogger('ProgressiveFallback');

// Niveaux de fallback
export enum FallbackLevel {
  LEVEL_0 = "Normal",        // Tous systèmes actifs
  LEVEL_1 = "Optimized",     // - Désactive Coach proactif
                             // - Réduit freq snapshots
                             // - Cache plus agressif
  LEVEL_2 = "Simple",        // - Brain = règles simples
                             // - NLP = heuristiques only
                             // - Max 3 tâches
  LEVEL_3 = "Survival"       // - Aucune IA
                             // - Liste simple
                             // - Mode readonly partiel
}

// Interface pour les métriques de performance
export interface PerformanceMetrics {
  brain_avg: number;         // Temps moyen de décision du cerveau
  brain_p95: number;         // 95e percentile du temps de décision
  memory_percent: number;     // Pourcentage d'utilisation mémoire
  ui_lag_count: number;      // Nombre de lags UI
}

// Configuration des seuils pour chaque niveau
export const FALLBACK_THRESHOLDS = {
  brain_avg: 150,            // ms
  brain_p95: 120,            // ms
  memory_percent: 85,        // %
  ui_lag_count: 10           // count
};

/**
 * Classe de gestion des fallbacks progressifs
 */
export class ProgressiveFallback {
  private currentLevel: FallbackLevel = FallbackLevel.LEVEL_0;
  private performanceMetrics: PerformanceMetrics = {
    brain_avg: 0,
    brain_p95: 0,
    memory_percent: 0,
    ui_lag_count: 0
  };
  private onLevelChangeCallback: ((from: FallbackLevel, to: FallbackLevel) => void) | null = null;
  
  /**
   * Sélectionne le niveau de fallback approprié en fonction des métriques
   * @param perf Métriques de performance
   * @returns Niveau de fallback approprié
   */
  selectFallbackLevel(perf: PerformanceMetrics): FallbackLevel {
    if (perf.brain_avg > FALLBACK_THRESHOLDS.brain_avg) return FallbackLevel.LEVEL_2;
    if (perf.brain_p95 > FALLBACK_THRESHOLDS.brain_p95) return FallbackLevel.LEVEL_1;
    if (perf.memory_percent > FALLBACK_THRESHOLDS.memory_percent) return FallbackLevel.LEVEL_2;
    if (perf.ui_lag_count > FALLBACK_THRESHOLDS.ui_lag_count) return FallbackLevel.LEVEL_1;
    return FallbackLevel.LEVEL_0;
  }
  
  /**
   * Met à jour les métriques de performance et adapte le niveau de fallback si nécessaire
   * @param perf Nouvelles métriques de performance
   */
  updatePerformance(perf: PerformanceMetrics): void {
    this.performanceMetrics = { ...perf };
    this.adaptFallbackLevel();
  }
  
  /**
   * Adapte automatiquement le niveau de fallback en fonction des métriques actuelles
   */
  private adaptFallbackLevel(): void {
    const newLevel = this.selectFallbackLevel(this.performanceMetrics);
    
    if (newLevel !== this.currentLevel) {
      const oldLevel = this.currentLevel;
      this.currentLevel = newLevel;
      
      logger.info('Changement de niveau', { from: oldLevel, to: newLevel });
      
      // Appeler le callback si défini
      if (this.onLevelChangeCallback) {
        this.onLevelChangeCallback(oldLevel, newLevel);
      }
      
      // Appliquer les changements spécifiques au niveau
      this.applyLevelChanges(newLevel);
    }
  }
  
  /**
   * Applique les changements spécifiques à un niveau de fallback
   * @param level Niveau de fallback
   */
  private applyLevelChanges(level: FallbackLevel): void {
    switch (level) {
      case FallbackLevel.LEVEL_0:
        logger.info('Mode Normal: Tous les systèmes actifs');
        break;
        
      case FallbackLevel.LEVEL_1:
        logger.info('Mode Optimized: Désactivation du Coach proactif, cache agressif');
        // Implémenter les changements spécifiques au niveau 1
        this.disableProactiveCoach();
        this.enableAggressiveCaching();
        this.reduceSnapshotFrequency();
        break;
        
      case FallbackLevel.LEVEL_2:
        logger.info('Mode Simple: Brain en mode règles, NLP heuristique');
        // Implémenter les changements spécifiques au niveau 2
        this.enableSimpleBrainMode();
        this.enableHeuristicNLP();
        this.limitTaskCount(3);
        break;
        
      case FallbackLevel.LEVEL_3:
        logger.info('Mode Survival: Aucune IA, mode readonly');
        // Implémenter les changements spécifiques au niveau 3
        this.disableAllAI();
        this.enableReadOnlyMode();
        this.simplifyTaskList();
        break;
    }
  }
  
  /**
   * Désactive le coach proactif
   */
  private disableProactiveCoach(): void {
    // Implémentation spécifique à l'application
    logger.debug('Coach proactif désactivé');
  }
  
  /**
   * Active le cache agressif
   */
  private enableAggressiveCaching(): void {
    // Implémentation spécifique à l'application
    logger.debug('Cache agressif activé');
  }
  
  /**
   * Réduit la fréquence des snapshots
   */
  private reduceSnapshotFrequency(): void {
    // Implémentation spécifique à l'application
    logger.debug('Fréquence des snapshots réduite');
  }
  
  /**
   * Active le mode cerveau simple
   */
  private enableSimpleBrainMode(): void {
    // Implémentation spécifique à l'application
    logger.debug('Mode cerveau simple activé');
  }
  
  /**
   * Active le NLP heuristique
   */
  private enableHeuristicNLP(): void {
    // Implémentation spécifique à l'application
    logger.debug('NLP heuristique activé');
  }
  
  /**
   * Limite le nombre de tâches
   * @param maxTasks Nombre maximum de tâches
   */
  private limitTaskCount(maxTasks: number): void {
    // Implémentation spécifique à l'application
    logger.debug('Nombre de tâches limité', { maxTasks });
  }
  
  /**
   * Désactive toute l'IA
   */
  private disableAllAI(): void {
    // Implémentation spécifique à l'application
    logger.debug("Toute l'IA désactivée");
  }
  
  /**
   * Active le mode lecture seule
   */
  private enableReadOnlyMode(): void {
    // Implémentation spécifique à l'application
    logger.debug('Mode lecture seule activé');
  }
  
  /**
   * Simplifie la liste des tâches
   */
  private simplifyTaskList(): void {
    // Implémentation spécifique à l'application
    logger.debug('Liste des tâches simplifiée');
  }
  
  /**
   * Obtient le niveau de fallback actuel
   * @returns Niveau de fallback actuel
   */
  getCurrentLevel(): FallbackLevel {
    return this.currentLevel;
  }
  
  /**
   * Obtient les métriques de performance actuelles
   * @returns Métriques de performance actuelles
   */
  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics };
  }
  
  /**
   * Force un niveau de fallback spécifique
   * @param level Niveau de fallback à forcer
   */
  forceFallbackLevel(level: FallbackLevel): void {
    const oldLevel = this.currentLevel;
    this.currentLevel = level;
    
    logger.info('Niveau forcé', { from: oldLevel, to: level });
    
    // Appeler le callback si défini
    if (this.onLevelChangeCallback) {
      this.onLevelChangeCallback(oldLevel, level);
    }
    
    // Appliquer les changements
    this.applyLevelChanges(level);
  }
  
  /**
   * Définit le callback pour les changements de niveau
   * @param callback Fonction de rappel
   */
  onLevelChange(callback: (from: FallbackLevel, to: FallbackLevel) => void): void {
    this.onLevelChangeCallback = callback;
  }
  
  /**
   * Réinitialise le système de fallback
   */
  reset(): void {
    this.currentLevel = FallbackLevel.LEVEL_0;
    this.performanceMetrics = {
      brain_avg: 0,
      brain_p95: 0,
      memory_percent: 0,
      ui_lag_count: 0
    };
    
    logger.info('Système réinitialisé');
  }
}

// Instance singleton du système de fallback progressif
export const progressiveFallback = new ProgressiveFallback();