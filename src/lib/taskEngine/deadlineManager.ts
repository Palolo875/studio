// Gestionnaire de deadlines impossibles pour le Cerveau de KairuFlow - Phase 1
import { Task } from './types';

/**
 * Résultat de l'analyse des deadlines
 */
export interface DeadlineAnalysis {
  /** Ratio charge/disponibilité */
  loadRatio: number;
  /** Tâches contribuant à la surcharge */
  overloadedTasks: Task[];
  /** Temps total requis */
  totalTimeRequired: number;
  /** Temps disponible */
  timeAvailable: number;
}

/**
 * Mode TRIAGE pour gérer les deadlines impossibles
 */
export interface TriageMode {
  /** Activé ? */
  active: boolean;
  /** Tâches à trier */
  tasksToTriage: Task[];
  /** Options disponibles */
  options: {
    /** Reporter des tâches */
    defer: boolean;
    /** Négocier des deadlines */
    negotiate: boolean;
    /** Déléguer des tâches */
    delegate: boolean;
    /** Abandonner des tâches */
    abandon: boolean;
  };
  /** Message d'alerte */
  alertMessage: string;
}

/**
 * Analyse les deadlines pour détecter les situations impossibles
 * @param tasks Tâches du jour
 * @param timeAvailable Temps disponible en minutes
 * @returns Résultat de l'analyse
 */
export function analyzeDeadlines(tasks: Task[], timeAvailable: number): DeadlineAnalysis {
  // Calculer le temps total requis
  const totalTimeRequired = tasks.reduce((sum, task) => sum + task.duration, 0);
  
  // Calculer le ratio charge/disponibilité
  const loadRatio = timeAvailable > 0 ? totalTimeRequired / timeAvailable : Infinity;
  
  // Identifier les tâches contribuant à la surcharge (si ratio > 1.5)
  const overloadedTasks = loadRatio > 1.5 
    ? [...tasks].sort((a, b) => b.duration - a.duration) // Trier par durée décroissante
    : [];
  
  return {
    loadRatio,
    overloadedTasks,
    totalTimeRequired,
    timeAvailable
  };
}

/**
 * Détermine si le mode TRIAGE doit être activé
 * @param analysis Résultat de l'analyse des deadlines
 * @returns Mode TRIAGE
 */
export function determineTriageMode(analysis: DeadlineAnalysis): TriageMode {
  const { loadRatio, overloadedTasks } = analysis;
  
  // Activer le mode TRIAGE si le ratio dépasse 1.5
  const active = loadRatio > 1.5;
  
  // Options disponibles
  const options = {
    defer: overloadedTasks.length > 0,
    negotiate: overloadedTasks.length > 0,
    delegate: overloadedTasks.length > 0,
    abandon: overloadedTasks.length > 0
  };
  
  // Message d'alerte
  let alertMessage = "";
  if (active) {
    alertMessage = `Votre journée semble très chargée. Avec ${analysis.totalTimeRequired} minutes de travail prévues pour ${analysis.timeAvailable} minutes disponibles, un tri est nécessaire pour rester serein.`;
  }
  
  return {
    active,
    tasksToTriage: active ? overloadedTasks : [],
    options,
    alertMessage
  };
}

/**
 * Trie les tâches par priorité pour le mode TRIAGE
 * @param tasks Tâches à trier
 * @returns Tâches triées par priorité
 */
export function triageTasksByPriority(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    // Priorité 1: Urgence
    const urgencyOrder = { 
      'urgent': 4, 
      'high': 3, 
      'medium': 2, 
      'low': 1 
    };
    
    const urgencyDiff = urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
    if (urgencyDiff !== 0) {
      return urgencyDiff;
    }
    
    // Priorité 2: Impact
    const impactOrder = { 
      'high': 3, 
      'medium': 2, 
      'low': 1 
    };
    
    const impactDiff = impactOrder[b.impact] - impactOrder[a.impact];
    if (impactDiff !== 0) {
      return impactDiff;
    }
    
    // Priorité 3: Deadline
    if (a.deadline && b.deadline) {
      return a.deadline.getTime() - b.deadline.getTime();
    }
    
    // Priorité 4: Durée (tâches courtes d'abord)
    return a.duration - b.duration;
  });
}

/**
 * Génère des suggestions pour résoudre les deadlines impossibles
 * @param triageMode Mode TRIAGE actif
 * @returns Suggestions d'action
 */
export function generateDeadlineSuggestions(triageMode: TriageMode): string[] {
  const suggestions: string[] = [];
  
  if (!triageMode.active) {
    return suggestions;
  }
  
  suggestions.push("Mode Triage : Priorisons ensemble.");
  suggestions.push(triageMode.alertMessage);
  suggestions.push("");
  suggestions.push("Quelles options souhaitez-vous explorer ?");
  
  if (triageMode.options.defer) {
    suggestions.push("[ ] Reporter les tâches moins urgentes");
  }
  
  if (triageMode.options.negotiate) {
    suggestions.push("[ ] Renégocier une deadline");
  }
  
  if (triageMode.options.delegate) {
    suggestions.push("[ ] Déléguer une tâche");
  }
  
  if (triageMode.options.abandon) {
    suggestions.push("[ ] Choisir consciemment ce qui ne sera pas fait");
  }
  
  return suggestions;
}

/**
 * Calcule la charge optimisée après triage
 * @param tasks Tâches originales
 * @param triagedTasks Tâches triées
 * @param timeAvailable Temps disponible
 * @returns Charge optimisée
 */
export function calculateOptimizedLoad(
  tasks: Task[],
  triagedTasks: Task[],
  timeAvailable: number
): {
  selectedTasks: Task[];
  totalTime: number;
  remainingTime: number;
} {
  // Sélectionner les tâches dans l'ordre de priorité jusqu'à saturation du temps disponible
  let totalTime = 0;
  const selectedTasks: Task[] = [];
  
  for (const task of triagedTasks) {
    if (totalTime + task.duration <= timeAvailable) {
      selectedTasks.push(task);
      totalTime += task.duration;
    } else {
      // Arrêter dès que l'ajout d'une tâche dépasserait le temps disponible
      break;
    }
  }
  
  const remainingTime = Math.max(0, timeAvailable - totalTime);
  
  return {
    selectedTasks,
    totalTime,
    remainingTime
  };
}
