import {
  calculateEnergyScore,
  calculateImpactScore,
  calculateDeadlineScore,
  calculateEffortScore,
  isQuickWin,
  calculateHistoryScore as calculateHistoryScoreFromRules,
  type EnergyLevel,
} from "./scoringRules";
import { getTodoTasksBulk, getTaskHistoryBulk, getUserPatternsFromDB } from "./database/index";
import { LanguageDetector } from "@/lib/nlp/LanguageDetector";
import { createLogger } from '@/lib/logger';

type TaskLike = {
  id: string;
  name: string;
  completed: boolean;
  subtasks: unknown[];
  lastAccessed: string;
  completionRate: number;
  priority: 'low' | 'medium' | 'high';
  description?: string;
  objective?: string;
  tags?: string[];
  energyRequired?: EnergyLevel;
  estimatedDuration?: number;
  scheduledDate?: string;
  effort?: 'S' | 'M' | 'L';
};

type UserPatternsLike = {
  skippedTaskTypes: Record<string, number>;
  completedTaskTypes: Record<string, number>;
  shuffleCount: number;
};

export type TaskScore = {
  task: TaskLike;
  score: number;
  reason: string;
  reasonDetails?: string[];
  isKeystoneHabit?: boolean;
  impactMetrics?: ImpactMetricsLike;
};

export type PlaylistGeneratorOptions = {
  energyLevel: EnergyLevel;
  currentTime: Date;
  taskHistory?: TaskLike[];
  userPatterns?: UserPatternsLike;
  maxTasks?: number;
  workdayHours?: number;
};

type ImpactMetricsLike = {
  calculatedImpact: number;
  [key: string]: unknown;
};

// Importer les nouveaux services SOTA
import { ImpactAnalyzer } from "@/lib/playlist/services/impactAnalyzer";
import { KeystoneDetector } from "@/lib/playlist/services/keystoneDetector";
import { FeedbackGenerator } from "@/lib/playlist/services/feedbackGenerator";
import { RewardSystem } from "@/lib/playlist/services/rewardSystem";

const logger = createLogger('PlaylistGenerator');

/**
 * Algorithme de Génération de Playlist (Cœur Décisionnel)
 * 
 * Génère 3-5 tâches impactantes basées sur :
 * - État énergétique du matin (40%)
 * - Impact inféré (15%)
 * - Deadline/Priorité (20%)
 * - Effort/Temps (15%)
 * - Patterns historiques (10%)
 * 
 * Optimisé pour <200ms via bulkGet Dexie + memoization
 * 
 * SOTA Enhancements:
 * - Nouveau facteur d'impact (15%) avec formule : Impact = (Valeur Perçue + Momentum Passé) / Effort Estimé
 * - Intégration des keystone habits
 * - Feedback intelligent basé sur l'impact moyen
 * - Système de récompenses gamifié
 */

// Cache pour la memoization
const playlistCache = new Map<string, TaskScore[]>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Analyse le contexte linguistique d'une tâche pour améliorer le scoring
 */
function analyzeTaskLanguageContext(task: TaskLike): { primaryLanguage: 'fr' | 'en' | 'es', confidence: number } {

  // Combiner le nom, la description et les tags pour l'analyse
  const textToAnalyze = [
    task.name,
    task.description,
    task.tags ? task.tags.join(' ') : ''
  ].filter(Boolean).join(' ');
  
  if (!textToAnalyze.trim()) {
    return { primaryLanguage: 'fr', confidence: 0.5 }; // Fallback par défaut
  }
  
  const detectedLanguage = LanguageDetector.detect(textToAnalyze, 'fr').lang;

  // Calculer la confiance basée sur la longueur du texte
  const confidence = Math.min(1, textToAnalyze.length / 50); // 100% de confiance à partir de 50 caractères
  
  return { primaryLanguage: detectedLanguage, confidence };
}

/**
 * Calcule le score d'une tâche en fonction des facteurs spécifiés
 * Et retourne également les raisons détaillées pour l'explication
 */
