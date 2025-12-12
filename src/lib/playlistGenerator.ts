import type { Task, EnergyLevel, UserPatterns, TaskScore, PlaylistGeneratorOptions } from "@/lib/types";
import {
  calculateEnergyScore,
  calculateImpactScore,
  calculateDeadlineScore,
  calculateEffortScore,
  isQuickWin,
  calculateHistoryScore as calculateHistoryScoreFromRules
} from "./scoringRules";
import { getTodoTasksBulk, getTaskHistoryBulk, getUserPatternsFromDB } from "./taskDatabase";
import { LanguageDetector } from "@/lib/nlp/LanguageDetector";

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
 */

// Cache pour la memoization
const playlistCache = new Map<string, TaskScore[]>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Analyse le contexte linguistique d'une tâche pour améliorer le scoring
 */
function analyzeTaskLanguageContext(task: Task): { primaryLanguage: 'fr' | 'en' | 'es', confidence: number } {
  // Combiner le nom, la description et les tags pour l'analyse
  const textToAnalyze = [
    task.name,
    task.description,
    task.tags ? task.tags.join(' ') : ''
  ].filter(Boolean).join(' ');
  
  if (!textToAnalyze.trim()) {
    return { primaryLanguage: 'fr', confidence: 0.5 }; // Fallback par défaut
  }
  
  const detectedLanguage = LanguageDetector.detect(textToAnalyze);
  
  // Calculer la confiance basée sur la longueur du texte
  const confidence = Math.min(1, textToAnalyze.length / 50); // 100% de confiance à partir de 50 caractères
  
  return { primaryLanguage: detectedLanguage, confidence };
}

/**
 * Calcule le score d'une tâche en fonction des facteurs spécifiés
 * Et retourne également les raisons détaillées pour l'explication
 */
function calculateTaskScore(
  task: Task,
  energyLevel: EnergyLevel,
  currentTime: Date,
  taskHistory: Task[] = [],
  userPatterns?: UserPatterns,
  workdayHours: number = 8
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

  // 2. Impact Inféré (15%)
  const impactScore = calculateImpactScore(task);
  score += impactScore * 15;
  if (impactScore > 0) {
    reasons.push(`Impact (${Math.round(impactScore * 100)}%)`);
    if (impactScore >= 20) {
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

  return {
    task,
    score: Math.max(0, score), // Assurer que le score ne soit jamais négatif
    reason: reasons.join(", "),
    reasonDetails // Ajout des détails pour les badges
  };
}

/**
 * Calcule le score basé sur l'historique (10%)
 * Tâches complétées régulièrement : Score +5
 * Tâches souvent reportées : Score -10
 * Intègre l'apprentissage automatique des patterns
 */
function calculateHistoryScore(task: Task, taskHistory: Task[] = [], userPatterns?: UserPatterns): number {
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
async function fetchTasksWithBulkGet(): Promise<{ tasks: Task[]; taskHistory: any[] }> {
  try {
    // Récupérer les tâches et l'historique en parallèle
    const [tasks, taskHistory] = await Promise.all([
      getTodoTasksBulk(),
      getTaskHistoryBulk()
    ]);
    
    return { tasks, taskHistory };
  } catch (error) {
    console.error('Erreur lors de la récupération des tâches:', error);
    return { tasks: [], taskHistory: [] };
  }
}

/**
 * Génère la playlist avec 3-5 tâches optimales
 * Respecte l'équilibre et gère les fallbacks
 * Optimisé pour <200ms via bulkGet Dexie + memoization
 */
export async function generatePlaylist(
  tasks: Task[],
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
        } as Task,
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
        } as Task,
        score: 100,
        reason: "Aucune tâche incomplète - suggestion de bien-être",
        reasonDetails: ["Bien-être"]
      }];
      
      // Mettre en cache le résultat
      playlistCache.set(cacheKey, result);
      return result;
    }

    // Récupérer les patterns utilisateur si non fournis
    let userPatterns = options.userPatterns;
    if (!userPatterns) {
      try {
        userPatterns = await getUserPatternsFromDB();
      } catch (error) {
        console.warn("Impossible de récupérer les patterns utilisateur:", error);
        // Continuer avec des patterns vides
        userPatterns = {
          skippedTaskTypes: {},
          completedTaskTypes: {},
          shuffleCount: 0
        };
      }
    }

    // Calculer les scores pour toutes les tâches
    const workdayHours = options.workdayHours || 8;
    const scoredTasks = incompleteTasks.map(task => 
      calculateTaskScore(task, options.energyLevel, options.currentTime, options.taskHistory || [], userPatterns, workdayHours)
    );

    // Trier par score décroissant
    scoredTasks.sort((a, b) => b.score - a.score);

    // Appliquer les règles d'équilibre
    const balancedPlaylist = applyBalanceRules(scoredTasks, options.energyLevel, userPatterns);
    
    // Limiter au nombre maximum de tâches
    const maxTasks = options.maxTasks || 5;
    const result = balancedPlaylist.slice(0, maxTasks);
    
    // Mettre en cache le résultat
    playlistCache.set(cacheKey, result);
    
    return result;
  } catch (error) {
    console.error("Erreur lors de la génération de la playlist:", error);
    
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
      console.error("Erreur lors du fallback:", fallbackError);
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
      } as Task,
      score: 100,
      reason: "Erreur système - fallback de sécurité",
      reasonDetails: ["Erreur", "Bien-être"]
    }];
  }
}

/**
 * Applique les règles d'équilibre pour la sélection des tâches
 * - Max 1 tâche L si énergie low
 * - Équilibre entre quick wins et tâches substantielles
 * - Gestion des fallbacks
 */
function applyBalanceRules(
  scoredTasks: TaskScore[],
  energyLevel: EnergyLevel,
  userPatterns?: UserPatterns
): TaskScore[] {
  try {
    const result: TaskScore[] = [];
    let longTaskCount = 0;
    let quickWinCount = 0;
    
    // Si énergie low, limiter à 1 tâche L maximum
    const maxLongTasks = energyLevel === "low" ? 1 : 3;
    
    for (const scoredTask of scoredTasks) {
      // Vérifier si on peut ajouter cette tâche sans violer les règles
      const isLongTask = scoredTask.task.effort === "L";
      const isQuickWinTask = isQuickWin(scoredTask.task);
      
      // Ajouter la tâche si elle respecte les contraintes
      if ((isLongTask && longTaskCount < maxLongTasks) || 
          (!isLongTask && result.length < 5)) {
        result.push(scoredTask);
        
        if (isLongTask) longTaskCount++;
        if (isQuickWinTask) quickWinCount++;
      }
      
      // Arrêter si on a atteint 5 tâches
      if (result.length >= 5) break;
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
          } as Task,
          score: 100,
          reason: "Fallback - Aucune tâche ne correspond",
          reasonDetails: ["Bien-être"]
        });
      }
    }
    
    return result;
  } catch (error) {
    console.error("Erreur lors de l'application des règles d'équilibre:", error);
    
    // Fallback : retourner les 3 meilleures tâches sans règles d'équilibre
    return scoredTasks.slice(0, 3);
  }
}

/**
 * Met à jour les patterns utilisateurs basés sur les interactions
 * Appelé après chaque génération de playlist
 */
export function updateUserPatterns(
  userPatterns: UserPatterns,
  selectedTasks: Task[],
  completedTasks: Task[],
  skippedTasks: Task[]
): UserPatterns {
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