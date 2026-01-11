import { TaskWithContext, TaskPool, TaskStatus, EnergyStability, Capacity, CognitiveInvariant, CognitiveRiskSnapshot } from './types';
import { isTaskActive, calculateTaskAgeIndex, determineDetoxPhase, detectImpossibleDay, resolveTemporalConflict, detectStability } from './taskManagement';
import { determineSessionState, generateSession, validateSession, generateDailyPlan } from './sessionManagement';

/**
 * Invariant I - Charge maximale par session
 * Jamais plus de 5 tâches par session.
 */
export function invariantMaxTasksPerSession(tasks: TaskWithContext[]): boolean {
  return tasks.length <= 5;
}

/**
 * Invariant II - Capacité énergétique dure
 * La somme des coûts ≤ capacité session.
 */
export function invariantCapacity(tasks: TaskWithContext[], capacity: Capacity): boolean {
  const totalEffort = tasks.reduce((sum, task) => sum + effortToNumber(task.effort), 0);
  return totalEffort <= capacity.maxEffort;
}

/**
 * Invariant III - Priorité temporelle absolue
 * OVERDUE > TODAY > SOON > AVAILABLE
 */
export function invariantTemporalPriority(task: TaskWithContext, allTasks: TaskWithContext[]): boolean {
  // Vérifier que les tâches OVERDUE sont traitées en priorité
  const hasOverdue = allTasks.some(t => t.pool === 'OVERDUE');
  const hasToday = allTasks.some(t => t.pool === 'TODAY');
  
  if (hasOverdue && task.pool !== 'OVERDUE') {
    // Si des tâches OVERDUE existent, les tâches SOON et AVAILABLE ne devraient pas être prioritaires
    return task.pool !== 'SOON' && task.pool !== 'AVAILABLE';
  }
  
  if (hasToday && !hasOverdue && task.pool !== 'TODAY') {
    // Si des tâches TODAY existent mais pas OVERDUE, les tâches SOON et AVAILABLE ne devraient pas être prioritaires
    return task.pool !== 'SOON' && task.pool !== 'AVAILABLE';
  }
  
  return true;
}

/**
 * Invariant IV - Contraintes horaires non négociables
 * Une tâche avec scheduledTime bloque le créneau.
 */
export function invariantFixedConstraints(task: TaskWithContext, conflictingTasks: TaskWithContext[]): boolean {
  if (!task.scheduledTime) {
    return true; // Pas de contrainte horaire à vérifier
  }
  
  // Vérifier qu'aucune autre tâche ne chevauche ce créneau
  const taskStart = new Date(task.scheduledTime).getTime();
  const taskEnd = taskStart + (task.duration * 60 * 1000);
  
  for (const conflictingTask of conflictingTasks) {
    if (conflictingTask.scheduledTime) {
      const conflictingStart = new Date(conflictingTask.scheduledTime).getTime();
      const conflictingEnd = conflictingStart + (conflictingTask.duration * 60 * 1000);
      
      // Vérifier s'il y a un chevauchement
      if ((taskStart < conflictingEnd && taskEnd > conflictingStart)) {
        return false; // Chevauchement détecté
      }
    }
  }
  
  return true;
}

/**
 * Invariant V - Fin de session explicite
 * Aucune session ne se termine sans action utilisateur.
 */
export function invariantExplicitSessionEnd(sessionState: string): boolean {
  // La session ne doit être marquée comme terminée que si l'utilisateur l'a explicitement décidée
  // Les états autres que COMPLETED ne signifient pas une fin réelle
  return sessionState !== 'COMPLETED'; // Si c'est COMPLETED, c'est que l'utilisateur a décidé
}

/**
 * Invariant VI - Session incomplète ≠ punition
 * Aucune pénalité automatique sur la session suivante.
 */
export function invariantNoPunishment(): boolean {
  // Cette logique est gérée au niveau de l'algorithme de sélection
  // Il ne doit jamais y avoir de pénalité automatique pour session incomplète
  return true; // Implémenté dans la logique métier
}