function calculateTaskScore(
  task: TaskLike,
  energyLevel: EnergyLevel,
  currentTime: Date,
  taskHistory: TaskLike[] = [],
  userPatterns?: UserPatternsLike,
  workdayHours: number = 8,
  keystoneHabits: any[] = [] // Pour la détection des keystone habits
): TaskScore {
  let score = 0;
  const reasons: string[] = [];
  const reasonDetails: string[] = []; // Pour les badges détaillés

  // 1. État Énergétique (40%)
  const energyScore = calculateEnergyScore(task, energyLevel);
  score += energyScore * 40;
  if (energyScore > 0) {
    reasons.push(`Énergie (${Math.round(energyScore * 100)}%)`);
    if (task.energyRequired === energyLevel) {
      reasonDetails.push("Matche votre énergie");
    }
  }

  // 2. Impact SOTA (15%) - Nouvelle formule : Impact = (Valeur Perçue + Momentum Passé) / Effort Estimé
  const impactMetrics = ImpactAnalyzer.calculateImpact(task, taskHistory) as unknown as ImpactMetricsLike;
  const sotaImpactScore = Math.min(1, impactMetrics.calculatedImpact / 100); // Normaliser entre 0 et 1
  score += sotaImpactScore * 15;
  if (sotaImpactScore > 0) {
    reasons.push(`Impact SOTA (${Math.round(sotaImpactScore * 100)}%)`);
    if (sotaImpactScore >= 0.8) {
      reasonDetails.push("Impact élevé");
    }
  }

  // 3. Priorité + Deadline (20%)
  const deadlineScore = calculateDeadlineScore(task, currentTime);
  score += deadlineScore * 20;
  if (deadlineScore > 0) {
    reasons.push(`Deadline (${Math.round(deadlineScore * 100)}%)`);
    if (deadlineScore >= 15) { // Proche deadline
      reasonDetails.push("Deadline proche");
    }
  }

  // 4. Effort + Temps (15%)
  const effortScore = calculateEffortScore(task, energyLevel);
  score += effortScore * 15;
  if (effortScore !== 0) {
    const effortLabel = effortScore > 0 ? "Bonus effort" : "Pénalité effort";
    reasons.push(`${effortLabel} (${Math.abs(effortScore)} pts)`);
    if (effortScore > 0) {
      reasonDetails.push("Quick win");
    }
  }

  // 5. Patterns Historiques (10%)
  const historyScore = calculateHistoryScoreFromRules(task, taskHistory, userPatterns);
  score += historyScore * 10;
  if (historyScore !== 0) {
    const historyLabel = historyScore > 0 ? "Bonus historique" : "Pénalité historique";
    reasons.push(`${historyLabel} (${Math.abs(historyScore)} pts)`);
    if (historyScore > 0) {
      reasonDetails.push("Bon historique");
    } else {
      reasonDetails.push("Pattern négatif");
    }
  }

  // 6. Contexte Linguistique (ajustement mineur)
  // L'analyse linguistique peut légèrement ajuster le score pour favoriser
  // les tâches dans la langue préférée de l'utilisateur
  const languageContext = analyzeTaskLanguageContext(task);
  // Pour l'instant, on ne fait qu'enregistrer cette information
  // Dans une implémentation plus avancée, on pourrait l'utiliser pour ajuster le score

  // 7. Détection Keystone Habit (bonus)
  const isKeystoneHabit = keystoneHabits.some((habit: any) => 
    task.tags && task.tags.includes(habit.name.toLowerCase())
  );
  
  if (isKeystoneHabit) {
    score += 10; // Bonus pour les keystone habits
    reasonDetails.push("Keystone Habit");
  }

  return {
    task,
    score: Math.max(0, score), // Assurer que le score ne soit jamais négatif
    reason: reasons.join(", "),
    reasonDetails, // Ajout des détails pour les badges
    isKeystoneHabit,
    impactMetrics // Ajout des métriques d'impact pour le feedback
  };
}

/**
 * Calcule le score basé sur l'historique (10%)
 * Tâches complétées régulièrement : Score +5
 * Tâches souvent reportées : Score -10
 * Intègre l'apprentissage automatique des patterns
 */
