import { SessionState, TaskWithContext, TaskPool, EnergyState, Capacity } from './types';
import { isTaskActive, assignTaskToPool, calculateCapacity, filterEligibleTasks } from './taskManagement';

/**
 * Détermine l'état d'une session selon les règles strictes de la Phase 1
 */
export function determineSessionState(session: SessionState, tasks: TaskWithContext[]): SessionState {
  // Si l'utilisateur clique explicitement sur "End"
  if (session.state === 'COMPLETED') {
    return session;
  }
  
  // Si le temps est écoulé sans que l'utilisateur ait explicitement terminé
  const now = Date.now();
  if (session.endTime && now > session.endTime + 30 * 60 * 1000) { // +30 min
    return {
      ...session,
      state: 'BLOCKED',
      // Loguer l'interruption
    };
  }
  
  // Si toutes les tâches sont faites mais que le temps n'est pas écoulé
  const completedTasksCount = tasks.filter(t => t.status === 'done' && session.taskIds.includes(t.id)).length;
  if (completedTasksCount === session.plannedTasks && now < (session.startTime + session.plannedTasks * 60 * 1000)) {
    // Ne pas terminer automatiquement, demander à l'utilisateur
    return {
      ...session,
      state: 'EXHAUSTED' // Indique que la session est terminée plus tôt que prévu
    };
  }
  
  return session;
}

/**
 * Génère une session basée sur les contraintes temporelles et énergétiques
 */
export function generateSession(
  tasks: TaskWithContext[],
  energyState: EnergyState,
  currentTime: Date,
  availableTime: number,  // en minutes
  maxTasks: number = 5
): SessionState {
  const sessionId = `session_${Date.now()}`;
  const eligibleTasks = filterEligibleTasks(tasks, currentTime);
  
  // Filtrer par disponibilité temporelle
  const temporalFiltered = eligibleTasks.filter(task => {
    // Ne pas inclure les tâches avec un horaire fixe qui entre en conflit
    if (task.scheduledTime) {
      const scheduledDateTime = new Date(task.scheduledTime);
      const sessionEnd = new Date(currentTime.getTime() + availableTime * 60 * 1000);
      
      // Si la tâche a un horaire fixe pendant cette session
      if (scheduledDateTime >= currentTime && scheduledDateTime <= sessionEnd) {
        return false; // On ne peut pas inclure cette tâche, elle est déjà fixe
      }
    }
    return true;
  });
  
  // Calculer la capacité pour cette session
  const capacity = calculateCapacity(energyState.level, energyState.stability, availableTime);
  
  // Filtrer par énergie et stabilité
  const energyFiltered = temporalFiltered.filter(task => {
    // Si la stabilité est volatile, exclure les tâches lourdes
    if (energyState.stability === 'volatile' && task.effort === 'high') {
      return false;
    }
    
    // Vérifier que la tâche convient au niveau d'énergie
    if (task.energyRequired && 
        ((energyState.level === 'low' && task.energyRequired === 'high') ||
         (energyState.level === 'medium' && task.energyRequired === 'high'))) {
      return false;
    }
    
    return true;
  });
  
  // Trier par priorité (pool) et autres critères
  const sortedTasks = energyFiltered.sort((a, b) => {
    // Priorité par pool
    const priorityA = getTaskPriority(a);
    const priorityB = getTaskPriority(b);
    
    if (priorityA !== priorityB) {
      return priorityB - priorityA; // Tri décroissant
    }
    
    // Puis par effort (moindre effort en premier)
    const effortOrder = { 'low': 1, 'medium': 2, 'high': 3 };
    return effortOrder[a.effort] - effortOrder[b.effort];
  });
  
  // Sélectionner les tâches qui tiennent dans la capacité
  const selectedTasks: TaskWithContext[] = [];
  let currentEffort = 0;
  let taskCount = 0;
  
  for (const task of sortedTasks) {
    if (taskCount >= maxTasks) break;
    
    // Calculer le coût de la tâche
    const taskEffort = effortToNumber(task.effort);
    
    if (currentEffort + taskEffort <= capacity.maxEffort && 
        selectedTasks.reduce((sum, t) => sum + t.duration, 0) + task.duration <= availableTime) {
      selectedTasks.push(task);
      currentEffort += taskEffort;
      taskCount++;
    }
  }
  
  // Créer la session
  const session: SessionState = {
    id: sessionId,
    timestamp: currentTime.getTime(),
    startTime: currentTime.getTime(),
    endTime: currentTime.getTime() + availableTime * 60 * 1000,
    plannedTasks: selectedTasks.length,
    completedTasks: 0,
    state: 'PLANNED',
    energyLevel: energyState.level,
    energyStability: energyState.stability,
    taskIds: selectedTasks.map(t => t.id),
    createdAt: currentTime
  };
  
  return session;
}

