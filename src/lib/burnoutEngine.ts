// Burnout Engine - Détection des signaux de burnout
// Connecté à la base de données réelle Dexie (KairuFlowDB)

import {
  getSessionsByDate,
  getSleepDataByPeriod,
  getOverridesByPeriod,
  getHistoryByPeriod,
  getTodoTasks,
  db
} from '@/lib/database';
import { DBSession, DBTask } from '@/lib/database';

// Types pour les signaux de burnout
export interface BurnoutDetectionResult {
  score: number;
  signals: {
    chronicOverload: boolean;
    sleepDebt: boolean;
    overrideAbuse: boolean;
    completionCollapse: boolean;
    erraticBehavior: boolean;
    taskAccumulation: boolean;
  };
}

// Helper pour calculer une date passée
function getPastDate(daysAgo: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(0, 0, 0, 0);
  return date;
}

// Fonction pour calculer la charge quotidienne réelle
export async function calculateDailyLoad(date: Date): Promise<number> {
  try {
    const daySessions = await getSessionsByDate(date);

    if (daySessions.length === 0) return 0;

    // Calcul de la charge basé sur le ratio tâches prévues / complétées
    // et pondéré par l'état de la session
    const totalLoad = daySessions.reduce((sum, session) => {
      if (session.plannedTasks === 0) return sum;

      const completionRatio = session.completedTasks / session.plannedTasks;
      let stressFactor = 1.0;

      // Les sessions "épuisé" ou "bloqué" comptent plus lourd dans la charge mentale
      if (session.state === 'EXHAUSTED') stressFactor = 1.5;
      if (session.state === 'BLOCKED') stressFactor = 1.3;

      // La charge est inversement proportionnelle à la complétion fluide
      // Une session avec peu de complétion mais beaucoup de tâches prévues pèse lourd
      const sessionLoad = (1 - completionRatio) * stressFactor;

      return sum + sessionLoad;
    }, 0);

    // Normalisation : On considère qu'au-delà de 3 sessions "lourdes", c'est une surcharge
    // Une charge > 1.0 signifie une journée très difficile
    return Math.min(totalLoad / 3, 2.0);

  } catch (error) {
    console.error('Erreur lors du calcul de la charge quotidienne:', error);
    return 0;
  }
}

// Fonction pour détecter la surcharge chronique
export async function detectChronicOverload(): Promise<boolean> {
  const daysToCheck = 5;
  let overloadCount = 0;

  for (let i = 0; i < daysToCheck; i++) {
    const date = getPastDate(i);
    const dailyLoad = await calculateDailyLoad(date);

    // Seuil de surcharge quotidienne
    if (dailyLoad > 1.2) {
      overloadCount++;
    }
  }

  // Surcharge chronique si 4 jours sur 5 sont en surcharge
  return overloadCount >= 4;
}

// Fonction pour détecter la dette de sommeil
export async function detectSleepDebt(): Promise<boolean> {
  const daysToCheck = 3;
  const startDate = getPastDate(daysToCheck);
  const endDate = new Date(); // Aujourd'hui

  try {
    const sleepRecords = await getSleepDataByPeriod(startDate, endDate);

    // S'il n'y a pas de données, on ne peut pas détecter de dette (bénéfice du doute)
    if (sleepRecords.length === 0) return false;

    let lowSleepCount = 0;

    // Pour chaque jour vérifié
    for (let i = 0; i < daysToCheck; i++) {
      const checkDate = getPastDate(i);
      const record = sleepRecords.find(r =>
        new Date(r.date).toDateString() === checkDate.toDateString()
      );

      // Si on a un enregistrement et qu'il est < 6h
      if (record && record.hours < 6) {
        lowSleepCount++;
      }
    }

    return lowSleepCount >= 3;
  } catch (error) {
    console.error("Erreur détection dette sommeil:", error);
    return false;
  }
}

// Fonction pour détecter l'abus d'overrides
export async function detectOverrideAbuse(periodDays: number = 7): Promise<boolean> {
  const startDate = getPastDate(periodDays);

  try {
    // Récupérer les overrides
    const overrides = await getOverridesByPeriod(startDate.getTime());

    // Récupérer le nombre total de décisions (approximé par l'historique des tâches)
    // Chaque action sur une tâche (création, start, complete) est une "décision" potentielle du système
    const history = await getHistoryByPeriod(startDate, new Date());

    // Estimation conservatrice : 1 décision système pour environ 3 actions d'historique
    const estimatedDecisions = Math.max(history.length / 3, 10); // Minimum 10 pour éviter les faux positifs au début

    if (overrides.length === 0) return false;

    const overrideRate = overrides.length / estimatedDecisions;

    // Si plus de 30% des décisions sont outrepassées (seuil ajusté par rapport à l'ancien 80% qui était très permissif)
    return overrideRate > 0.3;
  } catch (error) {
    console.error("Erreur détection abus overrides:", error);
    return false;
  }
}

