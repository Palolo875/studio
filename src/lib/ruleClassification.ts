/**
 * CLASSIFICATION DES RÈGLES - KairuFlow Phase 1
 * Selon la structure verrouillée : HARD / GARDE-FOU / ADAPTATIF
 */

// ========================
// 🔴 RÈGLES HARD (NON NÉGOCIABLES)
// Sans elles, KairuFlow cesse d'exister
// ========================

export interface HardRule {
  id: string;
  description: string;
  check: (context: any) => boolean;
  violationMessage: string;
}

export const HARD_RULES: HardRule[] = [
  {
    id: 'PLAYLIST_MANDATORY',
    description: 'Playlist obligatoire',
    check: (context: { tasks: any[] }) => context.tasks.length > 0,
    violationMessage: 'Aucune tâche sélectionnée pour la session'
  },
  {
    id: 'ONE_ACTIVE_TASK',
    description: 'Une seule tâche active',
    check: (context: { activeTasks: any[] }) => context.activeTasks.length <= 1,
    violationMessage: 'Plus d\'une tâche active simultanément'
  },
  {
    id: 'TASK_ATOMICITY',
    description: 'Tâche atomique, observable, exécutable maintenant',
    check: (context: { task: any }) => {
      return context.task.duration <= 90 && 
             context.task.description && 
             context.task.description.trim().length > 0;
    },
    violationMessage: 'La tâche n\'est pas atomique ou observable'
  },
  {
    id: 'NO_JUDGMENT_EVAL',
    description: 'Aucune évaluation morale',
    check: (context: { evaluation: any }) => {
      // Vérifie qu'il n'y a pas de langage de jugement
      const judgmentWords = ['procrastine', 'échoue', 'retard', 'devrait'];
      const evalStr = JSON.stringify(context.evaluation).toLowerCase();
      return !judgmentWords.some(word => evalStr.includes(word));
    },
    violationMessage: 'Évaluation contient un langage de jugement'
  },
  {
    id: 'REAL_BEHAVIOR_OVERRIDE',
    description: 'Le comportement réel écrase toute interprétation',
    check: (context: { actualBehavior: any, predictedBehavior: any }) => {
      // Le comportement réel prime toujours sur les prédictions
      return true; // Cette règle est plus un principe directeur
    },
    violationMessage: 'Interprétation prioritaire sur le comportement réel'
  }
];

// ========================
// 🟠 GARDE-FOUS STRUCTURELS
// Protègent contre l'illusion, pas contre l'utilisateur
// ========================

export interface GuardrailRule {
  id: string;
  description: string;
  triggerCondition: (context: any) => boolean;
  action: (context: any) => any;
}

export const GUARDRAIL_RULES: GuardrailRule[] = [
  {
    id: 'REFUSE_VAGUE_TASKS',
    description: 'Refus des tâches floues (non punitif)',
    triggerCondition: (context: { task: any }) => {
      // Tâche vague si description < 10 caractères ou mots génériques
      const vagueTerms = ['travailler', 'faire', 'quelque chose', 'divers'];
      return context.task.description.length < 10 || 
             vagueTerms.some(term => context.task.description.toLowerCase().includes(term));
    },
    action: (context: { task: any }) => {
      // Ne pas ajouter la tâche, mais ne pas punir
      console.warn(`Tâche trop vague ignorée: ${context.task.title}`);
      return null;
    }
  },
  {
    id: 'SILENCE_AFTER_FAILURE',
    description: 'Silence après échec répété',
    triggerCondition: (context: { failureCount: number }) => {
      return context.failureCount >= 3;
    },
    action: (context: any) => {
      // Réduire les interventions
      return { interventionLevel: 'minimal' };
    }
  },
  {
    id: 'LIMIT_INSIGHTS',
    description: 'Limite stricte des insights',
    triggerCondition: (context: { insightCount: number }) => {
      return context.insightCount > 5; // Max 5 insights par session
    },
    action: (context: any) => {
      return { stopGeneratingInsights: true };
    }
  },
  {
    id: 'COGNITIVE_COOLDOWN',
    description: 'Cooldown cognitif',
    triggerCondition: (context: { sessionFrequency: number, timeSinceLast: number }) => {
      // Si sessions trop fréquentes
      return context.sessionFrequency > 5; // Plus de 5 sessions par jour
    },
    action: (context: any) => {
      return { delayNextSession: true };
    }
  },
  {
    id: 'FORGET_WEAK_HYPOTHESES',
    description: 'Oubli actif des hypothèses faibles',
    triggerCondition: (context: { hypothesisAccuracy: number }) => {
      return context.hypothesisAccuracy < 0.3; // Moins de 30% d'accuracy
    },
    action: (context: any) => {
      // Effacer l'hypothèse du cache
      return { forgetHypothesis: true };
    }
  }
];

