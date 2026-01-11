/**
 * DÉTECTION DE STABILITÉ - KairuFlow Phase 1
 * Algorithme de détection automatique de la stabilité énergétique
 */

export interface StabilityIndicators {
  recentInterruptions: number;        // Dernières 3 sessions
  energyVariance: number;             // Écart-type sur 5 check-ins
  completionRate: number;             // % tâches finies
  contextFactors: ContextFactors;     // Meetings, déplacements, etc.
}

export interface ContextFactors {
  meetingCount: number;               // Nombre de réunions aujourd'hui
  travelDay: boolean;                 // Jour de déplacement
  openSpace: boolean;                 // Bureau ouvert
  weekend: boolean;                   // Est-ce le week-end
  unusualSchedule: boolean;           // Horaire inhabituel
}

export interface UserHistory {
  recentSessions: SessionHistory[];
  energyLogs: EnergyLog[];
  taskCompletions: TaskCompletion[];
  contextLogs: ContextLog[];
}

export interface SessionHistory {
  timestamp: Date;
  interruptions: number;
  completedTasks: number;
  plannedTasks: number;
}

export interface EnergyLog {
  timestamp: Date;
  level: 'low' | 'medium' | 'high';
  variance: number; // Mesure de la variabilité
}

export interface TaskCompletion {
  timestamp: Date;
  completed: boolean;
}

export interface ContextLog {
  timestamp: Date;
  factors: ContextFactors;
}

export type EnergyStability = 'stable' | 'volatile' | 'transitional';

/**
 * Algorithme de détection de la stabilité
 */
export function detectStability(
  userHistory: UserHistory,
  currentContext: ContextFactors
): EnergyStability {
  const indicators = calculateIndicators(userHistory, currentContext);
  
  // Calcul du score de volatilité avec poids empiriques
  const volatilityScore = calculateVolatilityScore(indicators);
  
  // Seuil avec hystérésis pour éviter oscillation
  const threshold = 0.6;
  const hysteresis = 0.1;
  
  // Si le score est clairement au-dessus ou en dessous du seuil
  if (volatilityScore > threshold + hysteresis) {
    return 'volatile';
  } else if (volatilityScore < threshold - hysteresis) {
    return 'stable';
  } else {
    // Dans la zone grise, on maintient l'état précédent pour éviter les oscillations
    return 'transitional'; // État intermédiaire
  }
}

/**
 * Calcule les indicateurs de stabilité
 */
function calculateIndicators(
  userHistory: UserHistory,
  currentContext: ContextFactors
): StabilityIndicators {
  // Calcul des interruptions récentes (sur les 3 dernières sessions)
  const recentInterruptions = calculateRecentInterruptions(userHistory.recentSessions);
  
  // Calcul de la variance d'énergie (sur les 5 derniers check-ins)
  const energyVariance = calculateEnergyVariance(userHistory.energyLogs);
  
  // Calcul du taux de complétion
  const completionRate = calculateCompletionRate(userHistory.taskCompletions);
  
  return {
    recentInterruptions,
    energyVariance,
    completionRate,
    contextFactors: currentContext
  };
}

/**
 * Calcule les interruptions récentes
 */
function calculateRecentInterruptions(sessions: SessionHistory[]): number {
  if (sessions.length === 0) return 0;
  
  // Moyenne des interruptions sur les dernières sessions
  const totalInterruptions = sessions.reduce((sum, session) => sum + session.interruptions, 0);
  return totalInterruptions / sessions.length;
}

/**
 * Calcule la variance d'énergie
 */
