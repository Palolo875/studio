/**
 * COGNITIVE BUDGET PROTECTION - PHASE 3 CORRECTION
 * Implements "protected budget with explicit debt" instead of "inviolable budget"
 */

import { DailyCognitiveBudget, CognitiveDebt, BudgetPolicy } from './phase3Contracts';

export interface CognitiveLoadCalculator {
  /**
   * Calculates cognitive load for a single task
   */
  calculateTaskLoad(task: any): number;
  
  /**
   * Calculates total cognitive load for a set of tasks
   */
  calculateTotalLoad(tasks: any[]): number;
}

/**
 * Default cognitive load calculator based on effort, duration, and stability
 */
export class DefaultCognitiveLoadCalculator implements CognitiveLoadCalculator {
  /**
   * Calculates cognitive load for a single task
   * Formula: effort_class × duration_factor × stability_penalty
   */
  calculateTaskLoad(task: any): number {
    // Base effort values (from invariantHierarchy.ts)
    const effortValues = {
      'low': 1,
      'medium': 2,
      'high': 3
    };
    
    // Duration factor (normalized to 30-minute chunks)
    const durationFactor = Math.ceil(task.duration / 30) * 0.5;
    
    // Stability penalty
    const stabilityPenalty = task.energyStability === 'volatile' ? 1.5 : 1.0;
    
    // Get effort value (default to medium if not specified)
    const effortValue = effortValues[task.effort] || 2;
    
    return effortValue * durationFactor * stabilityPenalty;
  }
  
  /**
   * Calculates total cognitive load for a set of tasks
   */
  calculateTotalLoad(tasks: any[]): number {
    return tasks.reduce((total, task) => total + this.calculateTaskLoad(task), 0);
  }
}

/**
 * Manages cognitive budget with debt-based protection
 */
export class CognitiveBudgetManager {
  private loadCalculator: CognitiveLoadCalculator;
  
  constructor(loadCalculator?: CognitiveLoadCalculator) {
    this.loadCalculator = loadCalculator || new DefaultCognitiveLoadCalculator();
  }
  
  /**
   * Creates a new daily cognitive budget
   */
  createDailyBudget(maxLoad: number): DailyCognitiveBudget {
    return {
      maxLoad,
      usedLoad: 0,
      remaining: maxLoad,
      lockThreshold: maxLoad * 0.2 // 20% threshold for locking
    };
  }
  
  /**
   * Updates budget based on tasks consumption
   */
  updateBudget(budget: DailyCognitiveBudget, tasks: any[]): {
    newBudget: DailyCognitiveBudget;
    hasDebt: boolean;
    debt?: CognitiveDebt;
    warnings: string[];
  } {
    const totalLoad = this.loadCalculator.calculateTotalLoad(tasks);
    const newUsedLoad = budget.usedLoad + totalLoad;
    const newRemaining = budget.maxLoad - newUsedLoad;
    
    const newBudget = {
      ...budget,
      usedLoad: newUsedLoad,
      remaining: newRemaining
    };
    
    const warnings: string[] = [];
    
    // Check for budget thresholds
    if (newRemaining < budget.lockThreshold) {
      warnings.push("⚠️ Budget cognitif critique. Capacité réduite de 30% demain.");
    } else if (newRemaining < budget.maxLoad * 0.4) {
      warnings.push("⚠️ Budget cognitif à 60%. Ralentis.");
    }
    
    // Check if budget is exceeded (creating debt)
    if (newRemaining < 0) {
      const debtAmount = Math.abs(newRemaining);
      
      const debt: CognitiveDebt = {
        type: "cognitive",
        amount: debtAmount,
        impact: "Demain, ta capacité sera réduite de ~30%",
        acknowledged: false,
        timestamp: new Date()
      };
      
      return {
        newBudget,
        hasDebt: true,
        debt,
        warnings: [...warnings, `🔴 Tu as dépassé ton budget de ${debtAmount.toFixed(2)} points. Cela créera une dette cognitive.`]
      };
    }
    
    return {
      newBudget,
      hasDebt: false,
      warnings
    };
  }
  
  /**
   * Processes an override request that would exceed the budget
   * Returns the new budget state and debt information
   */
  processBudgetOverride(
    currentBudget: DailyCognitiveBudget,
    overrideAmount: number,
    userAcknowledge: boolean
  ): {
    newBudget: DailyCognitiveBudget;
    debt: CognitiveDebt;
    canProceed: boolean;
  } {
    const newUsedLoad = currentBudget.usedLoad + overrideAmount;
    const newRemaining = currentBudget.maxLoad - newUsedLoad;
    
    // Calculate debt if budget is exceeded
    const debtAmount = Math.max(0, -newRemaining);
    
    const debt: CognitiveDebt = {
      type: "cognitive",
      amount: debtAmount,
      impact: `Demain, ta capacité sera réduite de ~${Math.round(debtAmount / currentBudget.maxLoad * 30)}%`,
      acknowledged: userAcknowledge,
      timestamp: new Date(),
      estimatedRecoveryTime: this.calculateRecoveryTime(debtAmount, currentBudget.maxLoad)
    };
    
    const newBudget = {
      ...currentBudget,
      usedLoad: newUsedLoad,
      remaining: Math.min(newRemaining, currentBudget.remaining) // Keep the worst case
    };
    
    return {
      newBudget,
      debt,
      canProceed: true // Allow override with explicit debt acknowledgment
    };
  }
  
