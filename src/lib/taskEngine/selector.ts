// Algorithme de sélection des tâches pour le Cerveau de KairuFlow - Phase 1

import { Task, TaskPlaylist, TaskScore, EnergyState } from './types';
import { calculateTaskScore, sortTasksByScore } from './scorer';
import { isEnergyCompatible } from './energyModel';
import { calculateSessionCapacity } from './capacityCalculator';
import { createTaskPoolManager, getEligibleTasks, updateTaskPools } from './taskPoolManager';
import { validatePlaylist } from './invariantChecker';
import { calculateTaskAgeIndex, getDetoxMode, applyDetoxActions } from './taskAgeIndex';
import { applyFallback } from './selectorFallback';
import { analyzeDeadlines, determineTriageMode, calculateOptimizedLoad, generateDeadlineSuggestions } from './deadlineManager';
import { checkTimeConstraints } from './timeConstraintManager';

/**
 * Filtre les tâches éligibles en fonction de leur deadline et statut
 * @param tasks Ensemble des tâches
 * @param currentDate Date actuelle
 * @returns Tâches éligibles
 */
export function filterEligibleTasks(tasks: Task[], currentDate: Date): Task[] {
  const today = new Date(currentDate);
  today.setHours(0, 0, 0, 0);

  return tasks.filter(task => {
    // Tâches en retard (deadline passée et non terminées)
    if (task.deadline && task.deadline < today) {
      return true;
    }

    // Tâches d'aujourd'hui
    if (task.deadline && task.deadline.getTime() === today.getTime()) {
      return true;
    }

    // Tâches sans deadline ou avec deadline future
    if (!task.deadline || task.deadline > today) {
      // Vérifier si la tâche a été démarrée par l'utilisateur
      return task.completionHistory.length > 0 || task.status === 'active' || task.status === 'todo';
    }

    return false;
  });
}

/**
 * Filtre les tâches en fonction de la stabilité énergétique
 * @param tasks Tâches à filtrer
 * @param energyState État d'énergie de l'utilisateur
 * @returns Tâches filtrées
 */
export function filterByStability(tasks: Task[], energyState: EnergyState): Task[] {
  // Si l'énergie est stable, toutes les tâches sont acceptées
  if (energyState.stability === 'stable') {
    return tasks;
  }

  // Si l'énergie est volatile, exclure les tâches à effort élevé
  return tasks.filter(task => task.effort !== 'high');
}

/**
 * Injecte une tâche quick win dans la playlist
 * @param tasks Tâches disponibles
 * @param playlist Playlist en cours de construction
 * @param maxQuickWins Nombre maximum de quick wins à injecter
 * @returns Tâche quick win trouvée (ou null si aucune)
 */
export function injectQuickWin(
  tasks: Task[],
  playlist: Task[],
  maxQuickWins: number = 1
): Task | null {
  // Compter les quick wins déjà dans la playlist
  const quickWinsInPlaylist = playlist.filter(task =>
    task.duration <= 15 && task.effort === 'low'
  ).length;

  // Si on a déjà atteint le maximum, ne pas en ajouter d'autres
  if (quickWinsInPlaylist >= maxQuickWins) {
    return null;
  }

  // Trouver une tâche quick win parmi les tâches disponibles
  const quickWin = tasks.find(task =>
    task.duration <= 15 &&
    task.effort === 'low' &&
    !playlist.includes(task)
  );

  return quickWin || null;
}

/**
 * Vérifie la diversité de la playlist
 * @param playlist Playlist à vérifier
 * @param maxSameCategory Nombre maximum de tâches de la même catégorie
 * @returns Booléen indiquant si la diversité est suffisante
 */
export function checkDiversity(playlist: Task[], maxSameCategory: number = 2): boolean {
  // Compter les tâches par catégorie
  const categoryCount: Record<string, number> = {};

  for (const task of playlist) {
    categoryCount[task.category] = (categoryCount[task.category] || 0) + 1;

    // Si une catégorie dépasse le maximum, la diversité n'est pas suffisante
    if (categoryCount[task.category] > maxSameCategory) {
      return false;
    }
  }

  return true;
}

/**
 * Génère une playlist de tâches en appliquant l'algorithme de sélection
 * @param tasks Ensemble des tâches disponibles
 * @param userEnergy État d'énergie de l'utilisateur
 * @param maxTasks Nombre maximum de tâches dans la playlist (par défaut 5)
 * @param currentDate Date actuelle (pour le filtrage)
 * @param options Options supplémentaires
 * @returns Playlist de tâches générée
 */