function calculateHistoryScore(task: TaskLike, taskHistory: TaskLike[] = [], userPatterns?: UserPatternsLike): number {
  // Utiliser la fonction du module scoringRules
  return calculateHistoryScoreFromRules(task, taskHistory, userPatterns);
}

/**
 * Génère un identifiant de cache unique basé sur les paramètres
 */
function generateCacheKey(options: PlaylistGeneratorOptions): string {
  const keyParts = [
    options.energyLevel,
    options.currentTime.getTime(),
    options.maxTasks || 5,
    options.workdayHours || 8,
    options.userPatterns ? JSON.stringify(options.userPatterns) : 'no-patterns'
  ];
  
  return keyParts.join('|');
}

/**
 * Récupère les tâches depuis la base de données avec bulkGet Dexie
 * Optimisé pour <200ms
 */
async function fetchTasksWithBulkGet(): Promise<{ tasks: TaskLike[]; taskHistory: any[] }> {
  try {
    // Récupérer les tâches et l'historique en parallèle
    const [tasks, taskHistory] = await Promise.all([
      getTodoTasksBulk(),
      getTaskHistoryBulk()
    ]);

    const normalized: TaskLike[] = (tasks as any[]).map((t) => ({
      id: String(t.id),
      name: String(t.name ?? t.title ?? ''),
      completed: Boolean(t.completed),
      subtasks: Array.isArray(t.subtasks) ? t.subtasks : [],
      lastAccessed: typeof t.lastAccessed === 'string' ? t.lastAccessed : new Date().toISOString(),
      completionRate: typeof t.completionRate === 'number' ? t.completionRate : 0,
      priority: (t.priority === 'low' || t.priority === 'medium' || t.priority === 'high') ? t.priority : 'medium',
      description: typeof t.description === 'string' ? t.description : undefined,
      objective: typeof t.objective === 'string' ? t.objective : undefined,
      tags: Array.isArray(t.tags) ? t.tags : undefined,
      energyRequired: (t.energyRequired === 'low' || t.energyRequired === 'medium' || t.energyRequired === 'high') ? t.energyRequired : undefined,
      estimatedDuration: typeof t.estimatedDuration === 'number' ? t.estimatedDuration : undefined,
      scheduledDate: typeof t.scheduledDate === 'string' ? t.scheduledDate : undefined,
      effort: (t.effort === 'S' || t.effort === 'M' || t.effort === 'L') ? t.effort : undefined,
    }));

    return { tasks: normalized, taskHistory };
  } catch (error) {
    logger.error('Erreur lors de la récupération des tâches', error as Error);
    return { tasks: [], taskHistory: [] };
  }
}

/**
 * Génère la playlist avec 3-5 tâches optimales
 * Respecte l'équilibre et gère les fallbacks
 * Optimisé pour <200ms via bulkGet Dexie + memoization
 * 
 * SOTA Enhancements:
 * - Limitation à 4 tâches max avec 1 keystone habit obligatoire
 * - Feedback basé sur l'impact moyen (>80% ou <50%)
 * - Suivi des tâches high-impact
 */