function calculateEnergyVariance(energyLogs: EnergyLog[]): number {
  if (energyLogs.length < 2) return 0;
  
  // Convertir les niveaux en nombres pour le calcul
  const energyValues = energyLogs.map(log => 
    log.level === 'high' ? 3 : log.level === 'medium' ? 2 : 1
  );
  
  // Calcul de la variance
  const mean = energyValues.reduce((sum, val) => sum + val, 0) / energyValues.length;
  const squaredDiffs = energyValues.map(val => Math.pow(val - mean, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / squaredDiffs.length;
  
  // Normaliser la variance (arbitrairement sur une échelle 0-2.0)
  return Math.min(2.0, variance);
}

/**
 * Calcule le taux de complétion
 */
function calculateCompletionRate(completions: TaskCompletion[]): number {
  if (completions.length === 0) return 1.0; // Si aucune tâche, on suppose 100%
  
  const completedCount = completions.filter(c => c.completed).length;
  return completedCount / completions.length;
}

/**
 * Calcule le score de volatilité global
 */
function calculateVolatilityScore(indicators: StabilityIndicators): number {
  // Poids empiriques (à calibrer selon les données réelles)
  const weights = {
    interruptions: 0.30,
    energyVariance: 0.30,
    completionRate: 0.20, // Note inversée: taux bas = volatilité haute
    contextChaos: 0.20
  };
  
  // Normalisation des indicateurs à une échelle 0-1
  const normalizedInterruptions = Math.min(1.0, indicators.recentInterruptions / 5); // Supposé max 5 interruptions
  const normalizedVariance = Math.min(1.0, indicators.energyVariance / 2.0); // Max variance supposée 2.0
  
  // Le taux de complétion inverse: moins on termine, plus on est volatile
  const normalizedCompletion = 1.0 - indicators.completionRate;
  
  // Calcul du chaos contextuel
  const contextChaos = scoreContextChaos(indicators.contextFactors);
  
  // Calcul du score final
  const volatilityScore = (
    weights.interruptions * normalizedInterruptions +
    weights.energyVariance * normalizedVariance +
    weights.completionRate * normalizedCompletion +
    weights.contextChaos * contextChaos
  );
  
  return Math.max(0, Math.min(1, volatilityScore)); // Assurer que c'est entre 0 et 1
}

/**
 * Calcule le score de chaos contextuel
 */
function scoreContextChaos(factors: ContextFactors): number {
  let chaosScore = 0;
  
  // Pondération des facteurs de chaos
  chaosScore += factors.meetingCount > 3 ? 0.3 : factors.meetingCount > 1 ? 0.15 : 0;
  chaosScore += factors.travelDay ? 0.2 : 0;
  chaosScore += factors.openSpace ? 0.15 : 0;
  chaosScore += factors.unusualSchedule ? 0.2 : 0;
  
  return Math.min(1.0, chaosScore); // Max 1.0
}

/**
 * Table de vérité pour la stabilité (documentation)
 * 
 * | Interruptions | Variance énergie | Completion | Meetings | → Stabilité |
 * |---------------|------------------|------------|----------|-------------|
 * | > 3           | > 1.5            | < 50%      | > 3      | **VOLATILE** |
 * | > 3           | ≤ 1.5            | ≥ 50%      | ≤ 3      | **INSTABLE** |
 * | ≤ 3           | > 1.5            | < 50%      | > 3      | **INSTABLE** |
 * | ≤ 3           | ≤ 1.5            | ≥ 50%      | ≤ 3      | **STABLE**   |
 */
export function getStabilityTruthTable(): Array<{
  interruptions: string;
  energyVariance: string;
  completionRate: string;
  meetings: string;
  stability: EnergyStability;
}> {
  return [
    { 
      interruptions: "> 3", 
      energyVariance: "> 1.5", 
      completionRate: "< 50%", 
      meetings: "> 3", 
      stability: "volatile" 
    },
    { 
      interruptions: "> 3", 
      energyVariance: "≤ 1.5", 
      completionRate: "≥ 50%", 
      meetings: "≤ 3", 
      stability: "volatile" // Toujours volatile avec beaucoup d'interruptions
    },
    { 
      interruptions: "≤ 3", 
      energyVariance: "> 1.5", 
      completionRate: "< 50%", 
      meetings: "> 3", 
      stability: "volatile" // Haute variance + bas taux de complétion
    },
    { 
      interruptions: "≤ 3", 
      energyVariance: "≤ 1.5", 
      completionRate: "≥ 50%", 
      meetings: "≤ 3", 
      stability: "stable" 
    }
  ];
}

/**
 * Interface pour le service de détection de stabilité
 */
export interface StabilityService {
  detect(currentContext: ContextFactors, history?: UserHistory): EnergyStability;
  updateHistory(newData: any): void;
  getIndicators(): StabilityIndicators | null;
}

/**
 * Service de détection de stabilité par défaut
 */
export class DefaultStabilityService implements StabilityService {
  private currentIndicators: StabilityIndicators | null = null;
  private userHistory: UserHistory;

  constructor(initialHistory: UserHistory) {
    this.userHistory = initialHistory;
  }

  detect(currentContext: ContextFactors, history?: UserHistory): EnergyStability {
    const hist = history || this.userHistory;
    this.currentIndicators = calculateIndicators(hist, currentContext);
    return detectStability(hist, currentContext);
  }

  updateHistory(newData: any): void {
    // Mettre à jour l'historique avec les nouvelles données
    // Implémentation selon les besoins spécifiques
  }

  getIndicators(): StabilityIndicators | null {
    return this.currentIndicators;
  }
}

/**
 * Options de calibration pour la détection de stabilité
 */
export interface StabilityCalibration {
  interruptionWeight: number;
  energyVarianceWeight: number;
  completionRateWeight: number;
  contextFactorWeight: number;
  volatilityThreshold: number;
  hysteresisBand: number;
}

/**
 * Calibration par défaut (à ajuster selon les données réelles)
 */
export const DEFAULT_STABILITY_CALIBRATION: StabilityCalibration = {
  interruptionWeight: 0.30,
  energyVarianceWeight: 0.30,
  completionRateWeight: 0.20,
  contextFactorWeight: 0.20,
  volatilityThreshold: 0.6,
  hysteresisBand: 0.1
};