// Fonction pour détecter l'effondrement de complétion
export async function detectCompletionCollapse(periodDays: number = 7): Promise<boolean> {
  const now = new Date();
  let lowCompletionDays = 0;
  let activeDays = 0;

  for (let i = 0; i < periodDays; i++) {
    const date = getPastDate(i);
    const sessions = await getSessionsByDate(date);

    if (sessions.length > 0) {
      activeDays++;

      // Calculer le taux de complétion moyen de la journée
      const totalPlanned = sessions.reduce((sum, s) => sum + s.plannedTasks, 0);
      const totalCompleted = sessions.reduce((sum, s) => sum + s.completedTasks, 0);

      if (totalPlanned > 0) {
        const dailyRate = totalCompleted / totalPlanned;
        if (dailyRate < 0.3) { // Moins de 30% de complétion
          lowCompletionDays++;
        }
      }
    }
  }

  if (activeDays < 3) return false; // Pas assez de données

  // Collapse si plus de 50% des jours actifs sont en échec
  return (lowCompletionDays / activeDays) > 0.5;
}

// Fonction pour détecter le comportement erratique
export async function detectErraticBehavior(periodDays: number = 7): Promise<boolean> {
  const now = new Date();
  const sessionDurations: number[] = [];

  for (let i = 0; i < periodDays; i++) {
    const date = getPastDate(i);
    const sessions = await getSessionsByDate(date);

    sessions.forEach(session => {
      if (session.endTime && session.startTime) {
        const durationMinutes = (session.endTime - session.startTime) / (1000 * 60);
        if (durationMinutes > 5) { // Ignorer les micro-sessions < 5 min
          sessionDurations.push(durationMinutes);
        }
      }
    });
  }

  if (sessionDurations.length < 5) return false; // Besoin d'un échantillon significatif

  // Calculer la variance
  const mean = sessionDurations.reduce((a, b) => a + b, 0) / sessionDurations.length;
  const squaredDiffs = sessionDurations.map(value => Math.pow(value - mean, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / squaredDiffs.length;
  const stdDev = Math.sqrt(variance);

  // Comportement erratique si l'écart-type est très élevé par rapport à la moyenne
  // Cela signifie que l'utilisateur alterne entre des sessions très courtes et très longues de manière imprévisible
  return stdDev > (1.5 * mean);
}

// Fonction pour détecter l'accumulation de tâches
export async function detectTaskAccumulation(periodDays: number = 7): Promise<boolean> {
  try {
    // Récupérer les tâches actives
    const activeTasks = await getTodoTasks();

    if (activeTasks.length <= 20) return false; // Charge raisonnable

    // Calculer le taux de croissance
    const startDate = getPastDate(periodDays);
    const recentTasks = activeTasks.filter(t => new Date(t.createdAt) > startDate);

    const creationRatePerDay = recentTasks.length / periodDays;

    // Accumulation si : Beaucoup de tâches (>20) ET on en crée plus de 3 par jour en moyenne sans les finir
    return activeTasks.length > 20 && creationRatePerDay > 3;
  } catch (error) {
    console.error("Erreur détection accumulation:", error);
    return false;
  }
}

// Fonction principale pour calculer le score de burnout
// Récupère automatiquement les données nécessaires
export async function calculateBurnoutScore(userId: string = "current_user"): Promise<BurnoutDetectionResult> {
  // Détecter tous les signaux en parallèle
  const [
    chronicOverload,
    sleepDebt,
    overrideAbuse,
    completionCollapse,
    erraticBehavior,
    taskAccumulation
  ] = await Promise.all([
    detectChronicOverload(),
    detectSleepDebt(),
    detectOverrideAbuse(),
    detectCompletionCollapse(),
    detectErraticBehavior(),
    detectTaskAccumulation()
  ]);

  // Calculer le score pondéré
  const weights = {
    chronicOverload: 0.3,
    sleepDebt: 0.3,
    overrideAbuse: 0.15, // Un peu moins grave
    completionCollapse: 0.15,
    erraticBehavior: 0.05,
    taskAccumulation: 0.05
  };

  const score =
    (chronicOverload ? weights.chronicOverload : 0) +
    (sleepDebt ? weights.sleepDebt : 0) +
    (overrideAbuse ? weights.overrideAbuse : 0) +
    (completionCollapse ? weights.completionCollapse : 0) +
    (erraticBehavior ? weights.erraticBehavior : 0) +
    (taskAccumulation ? weights.taskAccumulation : 0);

  return {
    score: Math.min(score, 1.0), // Plafonner à 1.0
    signals: {
      chronicOverload,
      sleepDebt,
      overrideAbuse,
      completionCollapse,
      erraticBehavior,
      taskAccumulation
    }
  };
}
