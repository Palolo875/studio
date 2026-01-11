/**
 * ANALYSEUR DE COHÉSION DES TÂCHES - KairuFlow Phase 2
 * Algorithme opérationnel pour la cohésion sémantique
 */

import { TaskWithContext } from './types';

export interface RawTask {
  action: string | null;
  object: string | null;
  modifiers: string[];
  confidence: number;
}

export enum CohesionStrategy {
  FORCE_GROUP = 'force_group',
  SUGGEST_GROUP = 'suggest_group',
  SPLIT_TASKS = 'split_tasks'
}

export interface CohesionResult {
  score: number;
  strategy: CohesionStrategy;
  reason: string;
}

/**
 * Calcule le score de cohésion entre deux tâches brutes
 */
export function calculateCohesionScore(taskA: RawTask, taskB: RawTask): number {
  let score = 0.0;
  
  // 1. Objet partagé (40% du poids)
  if (taskA.object && taskB.object) {
    if (areSemanticallyClose(taskA.object, taskB.object)) {
      score += 0.40;
    }
  }
  
  // 2. Contexte partagé via modificateurs (30%)
  const sharedModifiers = countSharedModifiers(taskA, taskB);
  score += Math.min(sharedModifiers / 3, 0.30);
  
  // 3. Dépendance temporelle (20%)
  if (hasTemporalDependency(taskA, taskB)) {
    score += 0.20;
  }
  
  // 4. Proximité sémantique des verbes (10%)
  if (taskA.action && taskB.action && areVerbsRelated(taskA.action, taskB.action)) {
    score += 0.10;
  }
  
  return score;
}

/**
 * Détermine la stratégie de cohésion selon le score
 */
export function determineCohesionStrategy(taskA: RawTask, taskB: RawTask): CohesionResult {
  const score = calculateCohesionScore(taskA, taskB);
  
  if (score > 0.70) {
    return {
      score,
      strategy: CohesionStrategy.FORCE_GROUP,
      reason: 'Cohésion très forte - les tâches doivent rester groupées'
    };
  } else if (score > 0.50) {
    return {
      score,
      strategy: CohesionStrategy.SUGGEST_GROUP,
      reason: 'Cohésion modérée - suggestion de regroupement avec possibilité de refus'
    };
  } else {
    return {
      score,
      strategy: CohesionStrategy.SPLIT_TASKS,
      reason: 'Faible cohésion - les tâches doivent être séparées'
    };
  }
}

/**
 * Vérifie si deux objets sont sémantiquement proches
 */
function areSemanticallyClose(object1: string, object2: string): boolean {
  // Simplification : mots identiques ou contenant des racines communes
  const obj1Lower = object1.toLowerCase();
  const obj2Lower = object2.toLowerCase();
  
  // Vérifier si les objets sont identiques ou très similaires
  if (obj1Lower === obj2Lower) return true;
  
  // Vérifier si l'un contient l'autre
  if (obj1Lower.includes(obj2Lower) || obj2Lower.includes(obj1Lower)) return true;
  
  // Vérifier des synonymes simples ou des racines communes
  const commonRoots = [
    ['dossier', 'document', 'fichier'],
    ['email', 'courriel', 'message'],
    ['projet', 'travail', 'tâche'],
    ['réunion', 'rendez-vous', 'meeting'],
    ['appel', 'téléphone', 'communication']
  ];
  
  for (const roots of commonRoots) {
    if (roots.some(root => obj1Lower.includes(root)) && roots.some(root => obj2Lower.includes(root))) {
      return true;
    }
  }
  
  return false;
}

/**
 * Compte les modificateurs partagés entre deux tâches
 */
function countSharedModifiers(taskA: RawTask, taskB: RawTask): number {
  if (!taskA.modifiers || !taskB.modifiers) return 0;
  
  return taskA.modifiers.filter(modA => 
    taskB.modifiers.some(modB => modA.toLowerCase() === modB.toLowerCase())
  ).length;
}

/**
 * Vérifie s'il existe une dépendance temporelle entre deux tâches
 */
function hasTemporalDependency(taskA: RawTask, taskB: RawTask): boolean {
  // Exemples de dépendances temporelles : "préparer" avant "envoyer", "écrire" avant "relire"
  const temporalPairs = [
    ['préparer', 'envoyer'],
    ['écrire', 'relire'],
    ['concevoir', 'implémenter'],
    ['démarrer', 'terminer'],
    ['commencer', 'finir'],
    ['planifier', 'exécuter']
  ];
  
  if (taskA.action && taskB.action) {
    const action1 = taskA.action.toLowerCase();
    const action2 = taskB.action.toLowerCase();
    
    return temporalPairs.some(pair => 
      (pair[0] === action1 && pair[1] === action2) || 
      (pair[0] === action2 && pair[1] === action1)
    );
  }
  
  return false;
}