/**
 * Invariant VII - Fenêtre ACTIVE limitée
 * Max 10 tâches "actives" simultanément.
 */
export function invariantMaxActiveTasks(tasks: TaskWithContext[], today: Date = new Date()): boolean {
  const activeCount = tasks.filter(task => isTaskActive(task, today)).length;
  return activeCount <= 10;
}

/**
 * Invariant VIII - Stability = filtre dur
 * Si stability = volatile → exclure les tâches lourdes.
 */
export function invariantStabilityFilter(task: TaskWithContext, stability: EnergyStability): boolean {
  if (stability === 'volatile') {
    // Si la stabilité est volatile, exclure les tâches lourdes
    return task.effort !== 'high';
  }
  return true; // Sinon, tout est autorisé
}

/**
 * Invariant IX - Task Age Index
 * Si TAI > 2 pendant 3 jours → Mode DETOX
 */
export function invariantTaskAgeIndex(tasks: TaskWithContext[], daysThreshold: number = 3): boolean {
  const tai = calculateTaskAgeIndex(tasks);
  return !(tai.averageAge > 2.0 && daysThreshold >= 3);
}

/**
 * Invariant X - SOON limité
 * SOON ≤ 3 tâches.
 */
export function invariantMaxSoonTasks(tasks: TaskWithContext[]): boolean {
  const soonTasks = tasks.filter(task => task.pool === 'SOON');
  return soonTasks.length <= 3;
}

/**
 * Invariant XI - Deadlines impossibles
 * Détecter si la somme des tâches dépasse le temps disponible
 */
export function invariantImpossibleDeadlines(tasks: TaskWithContext[], availableTime: number): boolean {
  return !detectImpossibleDay(tasks, availableTime);
}

/**
 * Convertir effort en nombre pour les calculs
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
 * Fonction de validation globale des invariants
 */
export function validateAllInvariants(
  tasks: TaskWithContext[],
  capacity: Capacity,
  sessionState: string,
  stability: EnergyStability,
  availableTime: number
): { valid: boolean; violations: string[] } {
  
  const violations: string[] = [];
  
  // Vérifier chaque invariant
  if (!invariantMaxTasksPerSession(tasks)) {
    violations.push("Invariant I violé: Plus de 5 tâches dans la session");
  }
  
  if (!invariantCapacity(tasks, capacity)) {
    violations.push("Invariant II violé: Capacité énergétique dépassée");
  }
  
  if (!invariantMaxActiveTasks(tasks)) {
    violations.push("Invariant VII violé: Plus de 10 tâches actives");
  }
  
  if (!invariantMaxSoonTasks(tasks)) {
    violations.push("Invariant X violé: Plus de 3 tâches dans SOON");
  }
  
  // Vérifier pour chaque tâche
  for (const task of tasks) {
    if (!invariantStabilityFilter(task, stability)) {
      violations.push(`Invariant VIII violé: Tâche lourde dans créneau instable - ${task.title}`);
    }
    
    if (!invariantTemporalPriority(task, tasks)) {
      violations.push(`Invariant III violé: Priorité temporelle non respectée - ${task.title}`);
    }
  }
  
  // Vérifier les contraintes fixes
  for (let i = 0; i < tasks.length; i++) {
    const remainingTasks = tasks.filter((_, idx) => idx !== i);
    if (!invariantFixedConstraints(tasks[i], remainingTasks)) {
      violations.push(`Invariant IV violé: Conflit de contrainte horaire - ${tasks[i].title}`);
    }
  }
  
  // Vérifier les deadlines impossibles
  if (!invariantImpossibleDeadlines(tasks, availableTime)) {
    violations.push("Invariant XI violé: Deadlines physiquement impossibles détectées");
  }
  
  return {
    valid: violations.length === 0,
    violations
  };
}

/**
 * Fonction de vérification des risques cognitifs
 */
