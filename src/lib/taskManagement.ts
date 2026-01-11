import { TaskWithContext, TaskPool, TaskStatus, EnergyStability, Capacity, TaskAgeIndex, DetoxPhase, TemporalConflictResolution, EnergyState } from './types';

/**
 * Fonction pour déterminer si une tâche est active selon la définition précise
 */
export function isTaskActive(task: TaskWithContext, today: Date = new Date()): boolean {
  // Exclusions explicites
  if (task.status === 'done' || task.status === 'cancelled') {
    return false;
  }
  
  if (task.scheduledTime && new Date(task.scheduledTime) > new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)) {
    // scheduledDate > today + 7
    return false;
  }

  // Définitions principales
  const primaryActive = ['in_progress', 'today', 'overdue'].includes(task.status as string);
  const secondaryActive = task.activationCount > 0 || 
                         (task.createdAt && 
                          (today.getTime() - task.createdAt.getTime()) <= 3 * 24 * 60 * 60 * 1000) || // createdDate >= today - 3 days
                         (task.lastActivated && 
                          (today.getTime() - task.lastActivated.getTime()) <= 2 * 24 * 60 * 60 * 1000); // lastTouched >= today - 2 days

  return Boolean(primaryActive || secondaryActive);
}

/**
 * Compte le nombre de tâches actives
 */
export function countActiveTasks(tasks: TaskWithContext[], today: Date = new Date()): number {
  return tasks.filter(task => isTaskActive(task, today)).length;
}

/**
 * Fonction pour assigner une tâche à un pool selon les règles strictes
 */
export function assignTaskToPool(task: TaskWithContext, today: Date = new Date()): TaskPool {
  const taskDate = task.deadline ? new Date(task.deadline) : null;
  const todayDate = new Date(today);
  todayDate.setHours(0, 0, 0, 0);
  
  // Si la tâche a une deadline passée
  if (taskDate && taskDate < todayDate) {
    return 'OVERDUE';
  }
  
  // Si la tâche est pour aujourd'hui
  if (taskDate && taskDate.getTime() === todayDate.getTime()) {
    return 'TODAY';
  }
  
  // Si la tâche est dans les 2-7 jours à venir
  const sevenDaysFromNow = new Date(today);
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
  const twoDaysFromNow = new Date(today);
  twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
  
  if (taskDate && taskDate >= twoDaysFromNow && taskDate <= sevenDaysFromNow) {
    return 'SOON';
  }
  
  // Sinon, c'est disponible
  return 'AVAILABLE';
}

/**
 * Calcule l'index d'âge des tâches (Task Age Index)
 */
export function calculateTaskAgeIndex(tasks: TaskWithContext[], today: Date = new Date()): TaskAgeIndex {
  if (tasks.length === 0) {
    return {
      averageAge: 0,
      totalAge: 0,
      count: 0,
      calculationDate: today
    };
  }
  
  const totalAgeDays = tasks.reduce((sum, task) => {
    if (!task.createdAt) return sum;
    const diffTime = today.getTime() - task.createdAt.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return sum + diffDays;
  }, 0);
  
  return {
    averageAge: totalAgeDays / tasks.length,
    totalAge: totalAgeDays,
    count: tasks.length,
    calculationDate: today
  };
}

/**
 * Détermine la phase DETOX selon les règles progressives
 */
export function determineDetoxPhase(tai: TaskAgeIndex, daysSinceLastPhase: number = 0): DetoxPhase | null {
  const avgAge = tai.averageAge;
  
  if (avgAge > 2.0 && daysSinceLastPhase >= 7) {
    return {
      phase: 'OVERRIDE_PENALTY',
      trigger: `TAI > 2.0 pendant ${Math.floor(daysSinceLastPhase / 7)} semaines`,
      action: 'Nouvelles tâches coûtent ×3, mais pas de blocage total',
      startDate: new Date()
    };
  } else if (avgAge > 2.0 && daysSinceLastPhase >= 5) {
    return {
      phase: 'GUIDED_REVIEW',
      trigger: `TAI > 2.0 pendant ${Math.floor(daysSinceLastPhase / 5)} jours`,
      action: 'Propose session de nettoyage assistée',
      startDate: new Date()
    };
  } else if (avgAge > 2.0 && daysSinceLastPhase >= 3) {
    return {
      phase: 'FRICTION',
      trigger: `TAI > 2.0 pendant ${Math.floor(daysSinceLastPhase / 3)} jours`,
      action: 'Demande confirmation pour nouvelles tâches',
      startDate: new Date()
    };
  } else if (avgAge > 2.0 && daysSinceLastPhase >= 1) {
    return {
      phase: 'WARNING',
      trigger: `TAI > 2.0 pendant ${daysSinceLastPhase} jours`,
      action: 'Notification douce',
      startDate: new Date()
    };
  }
  
  return null; // Pas de DETOX nécessaire
}

/**
 * Détecte les situations impossibles (deadlines physiquement impossibles)
 */
export function detectImpossibleDay(tasksToday: TaskWithContext[], availableTime: number): boolean {
  const totalDuration = tasksToday.reduce((sum, task) => sum + task.duration, 0);
  
  // Si la somme des durées dépasse 1.5 fois le temps disponible
  return totalDuration > availableTime * 1.5;
}

/**
 * Résout les conflits temporels entre tâches OVERDUE et tâches programmées
 */
