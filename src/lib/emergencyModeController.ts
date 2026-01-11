/**
 * EMERGENCY MODE CONTROLLER - PHASE 3 CORRECTION
 * Implements emergency mode triggers with explicit user consent
 */

import { 
  EmergencyTrigger, 
  DecisionPolicy, 
  createDecisionPolicy,
  TaskWithContext,
  SystemMode,
  BrainInput,
  BrainOutput
} from './phase3Contracts';

/**
 * Defines conditions that can trigger emergency mode
 */
export class EmergencyModeTriggerDetector {
  
  /**
   * Detects if emergency mode should be triggered based on various conditions
   */
  detectEmergencyTriggers(tasks: TaskWithContext[], availableTime: number): EmergencyTrigger | null {
    const now = new Date();
    
    // Check 1: Physical impossibility - deadlines that physically cannot be met
    const impossibleSituation = this.detectPhysicalImpossibility(tasks, availableTime);
    
    // Check 2: All tasks overdue
    const allOverdue = this.detectAllOverdue(tasks);
    
    // Check 3: User explicit request (would be handled separately in UI)
    // This is typically triggered by user action
    
    // Check 4: System cannot suggest valid configuration
    const noValidConfig = this.detectNoValidConfiguration(tasks, availableTime);
    
    // If any trigger condition is met, return the emergency trigger
    if (impossibleSituation || allOverdue || noValidConfig) {
      return {
        deadlinesImpossible: impossibleSituation,
        allTasksOverdue: allOverdue,
        userExplicitRequest: false, // This would be set by user action
        systemCannotSuggest: noValidConfig,
        detectedAt: now
      };
    }
    
    return null;
  }
  
  /**
   * Detects physical impossibility - when total required time exceeds available time
   */
  private detectPhysicalImpossibility(tasks: TaskWithContext[], availableTime: number): boolean {
    // Calculate total time required for all tasks
    const totalRequiredTime = tasks.reduce((sum, task) => sum + task.duration, 0);
    
    // If total required time is more than 1.5x available time, it's physically impossible
    return totalRequiredTime > availableTime * 1.5;
  }
  
  /**
   * Detects if all tasks are overdue
   */
  private detectAllOverdue(tasks: TaskWithContext[]): boolean {
    if (tasks.length === 0) return false;
    
    const now = new Date();
    const overdueTasks = tasks.filter(task => 
      task.deadline && new Date(task.deadline) < now
    );
    
    // If all tasks are overdue
    return overdueTasks.length === tasks.length;
  }
  
  /**
   * Detects if the system cannot suggest a valid configuration
   */
  private detectNoValidConfiguration(tasks: TaskWithContext[], availableTime: number): boolean {
    // If there are tasks but not enough time for even the smallest ones
    if (tasks.length === 0) return false;
    
    const smallestTaskDuration = Math.min(...tasks.map(task => task.duration));
    
    // If even the smallest task doesn't fit in available time
    return smallestTaskDuration > availableTime;
  }
  
  /**
   * Determines if emergency mode should be activated based on triggers and user consent
   */
  shouldActivateEmergencyMode(
    currentPolicy: DecisionPolicy,
    triggers: EmergencyTrigger | null,
    userHasConsented: boolean
  ): boolean {
    if (!triggers) return false;
    
    // Emergency mode can be activated if:
    // 1. There's a valid trigger AND
    // 2. Either the user has consented OR the trigger is critical enough
    return triggers.deadlinesImpossible || 
           triggers.allTasksOverdue || 
           (triggers.systemCannotSuggest && userHasConsented) ||
           (triggers.userExplicitRequest && userHasConsented);
  }
}

/**
 * Controller for emergency mode operations
 */
export class EmergencyModeController {
  private triggerDetector: EmergencyModeTriggerDetector;
  
  constructor(triggerDetector?: EmergencyModeTriggerDetector) {
    this.triggerDetector = triggerDetector || new EmergencyModeTriggerDetector();
  }
  