// ========================
// 🟢 ADAPTATIF (IA)
// Ajustement mécanique, jamais symbolique
// ========================

export interface AdaptiveRule {
  id: string;
  description: string;
  adjustParameter: string;
  condition: (context: any) => number; // Retourne un facteur d'ajustement
}

export const ADAPTIVE_RULES: AdaptiveRule[] = [
  {
    id: 'TEMPORAL_TOLERANCE',
    description: 'Tolérance temporelle',
    adjustParameter: 'timeBuffer',
    condition: (context: { recentCompletionRate: number }) => {
      // Augmenter la tolérance si taux de complétion faible
      return context.recentCompletionRate < 0.5 ? 1.5 : 1.0;
    }
  },
  {
    id: 'INTERVENTION_FREQUENCY',
    description: 'Fréquence d\'intervention',
    adjustParameter: 'interventionRate',
    condition: (context: { userEngagement: number }) => {
      // Réduire les interventions si engagement faible
      return context.userEngagement < 0.3 ? 0.5 : 1.0;
    }
  },
  {
    id: 'DEFAULT_RIGIDITY',
    description: 'Rigidité par défaut',
    adjustParameter: 'ruleStrictness',
    condition: (context: { userPreference: string }) => {
      return context.userPreference === 'flexible' ? 0.7 : 1.0;
    }
  },
  {
    id: 'PLAYLIST_SIZE',
    description: 'Taille de la playlist',
    adjustParameter: 'maxTasks',
    condition: (context: { energyLevel: string, stressLevel: number }) => {
      if (context.energyLevel === 'low' || context.stressLevel > 0.7) {
        return 3; // Taille réduite
      }
      return 5; // Taille normale
    }
  }
];

// ========================
// FONCTION DE VALIDATION GLOBALE
// ========================

export interface ValidationResult {
  hardRuleViolations: string[];
  guardrailTriggers: string[];
  adaptiveAdjustments: { [key: string]: any };
  isSystemHealthy: boolean;
}

export function validateSystemState(context: any): ValidationResult {
  const hardRuleViolations: string[] = [];
  const guardrailTriggers: string[] = [];
  const adaptiveAdjustments: { [key: string]: any } = {};

  // Vérifier les règles HARD
  for (const rule of HARD_RULES) {
    if (!rule.check(context)) {
      hardRuleViolations.push(rule.violationMessage);
    }
  }

  // Appliquer les garde-fous
  for (const rule of GUARDRAIL_RULES) {
    if (rule.triggerCondition(context)) {
      guardrailTriggers.push(rule.id);
      const result = rule.action(context);
      // Traiter le résultat si nécessaire
    }
  }

  // Appliquer les adaptations
  for (const rule of ADAPTIVE_RULES) {
    const adjustment = rule.condition(context);
    adaptiveAdjustments[rule.adjustParameter] = adjustment;
  }

  return {
    hardRuleViolations,
    guardrailTriggers,
    adaptiveAdjustments,
    isSystemHealthy: hardRuleViolations.length === 0
  };
}

// ========================
// GESTION DES ÉTATS D'ÉCHEC
// ========================

export interface FailurePolicy {
  noPenalty: boolean;
  noReminder: boolean;
  noReformulation: boolean;
  silenceAfter: number; // Après N échecs, silence
}

export const DEFAULT_FAILURE_POLICY: FailurePolicy = {
  noPenalty: true,
  noReminder: true,
  noReformulation: true,
  silenceAfter: 3
};

export function applyFailurePolicy(policy: FailurePolicy, failureCount: number, context: any) {
  if (failureCount >= policy.silenceAfter) {
    // Réduire toutes les interventions
    return {
      ...context,
      interventionLevel: 'silent',
      showNotifications: false
    };
  }
  
  // Sinon, ne rien changer - le système observe, se tait, ajuste
  return context;
}