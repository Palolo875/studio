// Transparence des adaptations - Phase 6
import { Parameters } from './adaptationMemory';

// Interface pour les logs d'adaptation
interface AdaptationLogEntry {
  date: number;
  change: string;
  reason: string;
}

// Component exemple pour l'UI de transparence
export function AdaptationPanel() {
  // Simulation des logs d'adaptation
  const logs: AdaptationLogEntry[] = [
    {
      date: Date.now() - 24 * 60 * 60 * 1000,
      change: "Augmentation de maxTasks de 4 à 5",
      reason: "Taux de tâches forcées élevé"
    },
    {
      date: Date.now() - 48 * 60 * 60 * 1000,
      change: "Réduction de strictness de 0.7 à 0.6",
      reason: "Bon taux de complétion"
    }
  ];
  
  // Paramètres actuels simulés
  const currentParams: Parameters = {
    maxTasks: 5,
    strictness: 0.6,
    coachFrequency: 1/30,
    coachEnabled: true,
    energyForecastMode: "ACCURATE",
    defaultMode: "STRICT",
    sessionBuffer: 10,
    estimationFactor: 1.0
  };
  
  return {
    title: "Adaptations du système",
    alert: {
      type: "info",
      message: "Le système s'ajuste en fonction de votre usage réel. Ces changements sont toujours réversibles."
    },
    currentParameters: {
      title: "Paramètres actuels",
      parameters: [
        { label: "Tâches max par session", value: currentParams.maxTasks },
        { label: "Niveau de structure", value: currentParams.strictness },
        { label: "Coach proactif", value: currentParams.coachEnabled }
      ]
    },
    recentChanges: {
      title: "Changements récents",
      logs: logs.map(log => ({
        date: new Date(log.date).toLocaleDateString(),
        change: log.change,
        reason: log.reason
      }))
    },
    actions: [
      { label: "Réinitialiser tous les ajustements", action: "resetAdaptation" }
    ]
  };
}

// Fonction pour formater une date
function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}