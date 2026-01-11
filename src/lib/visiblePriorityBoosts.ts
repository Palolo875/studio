/**
 * VISIBLE PRIORITY BOOSTS - PHASE 3 CORRECTION
 * Implements transparent priority boosts that are visible to users and don't violate the "no hidden modifications" invariant
 */

import { EnhancedTaskWithContext, UserPreferences } from './phase3Contracts';
import { TaskWithContext } from './types';

export interface PriorityBoost {
  source: string;           // Where the boost comes from (user preference, system heuristic, etc.)
  value: number;            // How much to boost (positive or negative)
  explanation: string;      // Clear explanation for the user
  visible: boolean;         // Whether this boost is visible to the user
  optInRequired: boolean;   // Whether user consent is required for this boost
}

export interface TaskScoringWithBoosts {
  userBase: number;                    // Original user-defined priority
  systemBoosts: PriorityBoost[];      // All applied boosts
  total: number;                      // Final calculated score
  explanation: string;                // Summary explanation for the user
}

/**
 * Applies visible priority boosts to a task based on user preferences and system heuristics
 * This addresses the contradiction between "no hidden modifications" and "productivity enhancement"
 */
export function applyVisiblePriorityBoosts(
  task: EnhancedTaskWithContext, 
  userPreferences: UserPreferences
): TaskScoringWithBoosts {
  
  const boosts: PriorityBoost[] = [];
  
  // Boost 1: Tangible result preference (if user opted in)
  if (userPreferences.favorTangibleResults && task.tangibleResult) {
    boosts.push({
      source: "user preference: favor tangible results",
      value: 0.2,
      explanation: "Boosted because task produces a tangible result (user preference enabled)",
      visible: true,
      optInRequired: true
    });
  }
  
  // Boost 2: Started tasks preference (if user opted in)
  if (userPreferences.favorStartedTasks && task.activationCount > 0) {
    boosts.push({
      source: "user preference: favor started tasks",
      value: 0.3,
      explanation: "Boosted because task has already been started (user preference enabled)",
      visible: true,
      optInRequired: true
    });
  }
  
  // Boost 3: Low effort preference (if user opted in)
  if (userPreferences.favorLowEffort && task.effort === 'low') {
    boosts.push({
      source: "user preference: favor low effort tasks",
      value: 0.1,
      explanation: "Boosted because task requires low effort (user preference enabled)",
      visible: true,
      optInRequired: true
    });
  }
  
  // Boost 4: Deadline proximity (system heuristic, visible to user)
  if (task.deadline) {
    const daysUntilDeadline = (new Date(task.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    
    if (daysUntilDeadline <= 0) {
      // Overdue - significant boost
      boosts.push({
        source: "system heuristic: overdue task",
        value: 0.8,
        explanation: "Significantly boosted because task is overdue",
        visible: true,
        optInRequired: false
      });
    } else if (daysUntilDeadline <= 1) {
      // Due tomorrow - moderate boost
      boosts.push({
        source: "system heuristic: deadline approaching",
        value: 0.5,
        explanation: "Moderately boosted because deadline is approaching (due tomorrow)",
        visible: true,
        optInRequired: false
      });
    } else if (daysUntilDeadline <= 3) {
      // Due in next 3 days - small boost
      boosts.push({
        source: "system heuristic: deadline approaching",
        value: 0.2,
        explanation: "Slightly boosted because deadline is approaching (due in 3 days)",
        visible: true,
        optInRequired: false
      });
    }
  }
  
  // Boost 5: Imposed task consideration (contextual boost)
  if (task.origin === 'IMPOSED') {
    boosts.push({
      source: "context: externally imposed task",
      value: 0.15,
      explanation: "Boosted because task is externally imposed (work obligation)",
      visible: true,
      optInRequired: false
    });
  }
  
  // Calculate total boost value
  const totalBoost = boosts.reduce((sum, boost) => sum + boost.value, 0);
  
  // Assuming a base score of 1.0 for user-declared priority
  const userBase = 1.0;
  const total = userBase + totalBoost;
  
  // Create explanation for the user
  const boostSources = boosts.map(boost => boost.explanation).join("; ");
  const explanation = boosts.length > 0 
    ? `Task score is ${total.toFixed(2)} (base: ${userBase}, boosts: ${boostSources})`
    : `Task score is ${total.toFixed(2)} (base priority only, no boosts applied)`;
  
  return {
    userBase,
    systemBoosts: boosts,
    total,
    explanation
  };
}

/**
 * Updates a task with visible priority boosts
 */
export function enhanceTaskWithPriorityBoosts(
  task: EnhancedTaskWithContext,
  userPreferences: UserPreferences
): EnhancedTaskWithContext {
  const scoringInfo = applyVisiblePriorityBoosts(task, userPreferences);
  
  // Add the boost information to the task
  return {
    ...task,
    priorityBoosts: scoringInfo.systemBoosts
  };
}

/**
 * Validates that all priority boosts are visible and properly justified
 * This ensures we don't violate the "no hidden modifications" invariant
 */
export function validatePriorityBoosts(boosts: PriorityBoost[]): {
  isValid: boolean;
  violations: string[];
} {
  const violations: string[] = [];
  
  for (const boost of boosts) {
    // Check that all boosts are visible to the user
    if (!boost.visible) {
      violations.push(`Boost from "${boost.source}" is not visible to the user`);
    }
    
    // Check that opt-in required boosts have proper user consent
    if (boost.optInRequired && !boost.explanation.includes('user preference')) {
      violations.push(`Boost from "${boost.source}" requires opt-in but doesn't indicate user preference`);
    }
  }
  
  return {
    isValid: violations.length === 0,
    violations
  };
}

/**
 * Generates user-friendly explanation of all priority boosts applied to a task
 */
export function generateBoostExplanation(task: EnhancedTaskWithContext): string {
  if (!task.priorityBoosts || task.priorityBoosts.length === 0) {
    return "No priority boosts applied. Task priority is based solely on user-defined criteria.";
  }
  
  const boostList = task.priorityBoosts.map(boost => 
    `- ${boost.explanation} (+${boost.value.toFixed(2)})`
  ).join('\n');
  
  return `Priority boosts applied to this task:\n${boostList}`;
}

/**
 * Calculates a final score considering both user preferences and system heuristics
 * This replaces hidden priority modifications with transparent ones
 */
export function calculateFinalTaskScore(
  task: EnhancedTaskWithContext,
  userPreferences: UserPreferences
): number {
  const scoringInfo = applyVisiblePriorityBoosts(task, userPreferences);
  return scoringInfo.total;
}

/**
 * Creates a summary of all applied priority modifications for transparency
 */
export function createPriorityModificationSummary(
  originalTasks: EnhancedTaskWithContext[],
  userPreferences: UserPreferences
): string {
  const modifications = [];
  
  for (const task of originalTasks) {
    const scoringInfo = applyVisiblePriorityBoosts(task, userPreferences);
    
    if (scoringInfo.systemBoosts.length > 0) {
      const totalBoost = scoringInfo.systemBoosts.reduce((sum, boost) => sum + boost.value, 0);
      modifications.push(`Task "${task.title}": boosted by ${totalBoost.toFixed(2)} through ${scoringInfo.systemBoosts.length} visible modifications`);
    }
  }
  
  if (modifications.length === 0) {
    return "No priority modifications applied. All tasks retain their original user-defined priorities.";
  }
  
  return `Priority modifications applied:\n${modifications.join('\n')}`;
}