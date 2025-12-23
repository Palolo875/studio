// Gestionnaire de sessions pour le Cerveau de KairuFlow - Phase 1
import { Task, EnergyState } from './types';
import { predictEnergyState } from './energyModel';
import { generateTaskPlaylist } from './selector';
import { checkAllInvariants } from './invariantChecker';
import { calculateSessionCapacity } from './capacityCalculator';
import { applyFallback as applySelectorFallback } from './selectorFallback';

/**
 * État d'une session
 */
export type SessionState =
  | 'PLANNED'      // Session prévue
  | 'IN_PROGRESS'  // Session en cours
  | 'COMPLETED'    // Session terminée par l'utilisateur
  | 'EXHAUSTED'    // Session abandonnée par l'utilisateur
  | 'BLOCKED';     // Session bloquée par une contrainte externe

/**
 * Session de travail
 */
export interface Session {
  /** Identifiant unique de la session */
  id: string;
  /** Créneau horaire de la session */
  timeSlot: {
    start: Date;
    end: Date;
  };
  /** État de la session */
  state: SessionState;
  /** Playlist de tâches associée */
  playlist: Task[];
  /** Énergie prévue pour cette session */
  predictedEnergy: EnergyState;
  /** Tâches à horaire fixe dans cette session */
  fixedTasks: Task[];
  /** Durée totale de la session en minutes */
  duration: number;
  /** Créneau horaire au format texte */
  timeLabel: string;
}

/**
 * Créneau horaire avec énergie prévue
 */
export interface TimeSlot {
  /** Heure de début (format HH:MM) */
  startTime: string;
  /** Heure de fin (format HH:MM) */
  endTime: string;
  /** Énergie prévue pour ce créneau */
  energy: EnergyState;
  /** Label du créneau */
  label: string;
}

/**
 * Génère les créneaux horaires standards d'une journée
 * @returns Liste des créneaux horaires
 */
export function generateStandardTimeSlots(): TimeSlot[] {
  return [
    {
      startTime: "08:00",
      endTime: "10:00",
      energy: { level: 'medium', stability: 'stable' },
      label: "Matin - Montée en puissance"
    },
    {
      startTime: "10:00",
      endTime: "12:00",
      energy: { level: 'high', stability: 'stable' },
      label: "Matin - Pic d'énergie"
    },
    {
      startTime: "12:00",
      endTime: "14:00",
      energy: { level: 'medium', stability: 'volatile' },
      label: "Après-midi - Creux post-repas"
    },
    {
      startTime: "14:00",
      endTime: "16:00",
      energy: { level: 'medium', stability: 'volatile' },
      label: "Après-midi - Reprise progressive"
    },
    {
      startTime: "16:00",
      endTime: "18:00",
      energy: { level: 'medium', stability: 'stable' },
      label: "Fin d'après-midi - Dernière ligne droite"
    },
    {
      startTime: "18:00",
      endTime: "20:00",
      energy: { level: 'low', stability: 'stable' },
      label: "Soirée - Tâches légères"
    }
  ];
}

/**
 * Convertit une heure au format HH:MM en objet Date
 * @param timeString Heure au format HH:MM
 * @param baseDate Date de référence
 * @returns Objet Date
 */
export function timeStringToDate(timeString: string, baseDate: Date): Date {
  const [hours, minutes] = timeString.split(':').map(Number);
  const date = new Date(baseDate);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

/**
 * Crée une session pour un créneau horaire donné
 * @param timeSlot Créneau horaire
 * @param tasks Tâches disponibles
 * @param baseDate Date de référence
 * @returns Session créée
 */
export function createSession(
  timeSlot: TimeSlot,
  tasks: Task[],
  baseDate: Date = new Date()
): Session {
  const start = timeStringToDate(timeSlot.startTime, baseDate);
  const end = timeStringToDate(timeSlot.endTime, baseDate);

  // Calculer la durée en minutes
  const duration = (end.getTime() - start.getTime()) / (1000 * 60);

  // Prédire l'énergie pour ce créneau
  const hour = parseInt(timeSlot.startTime.split(':')[0]);
  const predictedEnergy = predictEnergyState(hour);

  // Calculer la capacité de session
  const sessionCapacity = calculateSessionCapacity(duration, predictedEnergy);

  // Générer la playlist pour cette session
  const playlistResult = generateTaskPlaylist(
    tasks,
    predictedEnergy,
    5, // Max 5 tâches par session
    baseDate,
    { sessionDurationMinutes: duration }
  );

  // Vérifier les invariants de la session
  const invariantResults = checkAllInvariants(
    playlistResult.tasks,
    predictedEnergy,
    sessionCapacity
  );

  // Si les invariants ne sont pas respectés, appliquer un fallback
  if (!invariantResults.allValid) {
    const fallbackPlaylist = applySelectorFallback(
      tasks,
      predictedEnergy,
      "Violations d'invariants détectées dans la session"
    );

    return {
      id: `session_${start.getTime()}`,
      timeSlot: { start, end },
      state: 'PLANNED',
      playlist: fallbackPlaylist.tasks,
      predictedEnergy,
      fixedTasks: [],
      duration,
      timeLabel: timeSlot.label
    };
  }

  return {
    id: `session_${start.getTime()}`,
    timeSlot: { start, end },
    state: 'PLANNED',
    playlist: playlistResult.tasks,
    predictedEnergy,
    fixedTasks: [], // À implémenter avec la gestion des contraintes horaires
    duration,
    timeLabel: timeSlot.label
  };
}

/**
 * Marque une session comme terminée par l'utilisateur
 * @param session Session à terminer
 * @returns Session mise à jour
 */
export function markSessionCompleted(session: Session): Session {
  return {
    ...session,
    state: 'COMPLETED'
  };
}

/**
 * Marque une session comme abandonnée par l'utilisateur
 * @param session Session à abandonner
 * @returns Session mise à jour
 */
export function markSessionExhausted(session: Session): Session {
  return {
    ...session,
    state: 'EXHAUSTED'
  };
}

/**
 * Marque une session comme bloquée
 * @param session Session à bloquer
 * @returns Session mise à jour
 */
export function markSessionBlocked(session: Session): Session {
  return {
    ...session,
    state: 'BLOCKED'
  };
}

/**
 * Démarre une session
 * @param session Session à démarrer
 * @returns Session mise à jour
 */
export function startSession(session: Session): Session {
  return {
    ...session,
    state: 'IN_PROGRESS'
  };
}

/**
 * Vérifie si une session est valide selon les invariants
 * @param session Session à vérifier
 * @param maxLoad Charge maximale autorisée
 * @returns Booléen indiquant si la session est valide
 */
export function isSessionValid(session: Session, maxLoad: number): boolean {
  const invariantResults = checkAllInvariants(
    session.playlist,
    session.predictedEnergy,
    maxLoad
  );

  return invariantResults.allValid;
}