  /**
   * Calculates estimated recovery time based on debt amount
   */
  private calculateRecoveryTime(debtAmount: number, maxLoad: number): Date {
    // Estimate recovery time based on debt percentage of max load
    const debtPercentage = debtAmount / maxLoad;
    const recoveryDays = Math.ceil(debtPercentage * 3); // 100% debt = ~3 days recovery
    
    const recoveryDate = new Date();
    recoveryDate.setDate(recoveryDate.getDate() + recoveryDays);
    
    return recoveryDate;
  }
  
  /**
   * Gets budget status message for user display
   */
  getBudgetStatusMessage(budget: DailyCognitiveBudget): string {
    const percentageUsed = (budget.usedLoad / budget.maxLoad) * 100;
    
    if (budget.remaining < 0) {
      return `🔴 Budget dépassé de ${(Math.abs(budget.remaining)).toFixed(2)} points. Dette cognitive enregistrée.`;
    } else if (percentageUsed > 80) {
      return `⚠️ Budget presque atteint (${percentageUsed.toFixed(1)}%). Attention à la fatigue.`;
    } else if (percentageUsed > 60) {
      return `🟡 Budget utilisé à ${percentageUsed.toFixed(1)}%. Continue avec prudence.`;
    } else {
      return `🔵 Budget disponible : ${(budget.remaining).toFixed(2)} points sur ${budget.maxLoad}.`;
    }
  }
  
  /**
   * Creates a budget policy based on current state
   */
  createBudgetPolicy(currentBudget: DailyCognitiveBudget, overrunAmount: number = 0): BudgetPolicy {
    return {
      recommended: currentBudget.maxLoad,
      used: currentBudget.usedLoad,
      overrun: overrunAmount,
      debt: {
        type: "cognitive",
        amount: Math.max(0, -currentBudget.remaining),
        impact: `Demain, ta capacité sera réduite de ~${Math.round(Math.max(0, -currentBudget.remaining) / currentBudget.maxLoad * 30)}%`,
        acknowledged: false,
        timestamp: new Date()
      },
      requiresExplicitAck: currentBudget.remaining < 0
    };
  }
}

/**
 * Helper function to check if a task can be added to the current budget
 */
export function canAddTaskToBudget(
  budget: DailyCognitiveBudget, 
  task: any, 
  loadCalculator: CognitiveLoadCalculator = new DefaultCognitiveLoadCalculator()
): {
  canAdd: boolean;
  remainingLoad: number;
  taskLoad: number;
  message: string;
} {
  const taskLoad = loadCalculator.calculateTaskLoad(task);
  const remainingLoad = budget.remaining;
  
  if (remainingLoad >= taskLoad) {
    return {
      canAdd: true,
      remainingLoad,
      taskLoad,
      message: `Tâche ajoutable. Reste ${remainingLoad - taskLoad} points après ajout.`
    };
  } else if (remainingLoad > 0) {
    return {
      canAdd: false,
      remainingLoad,
      taskLoad,
      message: `Tâche trop lourde. Manque ${taskLoad - remainingLoad} points. Peut être ajoutée avec dette cognitive.`
    };
  } else {
    return {
      canAdd: false,
      remainingLoad,
      taskLoad,
      message: `Budget déjà dépassé. Ajouter cette tâche augmentera la dette cognitive.`
    };
  }
}

/**
 * Corrected budget protection functions that replace "inviolable" concept
 */

/**
 * Checks if budget is in critical state (near or exceeded)
 */
export function isBudgetCritical(budget: DailyCognitiveBudget): boolean {
  return budget.remaining < budget.lockThreshold;
}

/**
 * Checks if budget has been exceeded (creating debt)
 */
export function isBudgetExceeded(budget: DailyCognitiveBudget): boolean {
  return budget.remaining < 0;
}

/**
 * Gets the debt amount if budget is exceeded
 */
export function getBudgetDebtAmount(budget: DailyCognitiveBudget): number {
  return Math.max(0, -budget.remaining);
}

/**
 * Formats debt information for user display
 */
export function formatDebtInformation(budget: DailyCognitiveBudget): string {
  const debtAmount = getBudgetDebtAmount(budget);
  if (debtAmount > 0) {
    const debtPercentage = (debtAmount / budget.maxLoad) * 100;
    return `Dette cognitive: ${debtAmount.toFixed(2)} points (${debtPercentage.toFixed(1)}% du budget quotidien). Impact estimé: réduction de capacité de ~${Math.round(debtPercentage * 0.3)}% demain.`;
  }
  return "Aucune dette cognitive.";
}