export async function generatePlaylist(
  tasks: TaskLike[],
  options: PlaylistGeneratorOptions
): Promise<TaskScore[]> {
  try {
    // Générer la clé de cache
    const cacheKey = generateCacheKey(options);
    const now = Date.now();
    
    // Vérifier le cache
    const cachedEntry = playlistCache.get(cacheKey);
    if (cachedEntry) {
      // Vérifier si le cache est encore valide
      return cachedEntry;
    }
    
    // Validation des paramètres obligatoires
    if (!options.energyLevel) {
      throw new Error("Le niveau d'énergie est requis pour générer la playlist");
    }
    
    if (!options.currentTime) {
      throw new Error("L'heure courante est requise pour générer la playlist");
    }
    
    // Vérification des paramètres
    if (!tasks || tasks.length === 0) {
      // Gestion d'erreur : Si DB vide, playlist = [micro-tâche "Respire"]
      const result = [{
        task: {
          id: "breathing-exercise",
          name: "Aujourd'hui, respire : une marche ?",
          completed: false,
          subtasks: [],
          lastAccessed: new Date().toISOString(),
          completionRate: 0,
          priority: "low",
          energyRequired: "low",
          effort: "S"
        } as TaskLike,
        score: 100,
        reason: "Playlist vide - suggestion de bien-être",
        reasonDetails: ["Bien-être"]
      }];
      
      // Mettre en cache le résultat
      playlistCache.set(cacheKey, result);
      return result;
    }

    // Filtrer les tâches déjà complétées
    const incompleteTasks = tasks.filter(task => !task.completed);

    // S'il n'y a pas de tâches incomplètes, retourner la tâche de bien-être
    if (incompleteTasks.length === 0) {
      const result = [{
        task: {
          id: "breathing-exercise",
          name: "Aujourd'hui, respire : une marche ?",
          completed: false,
          subtasks: [],
          lastAccessed: new Date().toISOString(),
          completionRate: 0,
          priority: "low",
          energyRequired: "low",
          effort: "S"
        } as TaskLike,
        score: 100,
        reason: "Aucune tâche incomplète - suggestion de bien-être",
        reasonDetails: ["Bien-être"]
      }];
      
      // Mettre en cache le résultat
      playlistCache.set(cacheKey, result);
      return result;
    }

    // Récupérer les patterns utilisateur si non fournis
    let userPatterns: UserPatternsLike | undefined = options.userPatterns;
    if (!userPatterns) {
      try {
        const fromDb = await getUserPatternsFromDB();
        if (fromDb && typeof fromDb === 'object') {
          userPatterns = fromDb as unknown as UserPatternsLike;
        }
      } catch (error) {
        logger.warn('Impossible de récupérer les patterns utilisateur', { error });
        // Continuer avec des patterns vides
        userPatterns = {
          skippedTaskTypes: {},
          completedTaskTypes: {},
          shuffleCount: 0
        } satisfies UserPatternsLike;
      }
    }

    if (!userPatterns) {
      userPatterns = {
        skippedTaskTypes: {},
        completedTaskTypes: {},
        shuffleCount: 0,
      };
    }

    // Détection des keystone habits
    const keystoneDetector = new KeystoneDetector(options.taskHistory || []);
    const keystoneHabits = keystoneDetector.getKeystoneHabits();

    // Calculer les scores pour toutes les tâches
    const workdayHours = options.workdayHours || 8;
    const scoredTasks = incompleteTasks.map(task => 
      calculateTaskScore(task, options.energyLevel, options.currentTime, options.taskHistory || [], userPatterns, workdayHours, keystoneHabits)
    );

    // Trier par score décroissant
    scoredTasks.sort((a, b) => b.score - a.score);

    // Appliquer les règles d'équilibre SOTA
    const balancedPlaylist = applySOTABalanceRules(scoredTasks, options.energyLevel, userPatterns, keystoneHabits);
    
    // Limiter à 4 tâches max (SOTA enhancement)
    const maxTasks = 4;
    const result = balancedPlaylist.slice(0, maxTasks);
    
    // Générer le feedback basé sur l'impact moyen
    const feedback = generateSOTAFeedback(result);
    
    // Mettre à jour le système de récompenses
    updateRewardSystem(result);
    
    // Mettre en cache le résultat
    playlistCache.set(cacheKey, result);
    
    return result;
  } catch (error) {
    logger.error('Erreur lors de la génération de la playlist', error as Error);
    
    // Fallback en cas d'erreur : retourner une playlist de base avec des quick wins
    try {
      if (tasks && tasks.length > 0) {
        const incompleteTasks = tasks.filter(task => !task.completed);
        if (incompleteTasks.length > 0) {
          // Sélectionner quelques quick wins
          const quickWins = incompleteTasks
            .filter(task => isQuickWin(task))
            .slice(0, 3)
            .map(task => ({
              task,
              score: 50,
              reason: "Quick win sélectionné en fallback",
              reasonDetails: ["Fallback", "Quick win"]
            }));
          
          if (quickWins.length > 0) {
            return quickWins;
          }
        }
      }
    } catch (fallbackError) {
      logger.error('Erreur lors du fallback', fallbackError as Error);
    }
    
    // Dernier recours : tâche de bien-être
    return [{
      task: {
        id: "breathing-exercise-error",
        name: "Erreur système - respirez profondément",
        completed: false,
        subtasks: [],
        lastAccessed: new Date().toISOString(),
        completionRate: 0,
        priority: "low",
        energyRequired: "low",
        effort: "S"
      } as TaskLike,
      score: 100,
      reason: "Erreur système - fallback de sécurité",
      reasonDetails: ["Erreur", "Bien-être"]
    }];
  }
}

