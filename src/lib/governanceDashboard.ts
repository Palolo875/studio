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
  private onUpdateCallback: ((metrics: GovernanceMetrics) => void) | null = null;

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

  // Mettre à jour les décisions utilisateur
  updateUserDecisions(count: number = 1) {
    this.metrics.userDecisions += count;
    this.metrics.totalDecisions += count;
    this.recalculateScores();
    this.notifyUpdate();
  }

  // Metter à jour les décisions système
  updateSystemDecisions(count: number = 1) {
    this.metrics.systemDecisions += count;
    this.metrics.totalDecisions += count;
    this.recalculateScores();
    this.notifyUpdate();
  }

  // Mettre à jour le mode courant
  updateCurrentMode(mode: SovereigntyMode) {
    this.metrics.currentMode = mode;
    this.metrics.lastModeChange = Date.now();
    this.notifyUpdate();
  }

  // Mettre à jour le risque de burnout
  updateBurnoutRisk(risk: number) {
    this.metrics.burnoutRisk = Math.max(0, Math.min(1, risk)); // Clamp entre 0 et 1
    this.notifyUpdate();
  }

  // Mettre à jour le taux d'overrides
  updateOverrideRate(rate: number) {
    this.metrics.overrideRate = Math.max(0, Math.min(1, rate)); // Clamp entre 0 et 1
    this.notifyUpdate();
  }

  // Recalculer les scores
  private recalculateScores() {
    if (this.metrics.totalDecisions > 0) {
      this.metrics.autonomyIntegrityScore = calculateAutonomyIntegrityScore(
        this.metrics.systemDecisions,
        this.metrics.userDecisions,
        this.metrics.totalDecisions
      );
    }
  }

  // Obtenir les métriques actuelles
  getMetrics(): GovernanceMetrics {
    return { ...this.metrics };
  }

  // Obtenir une évaluation textuelle du score d'intégrité
  getIntegrityAssessment(): string {
    const score = this.metrics.autonomyIntegrityScore;
    
    if (score < 0.3) {
      return "Système trop autoritaire";
    } else if (score < 0.4) {
      return "Système majoritairement autoritaire";
    } else if (score < 0.6) {
      return "Bon équilibre autorité/utilisateur";
    } else if (score < 0.7) {
      return "Utilisateur majoritairement autonome";
    } else {
      return "Utilisateur trop autonome (risque de manque de guidance)";
    }
  }

  // Obtenir des recommandations basées sur les métriques
  getRecommendations(): string[] {
    const recommendations: string[] = [];
    
    // Recommandation basée sur le score d'intégrité
    const integrityScore = this.metrics.autonomyIntegrityScore;
    if (integrityScore < 0.4) {
      recommendations.push("Le système semble trop interventionniste. Considérez plus de flexibilité.");
    } else if (integrityScore > 0.6) {
      recommendations.push("L'utilisateur semble contourner trop souvent le système. Considérez plus de guidance.");
    }
    
    // Recommandation basée sur le risque de burnout
    if (this.metrics.burnoutRisk > 0.7) {
      recommendations.push("Risque de burnout élevé détecté. Le système devrait envisager le mode protectif.");
    }
    
    // Recommandation basée sur le taux d'overrides
    if (this.metrics.overrideRate > 0.8) {
      recommendations.push("Taux d'overrides élevé. L'utilisateur contourne fréquemment le système.");
    }
    
    // Recommandation basée sur le mode courant
    switch (this.metrics.currentMode) {
      case SovereigntyMode.MANUAL:
        recommendations.push("Mode manuel actif. L'utilisateur a pris le contrôle complet.");
        break;
      case SovereigntyMode.PROTECTIVE:
        recommendations.push("Mode protectif actif. Le système protège l'utilisateur.");
        break;
    }
    
    return recommendations;
  }

  // Enregistrer un callback pour les mises à jour
  onUpdate(callback: (metrics: GovernanceMetrics) => void) {
    this.onUpdateCallback = callback;
  }

  // Notifier les mises à jour
  private notifyUpdate() {
    if (this.onUpdateCallback) {
      this.onUpdateCallback(this.getMetrics());
    }
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