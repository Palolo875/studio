import { progressiveFallback } from './progressiveFallback';
import { createLogger } from '@/lib/logger';

/**
 * Agrégateur de métriques de performance - Phase 4
 * Implémente le suivi et l'analyse des performances avec détection de dégradations
 */

// Interface pour les statistiques de performance
export interface PerformanceStats {
  avg: number;        // Moyenne
  p50: number;        // 50e percentile (médiane)
  p95: number;        // 95e percentile
  p99: number;        // 99e percentile
  max: number;        // Valeur maximale
  violations: number; // Nombre de violations de seuil
  count: number;      // Nombre d'échantillons
}

// Interface pour un rapport de performance
export interface PerformanceReport {
  name: string;
  stats: PerformanceStats | null;
}

const logger = createLogger('PerformanceTracker');

// Seuils de performance par défaut
export const PERF_BASELINES = {
  brain_100_tasks: 80,     // ms
  brain_1000_tasks: 150,   // ms (low-end)
  nlp_short: 50,           // ms
  nlp_long: 120            // ms
};

// Seuils de performance personnalisables
export const THRESHOLDS: Record<string, number> = {
  brain_decision: 100,     // ms
  nlp_extraction: 150,     // ms
  ui_render: 16,           // ms (60 FPS)
  worker_communication: 10 // ms
};

/**
 * Classe de suivi des performances
 */
export class PerformanceTracker {
  private metrics: Map<string, number[]> = new Map();
  private intervalId: NodeJS.Timeout | null = null;
  private isActive: boolean = false;
  private onDegradationCallback: ((report: PerformanceReport[]) => void) | null = null;

  /**
   * Enregistre une mesure de performance
   * @param name Nom de la métrique
   * @param duration Durée en millisecondes
   */
  record(name: string, duration: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const values = this.metrics.get(name)!;
    values.push(duration);

    // Garder seulement les 100 derniers échantillons
    if (values.length > 100) {
      values.shift();
    }
  }

  /**
   * Calcule les statistiques pour une métrique
   * @param name Nom de la métrique
   * @returns Statistiques de performance ou null si aucune donnée
   */
  getStats(name: string): PerformanceStats | null {
    const values = this.metrics.get(name) || [];
    if (values.length === 0) return null;

    // Trier les valeurs pour les calculs de percentiles
    const sortedValues = [...values].sort((a, b) => a - b);

    return {
      avg: this.mean(sortedValues),
      p50: this.percentile(sortedValues, 50),
      p95: this.percentile(sortedValues, 95),
      p99: this.percentile(sortedValues, 99),
      max: Math.max(...sortedValues),
      violations: this.countViolations(name, sortedValues),
      count: sortedValues.length
    };
  }

  /**
   * Génère un rapport complet de performance
   * @returns Rapport de performance
   */
  report(): PerformanceReport[] {
    return Array.from(this.metrics.keys()).map(name => ({
      name,
      stats: this.getStats(name)
    }));
  }

  /**
   * Calcule la moyenne d'un tableau de nombres
   * @param values Tableau de valeurs
   * @returns Moyenne
   */
  private mean(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  /**
   * Calcule un percentile d'un tableau de nombres
   * @param values Tableau de valeurs triées
   * @param percentile Percentile à calculer (0-100)
   * @returns Valeur du percentile
   */
  private percentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;

    const index = (percentile / 100) * (values.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);

    if (lower === upper) {
      return values[lower];
    }

    const weight = index - lower;
    return values[lower] * (1 - weight) + values[upper] * weight;
  }

  /**
   * Compte le nombre de violations de seuil pour une métrique
   * @param name Nom de la métrique
   * @param values Tableau de valeurs
   * @returns Nombre de violations
   */
  private countViolations(name: string, values: number[]): number {
    const threshold = THRESHOLDS[name] || PERF_BASELINES[name as keyof typeof PERF_BASELINES];
    if (!threshold) return 0;

    return values.filter(value => value > threshold).length;
  }

  /**
   * Vérifie s'il y a une dégradation de performance
   * @returns Rapport de dégradation ou null si aucune dégradation
   */
  checkDegradation(): PerformanceReport[] | null {
    const report = this.report();
    const degradedMetrics: PerformanceReport[] = [];

    for (const { name, stats } of report) {
      if (stats && stats.p95 > (THRESHOLDS[name] || PERF_BASELINES[name as keyof typeof PERF_BASELINES] || 0)) {
        degradedMetrics.push({ name, stats });
      }
    }

    return degradedMetrics.length > 0 ? degradedMetrics : null;
  }

  /**
   * Démarre le monitoring périodique des performances
   */
  startMonitoring(interval: number = 60000): void {
    if (this.intervalId) return;

    this.isActive = true;
    this.intervalId = setInterval(() => {
      const stats = this.report();

      // Construis l'objet pour le fallback
      const perfMetrics = {
        brain_avg: this.getStats('brain_decision')?.avg || 0,
        brain_p95: this.getStats('brain_decision')?.p95 || 0,
        memory_percent: 0, // Sera mis à jour par le MemoryMonitor
        ui_lag_count: this.getStats('ui_render')?.violations || 0
      };

      // Informe le système de fallback (Phase 4.5.2)
      progressiveFallback.updatePerformance(perfMetrics);

      const degradedMetrics = this.checkDegradation();
      if (degradedMetrics && this.onDegradationCallback) {
        this.onDegradationCallback(degradedMetrics);
      }
    }, interval);

    logger.info('Monitoring démarré (Phase 4)');
  }

  /**
   * Arrête le monitoring périodique
   */
  stopMonitoring(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.isActive = false;
      logger.info('Monitoring arrêté');
    }
  }

  /**
   * Définit le callback pour les dégradations de performance
   * @param callback Fonction de rappel
   */
  onDegradation(callback: (report: PerformanceReport[]) => void): void {
    this.onDegradationCallback = callback;
  }

  /**
   * Met à jour un seuil de performance
   * @param name Nom de la métrique
   * @param threshold Nouveau seuil
   */
  updateThreshold(name: string, threshold: number): void {
    THRESHOLDS[name] = threshold;
  }

  /**
   * Obtient tous les seuils de performance
   * @returns Seuils de performance
   */
  getThresholds(): Record<string, number> {
    return { ...THRESHOLDS };
  }

  /**
   * Réinitialise toutes les métriques
   */
  reset(): void {
    this.metrics.clear();
    logger.info('Métriques réinitialisées');
  }

  /**
   * Vérifie si le monitoring est actif
   * @returns true si le monitoring est actif, false sinon
   */
  isMonitoring(): boolean {
    return this.isActive;
  }
}

// Instance singleton du tracker de performance
export const performanceTracker = new PerformanceTracker();