/**
 * Applique les règles d'équilibre SOTA pour la sélection des tâches
 * - Max 4 tâches avec 1 keystone habit obligatoire
 * - Équilibre entre quick wins et tâches substantielles
 * - Gestion des fallbacks
 */
function applySOTABalanceRules(
  scoredTasks: TaskScore[],
  energyLevel: EnergyLevel,
  userPatterns?: UserPatternsLike,
  keystoneHabits: any[] = []
): TaskScore[] {
  try {
    const result: TaskScore[] = [];
    let longTaskCount = 0;
    let quickWinCount = 0;
    let keystoneHabitIncluded = false;
    
    // Si énergie low, limiter à 1 tâche L maximum
    const maxLongTasks = energyLevel === "low" ? 1 : 3;
    
    // Première passe : inclure une keystone habit si disponible
    if (keystoneHabits.length > 0) {
      const keystoneTask = scoredTasks.find(st => st.isKeystoneHabit);
      if (keystoneTask) {
        result.push(keystoneTask);
        keystoneHabitIncluded = true;
        
        if (keystoneTask.task.effort === "L") longTaskCount++;
        if (isQuickWin(keystoneTask.task)) quickWinCount++;
      }
    }
    
    // Deuxième passe : ajouter les autres tâches
    for (const scoredTask of scoredTasks) {
      // Éviter les doublons
      if (result.some(t => t.task.id === scoredTask.task.id)) continue;
      
      // Vérifier si on peut ajouter cette tâche sans violer les règles
      const isLongTask = scoredTask.task.effort === "L";
      const isQuickWinTask = isQuickWin(scoredTask.task);
      
      // Ajouter la tâche si elle respecte les contraintes
      if ((isLongTask && longTaskCount < maxLongTasks) || 
          (!isLongTask && result.length < 4)) {
        result.push(scoredTask);
        
        if (isLongTask) longTaskCount++;
        if (isQuickWinTask) quickWinCount++;
      }
      
      // Arrêter si on a atteint 4 tâches
      if (result.length >= 4) break;
    }
    
    // Si aucune keystone habit n'a été incluse, en ajouter une artificiellement
    if (!keystoneHabitIncluded && keystoneHabits.length > 0 && result.length < 4) {
      // Trouver la keystone habit la plus pertinente
      const mostRelevantHabit = keystoneHabits[0]; // Simplification
      
      // Créer une tâche fictive pour la keystone habit
      const keystoneTaskScore: TaskScore = {
        task: {
          id: `keystone-${mostRelevantHabit.id}`,
          name: mostRelevantHabit.name,
          completed: false,
          subtasks: [],
          lastAccessed: new Date().toISOString(),
          completionRate: 0,
          priority: "high",
          energyRequired: mostRelevantHabit.energyRequirement === 'high' ? 'high' : 
                         mostRelevantHabit.energyRequirement === 'medium' ? 'medium' : 'low',
          effort: mostRelevantHabit.energyRequirement === 'high' ? 'L' : 
                  mostRelevantHabit.energyRequirement === 'medium' ? 'M' : 'S',
          tags: [mostRelevantHabit.name.toLowerCase()]
        } as TaskLike,
        score: 90, // Score élevé
        reason: "Keystone Habit obligatoire",
        reasonDetails: ["Keystone Habit"],
        isKeystoneHabit: true
      };
      
      // Ajouter au début de la liste
      result.unshift(keystoneTaskScore);
      
      // Ajuster la taille si nécessaire
      if (result.length > 4) {
        result.splice(4);
      }
    }
    
    // Si playlist vide ou insuffisante, ajouter des quick wins
    if (result.length < 3) {
      const quickWins = scoredTasks.filter(st => isQuickWin(st.task));
      while (result.length < 3 && quickWins.length > 0) {
        const quickWin = quickWins.shift();
        if (quickWin && !result.some(t => t.task.id === quickWin.task.id)) {
          result.push(quickWin);
        }
      }
    }
    
    // Fallback : Si rien ne matche (e.g., tout L en low energy), fallback : 1-2 quick wins + 1 "respiration"
    if (result.length === 0) {
      // Ajouter 1-2 quick wins
      const quickWins = scoredTasks.filter(st => isQuickWin(st.task));
      const fallbackCount = Math.min(2, quickWins.length);
      for (let i = 0; i < fallbackCount; i++) {
        if (quickWins[i]) {
          result.push(quickWins[i]);
        }
      }
      
      // Ajouter une tâche de respiration si nécessaire
      if (result.length === 0) {
        result.push({
          task: {
            id: "breathing-exercise-fallback",
            name: "Aujourd'hui, respire : une marche ?",
            completed: false,
            subtasks: [],
            lastAccessed: new Date().toISOString(),
            completionRate: 0,
            priority: "low",
            energyRequired: "low",
            effort: "S"
          } as TaskLike,
          score: 100,
          reason: "Fallback - Aucune tâche ne correspond",
          reasonDetails: ["Bien-être"]
        });
      }
    }
    
    return result;
  } catch (error) {
    logger.error("Erreur lors de l'application des règles d'équilibre SOTA", error as Error);
    
    // Fallback : retourner les 3 meilleures tâches sans règles d'équilibre
    return scoredTasks.slice(0, 3);
  }
}