export function resolveTemporalConflict(
  overdueTask: TaskWithContext, 
  scheduledTask: TaskWithContext, 
  availableTime: number,
  currentTime: Date = new Date()
): TemporalConflictResolution {
  
  if (overdueTask.duration > availableTime) {
    // Si la tâche OVERDUE est plus longue que le temps disponible
    if (overdueTask.hasOwnProperty('divisible') && (overdueTask as any).divisible) {
      // Si la tâche peut être divisée
      return {
        type: 'CONFLICT_RESOLVED',
        message: `La tâche "${overdueTask.title}" peut être divisée pour s'adapter au temps disponible`,
        options: [
          `Commencer "${overdueTask.title}" (partiellement)`,
          `Reporter "${overdueTask.title}" après la réunion`,
          `Reprogrammer la réunion` // Peu probable mais honnête
        ]
      };
    } else {
      // La tâche ne peut pas être divisée
      return {
        type: 'IMPOSSIBLE_SITUATION',
        message: `"${overdueTask.title}" prend ${overdueTask.duration}min mais vous avez seulement ${availableTime}min avant la réunion`,
        options: [
          `Commencer "${overdueTask.title}" (il sera incomplet)`,
          `Reporter "${overdueTask.title}" après la réunion`,
          `Reprogrammer la réunion`
        ]
      };
    }
  }
  
  // Sinon, on peut gérer normalement
  return {
    type: 'CONFLICT_RESOLVED',
    message: `La tâche OVERDUE "${overdueTask.title}" est prioritaire mais peut tenir dans le temps disponible`
  };
}

/**
 * Détecte la stabilité énergétique selon les signaux comportementaux
 */
export function detectStability(
  recentInterruptions: number = 0,
  energyVariance: number = 0,
  incompleteSessionRate: number = 0,
  hasManyMeetings: boolean = false,
  isOpenSpace: boolean = false,
  isTravelDay: boolean = false
): EnergyStability {
  // Calcul du score de volatilité basé sur plusieurs facteurs
  const volatilityScore = (
    0.3 * Math.min(1, recentInterruptions / 5) +      // Normaliser interruptions
    0.3 * energyVariance +                             // Variance d'énergie
    0.2 * incompleteSessionRate +                      // Taux d'incomplétude
    0.2 * (hasManyMeetings ? 1 : 0)                   // Rencontres beaucoup de réunions
  );
  
  return volatilityScore > 0.6 ? 'volatile' : 'stable';
}

/**
 * Calcule la capacité cognitive en fonction du contexte
 */
export function calculateCapacity(
  energyLevel: 'low' | 'medium' | 'high',
  energyStability: EnergyStability,
  availableMinutes: number
): Capacity {
  let maxTasks = 5; // Valeur par défaut
  let maxEffort = 10; // Valeur par défaut
  
  // Ajuster selon le niveau d'énergie
  switch (energyLevel) {
    case 'high':
      maxTasks = 5;
      maxEffort = 12;
      break;
    case 'medium':
      maxTasks = 3;
      maxEffort = 8;
      break;
    case 'low':
      maxTasks = 2;
      maxEffort = 4;
      break;
  }
  
  // Réduire davantage si la stabilité est volatile
  if (energyStability === 'volatile') {
    maxTasks = Math.max(1, Math.floor(maxTasks * 0.6)); // Réduction de 40%
    maxEffort = Math.max(1, Math.floor(maxEffort * 0.6));
  }
  
  return {
    maxTasks,
    maxEffort,
    availableMinutes
  };
}

/**
 * Vérifie si une tâche est une "quick win" (facile à accomplir)
 */
export function isQuickWin(task: TaskWithContext): boolean {
  return task.duration <= 15 && task.effort === 'low'; // Tâche de 15 minutes ou moins et effort faible
}

/**
 * Détermine si une tâche est imposée (externally mandated)
 */
export function isImposedTask(task: TaskWithContext): boolean {
  // Une tâche est considérée comme imposée si elle a un contexte externe
  return task.category === 'work' || 
         task.tags?.includes('imposed') || 
         task.tags?.includes('external-deadline') ||
         task.urgency === 'urgent';
}

/**
 * Applique les règles de pool temporel
 * OVERDUE > TODAY > SOON > AVAILABLE
 */
export function getTaskPriority(task: TaskWithContext): number {
  switch (task.pool) {
    case 'OVERDUE':
      return 4; // Priorité la plus haute
    case 'TODAY':
      return 3;
    case 'SOON':
      return 2;
    case 'AVAILABLE':
      return 1; // Priorité la plus basse
    default:
      return 0;
  }
}

/**
 * Filtre les tâches éligibles selon les contraintes temporelles
 */
export function filterEligibleTasks(tasks: TaskWithContext[], today: Date = new Date()): TaskWithContext[] {
  // Si des tâches OVERDUE ou TODAY existent, cacher SOON et AVAILABLE
  const hasOverdueOrToday = tasks.some(task => 
    task.pool === 'OVERDUE' || task.pool === 'TODAY'
  );
  
  if (hasOverdueOrToday) {
    return tasks.filter(task => 
      task.pool === 'OVERDUE' || task.pool === 'TODAY'
    );
  }
  
  // Sinon, inclure SOON et AVAILABLE si pas plus de 3 tâches SOON
  const soonTasks = tasks.filter(task => task.pool === 'SOON');
  const availableTasks = tasks.filter(task => task.pool === 'AVAILABLE');
  
  // Limiter SOON à 3 tâches max
  const limitedSoonTasks = soonTasks.slice(0, 3);
  
  return [...limitedSoonTasks, ...availableTasks];
}