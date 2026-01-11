/**
 * HIERARCHIE DES INVARIANTS - KairuFlow Phase 1
 * Pyramide de priorité pour résoudre les conflits entre invariants
 */

export enum InvariantPriority {
  CRITICAL = 0,      // Jamais violable
  STRUCTURAL = 1,    // Violable uniquement en mode CHAOS
  PROTECTIVE = 2     // Peut être contourné avec friction explicite
}

export interface InvariantDefinition {
  id: string;
  name: string;
  description: string;
  priority: InvariantPriority;
  category: 'HARD' | 'GUARDRAIL' | 'ADAPTIVE';
  check: (context: any) => boolean;
  resolutionStrategy: string;
  isViolable: boolean;
  chaosOverrideAllowed: boolean;
}

// Définition des invariants selon la hiérarchie
export const INVARIANT_HIERARCHY: { [key in InvariantPriority]: InvariantDefinition[] } = {
  [InvariantPriority.CRITICAL]: [
    {
      id: 'session_end_explicit',
      name: 'Fin de session explicite',
      description: 'Aucune session ne se termine sans action explicite de l\'utilisateur',
      priority: InvariantPriority.CRITICAL,
      category: 'HARD',
      check: (context: any) => context.sessionState !== 'COMPLETED' || context.userAction === 'EXPLICIT_END',
      resolutionStrategy: 'Jamais violé',
      isViolable: false,
      chaosOverrideAllowed: false
    },
    {
      id: 'no_moral_judgment',
      name: 'Pas de jugement moral',
      description: 'Le système n\'émet jamais de jugement de valeur sur le comportement de l\'utilisateur',
      priority: InvariantPriority.CRITICAL,
      category: 'HARD',
      check: (context: any) => {
        const judgmentWords = ['devrait', 'devrais', 'procrastine', 'échoue', 'retard'];
        const text = JSON.stringify(context.messages || {}).toLowerCase();
        return !judgmentWords.some(word => text.includes(word));
      },
      resolutionStrategy: 'Filtre de langage appliqué',
      isViolable: false,
      chaosOverrideAllowed: false
    },
    {
      id: 'user_sovereignty',
      name: 'Souveraineté de l\'utilisateur',
      description: 'L\'utilisateur conserve le contrôle ultime sur ses décisions',
      priority: InvariantPriority.CRITICAL,
      category: 'HARD',
      check: (context: any) => context.systemCanBlockUser === false,
      resolutionStrategy: 'Jamais de blocage utilisateur',
      isViolable: false,
      chaosOverrideAllowed: false
    },
    {
      id: 'scheduled_time_immutable',
      name: 'Contrainte horaire immuable',
      description: 'Les tâches avec horaires fixes bloquent les créneaux',
      priority: InvariantPriority.CRITICAL,
      category: 'HARD',
      check: (context: any) => {
        // Vérifier qu'aucune autre tâche ne chevauche un créneau fixe
        const { tasks, schedule } = context;
        for (const task of tasks) {
          if (task.scheduledTime) {
            // Vérifier conflits dans le schedule
            for (const scheduledTask of schedule) {
              if (scheduledTask.id !== task.id && scheduledTask.scheduledTime) {
                const start1 = new Date(task.scheduledTime).getTime();
                const end1 = start1 + (task.duration * 60 * 1000);
                const start2 = new Date(scheduledTask.scheduledTime).getTime();
                const end2 = start2 + (scheduledTask.duration * 60 * 1000);
                
                if ((start1 < end2 && end1 > start2)) {
                  return false; // Conflit trouvé
                }
              }
            }
          }
        }
        return true;
      },
      resolutionStrategy: 'Aucune tâche ne peut outrepasser une contrainte horaire',
      isViolable: false,
      chaosOverrideAllowed: false
    }
  ],
  [InvariantPriority.STRUCTURAL]: [
    {
      id: 'max_5_tasks_per_session',
      name: 'Max 5 tâches par session',
      description: 'La session ne peut contenir plus de 5 tâches',
      priority: InvariantPriority.STRUCTURAL,
      category: 'HARD',
      check: (context: any) => {
        // Exception pour les micro-tâches
        const microTasks = context.tasks?.filter((t: any) => t.duration < 5) || [];
        if (microTasks.length === context.tasks?.length && microTasks.length <= 7) {
          return true; // Permettre jusqu'à 7 micro-tâches
        }
        return (context.tasks?.length || 0) <= 5;
      },
      resolutionStrategy: 'Réduction de la playlist si nécessaire, avec consentement',
      isViolable: true,
      chaosOverrideAllowed: true
    },
    {
      id: 'capacity_hard_limit',
      name: 'Limite de capacité dure',
      description: 'Somme des efforts ne dépasse pas la capacité de la session',
      priority: InvariantPriority.STRUCTURAL,
      category: 'HARD',
      check: (context: any) => {
        const totalEffort = (context.tasks || []).reduce((sum: number, task: any) => {
          return sum + ({ 'low': 1, 'medium': 2, 'high': 3 }[task.effort] || 1);
        }, 0);
        return totalEffort <= (context.capacity?.maxEffort || 10);
      },
      resolutionStrategy: 'Réduction des tâches les plus exigeantes',
      isViolable: true,
      chaosOverrideAllowed: true
    },
    {
      id: 'temporal_priority',
      name: 'Priorité temporelle',
      description: 'OVERDUE > TODAY > SOON > AVAILABLE',
      priority: InvariantPriority.STRUCTURAL,
      category: 'HARD',
      check: (context: any) => {
        const tasks = context.tasks || [];
        const hasOverdue = tasks.some((t: any) => t.pool === 'OVERDUE');
        const hasToday = tasks.some((t: any) => t.pool === 'TODAY');
        
        // Si OVERDUE existe, pas de SOON/AVAILABLE dans la même session
        if (hasOverdue) {
          return !tasks.some((t: any) => t.pool === 'SOON' || t.pool === 'AVAILABLE');
        }
        
        // Si TODAY existe mais pas OVERDUE, pas de SOON/AVAILABLE
        if (hasToday && !hasOverdue) {
          return !tasks.some((t: any) => t.pool === 'SOON' || t.pool === 'AVAILABLE');
        }
        
        return true;
      },
      resolutionStrategy: 'Filtrage des pools inférieurs quand supérieurs présents',
      isViolable: true,
      chaosOverrideAllowed: true
    },
    {
      id: 'stability_filter',
      name: 'Filtre de stabilité',
      description: 'Si stabilité volatile, exclusion des tâches lourdes',
      priority: InvariantPriority.STRUCTURAL,
      category: 'GUARDRAIL',
      check: (context: any) => {
        if (context.energyStability === 'volatile') {
          return !(context.tasks || []).some((t: any) => t.effort === 'high');
        }
        return true;
      },
      resolutionStrategy: 'Remplacement des tâches lourdes par des alternatives légères',
      isViolable: true,
      chaosOverrideAllowed: true
    }
  ],
  [InvariantPriority.PROTECTIVE]: [
    {
      id: 'active_window_limit',
      name: 'Fenêtre active limitée',
      description: 'Max 10 tâches actives simultanément',
      priority: InvariantPriority.PROTECTIVE,
      category: 'GUARDRAIL',
      check: (context: any) => (context.activeTasksCount || 0) <= 10,
      resolutionStrategy: 'Archivage des tâches anciennes si dépassement',
      isViolable: true,
      chaosOverrideAllowed: true
    },
    {
      id: 'task_age_index',
      name: 'Index d\'âge des tâches',
      description: 'Si TAI > 2 pendant 3 jours → Mode DETOX',
      priority: InvariantPriority.PROTECTIVE,
      category: 'ADAPTIVE',
      check: (context: any) => {
        const tai = context.taskAgeIndex || { averageAge: 0 };
        const daysAboveThreshold = context.daysAboveThreshold || 0;
        return !(tai.averageAge > 2.0 && daysAboveThreshold >= 3);
      },
      resolutionStrategy: 'Activation progressive du mode DETOX',
      isViolable: true,
      chaosOverrideAllowed: true
    },
    {
      id: 'soon_capacity',
      name: 'Capacité SOON limitée',
      description: 'Max 3 tâches dans le pool SOON',
      priority: InvariantPriority.PROTECTIVE,
      category: 'GUARDRAIL',
      check: (context: any) => {
        const soonTasks = (context.tasks || []).filter((t: any) => t.pool === 'SOON');
        return soonTasks.length <= 3;
      },
      resolutionStrategy: 'Promotion automatique des tâches SOON à TODAY quand proches',
      isViolable: true,
      chaosOverrideAllowed: true
    }
  ]
};

