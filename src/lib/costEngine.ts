// Cost Engine - Calcul du coût des overrides et responsabilisation
// Implémentation du calcul du coût intégré dans l'UI

import { OverrideCostCalculation } from './phase7Implementation';

type TaskLike = {
  effort?: string;
};

// Interface pour le contexte utilisateur
export interface UserContext {
  energy: "HIGH" | "MEDIUM" | "LOW";
  dailyBudget: {
    remaining: number;
    total: number;
  };
  burnoutScore: number;
  overridesLast2h: number;
}

// Fonction pour calculer le coût d'un override
export function computeOverrideCost(
  task: TaskLike,
  context: UserContext
): OverrideCostCalculation {
  const base = 0.2;
  
  // Déterminer l'effort de la tâche (simulé)
  const taskEffort = task.effort || "MEDIUM";
  
  const mult = {
    taskEffort: taskEffort === "HEAVY" ? 2 : taskEffort === "LIGHT" ? 0.5 : 1,
    energyMismatch: (taskEffort === "HEAVY" && context.energy === "LOW") ? 1.5 : 1,
    burnoutSignals: 1 + (context.burnoutScore * 0.2),
    recentOverrides: context.overridesLast2h > 0 ? 1.3 : 1
  };
  
  const total = base * Object.values(mult).reduce((a, b) => a * b, 1);
  
  // Déterminer le niveau d'avertissement
  let warningLevel: "LOW" | "MEDIUM" | "HIGH" = "LOW";
  if (total > 0.5) {
    warningLevel = "HIGH";
  } else if (total > 0.3) {
    warningLevel = "MEDIUM";
  }
  
  return {
    baseCost: base,
    multipliers: mult,
    total: total,
    consequences: {
      budgetReduction: total * context.dailyBudget.remaining,
      protectionDisabled: mult.burnoutSignals > 1.4,
      warningLevel: warningLevel
    }
  };
}

// Fonction pour formater le coût pour l'affichage
export function formatCost(cost: OverrideCostCalculation): string {
  return `${(cost.total * 100).toFixed(0)}%`;
}

// Fonction pour obtenir la description des conséquences
export function getConsequenceDescription(cost: OverrideCostCalculation): string[] {
  const consequences: string[] = [];
  
  if (cost.consequences.budgetReduction > 0) {
    consequences.push(
      `Budget réduit de ${(cost.consequences.budgetReduction * 100).toFixed(0)}%`
    );
  }
  
  if (cost.consequences.protectionDisabled) {
    consequences.push("Protections désactivées pendant 24h");
  }
  
  return consequences;
}

// Fonction pour vérifier si l'override doit être confirmé
export function shouldConfirmOverride(cost: OverrideCostCalculation): boolean {
  // Toujours confirmer si le coût est moyen ou élevé
  return cost.consequences.warningLevel !== "LOW";
}

// Fonction pour calculer l'impact sur le budget futur
export function calculateFutureImpact(
  cost: OverrideCostCalculation,
  futureBudget: number
): number {
  return futureBudget * (1 - cost.total);
}

// Fonction pour obtenir le message d'avertissement approprié
export function getWarningMessage(cost: OverrideCostCalculation): string {
  switch (cost.consequences.warningLevel) {
    case "HIGH":
      return "Cette tâche a un coût élevé sur votre budget futur et désactivera les protections.";
    case "MEDIUM":
      return "Cette tâche a un coût modéré sur votre budget futur.";
    case "LOW":
    default:
      return "Cette tâche a un coût faible sur votre budget futur.";
  }
}