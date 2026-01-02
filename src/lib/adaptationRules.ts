// Règles d'ajustement des paramètres - Phase 6
import { 
  AdaptationAggregate, 
  Parameters, 
  Adjustment, 
  clampParameters,
  ADAPTATION_CONSTRAINTS
} from './adaptationMemory';
import { createLogger } from '@/lib/logger';

const logger = createLogger('AdaptationRules');

// Interface pour les règles d'ajustement
interface AdjustmentRules {
  // Règle 1 : Trop de forces
  too_many_forces: {
    trigger: string;
    action: {
      maxTasks: string;
      strictness: string;
      reason: string;
    };
  };
  
  // Règle 2 : Trop de rejets suggestions
  too_many_rejections: {
    trigger: string;
    action: {
      coachFrequency: string;
      coachProactivity: string;
      reason: string;
    };
  };
  
  // Règle 3 : Sessions systématiquement dépassées
  consistent_overruns: {
    trigger: string;
    action: {
      sessionBuffer: string;
      estimationFactor: string;
      reason: string;
    };
  };
  
  // Règle 4 : Mode constamment overridé
  mode_mismatch: {
    trigger: string;
    action: {
      defaultMode: string;
      reason: string;
    };
  };
  
  // Règle 5 : Énergie mal estimée
  energy_prediction_off: {
    trigger: string;
    action: {
      energyForecastMode: string;
      reason: string;
    };
  };
}

// Règles d'ajustement définies
const RULES: AdjustmentRules = {
  // Règle 1 : Trop de forces
  too_many_forces: {
    trigger: "forcedTasksRatio > 0.6 over 2 weeks",
    action: {
      maxTasks: "+1",
      strictness: "-0.1",
      reason: "User besoin de plus de flexibilité"
    }
  },
  
  // Règle 2 : Trop de rejets suggestions
  too_many_rejections: {
    trigger: "rejectionRate > 0.7 over 2 weeks",
    action: {
      coachFrequency: "-20%",
      coachProactivity: "OFF",
      reason: "Coach trop intrusif"
    }
  },
  
  // Règle 3 : Sessions systématiquement dépassées
  consistent_overruns: {
    trigger: "overrunRate > 0.5 AND avg_overrun > 30min",
    action: {
      sessionBuffer: "+15min",
      estimationFactor: "*1.2",
      reason: "Estimations trop optimistes"
    }
  },
  
  // Règle 4 : Mode constamment overridé
  mode_mismatch: {
    trigger: "modeOverrideRate > 0.6",
    action: {
      defaultMode: "user's most used mode",
      reason: "Mode par défaut mal aligné"
    }
  },
  
  // Règle 5 : Énergie mal estimée
  energy_prediction_off: {
    trigger: "energyPredictionAccuracy < 0.6",
    action: {
      energyForecastMode: "CONSERVATIVE",
      reason: "Prédictions énergie peu fiables"
    }
  }
};

// Interface pour les logs d'adaptation
export interface AdaptationLog {
  date: number;
  changes: string[];
  oldParams: Parameters;
  newParams: Parameters;
  userId?: string;
}

// Fonction de logging des adaptations
export function logAdaptation(log: AdaptationLog) {
  // Dans une implémentation réelle, cela enregistrerait dans une base de données
  // ou un système de logging
  logger.info('ADAPTATION', {
    date: new Date(log.date).toISOString(),
    changes: log.changes,
    userId: log.userId,
  });
  
  // Pour le suivi utilisateur, on pourrait aussi envoyer à un service d'analyse
  // analytics.track('SystemAdaptation', log);
}

// Application des règles d'ajustement
export function applyAdjustmentRules(
  aggregate: AdaptationAggregate,
  currentParams: Parameters
): Parameters {
  let newParams = { ...currentParams };
  const changes: string[] = [];

  const toModeCounts = new Map<string, number>();
  aggregate.patterns.mode_overrides.from_to.forEach((count, transition) => {
    const parts = transition.split('→');
    const to = parts[1] ?? '';
    if (!to) return;
    toModeCounts.set(to, (toModeCounts.get(to) || 0) + count);
  });
  const mostUsedMode = [...toModeCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] as any;
  
  // Règle 1 : Trop de forces
  if (aggregate.patterns.forced_tasks.ratio > 0.6) {
    newParams.maxTasks = Math.min(
      newParams.maxTasks + 1, 
      ADAPTATION_CONSTRAINTS.maxTasks.max
    ); // Respecte l'invariant
    newParams.strictness = Math.max(
      newParams.strictness - 0.1, 
      ADAPTATION_CONSTRAINTS.strictness.min
    ); // Respecte l'invariant
    changes.push(RULES.too_many_forces.action.reason);
  }
  
  // Règle 2 : Trop de rejets suggestions
  if (aggregate.patterns.rejected_suggestions.ratio > 0.7) {
    newParams.coachFrequency = Math.max(1 / 365, newParams.coachFrequency * 0.8);
    newParams.coachEnabled = false;
    changes.push(RULES.too_many_rejections.action.reason);
  }
  
  // Règle 3 : Sessions systématiquement dépassées
  if (aggregate.patterns.overrun_sessions.count > 0 && 
      aggregate.patterns.overrun_sessions.avg_overrun_minutes > 30) {
    newParams.sessionBuffer = Math.min(120, Math.max(0, newParams.sessionBuffer + 15));
    newParams.estimationFactor = Math.min(3, Math.max(0.5, newParams.estimationFactor * 1.2));
    changes.push(RULES.consistent_overruns.action.reason);
  }
  
  // Règle 4 : Mode constamment overridé
  if (aggregate.signals.mode_mismatch && mostUsedMode) {
    newParams.defaultMode = mostUsedMode;
    changes.push(RULES.mode_mismatch.action.reason);
  }
  
  // Règle 5 : Énergie mal estimée
  if (aggregate.signals.energy_estimates_off) {
    newParams.energyForecastMode = 'CONSERVATIVE';
    changes.push(RULES.energy_prediction_off.action.reason);
  }
  
  // Log changes
  if (changes.length > 0) {
    logAdaptation({
      date: Date.now(),
      changes: changes,
      oldParams: currentParams,
      newParams: newParams
    });
  }
  
  return clampParameters(newParams);
}