/**
 * Trouve la priorité d'un invariant
 */
export function getInvariantPriority(invariantId: string): InvariantPriority | null {
  for (const [priority, invariants] of Object.entries(INVARIANT_HIERARCHY)) {
    const invariant = invariants.find(inv => inv.id === invariantId);
    if (variant) {
      return parseInt(priority) as InvariantPriority;
    }
  }
  return null;
}

/**
 * Résout un conflit entre deux invariants
 */
export function resolveInvariantConflict(
  invariantA: InvariantDefinition, 
  invariantB: InvariantDefinition
): { winner: InvariantDefinition; loser: InvariantDefinition; justification: string } {
  if (invariantA.priority < invariantB.priority) {
    // Le nombre plus petit = priorité plus haute
    return {
      winner: invariantA,
      loser: invariantB,
      justification: `Priorité ${invariantA.name} (${invariantA.priority}) > ${invariantB.name} (${invariantB.priority})`
    };
  } else if (invariantB.priority < invariantA.priority) {
    return {
      winner: invariantB,
      loser: invariantA,
      justification: `Priorité ${invariantB.name} (${invariantB.priority}) > ${invariantA.name} (${invariantA.priority})`
    };
  } else {
    // Même priorité - utiliser des critères secondaires
    // Par défaut, on favorise les invariants CRITICAL dans les cas d'égalité
    if (invariantA.priority === InvariantPriority.CRITICAL) {
      return {
        winner: invariantA,
        loser: invariantB,
        justification: `Égalité de priorité, mais ${invariantA.name} est CRITICAL`
      };
    }
    // Sinon, on pourrait utiliser d'autres critères comme la date de création, etc.
    return {
      winner: invariantA,
      loser: invariantB,
      justification: `Égalité de priorité, choix arbitraire pour éviter blocage`
    };
  }
}

