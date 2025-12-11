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
