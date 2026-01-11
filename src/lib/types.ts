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

// Types pour la Phase 1 - Gestion des tâches actives
export type TaskPool = "OVERDUE" | "TODAY" | "SOON" | "AVAILABLE";
export type TaskStatus = "todo" | "active" | "frozen" | "done" | "cancelled";
export type EnergyStability = "volatile" | "stable";

export interface TaskWithContext {
  id: string;
  title: string;
  description?: string;
  duration: number;
  effort: 'low' | 'medium' | 'high';
  urgency: 'low' | 'medium' | 'high' | 'urgent';
  impact: 'low' | 'medium' | 'high';
  deadline?: Date;
  scheduledTime?: string;
  category: string;
  status: TaskStatus;
  pool: TaskPool;
  activationCount: number;
  lastActivated?: Date;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  tags?: string[];
  energyRequired?: "low" | "medium" | "high";
  energyStability?: EnergyStability;
}

export interface SessionState {
  id: string;
  timestamp: number;
  startTime: number;
  endTime?: number;
  plannedTasks: number;
  completedTasks: number;
  state: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'EXHAUSTED' | 'BLOCKED';
  energyLevel?: EnergyLevel;
  energyStability?: EnergyStability;
  taskIds: string[];
  createdAt: Date;
}

export interface EnergyState {
  level: EnergyLevel;
  stability: EnergyStability;
  confidence: number; // confiance du système dans cette estimation
}

export interface Capacity {
  maxTasks: number;        // 1–5
  maxEffort: number;       // S=1, M=2, L=3 → somme max
  availableMinutes: number;
}

export interface TaskAgeIndex {
  averageAge: number;      // Âge moyen des tâches
  totalAge: number;       // Somme des âges
  count: number;          // Nombre total de tâches
  calculationDate: Date;  // Date du calcul
}

export interface DetoxPhase {
  phase: 'WARNING' | 'FRICTION' | 'GUIDED_REVIEW' | 'OVERRIDE_PENALTY';
  trigger: string;
  action: string;
  startDate: Date;
}

export interface TemporalConflictResolution {
  type: 'IMPOSSIBLE_SITUATION' | 'CONFLICT_RESOLVED';
  message: string;
  options?: string[];
}

export interface CognitiveInvariant {
  id: string;
  violated: boolean;
  rule: 'NO_GUILT' | 'NO_ADDICTION' | 'NO_URGENCY' | 'NO_AUTO_DECISION' | 'USER_CONSENT_REQUIRED';
  detectedAt: Date;
  context: any;
}

export interface CognitiveRiskSnapshot {
  timestamp: Date;
  addictionRiskScore: number;
  coercionRiskScore: number;
  overloadRiskScore: number;
  autonomyLossScore: number;
}

// Types pour la classification des règles
export interface Rule {
  id: string;
  description: string;
  category: 'HARD' | 'GUARDRAIL' | 'ADAPTIVE';
}

export interface BehavioralEvent {
  timestamp: Date;
  eventType: 'task_selected' | 'task_started' | 'task_completed' | 'task_skipped' | 'session_ended';
  taskId?: string;
  sessionId?: string;
  context?: any;
}

// Types pour les rituels
export interface MorningRitualResult {
  selectedTaskId: string | null;
  timestamp: Date;
  skipped: boolean;
}

export interface EveningRitualResult {
  executedTasks: string[];
  skippedTasks: string[];
  timestamp: Date;
  skipped: boolean;
}

export interface RitualOptions {
  enableMorningRitual: boolean;
  enableEveningRitual: boolean;
  morningTimeWindow: { start: number; end: number };
  eveningTimeWindow: { start: number; end: number };
  maxDurationMinutes: number;
}