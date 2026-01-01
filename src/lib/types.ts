export type Subtask = {
  id: string;
  name: string;
  completed: boolean;
};

export type Task = {
  id: string;
  name: string;
  completed: boolean;
  subtasks: Subtask[];
  lastAccessed: string; // ISO string
  completionRate: number; // 0-100
  description?: string;
  nlpHints?: {
    detectedLang: string;
    energySuggestion?: string;
    effortSuggestion?: string;
    confidence: number;
    isUncertain: boolean;
    rawText: string;
  };
  priority?: "low" | "medium" | "high";
  energyRequired?: "low" | "medium" | "high";
  estimatedDuration?: number; // in minutes
  objective?: string;
  autoSelected?: boolean;
  tags?: string[];
  completedAt?: string; // ISO string
  scheduledDate?: string; // ISO string
  // Champ pour stocker la raison de la sélection dans la playlist
  selectionReason?: string;
  // Champs pour les métadonnées
  effort?: "S" | "M" | "L";
  deadlineDisplay?: string;
};

export type DailyRituals = {
  playlistShuffledCount: number;
  completedTaskCount: number;
  completedTasks: Task[];
};

export type FocusSettings = {
  workDuration: number; // en secondes
  breakDuration: number; // en secondes
  autoSaveNotes: boolean;
  soundEnabled: boolean;
};

// Types pour l'algorithme de génération de playlist
export type EnergyLevel = "high" | "medium" | "low";
export type Priority = "low" | "medium" | "high";

export interface UserPatterns {
  skippedTaskTypes: Record<string, number>; // Types de tâches souvent ignorées
  completedTaskTypes: Record<string, number>; // Types de tâches souvent complétées
  shuffleCount: number; // Nombre de fois où l'utilisateur a mélangé la playlist
}

export interface TaskScore {
  task: Task;
  score: number;
  reason: string;
  reasonDetails?: string[]; // Détails pour les badges
  isKeystoneHabit?: boolean; // Indique si la tâche est une keystone habit
  impactMetrics?: any; // Métriques d'impact pour le feedback
}

export interface PlaylistGeneratorOptions {
  energyLevel: EnergyLevel;
  currentTime: Date;
  taskHistory?: Task[];
  maxTasks?: number; // Par défaut 5
  userPatterns?: UserPatterns; // Ajout pour l'apprentissage automatique
  workdayHours?: number; // Heures de travail par jour (défaut: 8)
}