  /**
   * Evaluates if emergency mode should be activated and returns appropriate policy
   */
  evaluateEmergencyMode(input: BrainInput): {
    shouldActivate: boolean;
    newPolicy: DecisionPolicy;
    trigger?: EmergencyTrigger;
    explanation: string;
  } {
    // First, detect if any emergency triggers are present
    const trigger = this.triggerDetector.detectEmergencyTriggers(
      input.tasks, 
      input.temporal.availableTime
    );
    
    // Check if user has previously consented to emergency mode
    const userHasConsented = input.decisionPolicy.consentGiven || false;
    
    // Determine if emergency mode should be activated
    const shouldActivate = this.triggerDetector.shouldActivateEmergencyMode(
      input.decisionPolicy,
      trigger,
      userHasConsented
    );
    
    if (!shouldActivate || !trigger) {
      return {
        shouldActivate: false,
        newPolicy: input.decisionPolicy,
        explanation: "Aucun déclencheur d'urgence détecté ou utilisateur non consentant"
      };
    }
    
    // Create new policy for emergency mode with explicit consent requirement
    const newPolicy = createDecisionPolicy("EMERGENCY", userHasConsented);
    
    // Generate explanation for the user
    let explanation = "Mode d'urgence activé en raison de :";
    if (trigger.deadlinesImpossible) {
      explanation += " impossibilité physique (trop de tâches pour le temps disponible);";
    }
    if (trigger.allTasksOverdue) {
      explanation += " toutes les tâches sont en retard;";
    }
    if (trigger.systemCannotSuggest) {
      explanation += " système incapable de suggérer une configuration valide;";
    }
    if (trigger.userExplicitRequest) {
      explanation += " demande explicite de l'utilisateur;";
    }
    
    explanation += " exposition de la réalité brute avec choix conscient requis.";
    
    return {
      shouldActivate: true,
      newPolicy,
      trigger,
      explanation
    };
  }
  
  /**
   * Handles emergency mode activation with proper user consent flow
   */
  async activateEmergencyModeWithConsent(
    input: BrainInput,
    onRequestConsent: (message: string) => Promise<boolean>
  ): Promise<{
    policy: DecisionPolicy;
    activated: boolean;
    explanation: string;
  }> {
    const evaluation = this.evaluateEmergencyMode(input);
    
    if (!evaluation.shouldActivate) {
      return {
        policy: input.decisionPolicy,
        activated: false,
        explanation: "Aucune activation d'urgence requise"
      };
    }
    
    // If we need consent and don't have it, request it
    if (!input.decisionPolicy.consentGiven) {
      const consentGranted = await onRequestConsent(evaluation.explanation);
      
      if (consentGranted) {
        const emergencyPolicy = createDecisionPolicy("EMERGENCY", true);
        
        return {
          policy: emergencyPolicy,
          activated: true,
          explanation: `Mode d'urgence activé avec consentement de l'utilisateur. ${evaluation.explanation}`
        };
      } else {
        // User denied consent, fall back to ASSISTED mode or maintain current
        const fallbackPolicy = createDecisionPolicy("ASSISTED", false);
        
        return {
          policy: fallbackPolicy,
          activated: false,
          explanation: "Utilisateur a refusé le mode d'urgence. Mode assisté appliqué à la place."
        };
      }
    } else {
      // Already have consent, proceed with emergency mode
      const emergencyPolicy = createDecisionPolicy("EMERGENCY", true);
      
      return {
        policy: emergencyPolicy,
        activated: true,
        explanation: `Mode d'urgence activé avec consentement préalable. ${evaluation.explanation}`
      };
    }
  }
  
