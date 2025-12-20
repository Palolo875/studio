// Types pour le Cerveau de KairuFlow - Phase 1

/**
 * État d'énergie de l'utilisateur
 */
export interface EnergyState {
  /** Niveau d'énergie : faible, moyen ou élevé */
  level: 'low' | 'medium' | 'high';
  /** Stabilité de l'énergie : volatile ou stable */
  stability: 'volatile' | 'stable';
  /** Confiance dans l'état d'énergie (0.0-1.0) */
  confidence?: number;
}

/**
 * Tâche structurée
 */
export interface Task {
  /** Identifiant unique de la tâche */
  id: string;
  /** Titre de la tâche */
  title: string;
  /** Description détaillée */
  description?: string;
  /** Durée estimée en minutes */
  duration: number;
  /** Niveau d'effort requis */
  effort: 'low' | 'medium' | 'high';
  /** Urgence de la tâche */
  urgency: 'low' | 'medium' | 'high' | 'urgent';
  /** Impact de la tâche */
  impact: 'low' | 'medium' | 'high';
  /** Date limite (optionnelle) */
  deadline?: Date;
  /** Heure programmée (optionnelle) */
  scheduledTime?: string;
  /** Historique de complétion */
  completionHistory: CompletionRecord[];
  /** Diversité cognitive (catégorie de la tâche) */
  category: string;
  /** Statut de la tâche */
  status?: 'todo' | 'active' | 'frozen' | 'done';
  /** Nombre d'activations */
  activationCount?: number;
  /** Date de dernière activation */
  lastActivated?: Date;
  /** Date de création de la tâche */
  createdAt: Date;
}

/**
 * Enregistrement de complétion
 */
export interface CompletionRecord {
  /** Date de complétion */
  date: Date;
  /** Durée réelle en minutes */
  actualDuration: number;
  /** Énergie perçue lors de la complétion */
  energy: EnergyState;
}

/**
 * Playlist de tâches
 */
export interface TaskPlaylist {
  /** Tâches dans la playlist */
  tasks: Task[];
  /** Date de génération */
  generatedAt: Date;
  /** Énergie utilisée pour la génération */
  energyUsed: EnergyState;
  /** Explication de la sélection (optionnelle) */
  explanation?: string;
  /** Avertissements (optionnels) */
  warnings?: string[];
}

/**
 * Capacité cognitive journalière
 */
export interface DailyCapacity {
  /** Charge maximale autorisée */
  maxLoad: number;
  /** Charge déjà utilisée */
  usedLoad: number;
  /** Charge restante */
  remaining: number;
  /** Tâches planifiées pour aujourd'hui */
  tasksToday: {
    /** Coût de la tâche */
    cost: number;
    /** Statut de la tâche */
    status: 'done' | 'in_progress' | 'planned';
  }[];
}

/**
 * Résultat du scoring d'une tâche
 */
export interface TaskScore {
  /** Tâche évaluée */
  task: Task;
  /** Score total */
  totalScore: number;
  /** Détail des scores par critère */
  breakdown: {
    energyAlignment: number;
    urgency: number;
    impact: number;
    effortBalance: number;
    behavioralPattern: number;
    diversity: number;
  };
  /** Confiance dans le score */
  confidence: number;
}