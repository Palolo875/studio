/**
 * Moniteur de qualité des décisions - Phase 5
 * Implémente le suivi et la mesure de la qualité des décisions du cerveau
 */

// Types pour la qualité des décisions
export interface DecisionQualityMetrics {
  forcingRate: number;        // Taux de forcing des décisions
  completionAccuracy: number;  // Précision des estimations de complétion
  consistencyScore: number;   // Score de cohérence des décisions
  overrideImpact: number;     // Impact des overrides sur la qualité
  overallQuality: number;     // Score de qualité global
}

export interface SessionDecisionData {
  sessionId: string;
  totalTasks: number;
  forcedTasks: number;
  completedTasks: number;
  estimatedCompletion: number;
  actualCompletion: number;
  overrides: number;
  cognitiveDebt: number;
}

/**
 * Calcule la qualité d'une décision pour une session donnée
 * @param session Données de la session
 * @returns Métriques de qualité des décisions
 */
export function calculateDecisionQuality(session: SessionDecisionData): DecisionQualityMetrics {
  // Calculer le taux de forcing
  const forcingRate = session.totalTasks > 0 ? session.forcedTasks / session.totalTasks : 0;
  
  // Calculer la précision des estimations de complétion
  const completionGap = Math.abs(session.estimatedCompletion - session.actualCompletion);
  const completionAccuracy = Math.max(0, 1 - completionGap);
  
  // Calculer le score de cohérence (inverse du taux de forcing)
  const consistencyScore = Math.max(0, 1 - forcingRate);
  
  // Calculer l'impact des overrides
  const overrideImpact = session.overrides > 0 ? 
    Math.min(1, session.cognitiveDebt / (session.overrides * 10)) : 0;
  
  // Calculer le score de qualité global
  // Pondérations : 30% forcing, 30% complétion, 20% cohérence, 20% overrides
  const overallQuality = (
    0.3 * (1 - forcingRate) +
    0.3 * completionAccuracy +
    0.2 * consistencyScore +
    0.2 * (1 - overrideImpact)
  );
  
  return {
    forcingRate,
    completionAccuracy,
    consistencyScore,
    overrideImpact,
    overallQuality
  };
}

/**
 * Suit la qualité des décisions au fil du temps
 */
export class DecisionQualityTracker {
  private qualityHistory: { date: Date; quality: DecisionQualityMetrics }[] = [];
  private alertThreshold: number = 0.5;
  private alertPeriodDays: number = 7;
  
  /**
   * Enregistre une mesure de qualité
   * @param quality Métriques de qualité à enregistrer
   */
  recordQuality(quality: DecisionQualityMetrics): void {
    this.qualityHistory.push({
      date: new Date(),
      quality
    });
    
    // Nettoyer l'historique (garder seulement les 30 derniers jours)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);
    this.qualityHistory = this.qualityHistory.filter(entry => entry.date >= cutoffDate);
    
    // Vérifier si une alerte doit être déclenchée
    this.checkForAlerts();
  }
  
  /**
   * Vérifie si des alertes doivent être déclenchées
   */
  private checkForAlerts(): void {
    // Calculer la qualité moyenne sur la période d'alerte
    const periodStart = new Date();
    periodStart.setDate(periodStart.getDate() - this.alertPeriodDays);
    
    const recentQualities = this.qualityHistory.filter(
      entry => entry.date >= periodStart
    ).map(entry => entry.quality.overallQuality);
    
    if (recentQualities.length === 0) return;
    
    const averageQuality = recentQualities.reduce((sum, q) => sum + q, 0) / recentQualities.length;
    
    if (averageQuality < this.alertThreshold) {
      this.triggerAlert(averageQuality);
    }
  }
  
  /**
   * Déclenche une alerte lorsque la qualité est insuffisante
   * @param averageQuality Qualité moyenne qui a déclenché l'alerte
   */
  private triggerAlert(averageQuality: number): void {
    console.warn(`[DecisionQuality] Alerte : Qualité des décisions basse (${(averageQuality * 100).toFixed(1)}%)`);
    
    // Dans une application réelle, cela pourrait :
    // - Afficher une notification à l'utilisateur
    // - Envoyer des données pour analyse
    // - Ajuster les paramètres du système de décision
    // - Proposer des actions de récupération
    
    // Pour cette implémentation, nous nous contentons de logger
    console.log("[DecisionQuality] Suggestions d'amélioration :");
    console.log("  - Réviser les heuristiques de décision");
    console.log("  - Ajuster les paramètres d'apprentissage");
    console.log("  - Considérer un recalibrage du modèle");
  }
  
  /**
   * Obtient l'historique de qualité
   * @returns Historique des mesures de qualité
   */
  getQualityHistory(): { date: Date; quality: DecisionQualityMetrics }[] {
    return [...this.qualityHistory];
  }
  
  /**
   * Calcule les statistiques de qualité sur une période
   * @param days Nombre de jours à analyser
   * @returns Statistiques de qualité
   */
  getQualityStats(days: number = 7): {
    averageQuality: number;
    forcingRate: number;
    completionAccuracy: number;
    consistencyScore: number;
    sampleSize: number;
  } {
    const periodStart = new Date();
    periodStart.setDate(periodStart.getDate() - days);
    
    const recentQualities = this.qualityHistory.filter(
      entry => entry.date >= periodStart
    ).map(entry => entry.quality);
    
    if (recentQualities.length === 0) {
      return {
        averageQuality: 0,
        forcingRate: 0,
        completionAccuracy: 0,
        consistencyScore: 0,
        sampleSize: 0
      };
    }
    
    const sum = recentQualities.reduce(
      (acc, q) => ({
        overallQuality: acc.overallQuality + q.overallQuality,
        forcingRate: acc.forcingRate + q.forcingRate,
        completionAccuracy: acc.completionAccuracy + q.completionAccuracy,
        consistencyScore: acc.consistencyScore + q.consistencyScore
      }),
      { overallQuality: 0, forcingRate: 0, completionAccuracy: 0, consistencyScore: 0 }
    );
    
    return {
      averageQuality: sum.overallQuality / recentQualities.length,
      forcingRate: sum.forcingRate / recentQualities.length,
      completionAccuracy: sum.completionAccuracy / recentQualities.length,
      consistencyScore: sum.consistencyScore / recentQualities.length,
      sampleSize: recentQualities.length
    };
  }
}

// Instance singleton du tracker
export const decisionQualityTracker = new DecisionQualityTracker();

/**
 * Initialise le suivi de la qualité des décisions
 */
export function initializeDecisionQualityTracking(): void {
  console.log('[DecisionQuality] Initialisation du suivi de la qualité des décisions');
  
  // Dans une application réelle, vous pourriez :
  // - Charger l'historique depuis la base de données
  // - Configurer des intervalles de vérification
  // - Connecter aux événements de décision du cerveau
  
  // Pour cette implémentation, nous nous contentons de logger
  console.log('[DecisionQuality] Suivi initialisé');
}