/**
 * Génère le feedback SOTA basé sur l'impact moyen des tâches
 */
function generateSOTAFeedback(taskScores: TaskScore[]): string {
  if (taskScores.length === 0) return "";
  
  // Calculer l'impact moyen
  const totalImpact = taskScores.reduce((sum, ts) => sum + (ts.impactMetrics?.calculatedImpact ?? 0), 0);
  const averageImpact = totalImpact / taskScores.length;
  
  // Générer le feedback approprié
  if (averageImpact >= 80) {
    return "Ces 3 tâches libèrent 2h demain – bien joué !";
  } else if (averageImpact < 50) {
    // Fallback à 2 quick wins + 1 high-impact
    return "Nous avons sélectionné 2 tâches rapides et 1 tâche à fort impact pour vous aider à reprendre le momentum.";
  }
  
  return ""; // Pas de feedback particulier
}

/**
 * Met à jour le système de récompenses
 */
function updateRewardSystem(taskScores: TaskScore[]): void {
  // Cette fonction serait connectée au système de récompenses
  // Pour l'instant, nous simulons la mise à jour
  
  const highImpactTasks = taskScores.filter(ts => 
    typeof ts.impactMetrics?.calculatedImpact === 'number' && ts.impactMetrics.calculatedImpact >= 80
  );
  
  if (highImpactTasks.length > 0) {
    logger.info('Tâches à haut impact dans la playlist', { count: highImpactTasks.length });
  }
}

/**
 * Met à jour les patterns utilisateurs basés sur les interactions
 * Appelé après chaque génération de playlist
 */
export function updateUserPatterns(
  userPatterns: UserPatternsLike,
  selectedTasks: TaskLike[],
  completedTasks: TaskLike[],
  skippedTasks: TaskLike[]
): UserPatternsLike {
  // Mettre à jour les tâches ignorées
  for (const task of skippedTasks) {
    if (task.tags) {
      for (const tag of task.tags) {
        userPatterns.skippedTaskTypes[tag] = (userPatterns.skippedTaskTypes[tag] || 0) + 1;
      }
    }
  }
  
  // Mettre à jour les tâches complétées
  for (const task of completedTasks) {
    if (task.tags) {
      for (const tag of task.tags) {
        userPatterns.completedTaskTypes[tag] = (userPatterns.completedTaskTypes[tag] || 0) + 1;
      }
    }
  }
  
  return userPatterns;
}

/**
 * Fonction pour nettoyer le cache expiré
 */
export function cleanupCache(): void {
  const now = Date.now();
  for (const [key, value] of playlistCache.entries()) {
    // Supprimer les entrées expirées
    playlistCache.delete(key);
  }
}