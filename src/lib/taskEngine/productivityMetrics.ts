// Système de métriques de productivité - Phase 3.6
import { TaskOutcome, ProductivityMetrics, calculateProductivityMetrics } from './taskOutcome';

/**
 * Rapport de productivité
 */
export interface ProductivityReport {
  metrics: ProductivityMetrics;
  insights: string[];
  recommendations: string[];
}

/**
 * Périodes de mesure
 */
export type MeasurementPeriod = 
  | "DAILY"
  | "WEEKLY"
  | "MONTHLY"
  | "QUARTERLY";

/**
 * Générateur de rapports de productivité
 */
export class ProductivityReporter {
  private outcomes: TaskOutcome[] = [];
  
  /**
   * Ajoute un résultat de tâche
   */
  addTaskOutcome(outcome: TaskOutcome): void {
    this.outcomes.push(outcome);
  }
  
  /**
   * Obtient les métriques de productivité pour une période donnée
   */
  getMetrics(period: MeasurementPeriod = "WEEKLY"): ProductivityMetrics {
    // Filtrer les résultats selon la période
    const filteredOutcomes = this.filterOutcomesByPeriod(period);
    return calculateProductivityMetrics(filteredOutcomes);
  }
  
  /**
   * Génère un rapport de productivité
   */
  generateReport(period: MeasurementPeriod = "WEEKLY"): ProductivityReport {
    const metrics = this.getMetrics(period);
    const insights: string[] = [];
    const recommendations: string[] = [];
    
    // Générer des insights basés sur les métriques
    if (metrics.tangibleTasksCompleted === 0) {
      insights.push("Aucune tâche tangible n'a été complétée cette période.");
      recommendations.push("Essayez de décomposer les grandes tâches en livrables plus petits.");
    } else {
      insights.push(`${metrics.tangibleTasksCompleted} tâche(s) tangible(s) complétée(s).`);
    }
    
    if (metrics.avgEffortPerImpact > 9) {
      insights.push("Le ratio effort/impact est élevé.");
      recommendations.push("Identifiez des tâches à fort impact avec moins d'effort.");
    }
    
    if (metrics.completionRate < 0.5) {
      insights.push("Le taux de complétion est faible.");
      recommendations.push("Revoyez vos priorités ou ajustez vos estimations.");
    }
    
    if (metrics.avgTimeToResult > 120) {
      insights.push("Le temps moyen pour atteindre un résultat est long.");
      recommendations.push("Décomposez les tâches en étapes plus petites.");
    }
    
    // Ajouter des recommandations générales si aucune n'a été générée
    if (recommendations.length === 0) {
      recommendations.push("Continuez sur cette lancée !");
      recommendations.push("Pensez à célébrer les petites victoires.");
    }
    
    return {
      metrics,
      insights,
      recommendations
    };
  }
  
  /**
   * Filtre les résultats selon une période
   */
  private filterOutcomesByPeriod(period: MeasurementPeriod): TaskOutcome[] {
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case "DAILY":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        break;
      case "WEEKLY":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        break;
      case "MONTHLY":
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      case "QUARTERLY":
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
    }
    
    return this.outcomes.filter(outcome => 
      outcome.completedAt && outcome.completedAt >= startDate
    );
  }
  
  /**
   * Réinitialise les données
   */
  reset(): void {
    this.outcomes = [];
  }
}

// Instance singleton pour le reporting
export const productivityReporter = new ProductivityReporter();

/**
 * Formate un rapport de productivité pour l'affichage
 */
export function formatProductivityReport(report: ProductivityReport): string {
  let output = "=== RAPPORT DE PRODUCTIVITÉ ===\n\n";
  
  output += `Période: ${report.metrics.period.start.toLocaleDateString()} - ${report.metrics.period.end.toLocaleDateString()}\n`;
  output += `Tâches tangibles complétées: ${report.metrics.tangibleTasksCompleted}\n`;
  output += `Ratio effort/impact moyen: ${report.metrics.avgEffortPerImpact.toFixed(2)}\n`;
  output += `Taux de complétion: ${(report.metrics.completionRate * 100).toFixed(1)}%\n`;
  output += `Temps moyen jusqu'au résultat: ${Math.round(report.metrics.avgTimeToResult)} minutes\n\n`;
  
  output += "INSIGHTS:\n";
  for (const insight of report.insights) {
    output += `- ${insight}\n`;
  }
  
  output += "\nRECOMMANDATIONS:\n";
  for (const recommendation of report.recommendations) {
    output += `- ${recommendation}\n`;
  }
  
  return output;
}