/**
 * Valide un contexte par rapport à tous les invariants
 */
export function validateAgainstAllInvariants(context: any): {
  valid: boolean;
  violations: Array<{ invariant: InvariantDefinition; violated: boolean; message: string }>;
  criticalViolations: number;
  structuralViolations: number;
  protectiveViolations: number;
} {
  const violations = [];
  let criticalViolations = 0;
  let structuralViolations = 0;
  let protectiveViolations = 0;

  for (const priorityLevel of Object.values(INVARIANT_HIERARCHY)) {
    for (const invariant of priorityLevel) {
      const isViolated = !invariant.check(context);
      
      if (isViolated) {
        violations.push({
          invariant,
          violated: true,
          message: `Violation de l'invariant "${invariant.name}" (priorité: ${invariant.priority})`
        });
        
        // Compter par niveau de priorité
        if (invariant.priority === InvariantPriority.CRITICAL) criticalViolations++;
        else if (invariant.priority === InvariantPriority.STRUCTURAL) structuralViolations++;
        else if (invariant.priority === InvariantPriority.PROTECTIVE) protectiveViolations++;
      }
    }
  }

  return {
    valid: violations.length === 0,
    violations,
    criticalViolations,
    structuralViolations,
    protectiveViolations
  };
}

/**
 * Détermine si un invariant peut être violé dans le mode CHAOS
 */
export function isInvariantViolableInChaos(invariantId: string): boolean {
  const priority = getInvariantPriority(invariantId);
  if (priority === null) return false;
  
  const invariant = INVARIANT_HIERARCHY[priority].find(inv => inv.id === invariantId);
  return invariant ? invariant.chaosOverrideAllowed : false;
}