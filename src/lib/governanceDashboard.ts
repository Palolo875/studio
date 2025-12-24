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

  // ... (méthodes update inchangées)

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