export function generateTaskPlaylist(
  tasks: Task[],
  userEnergy: EnergyState,
  maxTasks: number = 5,
  currentDate: Date = new Date(),
  options?: {
    sessionDurationMinutes?: number;
    detoxConsecutiveDays?: number;
  }
): TaskPlaylist {
  const sessionCapacity = options?.sessionDurationMinutes
    ? calculateSessionCapacity(options.sessionDurationMinutes, userEnergy)
    : Number.POSITIVE_INFINITY;

  // 1. ANALYSE DES DEADLINES AVANT TOUTE SÉLECTION
  const timeAvailable = options?.sessionDurationMinutes ?? 120; // Default 2h
  const deadlineAnalysis = analyzeDeadlines(tasks, timeAvailable);
  const triageMode = determineTriageMode(deadlineAnalysis);

  // Si mode TRIAGE activé, générer une playlist spéciale
  if (triageMode.active) {
    const suggestions = generateDeadlineSuggestions(triageMode);
    const optimizedLoad = calculateOptimizedLoad(
      tasks,
      triageMode.tasksToTriage,
      timeAvailable
    );

    return {
      tasks: optimizedLoad.selectedTasks.slice(0, maxTasks),
      generatedAt: new Date(),
      energyUsed: userEnergy,
      explanation: `Mode Triage : Priorisation des tâches critiques.`,
      warnings: suggestions
    };
  }

  // 2. GESTION DES POOLS AVEC RÈGLE D'OR
  let poolManager = updateTaskPools(tasks, createTaskPoolManager(currentDate));

  // 3. DETOX : calcul TAI + application des actions aux pools
  const tai = calculateTaskAgeIndex(tasks, currentDate);
  const detoxMode = getDetoxMode(tai, options?.detoxConsecutiveDays ?? 0);
  const detoxActions = applyDetoxActions(tasks, detoxMode);

  if (detoxMode === 'BLOCK' || detoxMode === 'SUGGESTION') {
    // Geler SOON : retirer du pool SOON
    poolManager = {
      ...poolManager,
      soon: poolManager.soon.filter(
        t => !detoxActions.frozenSoonTasks.some(f => f.id === t.id)
      )
    };
    // Limiter TODAY à 2 tâches en mode BLOCK
    if (detoxMode === 'BLOCK') {
      poolManager = {
        ...poolManager,
        today: poolManager.today.slice(0, 2)
      };
    }
  }

  // 4. RÈGLE D'OR POUR L'ÉLIGIBILITÉ
  const eligibleTasks = getEligibleTasks(poolManager);

  // 5. FILTRAGE PAR DEADLINES/PROGRAMMATION
  const timeEligibleTasks = filterEligibleTasks(eligibleTasks, currentDate);

  // 6. FILTRAGE PAR CONTRAINTES HORAIRE
  const constraintFilteredTasks = checkTimeConstraints(timeEligibleTasks, currentDate);

  // 7. FILTRAGE PAR STABILITÉ ÉNERGÉTIQUE
  const stabilityFilteredTasks = filterByStability(constraintFilteredTasks, userEnergy);

  // 8. CALCUL DES SCORES
  const taskScores: TaskScore[] = stabilityFilteredTasks.map(task =>
    calculateTaskScore(task, userEnergy, [])
  );

  // 9. TRI PAR SCORE DÉCROISSANT
  const sortedTaskScores = sortTasksByScore(taskScores);

  // 10. CONSTRUCTION DE LA PLAYLIST
  const playlist: Task[] = [];
  let remainingTasks = [...sortedTaskScores];

  // Injecter une tâche quick win si possible
  const quickWin = injectQuickWin(stabilityFilteredTasks, playlist);
  if (quickWin) {
    playlist.push(quickWin);
    // Retirer la quick win des tâches restantes
    remainingTasks = remainingTasks.filter(ts => ts.task.id !== quickWin.id);
  }

  // Ajouter les autres tâches jusqu'à atteindre la limite
  for (const taskScore of remainingTasks) {
    if (playlist.length >= maxTasks) {
      break;
    }
    if (!isEnergyCompatible(taskScore.task.effort, userEnergy)) {
      continue;
    }
    playlist.push(taskScore.task);
  }

  // 11. VÉRIFICATION DE LA DIVERSITÉ
  while (!checkDiversity(playlist) && playlist.length > 1) {
    playlist.pop();
  }

  // 12. CONSTRUCTION DE LA PLAYLIST FINALE AVEC EXPLICATIONS STRUCTURÉES
  const explanationParts: string[] = [];
  
  if(userEnergy.stability === 'volatile') {
    explanationParts.push("Votre énergie semble changeante, la playlist est plus légère.");
  }

  if (quickWin) {
    explanationParts.push(`Nous commençons par une tâche rapide pour prendre de l'élan.`);
  }

  if(detoxMode !== 'NONE') {
    explanationParts.push('Le mode Detox est actif pour vous aider à rattraper les anciennes tâches.');
  }

  const explanation = explanationParts.length > 0 ? explanationParts.join(' ') : "Voici une sélection de tâches adaptées à votre journée.";

  const builtPlaylist: TaskPlaylist = {
    tasks: playlist,
    generatedAt: new Date(),
    energyUsed: userEnergy,
    explanation,
    warnings: playlist.length === 0 ? ["Aucune tâche ne semble correspondre à votre énergie actuelle. Prenez une pause ?"] : undefined
  };

  // 13. VALIDATION DES INVARIANTS
  const validation = validatePlaylist(builtPlaylist, userEnergy, sessionCapacity);
  if ('error' in validation) {
    return applyFallback(tasks, userEnergy, validation.invalidInvariants.join(', '));
  }

  return { ...validation };
}
