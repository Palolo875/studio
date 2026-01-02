// Governance Dashboard - Tableau de bord de gouvernance
// Affichage de l'autonomyIntegrity en temps réel

import { calculateAutonomyIntegrityScore } from './phase7Implementation';
import { SovereigntyMode } from './phase7Implementation';

// Interface pour les métriques de gouvernance
export interface GovernanceMetrics {
  autonomyIntegrityScore: number;
  userDecisions: number;
  systemDecisions: number;
  totalDecisions: number;
  currentMode: SovereigntyMode;
  burnoutRisk: number; // 0-1
  overrideRate: number; // 0-1
  lastModeChange: number; // timestamp
}

// Interface pour le tableau de bord de gouvernance
export class GovernanceDashboard {
  private metrics: GovernanceMetrics;
  private listeners: ((metrics: GovernanceMetrics) => void)[] = [];

  constructor() {
    this.metrics = {
      autonomyIntegrityScore: 0.5, // Score initial
      userDecisions: 0,
      systemDecisions: 0,
      totalDecisions: 0,
      currentMode: SovereigntyMode.GUIDED,
      burnoutRisk: 0,
      overrideRate: 0,
      lastModeChange: Date.now()
    };
  }

  getMetrics(): GovernanceMetrics {
    return { ...this.metrics };
  }

  updateBurnoutRisk(score: number): void {
    this.metrics = { ...this.metrics, burnoutRisk: Math.max(0, Math.min(1, score)) };
    this.notifyUpdate();
  }

  updateOverrideRate(rate: number): void {
    this.metrics = { ...this.metrics, overrideRate: Math.max(0, Math.min(1, rate)) };
    this.notifyUpdate();
  }

  updateCurrentMode(mode: SovereigntyMode): void {
    this.metrics = { ...this.metrics, currentMode: mode, lastModeChange: Date.now() };
    this.notifyUpdate();
  }

  // Enregistrer une décision utilisateur (override)
  recordUserDecision(): void {
    const newMetrics = {
      ...this.metrics,
      userDecisions: this.metrics.userDecisions + 1,
      totalDecisions: this.metrics.totalDecisions + 1,
    };
    newMetrics.autonomyIntegrityScore = calculateAutonomyIntegrityScore(
      newMetrics.userDecisions,
      newMetrics.systemDecisions,
      newMetrics.totalDecisions
    );
    this.metrics = newMetrics;
    this.notifyUpdate();
  }

  // Enregistrer une décision système (refus accepté)
  recordSystemDecision(): void {
    const newMetrics = {
      ...this.metrics,
      systemDecisions: this.metrics.systemDecisions + 1,
      totalDecisions: this.metrics.totalDecisions + 1,
    };
    newMetrics.autonomyIntegrityScore = calculateAutonomyIntegrityScore(
      newMetrics.userDecisions,
      newMetrics.systemDecisions,
      newMetrics.totalDecisions
    );
    this.metrics = newMetrics;
    this.notifyUpdate();
  }

  private getIntegrityAssessment(): string {
    const score = this.metrics.autonomyIntegrityScore;
    if (score >= 0.8) return 'Excellent';
    if (score >= 0.6) return 'Bon';
    if (score >= 0.4) return 'Moyen';
    return 'Faible';
  }

  private getRecommendations(): string[] {
    const recs: string[] = [];
    if (this.metrics.burnoutRisk > 0.75) recs.push('Réduire la charge et privilégier les tâches légères');
    if (this.metrics.overrideRate > 0.7) recs.push("Réévaluer les règles: taux d'override élevé");
    return recs.length ? recs : ['Continuer le suivi'];
  }

  // Enregistrer un listener pour les mises à jour
  // Retourne une fonction de désabonnement
  subscribe(callback: (metrics: GovernanceMetrics) => void): () => void {
    this.listeners.push(callback);

    // Appeler immédiatement avec l'état actuel
    callback(this.getMetrics());

    // Fonction de nettoyage
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  // Notifier tous les listeners
  private notifyUpdate() {
    const currentMetrics = this.getMetrics();
    this.listeners.forEach(listener => listener(currentMetrics));
  }

  // Générer un rapport de gouvernance
  generateReport(): string {
    const metrics = this.getMetrics();
    const assessment = this.getIntegrityAssessment();
    const recommendations = this.getRecommendations();

    return `
=== RAPPORT DE GOUVERNANCE ===

Score d'intégrité autonomie : ${(metrics.autonomyIntegrityScore * 100).toFixed(1)}%
Évaluation : ${assessment}

Décisions utilisateur : ${metrics.userDecisions}
Décisions système : ${metrics.systemDecisions}
Total décisions : ${metrics.totalDecisions}

Mode courant : ${SovereigntyMode[metrics.currentMode]}
Dernier changement de mode : ${new Date(metrics.lastModeChange).toLocaleString()}

Risque de burnout : ${(metrics.burnoutRisk * 100).toFixed(1)}%
Taux d'overrides : ${(metrics.overrideRate * 100).toFixed(1)}%

RECOMMANDATIONS :
${recommendations.map(rec => `- ${rec}`).join('\n')}

============================
`;
  }
}