  /**
   * Generates emergency mode output with brutal transparency
   */
  generateEmergencyOutput(
    input: BrainInput,
    trigger: EmergencyTrigger
  ): Omit<BrainOutput, 'guarantees'> {
    // In emergency mode, expose brutal reality without filters
    const totalRequiredTime = input.tasks.reduce((sum, task) => sum + task.duration, 0);
    const availableTime = input.temporal.availableTime;
    const overloadRatio = totalRequiredTime / availableTime;
    
    // Prepare explanation of the impossible situation
    const brutalExplanation = this.generateBrutalExplanation(
      input.tasks, 
      availableTime, 
      totalRequiredTime, 
      trigger
    );
    
    // In emergency mode, we don't filter tasks but rather present the harsh reality
    // Let user make conscious choice
    return {
      session: {
        allowedTasks: input.tasks, // All tasks presented, user chooses
        maxTasks: input.tasks.length, // Present all options
        estimatedDuration: totalRequiredTime,
        budgetConsumed: totalRequiredTime // Acknowledge the overload
      },
      rejected: {
        tasks: [],
        reasons: new Map() // In emergency mode, nothing is rejected, everything is exposed
      },
      mode: {
        current: 'EMERGENCY' as SystemMode,
        reason: brutalExplanation,
        changedFrom: input.decisionPolicy.level as SystemMode
      },
      warnings: [
        `Situation impossible détectée: ${totalRequiredTime} min de travail pour ${availableTime} min disponibles`,
        `Ratio de surcharge: ${overloadRatio.toFixed(1)}x`
      ],
      explanations: {
        summary: brutalExplanation,
        perTask: new Map(input.tasks.map(task => [
          task.id, 
          `Durée: ${task.duration} min. ${this.getTaskSpecificExplanation(task, availableTime, totalRequiredTime)}`
        ]))
      }
    };
  }
  
  /**
   * Generates brutal explanation of the impossible situation
   */
  private generateBrutalExplanation(
    tasks: TaskWithContext[],
    availableTime: number,
    totalRequiredTime: number,
    trigger: EmergencyTrigger
  ): string {
    const overloadRatio = totalRequiredTime / availableTime;
    
    let explanation = `Situation impossible détectée. Tu as ${totalRequiredTime} minutes de travail pour ${availableTime} minutes disponibles. `;
    
    if (overloadRatio > 3) {
      explanation += "La surcharge est sévère. ";
    } else if (overloadRatio > 2) {
      explanation += "La surcharge est significative. ";
    } else {
      explanation += "La surcharge est modérée mais réelle. ";
    }
    
    explanation += "Le système expose la réalité brute. Tu dois faire un choix conscient.";
    
    if (trigger.deadlinesImpossible) {
      explanation += " Certaines deadlines sont physiquement impossibles à respecter.";
    }
    if (trigger.allTasksOverdue) {
      explanation += " Toutes les tâches sont en retard.";
    }
    
    return explanation;
  }
  
  /**
   * Gets task-specific explanation for emergency mode
   */
  private getTaskSpecificExplanation(
    task: TaskWithContext,
    availableTime: number,
    totalRequiredTime: number
  ): string {
    const percentageOfTotal = (task.duration / totalRequiredTime * 100).toFixed(1);
    
    if (task.deadline && new Date(task.deadline) < new Date()) {
      return `En retard de ${Math.ceil((Date.now() - new Date(task.deadline).getTime()) / (1000 * 60 * 60 * 24))} jours.`;
    }
    
    return `${percentageOfTotal}% de la charge totale. Considère le repousser ou le diviser.`;
  }
  
  /**
   * Handles exit from emergency mode
   */
  exitEmergencyMode(): DecisionPolicy {
    // Return to ASSISTED mode after emergency, requiring fresh consent for any further escalation
    return createDecisionPolicy("ASSISTED", false);
  }
}

/**
 * Helper function to request user consent for emergency mode
 */
export async function requestEmergencyConsent(message: string): Promise<boolean> {
  // In a real implementation, this would show a modal or similar UI element
  // For now, we'll simulate the user interaction
  console.log(`CONSENTEMENT D'URGENCE REQUISE: ${message}`);
  
  // This would normally be replaced with actual UI interaction
  return new Promise((resolve) => {
    // Simulating user decision - in real app this would be actual user input
    setTimeout(() => resolve(true), 100); // Auto-accept for demo purposes
  });
}