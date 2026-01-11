/**
 * MODE DETOX - KairuFlow Phase 1
 * Friction progressive, jamais blocage
 */

import { TaskWithContext } from './types';

export interface DetoxPhase {
  id: string;
  name: string;
  trigger: string;
  frictionLevel: number; // 0.0 = aucune, 1.0 = maximum
  action: string;
  userOverride: boolean;
  durationThreshold: number; // jours
  taiThreshold: number; // Task Age Index seuil
}

export interface DetoxContext {
  taskAgeIndex: number;
  daysAboveThreshold: number;
  userActions: string[];
  taskHistory: TaskWithContext[];
}

export class DetoxMode {
  /**
   * Phases du mode DETOX
   * Le DETOX n'est JAMAIS un blocage.
   * C'est une friction graduée qui force la conscience.
   */
  static readonly PHASES: DetoxPhase[] = [
    {
      id: 'warning',
      name: 'Avertissement',
      trigger: 'TAI > 2.0 x 1 jour',
      frictionLevel: 0.2,
      action: 'notification_douce',
      userOverride: true,
      durationThreshold: 1,
      taiThreshold: 2.0
    },
    {
      id: 'friction',
      name: 'Friction',
      trigger: 'TAI > 2.0 x 3 jours',
      frictionLevel: 0.5,
      action: 'confirmation_requise',
      userOverride: true,
      durationThreshold: 3,
      taiThreshold: 2.0
    },
    {
      id: 'guided_review',
      name: 'Revue guidée',
      trigger: 'TAI > 2.0 x 5 jours',
      frictionLevel: 0.7,
      action: 'recommandation_revue',
      userOverride: true,
      durationThreshold: 5,
      taiThreshold: 2.0
    },
    {
      id: 'cost_multiplier',
      name: 'Multiplicateur de coût',
      trigger: 'TAI > 2.0 x 7 jours',
      frictionLevel: 0.9,
      action: 'cout_visible_augmente',
      userOverride: true,
      durationThreshold: 7,
      taiThreshold: 2.0
    }
  ];

  /**
   * Détermine la phase DETOX actuelle basée sur le contexte
   */
  static getCurrentPhase(context: DetoxContext): DetoxPhase | null {
    // Trouver la phase la plus avancée applicable
    const applicablePhases = this.PHASES
      .filter(phase => 
        context.taskAgeIndex > phase.taiThreshold && 
        context.daysAboveThreshold >= phase.durationThreshold
      )
      .sort((a, b) => b.durationThreshold - a.durationThreshold); // Du plus élevé au plus bas

    return applicablePhases.length > 0 ? applicablePhases[0] : null;
  }

  /**
   * Applique la friction appropriée selon la phase
   */
  static applyFriction(phase: DetoxPhase | null, userAction: string, task?: TaskWithContext): {
    allowAction: boolean;
    modifiedTask?: TaskWithContext;
    dialogToShow?: any;
    frictionApplied: boolean;
  } {
    if (!phase) {
      return { allowAction: true, frictionApplied: false };
    }

    // Selon la phase, appliquer différents types de friction
    switch (phase.id) {
      case 'warning':
        // Aucune restriction, juste notification
        return { allowAction: true, frictionApplied: false };

      case 'friction':
        // Action d'ajout de tâche nécessite confirmation
        if (userAction === 'add_task') {
          return {
            allowAction: false,
            frictionApplied: true,
            dialogToShow: {
              title: 'Attention au backlog',
              message: `Vous avez ${this.countOldTasks()} tâches anciennes.`,
              suggestion: 'Voulez-vous d\'abord les revoir ?',
              options: [
                { id: 'review_now', label: 'Oui, les revoir maintenant' },
                { id: 'add_anyway', label: 'Non, ajouter quand même' } // TOUJOURS POSSIBLE
              ]
            }
          };
        }
        return { allowAction: true, frictionApplied: true };

      case 'guided_review':
        // Suggestion plus insistante de revue
        if (userAction === 'add_task') {
          return {
            allowAction: false,
            frictionApplied: true,
            dialogToShow: {
              title: 'Backlog important détecté',
              message: `Vous avez ${this.countOldTasks()} tâches non traitées depuis plus de 5 jours.`,
              suggestion: 'Session de triage recommandée',
              options: [
                { id: 'triage_now', label: 'Commencer le triage maintenant' },
                { id: 'add_with_warning', label: 'Ajouter avec avertissement' }
              ]
            }
          };
        }
        return { allowAction: true, frictionApplied: true };

      case 'cost_multiplier':
        // Coût visible mais non bloquant
        if (userAction === 'add_task' && task) {
          const modifiedTask = { ...task };
          modifiedTask.duration = task.duration * 3; // Le coût perçu triple
          
          return {
            allowAction: true, // TOUJOURS AUTORISÉ
            modifiedTask,
            frictionApplied: true,
            dialogToShow: {
              title: 'Coût accru de la tâche',
              message: `Cette tâche coûtera ×3 à cause du backlog important.`,
              suggestion: `Continuer ? Le temps estimé est maintenant de ${modifiedTask.duration} minutes.`,
              options: [
                { id: 'continue_anyway', label: 'Continuer' },
                { id: 'cancel_add', label: 'Annuler' }
              ]
            }
          };
        }
        return { allowAction: true, frictionApplied: true };

      default:
        return { allowAction: true, frictionApplied: false };
    }
  }

