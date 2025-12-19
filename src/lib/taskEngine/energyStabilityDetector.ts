// Détecteur de stabilité énergétique pour le Cerveau de KairuFlow - Phase 1
import { EnergyState } from './types';
import { Task } from './types';

/**
 * Historique de l'utilisateur pour la détection de stabilité
 */
export interface UserHistory {
  /** Historique des check-ins énergétiques */
  energyCheckIns: {
    date: Date;
    energy: EnergyState;
  }[];
  /** Historique des interruptions */
  interruptions: {
    date: Date;
    reason: string;
  }[];
  /** Historique des sessions */
  sessions: {
    date: Date;
    completed: boolean;
    duration: number;
  }[];
}

/**
 * Contexte environnemental
 */
export interface EnvironmentalContext {
  /** Présence dans un open space */
  openSpace: boolean;
  /** Nombre de réunions prévues */
  scheduledMeetings: number;
  /** Journée atypique (déplacement, événement, etc.) */
  atypicalDay: boolean;
}

/**
 * Résultat de la détection de stabilité
 */
export interface StabilityDetectionResult {
  /** Stabilité détectée */
  stability: 'stable' | 'volatile';
  /** Confiance dans le résultat (0.0 - 1.0) */
  confidence: number;
  /** Facteurs ayant influencé la détection */
  factors: {
    name: string;
    weight: number;
    value: any;
    contribution: number;
  }[];
  /** Message explicatif */
  explanation: string;
}

/**
 * Paramètres pour la détection de stabilité
 */
export interface StabilityDetectionParams {
  /** Historique utilisateur */
  userHistory: UserHistory;
  /** Contexte environnemental */
  environment: EnvironmentalContext;
  /** Date de référence */
  referenceDate: Date;
}

/**
 * Détecte la stabilité énergétique de l'utilisateur
 * @param params Paramètres de détection
 * @returns Résultat de la détection de stabilité
 */