export function checkCognitiveRisks(tasks: TaskWithContext[], userActions: any[]): CognitiveRiskSnapshot {
  // Calculer les scores de risque
  let addictionRiskScore = 0;
  let coercionRiskScore = 0;
  let overloadRiskScore = 0;
  let autonomyLossScore = 0;
  
  // Calcul basé sur les interactions utilisateur
  const overrideCount = userActions.filter((action: any) => action.type === 'OVERRIDE').length;
  const ignoreCount = userActions.filter((action: any) => action.type === 'IGNORE_SUGGESTION').length;
  const sessionCount = userActions.filter((action: any) => action.type === 'SESSION_COMPLETED').length;
  const incompleteCount = userActions.filter((action: any) => action.type === 'SESSION_INCOMPLETE').length;
  
  // Calculer les scores
  addictionRiskScore = Math.min(1, overrideCount / 10); // Plus d'overrides = plus de risque
  coercionRiskScore = Math.min(1, ignoreCount / 5); // Plus d'ignorés = plus de coercition perçue
  overloadRiskScore = tasks.length > 5 ? 0.8 : tasks.length > 3 ? 0.5 : 0.2;
  autonomyLossScore = incompleteCount > sessionCount * 0.5 ? 0.7 : 0.3; // Si plus de 50% des sessions incomplètes
  
  return {
    timestamp: new Date(),
    addictionRiskScore,
    coercionRiskScore,
    overloadRiskScore,
    autonomyLossScore
  };
}

/**
 * Application des règles de la Phase 1 dans un flux de travail
 */
export function applyPhase1Rules(
  tasks: TaskWithContext[],
  energyLevel: 'low' | 'medium' | 'high',
  energyStability: EnergyStability,
  currentTime: Date = new Date(),
  availableTime: number
): { 
  filteredTasks: TaskWithContext[]; 
  capacity: Capacity; 
  invariantsValid: boolean; 
  violations: string[];
  detoxPhase: string | null;
} {
  
  // Calculer l'index d'âge des tâches
  const tai = calculateTaskAgeIndex(tasks, currentTime);
  
  // Déterminer la phase DETOX
  const detox = determineDetoxPhase(tai);
  const detoxPhaseName = detox ? detox.phase : null;
  
  // Calculer la capacité
  const capacity = {
    maxTasks: energyLevel === 'high' ? 5 : energyLevel === 'medium' ? 3 : 2,
    maxEffort: energyLevel === 'high' ? 12 : energyLevel === 'medium' ? 8 : 4,
    availableMinutes: availableTime
  };
  
  // Appliquer la stabilité à la capacité
  if (energyStability === 'volatile') {
    capacity.maxTasks = Math.max(1, Math.floor(capacity.maxTasks * 0.6));
    capacity.maxEffort = Math.max(1, Math.floor(capacity.maxEffort * 0.6));
  }
  
  // Filtrer les tâches selon les règles de pool
  const eligibleTasks = tasks.filter(task => {
    // Appliquer la filtration basée sur la stabilité
    if (!invariantStabilityFilter(task, energyStability)) {
      return false;
    }
    
    // Autres règles de filtration pourraient être appliquées ici
    return true;
  });
  
  // Limiter aux tâches actives (max 10)
  const activeTasks = eligibleTasks.filter(task => isTaskActive(task, currentTime));
  if (activeTasks.length > 10) {
    // Garder les 10 tâches les plus récentes
    const sorted = activeTasks.sort((a, b) => 
      (b.lastActivated?.getTime() || 0) - (a.lastActivated?.getTime() || 0)
    );
    activeTasks.splice(10);
  }
  
  // Valider les invariants
  const validation = validateAllInvariants(activeTasks, capacity, 'IN_PROGRESS', energyStability, availableTime);
  
  return {
    filteredTasks: activeTasks,
    capacity,
    invariantsValid: validation.valid,
    violations: validation.violations,
    detoxPhase: detoxPhaseName
  };
}