  /**
   * Compte les tâches anciennes
   */
  private static countOldTasks(): number {
    // Cette méthode serait implémentée avec les données réelles
    // Pour l'instant, retourne un placeholder
    return 5; // Placeholder
  }

  /**
   * Calcule l'index d'âge des tâches
   */
  static calculateTaskAgeIndex(tasks: TaskWithContext[]): number {
    if (tasks.length === 0) return 0;

    const totalAgeDays = tasks.reduce((sum, task) => {
      if (!task.createdAt) return sum;
      const diffTime = new Date().getTime() - task.createdAt.getTime();
      const diffDays = diffTime / (1000 * 60 * 60 * 24);
      return sum + diffDays;
    }, 0);

    return totalAgeDays / tasks.length;
  }

  /**
   * Vérifie si le mode DETOX devrait être activé
   */
  static shouldActivateDetox(context: DetoxContext): boolean {
    return this.getCurrentPhase(context) !== null;
  }

  /**
   * Principe absolu : Le système peut RALENTIR l'utilisateur, jamais BLOQUER
   */
  static readonly PRINCIPLE = {
    slowdownPossible: true,
    blockNever: true,
    userOverrideAlways: true
  };

  /**
   * Obtient le message d'explication pour une phase
   */
  static getPhaseExplanation(phase: DetoxPhase): string {
    switch (phase.id) {
      case 'warning':
        return "Le système vous informe de l'accumulation de tâches anciennes.";
      case 'friction':
        return "Le système demande confirmation avant d'ajouter de nouvelles tâches.";
      case 'guided_review':
        return "Le système recommande une session de triage des tâches anciennes.";
      case 'cost_multiplier':
        return "Le système rend visible le coût additionnel des nouvelles tâches.";
      default:
        return "Mode de protection cognitive activé.";
    }
  }
}

/**
 * Interface pour le gestionnaire de DETOX
 */
export interface DetoxHandler {
  evaluateDetoxState(context: DetoxContext): DetoxPhase | null;
  applyFrictionIfNeeded(action: string, task?: TaskWithContext): {
    allowAction: boolean;
    modifiedTask?: TaskWithContext;
    dialogToShow?: any;
  };
  resetDetoxCounter(): void;
}

/**
 * Gestionnaire par défaut du mode DETOX
 */
export class DefaultDetoxHandler implements DetoxHandler {
  private currentPhase: DetoxPhase | null = null;

  evaluateDetoxState(context: DetoxContext): DetoxPhase | null {
    this.currentPhase = DetoxMode.getCurrentPhase(context);
    return this.currentPhase;
  }

  applyFrictionIfNeeded(action: string, task?: TaskWithContext) {
    return DetoxMode.applyFriction(this.currentPhase, action, task);
  }

  resetDetoxCounter(): void {
    this.currentPhase = null;
  }
}

/**
 * Options de configuration du mode DETOX
 */
export interface DetoxOptions {
  enableDetox: boolean;
  taiThreshold: number; // Seuil de Task Age Index
  warningAfterDays: number;
  frictionAfterDays: number;
  guidedReviewAfterDays: number;
  costMultiplierAfterDays: number;
  maxTasksBeforeWarning: number;
}

/**
 * Configuration par défaut
 */
export const DEFAULT_DETOX_OPTIONS: DetoxOptions = {
  enableDetox: true,
  taiThreshold: 2.0,
  warningAfterDays: 1,
  frictionAfterDays: 3,
  guidedReviewAfterDays: 5,
  costMultiplierAfterDays: 7,
  maxTasksBeforeWarning: 10
};