/**
 * Vérifie si deux verbes sont liés sémantiquement
 */
function areVerbsRelated(verb1: string, verb2: string): boolean {
  const verb1Lower = verb1.toLowerCase();
  const verb2Lower = verb2.toLowerCase();
  
  // Groupes de verbes liés
  const relatedVerbs = [
    ['préparer', 'organiser', 'planifier', 'structurer'],
    ['envoyer', 'transmettre', 'partager', 'diffuser'],
    ['écrire', 'composer', 'rédiger', 'créer'],
    ['lire', 'examiner', 'analyser', 'consulter'],
    ['faire', 'exécuter', 'accomplir', 'réaliser'],
    ['revoir', 'corriger', 'améliorer', 'modifier']
  ];
  
  for (const verbs of relatedVerbs) {
    if (verbs.includes(verb1Lower) && verbs.includes(verb2Lower)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Analyse la cohésion d'un ensemble de tâches
 */
export function analyzeTaskCohesion(rawTasks: RawTask[]): Array<{ 
  taskIds: [number, number]; 
  cohesion: CohesionResult 
}> {
  const cohesionResults: Array<{ 
    taskIds: [number, number]; 
    cohesion: CohesionResult 
  }> = [];
  
  for (let i = 0; i < rawTasks.length; i++) {
    for (let j = i + 1; j < rawTasks.length; j++) {
      const result = determineCohesionStrategy(rawTasks[i], rawTasks[j]);
      cohesionResults.push({
        taskIds: [i, j],
        cohesion: result
      });
    }
  }
  
  return cohesionResults;
}

/**
 * Groupe les tâches en fonction de leur cohésion
 */
export function groupCohesiveTasks(rawTasks: RawTask[], cohesionThreshold: number = 0.50): RawTask[][] {
  // Créer des groupes initiaux avec chaque tâche
  const groups: RawTask[][] = rawTasks.map(task => [task]);
  
  // Tenter de fusionner les groupes basés sur la cohésion
  let continueMerging = true;
  while (continueMerging) {
    continueMerging = false;
    
    for (let i = 0; i < groups.length; i++) {
      for (let j = i + 1; j < groups.length; j++) {
        // Calculer la cohésion entre le dernier élément du groupe i et le premier du groupe j
        const cohesionScore = calculateCohesionScore(
          groups[i][groups[i].length - 1], 
          groups[j][0]
        );
        
        if (cohesionScore >= cohesionThreshold) {
          // Fusionner les groupes
          groups[i] = groups[i].concat(groups[j]);
          groups.splice(j, 1); // Supprimer le groupe j
          continueMerging = true;
          break; // Recommencer la boucle après fusion
        }
      }
      if (continueMerging) break;
    }
  }
  
  return groups;
}

/**
 * Exemple d'utilisation
 */
export function exampleUsage(): void {
  const task1: RawTask = {
    action: "préparer",
    object: "dossier client",
    modifiers: ["urgent", "aujourd'hui"],
    confidence: 0.85
  };
  
  const task2: RawTask = {
    action: "envoyer",
    object: "dossier client",
    modifiers: ["par email", "aujourd'hui"],
    confidence: 0.80
  };
  
  const cohesion = calculateCohesionScore(task1, task2);
  console.log(`Score de cohésion: ${cohesion}`); // Devrait être > 0.60
  
  const strategy = determineCohesionStrategy(task1, task2);
  console.log(`Stratégie: ${strategy.strategy}, Raison: ${strategy.reason}`);
}

/**
 * Options de configuration pour l'analyseur de cohésion
 */
export interface CohesionAnalyzerOptions {
  cohesionThreshold: number;
  enableSemanticAnalysis: boolean;
  enableTemporalAnalysis: boolean;
  enableModifierAnalysis: boolean;
}

/**
 * Configuration par défaut
 */
export const DEFAULT_COHESION_OPTIONS: CohesionAnalyzerOptions = {
  cohesionThreshold: 0.50,
  enableSemanticAnalysis: true,
  enableTemporalAnalysis: true,
  enableModifierAnalysis: true
};