export function detectEnergyStability(params: StabilityDetectionParams): StabilityDetectionResult {
  const { userHistory, environment, referenceDate } = params;
  const factors: StabilityDetectionResult['factors'] = [];
  
  // 1. Analyser la variance des check-ins énergétiques sur les 3 derniers jours
  const recentCheckIns = userHistory.energyCheckIns
    .filter(checkIn => {
      const diffDays = (referenceDate.getTime() - checkIn.date.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays <= 3;
    })
    .sort((a, b) => b.date.getTime() - a.date.getTime());
  
  let energyVarianceScore = 0;
  if (recentCheckIns.length > 1) {
    // Calculer la variance des niveaux d'énergie
    const energyLevels = recentCheckIns.map(checkIn => {
      switch (checkIn.energy.level) {
        case 'low': return 1;
        case 'medium': return 2;
        case 'high': return 3;
        default: return 2;
      }
    });
    
    const mean = energyLevels.reduce((sum, level) => sum + level, 0) / energyLevels.length;
    const variance = energyLevels.reduce((sum, level) => sum + Math.pow(level - mean, 2), 0) / energyLevels.length;
    
    // Plus la variance est grande, moins l'énergie est stable
    energyVarianceScore = Math.min(1, variance / 2); // Normaliser entre 0 et 1
  }
  
  factors.push({
    name: 'energy_variance',
    weight: 0.3,
    value: energyVarianceScore,
    contribution: energyVarianceScore * 0.3
  });
  
  // 2. Analyser le nombre d'interruptions récentes
  const recentInterruptions = userHistory.interruptions
    .filter(interruption => {
      const diffDays = (referenceDate.getTime() - interruption.date.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays <= 3;
    });
  
  const interruptionScore = Math.min(1, recentInterruptions.length / 3); // 3 interruptions = score maximum
  
  factors.push({
    name: 'interruptions',
    weight: 0.25,
    value: recentInterruptions.length,
    contribution: interruptionScore * 0.25
  });
  
  // 3. Analyser les sessions incomplètes
  const recentSessions = userHistory.sessions
    .filter(session => {
      const diffDays = (referenceDate.getTime() - session.date.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays <= 3;
    });
  
  const incompleteSessions = recentSessions.filter(session => !session.completed);
  const incompleteSessionScore = recentSessions.length > 0 
    ? incompleteSessions.length / recentSessions.length 
    : 0;
  
  factors.push({
    name: 'incomplete_sessions',
    weight: 0.25,
    value: incompleteSessions.length,
    contribution: incompleteSessionScore * 0.25
  });
  
  // 4. Analyser le contexte environnemental
  let environmentalScore = 0;
  
  // Présence dans un open space
  if (environment.openSpace) {
    environmentalScore += 0.3;
  }
  
  // Nombre de réunions prévues
  if (environment.scheduledMeetings > 3) {
    environmentalScore += 0.2;
  } else if (environment.scheduledMeetings > 0) {
    environmentalScore += 0.1;
  }
  
  // Journée atypique
  if (environment.atypicalDay) {
    environmentalScore += 0.4;
  }
  
  environmentalScore = Math.min(1, environmentalScore); // Plafonner à 1
  
  factors.push({
    name: 'environmental_factors',
    weight: 0.2,
    value: environment,
    contribution: environmentalScore * 0.2
  });
  
  // Calculer le score total de volatilité
  const volatilityScore = factors.reduce((sum, factor) => sum + factor.contribution, 0);
  
  // Déterminer la stabilité
  const stability: 'stable' | 'volatile' = volatilityScore > 0.5 ? 'volatile' : 'stable';
  
  // Calculer la confiance (basée sur le nombre de facteurs disponibles)
  const availableFactors = factors.filter(factor => factor.value !== 0).length;
  const confidence = availableFactors / factors.length;
  
  // Générer l'explication
  const explanation = generateStabilityExplanation(factors, stability);
  
  return {
    stability,
    confidence,
    factors,
    explanation
  };
}

/**
 * Génère une explication de la détection de stabilité
 * @param factors Facteurs ayant influencé la détection
 * @param stability Stabilité détectée
 * @returns Explication textuelle
 */
function generateStabilityExplanation(
  factors: StabilityDetectionResult['factors'],
  stability: 'stable' | 'volatile'
): string {
  const volatileFactors = factors
    .filter(factor => factor.contribution > 0.1)
    .map(factor => factor.name);
  
  if (stability === 'volatile') {
    if (volatileFactors.length > 0) {
      return `Énergie volatile détectée en raison de: ${volatileFactors.join(', ')}.`;
    } else {
      return "Énergie volatile détectée sur la base de l'historique.";
    }
  } else {
    return "Énergie stable détectée. Conditions optimales pour le travail concentré.";
  }
}

/**
 * Met à jour l'historique utilisateur avec un nouveau check-in énergétique
 * @param history Historique actuel
 * @param energy État d'énergie déclaré
 * @param date Date du check-in
 * @returns Historique mis à jour
 */
export function updateEnergyHistory(
  history: UserHistory,
  energy: EnergyState,
  date: Date = new Date()
): UserHistory {
  return {
    ...history,
    energyCheckIns: [
      { date, energy },
      ...history.energyCheckIns.slice(0, 9) // Garder seulement les 10 derniers check-ins
    ]
  };
}

/**
 * Met à jour l'historique utilisateur avec une nouvelle interruption
 * @param history Historique actuel
 * @param reason Raison de l'interruption
 * @param date Date de l'interruption
 * @returns Historique mis à jour
 */
export function updateInterruptionHistory(
  history: UserHistory,
  reason: string,
  date: Date = new Date()
): UserHistory {
  return {
    ...history,
    interruptions: [
      { date, reason },
      ...history.interruptions.slice(0, 19) // Garder seulement les 20 dernières interruptions
    ]
  };
}

/**
 * Met à jour l'historique utilisateur avec une session
 * @param history Historique actuel
 * @param completed Session terminée ?
 * @param duration Durée de la session en minutes
 * @param date Date de la session
 * @returns Historique mis à jour
 */
export function updateSessionHistory(
  history: UserHistory,
  completed: boolean,
  duration: number,
  date: Date = new Date()
): UserHistory {
  return {
    ...history,
    sessions: [
      { date, completed, duration },
      ...history.sessions.slice(0, 19) // Garder seulement les 20 dernières sessions
    ]
  };
}