/**
 * Calcule la priorité d'une tâche pour la sélection de session
 */
function getTaskPriority(task: TaskWithContext): number {
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
 * Convertit l'effort en nombre pour les calculs
 */
function effortToNumber(effort: 'low' | 'medium' | 'high'): number {
  switch (effort) {
    case 'low': return 1;
    case 'medium': return 2;
    case 'high': return 3;
    default: return 1;
  }
}

/**
 * Vérifie si une session est terminée selon les règles strictes
 */
export function isSessionCompleted(session: SessionState, tasks: TaskWithContext[]): boolean {
  // La session n'est JAMAIS considérée comme terminée sans action explicite de l'utilisateur
  // Cette fonction est utilisée pour des alertes ou des suggestions, pas pour une conclusion automatique
  
  const completedTasksCount = tasks.filter(t => 
    t.status === 'done' && session.taskIds.includes(t.id)
  ).length;
  
  // Retourne un indicateur pour alerter l'utilisateur, mais ne termine pas la session
  return {
    allTasksDone: completedTasksCount === session.plannedTasks,
    timeExceeded: Date.now() > (session.startTime + session.plannedTasks * 60 * 60 * 1000),
    needsExplicitEnd: true  // L'utilisateur doit toujours cliquer explicitement pour terminer
  };
}

/**
 * Génère une prévision énergétique par créneau
 */
export function generateEnergyForecast(day: Date): Map<string, EnergyState> {
  const forecast = new Map<string, EnergyState>();
  
  // Courbe énergétique typique par créneau
  const defaultCurve = {
    "08h-10h": { level: "medium" as const, stability: "stable" as const },     // Montée
    "10h-12h": { level: "high" as const, stability: "stable" as const },       // Peak matinal
    "12h-14h": { level: "medium" as const, stability: "stable" as const },     // Digestion
    "14h-16h": { level: "medium" as const, stability: "volatile" as const },   // Creux après-midi
    "16h-18h": { level: "medium" as const, stability: "stable" as const },     // Remontée
    "18h-20h": { level: "low" as const, stability: "volatile" as const }       // Déclin
  };
  
  // Ajustements basés sur l'historique utilisateur (simulation)
  Object.entries(defaultCurve).forEach(([timeSlot, baseState]) => {
    forecast.set(timeSlot, {
      ...baseState,
      confidence: 0.8  // Confiance moyenne dans la prédiction
    });
  });
  
  return forecast;
}

/**
 * Vérifie les invariants de session
 */
export function validateSession(session: SessionState, tasks: TaskWithContext[]): boolean {
  // Invariant I - Max 5 tâches par session
  if (session.plannedTasks > 5) {
    console.error("Invariant I violé: Plus de 5 tâches par session");
    return false;
  }
  
  // Invariant II - Capacité énergétique respectée
  const totalEffort = tasks
    .filter(t => session.taskIds.includes(t.id))
    .reduce((sum, task) => sum + effortToNumber(task.effort), 0);
  
  if (totalEffort > 10) { // Max effort pour une session
    console.error("Invariant II violé: Capacité énergétique dépassée");
    return false;
  }
  
  // Invariant IV - Contraintes horaires respectées
  for (const taskId of session.taskIds) {
    const task = tasks.find(t => t.id === taskId);
    if (task && task.scheduledTime) {
      const scheduledTime = new Date(task.scheduledTime);
      const sessionStart = new Date(session.startTime);
      const sessionEnd = new Date(session.endTime || session.startTime + 120 * 60 * 1000); // 2h par défaut
      
      if (!(scheduledTime >= sessionStart && scheduledTime <= sessionEnd)) {
        console.error("Invariant IV violé: Contrainte horaire non respectée");
        return false;
      }
    }
  }
  
  // Invariant V - Fin de session explicite
  // Cet invariant est respecté par conception dans la fonction determineSessionState
  
  return true;
}

/**
 * Génère un plan de journée complet avec sessions
 */
export function generateDailyPlan(
  tasks: TaskWithContext[],
  energyForecast: Map<string, EnergyState>,
  day: Date
): { sessions: SessionState[]; totalTasks: number; totalDuration: number; flexibilityScore: number } {
  
  const sessions: SessionState[] = [];
  let totalTasks = 0;
  let totalDuration = 0;
  
  // Obtenir les créneaux fixes (réunions, tâches programmées)
  const fixedBlocks = getFixedTimeBlocks(tasks, day);
  
  // Calculer les créneaux disponibles
  const availableSlots = calculateFreeSlots(day, fixedBlocks);
  
  // Filtrer les tâches éligibles
  const prioritized = prioritizeTasks(tasks, day);
  
  // Créer des sessions pour chaque créneau disponible
  for (const slot of availableSlots) {
    const slotEnergy = energyForecast.get(slot.timeRange) || {
      level: "medium" as const,
      stability: "stable" as const,
      confidence: 0.7
    };
    
    // Créer une session pour ce créneau
    const session = generateSession(
      prioritized,
      slotEnergy,
      new Date(slot.startTime),
      slot.durationMinutes,
      5  // max 5 tâches
    );
    
    if (session.plannedTasks > 0) {
      sessions.push(session);
      totalTasks += session.plannedTasks;
      totalDuration += slot.durationMinutes;
      
      // Retirer les tâches planifiées du pool
      prioritized = prioritized.filter(task => !session.taskIds.includes(task.id));
    }
  }
  
  return {
    sessions,
    totalTasks,
    totalDuration,
    flexibilityScore: calculateFlexibility(sessions)
  };
}

/**
 * Obtenir les blocs de temps fixes
 */
function getFixedTimeBlocks(tasks: TaskWithContext[], day: Date): Array<{startTime: number, endTime: number, task: TaskWithContext}> {
  const blocks: Array<{startTime: number, endTime: number, task: TaskWithContext}> = [];
  
  for (const task of tasks) {
    if (task.scheduledTime) {
      const scheduledDate = new Date(task.scheduledTime);
      
      // Vérifier si la tâche est pour le jour spécifié
      const taskDay = new Date(scheduledDate);
      taskDay.setHours(0, 0, 0, 0);
      const targetDay = new Date(day);
      targetDay.setHours(0, 0, 0, 0);
      
      if (taskDay.getTime() === targetDay.getTime()) {
        const startTime = scheduledDate.getTime();
        const endTime = startTime + task.duration * 60 * 1000;
        
        blocks.push({
          startTime,
          endTime,
          task
        });
      }
    }
  }
  
  return blocks;
}

/**
 * Calculer les créneaux disponibles en fonction des blocs fixes
 */
function calculateFreeSlots(
  day: Date,
  fixedBlocks: Array<{startTime: number, endTime: number, task: TaskWithContext}>,
  dayStartHour: number = 8,
  dayEndHour: number = 20,
  breakDuration: number = 15
): Array<{startTime: number, endTime: number, durationMinutes: number, timeRange: string}> {
  
  const slots: Array<{startTime: number, endTime: number, durationMinutes: number, timeRange: string}> = [];
  
  // Début de la journée
  let currentTime = new Date(day);
  currentTime.setHours(dayStartHour, 0, 0, 0);
  let currentTimestamp = currentTime.getTime();
  
  // Fin de la journée
  const endOfDay = new Date(day);
  endOfDay.setHours(dayEndHour, 0, 0, 0);
  const endOfDayTimestamp = endOfDay.getTime();
  
  // Trier les blocs fixes par heure de début
  fixedBlocks.sort((a, b) => a.startTime - b.startTime);
  
  for (const block of fixedBlocks) {
    // Créneau libre avant le bloc fixe
    if (currentTimestamp < block.startTime) {
      const freeSlot = {
        startTime: currentTimestamp,
        endTime: block.startTime,
        durationMinutes: Math.floor((block.startTime - currentTimestamp) / (1000 * 60)),
        timeRange: getTimeRangeString(new Date(currentTimestamp), new Date(block.startTime))
      };
      
      if (freeSlot.durationMinutes > breakDuration) { // Ne pas créer de créneau trop court
        slots.push(freeSlot);
      }
    }
    
    // Mettre à jour le temps courant après le bloc fixe + pause
    currentTimestamp = block.endTime + breakDuration * 60 * 1000;
  }
  
  // Créneau libre après le dernier bloc fixe
  if (currentTimestamp < endOfDayTimestamp) {
    const freeSlot = {
      startTime: currentTimestamp,
      endTime: endOfDayTimestamp,
      durationMinutes: Math.floor((endOfDayTimestamp - currentTimestamp) / (1000 * 60)),
      timeRange: getTimeRangeString(new Date(currentTimestamp), endOfDay)
    };
    
    if (freeSlot.durationMinutes > breakDuration) {
      slots.push(freeSlot);
    }
  }
  
  return slots;
}

/**
 * Générer une chaîne de plage horaire
 */
function getTimeRangeString(start: Date, end: Date): string {
  return `${start.getHours()}h-${end.getHours()}h`;
}

/**
 * Prioriser les tâches selon les règles de la Phase 1
 */
function prioritizeTasks(tasks: TaskWithContext[], day: Date): TaskWithContext[] {
  // Créer une copie des tâches avec leurs pools assignés
  const tasksWithPools = tasks.map(task => ({
    ...task,
    pool: assignTaskToPool(task, day)
  }));
  
  // Trier selon la priorité des pools
  return tasksWithPools.sort((a, b) => {
    // Priorité par pool
    const poolPriority: {[key in TaskPool]: number} = {
      'OVERDUE': 4,
      'TODAY': 3,
      'SOON': 2,
      'AVAILABLE': 1
    };
    
    const priorityA = poolPriority[a.pool];
    const priorityB = poolPriority[b.pool];
    
    if (priorityA !== priorityB) {
      return priorityB - priorityA; // Tri décroissant
    }
    
    // Ensuite par urgence
    const urgencyOrder = { 'urgent': 4, 'high': 3, 'medium': 2, 'low': 1 };
    return urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
  });
}

/**
 * Calculer le score de flexibilité
 */
function calculateFlexibility(sessions: SessionState[]): number {
  // Plus il y a de sessions et moins elles sont pleines, plus le système est flexible
  if (sessions.length === 0) return 0;
  
  const avgFillRate = sessions.reduce((sum, session) => {
    return sum + (session.completedTasks / session.plannedTasks || 0);
  }, 0) / sessions.length;
  
  // Score entre 0 et 1, 1 étant très flexible
  return Math.min(1, (sessions.length * (1 - avgFillRate)) / 5);
}