// Burnout Engine - Détection des signaux de burnout
// Implémentation des 6 fonctions de détection avec seuils numériques

import { Session, Task } from './types';

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

// Fonction pour calculer la charge quotidienne
export function calculateDailyLoad(sessions: Session[], date: Date): number {
  // Filtrer les sessions pour la date donnée
  const daySessions = sessions.filter(session => {
    const sessionDate = new Date(session.timestamp);
    return sessionDate.toDateString() === date.toDateString();
  });
  
  if (daySessions.length === 0) return 0;
  
  // Calculer la charge totale pour la journée
  const totalLoad = daySessions.reduce((sum, session) => {
    // Simuler le budget consommé (dans une implémentation réelle, cela viendrait des données)
    const budgetConsumed = session.completedTasks * 0.5; // Exemple arbitraire
    const budgetAtStart = session.plannedTasks * 0.5; // Exemple arbitraire
    
    if (budgetAtStart === 0) return sum;
    return sum + (budgetConsumed / budgetAtStart);
  }, 0);
  
  return totalLoad / daySessions.length; // Moyenne de la charge quotidienne
}

// Fonction pour détecter la surcharge chronique
export async function detectChronicOverload(
  sessions: Session[],
  userId: string
): Promise<boolean> {
  const now = new Date();
  let overloadCount = 0;
  
  // Vérifier les 5 derniers jours
  for (let i = 0; i < 5; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    const dailyLoad = calculateDailyLoad(sessions, date);
    if (dailyLoad > 1.2) {
      overloadCount++;
    }
  }
  
  return overloadCount >= 5;
}

// Fonction pour détecter la dette de sommeil
export async function detectSleepDebt(
  userId: string,
  sleepData: { date: Date; hours: number }[]
): Promise<boolean> {
  const now = new Date();
  let lowSleepCount = 0;
  
  // Vérifier les 3 derniers jours
  for (let i = 0; i < 3; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    const sleepEntry = sleepData.find(entry => 
      entry.date.toDateString() === date.toDateString()
    );
    
    if (sleepEntry && sleepEntry.hours < 6) {
      lowSleepCount++;
    }
  }
  
  return lowSleepCount >= 3;
}

// Fonction pour détecter l'abus d'overrides
export async function detectOverrideAbuse(
  overrides: { timestamp: number }[],
  decisions: number,
  periodDays: number = 7
): Promise<boolean> {
  const now = Date.now();
  const periodStart = now - (periodDays * 24 * 60 * 60 * 1000);
  
  // Compter les overrides dans la période
  const recentOverrides = overrides.filter(
    override => override.timestamp > periodStart
  );
  
  if (decisions === 0) return false;
  
  const overrideRate = recentOverrides.length / decisions;
  return overrideRate > 0.8;
}

// Fonction pour détecter l'effondrement de complétion
export async function detectCompletionCollapse(
  sessions: Session[],
  periodDays: number = 7
): Promise<boolean> {
  const now = new Date();
  let lowCompletionCount = 0;
  let totalCount = 0;
  
  // Vérifier les sessions des derniers jours
  for (let i = 0; i < periodDays; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    const daySessions = sessions.filter(session => {
      const sessionDate = new Date(session.timestamp);
      return sessionDate.toDateString() === date.toDateString();
    });
    
    daySessions.forEach(session => {
      totalCount++;
      const completionRate = session.plannedTasks > 0 
        ? session.completedTasks / session.plannedTasks 
        : 0;
      
      if (completionRate < 0.3) {
        lowCompletionCount++;
      }
    });
  }
  
  if (totalCount === 0) return false;
  
  const collapseRate = lowCompletionCount / totalCount;
  return collapseRate > 0.5; // Plus de 50% des sessions ont un taux < 30%
}

// Fonction pour détecter le comportement erratique
export async function detectErraticBehavior(
  sessions: Session[],
  periodDays: number = 7
): Promise<boolean> {
  const now = new Date();
  const sessionDurations: number[] = [];
  
  // Collecter les durées de session des derniers jours
  for (let i = 0; i < periodDays; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    const daySessions = sessions.filter(session => {
      const sessionDate = new Date(session.timestamp);
      return sessionDate.toDateString() === date.toDateString();
    });
    
    daySessions.forEach(session => {
      // Calculer la durée de session (en minutes)
      const duration = session.endTime 
        ? (session.endTime - session.startTime) / (60 * 1000)
        : 0;
      sessionDurations.push(duration);
    });
  }
  
  if (sessionDurations.length < 2) return false;
  
  // Calculer la variance
  const mean = sessionDurations.reduce((a, b) => a + b, 0) / sessionDurations.length;
  const squaredDiffs = sessionDurations.map(value => Math.pow(value - mean, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / squaredDiffs.length;
  const stdDev = Math.sqrt(variance);
  
  // Vérifier si la variance est supérieure à 2σ
  return stdDev > 2 * mean;
}

// Fonction pour détecter l'accumulation de tâches
export async function detectTaskAccumulation(
  tasks: Task[],
  periodDays: number = 7
): Promise<boolean> {
  // Compter les tâches actives
  const activeTasks = tasks.filter(task => 
    task.status !== "DONE" && task.status !== "CANCELLED"
  );
  
  if (activeTasks.length <= 50) return false;
  
  // Calculer le taux de croissance (simplifié)
  const now = Date.now();
  const periodStart = now - (periodDays * 24 * 60 * 60 * 1000);
  
  const recentTasks = tasks.filter(
    task => task.createdAt > periodStart
  );
  
  const growthRate = recentTasks.length / periodDays;
  
  return activeTasks.length > 50 && growthRate > 5;
}

// Fonction principale pour calculer le score de burnout
export async function calculateBurnoutScore(
  userId: string,
  sessions: Session[],
  tasks: Task[],
  overrides: { timestamp: number }[],
  decisions: number,
  sleepData: { date: Date; hours: number }[]
): Promise<BurnoutDetectionResult> {
  // Détecter chaque signal
  const chronicOverload = await detectChronicOverload(sessions, userId);
  const sleepDebt = await detectSleepDebt(userId, sleepData);
  const overrideAbuse = await detectOverrideAbuse(overrides, decisions);
  const completionCollapse = await detectCompletionCollapse(sessions);
  const erraticBehavior = await detectErraticBehavior(sessions);
  const taskAccumulation = await detectTaskAccumulation(tasks);
  
  // Calculer le score pondéré
  const weights = {
    chronicOverload: 0.3,
    sleepDebt: 0.3,
    overrideAbuse: 0.2,
    completionCollapse: 0.2,
    erraticBehavior: 0.1,
    taskAccumulation: 0.1
  };
  
  const score = 
    (chronicOverload ? weights.chronicOverload : 0) +
    (sleepDebt ? weights.sleepDebt : 0) +
    (overrideAbuse ? weights.overrideAbuse : 0) +
    (completionCollapse ? weights.completionCollapse : 0) +
    (erraticBehavior ? weights.erraticBehavior : 0) +
    (taskAccumulation ? weights.taskAccumulation : 0);
  
  return {
    score,
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