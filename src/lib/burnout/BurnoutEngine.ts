/**
 * Burnout Detection Engine - Version avec vraie intégration DB
 * Détecte les signaux de burnout à partir des données réelles
 * 
 * Features:
 * - Détection de 6 signaux de burnout
 * - Seuils numériques calibrés
 * - Intégration complète avec Dexie.js
 * - Logging structuré
 */

import { createLogger } from '@/lib/logger';
import {
    db,
    getSessionsByDate,
    getOverridesByPeriod,
    getSleepDataByPeriod,
    getTodoTasks,
    type DBSession,
    type DBTask,
    type DBSleepData,
    type DBOverride,
} from '@/lib/database';

const logger = createLogger('BurnoutEngine');

// ============================================
// Types
// ============================================

export interface BurnoutSignals {
    chronicOverload: boolean;
    sleepDebt: boolean;
    overrideAbuse: boolean;
    completionCollapse: boolean;
    erraticBehavior: boolean;
    taskAccumulation: boolean;
}

export interface BurnoutDetectionResult {
    score: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    signals: BurnoutSignals;
    recommendations: string[];
    detectedAt: Date;
}

export interface BurnoutThresholds {
    overloadDays: number;
    overloadRatio: number;
    sleepMinHours: number;
    sleepCheckDays: number;
    overrideRatioThreshold: number;
    completionCollapseThreshold: number;
    varianceMultiplier: number;
    taskAccumulationLimit: number;
    taskGrowthRateLimit: number;
}

// ============================================
// Configuration par défaut
// ============================================

const DEFAULT_THRESHOLDS: BurnoutThresholds = {
    overloadDays: 5,
    overloadRatio: 1.2,
    sleepMinHours: 6,
    sleepCheckDays: 3,
    overrideRatioThreshold: 0.8,
    completionCollapseThreshold: 0.3,
    varianceMultiplier: 2,
    taskAccumulationLimit: 50,
    taskGrowthRateLimit: 5,
};

const SIGNAL_WEIGHTS = {
    chronicOverload: 0.25,
    sleepDebt: 0.25,
    overrideAbuse: 0.15,
    completionCollapse: 0.15,
    erraticBehavior: 0.10,
    taskAccumulation: 0.10,
};

// ============================================
// Fonctions de détection
// ============================================

/**
 * Calcule la charge quotidienne à partir des sessions
 */
async function calculateDailyLoad(date: Date): Promise<number> {
    const sessions = await getSessionsByDate(date);

    if (sessions.length === 0) {
        return 0;
    }

    const totalLoad = sessions.reduce((sum, session) => {
        const planned = session.plannedTasks ?? 0;
        const completed = session.completedTasks ?? 0;

        if (planned <= 0) return sum;

        // Charge = sur-planification vs exécution.
        // planned/completed > 1 signifie que l'utilisateur planifie plus qu'il n'exécute.
        // Cette métrique peut dépasser 1 (à l'inverse de completed/planned).
        const rawRatio = planned / Math.max(1, completed);
        const ratio = Math.min(10, rawRatio);

        return sum + ratio;
    }, 0);

    return totalLoad / sessions.length;
}

/**
 * Détecte la surcharge chronique
 * Seuil: sur-planification (planned/completed) >= 120% pendant N jours
 */
export async function detectChronicOverload(
    thresholds: BurnoutThresholds = DEFAULT_THRESHOLDS
): Promise<boolean> {
    logger.startTimer('detect-chronic-overload');

    let overloadCount = 0;
    const now = new Date();

    for (let i = 0; i < thresholds.overloadDays; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);

        const dailyLoad = await calculateDailyLoad(date);
        if (dailyLoad >= thresholds.overloadRatio) {
            overloadCount++;
        }
    }

    logger.endTimer('detect-chronic-overload');

    const isOverloaded = overloadCount >= thresholds.overloadDays;
    if (isOverloaded) {
        logger.warn('Chronic overload detected', { overloadCount });
    }

    return isOverloaded;
}

/**
 * Détecte la dette de sommeil
 * Seuil: < 6h de sommeil pendant 3 jours consécutifs
 */
export async function detectSleepDebt(
    thresholds: BurnoutThresholds = DEFAULT_THRESHOLDS
): Promise<boolean> {
    logger.startTimer('detect-sleep-debt');

    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - thresholds.sleepCheckDays);

    const sleepData = await getSleepDataByPeriod(startDate, now);

    // Si pas de données de sommeil, on ne peut pas détecter
    if (sleepData.length === 0) {
        logger.debug('No sleep data available');
        logger.endTimer('detect-sleep-debt');
        return false;
    }

    const lowSleepDays = sleepData.filter(
        entry => entry.hours < thresholds.sleepMinHours
    ).length;

    logger.endTimer('detect-sleep-debt');

    const hasSleepDebt = lowSleepDays >= thresholds.sleepCheckDays;
    if (hasSleepDebt) {
        logger.warn('Sleep debt detected', { lowSleepDays });
    }

    return hasSleepDebt;
}

/**
 * Détecte l'abus d'overrides
 * Seuil: > 80% des décisions sont des overrides
 */
export async function detectOverrideAbuse(
    periodDays: number = 7,
    thresholds: BurnoutThresholds = DEFAULT_THRESHOLDS
): Promise<boolean> {
    logger.startTimer('detect-override-abuse');

    const now = Date.now();
    const periodStart = now - (periodDays * 24 * 60 * 60 * 1000);

    const overrides = await getOverridesByPeriod(periodStart);

    // Estimer le nombre de décisions à partir des sessions
    const sessions = await db.sessions
        .where('timestamp')
        .above(periodStart)
        .toArray();

    const totalDecisions = sessions.reduce(
        (sum: number, session: DBSession) => sum + session.plannedTasks,
        0
    );
    if (totalDecisions === 0) {
        logger.endTimer('detect-override-abuse');
        return false;
    }

    const overrideRate = overrides.length / totalDecisions;

    logger.endTimer('detect-override-abuse');

    const hasOverrideAbuse = overrideRate > thresholds.overrideRatioThreshold;
    if (hasOverrideAbuse) {
        logger.warn('Override abuse detected', { overrideRate: overrideRate.toFixed(2) });
    }

    return hasOverrideAbuse;
}

/**
 * Détecte l'effondrement de complétion
 * Seuil: > 50% des sessions avec taux < 30%
 */
export async function detectCompletionCollapse(
    periodDays: number = 7,
    thresholds: BurnoutThresholds = DEFAULT_THRESHOLDS
): Promise<boolean> {
    logger.startTimer('detect-completion-collapse');

    const now = new Date();
    const sessions: DBSession[] = [];

    for (let i = 0; i < periodDays; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const daySessions = await getSessionsByDate(date);
        sessions.push(...daySessions);
    }

    if (sessions.length === 0) {
        logger.endTimer('detect-completion-collapse');
        return false;
    }

    const lowCompletionSessions = sessions.filter(session => {
        if (session.plannedTasks === 0) return false;
        const rate = session.completedTasks / session.plannedTasks;
        return rate < thresholds.completionCollapseThreshold;
    });

    const collapseRate = lowCompletionSessions.length / sessions.length;

    logger.endTimer('detect-completion-collapse');

    const hasCollapse = collapseRate > 0.5;
    if (hasCollapse) {
        logger.warn('Completion collapse detected', { collapseRate: collapseRate.toFixed(2) });
    }

    return hasCollapse;
}

/**
 * Détecte le comportement erratique
 * Seuil: variance des durées de session > 2σ
 */
export async function detectErraticBehavior(
    periodDays: number = 7,
    thresholds: BurnoutThresholds = DEFAULT_THRESHOLDS
): Promise<boolean> {
    logger.startTimer('detect-erratic-behavior');

    const now = new Date();
    const sessionDurations: number[] = [];

    for (let i = 0; i < periodDays; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const daySessions = await getSessionsByDate(date);

        daySessions.forEach(session => {
            if (session.endTime && session.startTime) {
                const duration = (session.endTime - session.startTime) / (60 * 1000);
                if (duration > 0) {
                    sessionDurations.push(duration);
                }
            }
        });
    }

    if (sessionDurations.length < 2) {
        logger.endTimer('detect-erratic-behavior');
        return false;
    }

    // Calculer moyenne et écart-type
    const mean = sessionDurations.reduce((a, b) => a + b, 0) / sessionDurations.length;
    const squaredDiffs = sessionDurations.map(value => Math.pow(value - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / squaredDiffs.length;
    const stdDev = Math.sqrt(variance);

    logger.endTimer('detect-erratic-behavior');

    const isErratic = stdDev > thresholds.varianceMultiplier * mean;
    if (isErratic) {
        logger.warn('Erratic behavior detected', { mean: mean.toFixed(1), stdDev: stdDev.toFixed(1) });
    }

    return isErratic;
}

/**
 * Détecte l'accumulation de tâches
 * Seuil: > 50 tâches actives avec croissance > 5/jour
 */
export async function detectTaskAccumulation(
    periodDays: number = 7,
    thresholds: BurnoutThresholds = DEFAULT_THRESHOLDS
): Promise<boolean> {
    logger.startTimer('detect-task-accumulation');

    const activeTasks = await getTodoTasks();

    if (activeTasks.length <= thresholds.taskAccumulationLimit) {
        logger.endTimer('detect-task-accumulation');
        return false;
    }

    // Calculer le taux de croissance
    const now = new Date();
    const periodStart = new Date(now);
    periodStart.setDate(periodStart.getDate() - periodDays);

    const recentTasks = activeTasks.filter(
        task => new Date(task.createdAt) > periodStart
    );

    const growthRate = recentTasks.length / periodDays;

    logger.endTimer('detect-task-accumulation');

    const hasAccumulation = growthRate > thresholds.taskGrowthRateLimit;
    if (hasAccumulation) {
        logger.warn('Task accumulation detected', {
            activeCount: activeTasks.length,
            growthRate: growthRate.toFixed(1),
        });
    }

    return hasAccumulation;
}

// ============================================
// Fonction principale
// ============================================

/**
 * Calcule le score de burnout global
 */
export async function calculateBurnoutScore(
    thresholds: BurnoutThresholds = DEFAULT_THRESHOLDS
): Promise<BurnoutDetectionResult> {
    logger.startTimer('burnout-detection');

    // Détecter tous les signaux en parallèle
    const [
        chronicOverload,
        sleepDebt,
        overrideAbuse,
        completionCollapse,
        erraticBehavior,
        taskAccumulation,
    ] = await Promise.all([
        detectChronicOverload(thresholds),
        detectSleepDebt(thresholds),
        detectOverrideAbuse(7, thresholds),
        detectCompletionCollapse(7, thresholds),
        detectErraticBehavior(7, thresholds),
        detectTaskAccumulation(7, thresholds),
    ]);

    const signals: BurnoutSignals = {
        chronicOverload,
        sleepDebt,
        overrideAbuse,
        completionCollapse,
        erraticBehavior,
        taskAccumulation,
    };

    // Calculer le score pondéré
    const score =
        (chronicOverload ? SIGNAL_WEIGHTS.chronicOverload : 0) +
        (sleepDebt ? SIGNAL_WEIGHTS.sleepDebt : 0) +
        (overrideAbuse ? SIGNAL_WEIGHTS.overrideAbuse : 0) +
        (completionCollapse ? SIGNAL_WEIGHTS.completionCollapse : 0) +
        (erraticBehavior ? SIGNAL_WEIGHTS.erraticBehavior : 0) +
        (taskAccumulation ? SIGNAL_WEIGHTS.taskAccumulation : 0);

    // Déterminer le niveau de risque
    let riskLevel: BurnoutDetectionResult['riskLevel'];
    if (score >= 0.7) {
        riskLevel = 'critical';
    } else if (score >= 0.5) {
        riskLevel = 'high';
    } else if (score >= 0.3) {
        riskLevel = 'medium';
    } else {
        riskLevel = 'low';
    }

    // Générer les recommandations
    const recommendations: string[] = [];

    if (chronicOverload) {
        recommendations.push('Réduisez votre charge de travail quotidienne');
        recommendations.push('Prenez des pauses régulières');
    }
    if (sleepDebt) {
        recommendations.push('Priorisez votre sommeil (visez 7-8h par nuit)');
        recommendations.push('Établissez une routine de coucher régulière');
    }
    if (overrideAbuse) {
        recommendations.push('Faites confiance aux recommandations du système');
        recommendations.push('Réfléchissez avant de surcharger votre journée');
    }
    if (completionCollapse) {
        recommendations.push('Réduisez le nombre de tâches planifiées');
        recommendations.push('Divisez les grandes tâches en sous-tâches');
    }
    if (erraticBehavior) {
        recommendations.push('Établissez une routine de travail plus régulière');
        recommendations.push('Planifiez vos sessions à l\'avance');
    }
    if (taskAccumulation) {
        recommendations.push('Faites un tri dans vos tâches en attente');
        recommendations.push('Supprimez ou déléguez les tâches non essentielles');
    }

    if (recommendations.length === 0) {
        recommendations.push('Continuez comme ça ! Votre rythme est sain.');
    }

    logger.endTimer('burnout-detection');

    const result: BurnoutDetectionResult = {
        score,
        riskLevel,
        signals,
        recommendations,
        detectedAt: new Date(),
    };

    logger.info('Burnout detection completed', {
        score: score.toFixed(2),
        riskLevel,
        signalsDetected: Object.values(signals).filter(Boolean).length,
    });

    return result;
}

/**
 * Vérifie périodiquement le burnout (à appeler une fois par jour)
 */
export async function scheduleDailyBurnoutCheck(): Promise<void> {
    const { getSetting, setSetting } = await import('@/lib/database');

    const lastCheck = await getSetting<string>('burnout.lastCheck');
    const today = new Date().toISOString().split('T')[0];

    if (lastCheck === today) {
        logger.debug('Burnout check already done today');
        return;
    }

    const result = await calculateBurnoutScore();
    await setSetting('burnout.lastCheck', today);
    await setSetting('burnout.lastResult', result);

    if (result.riskLevel === 'high' || result.riskLevel === 'critical') {
        logger.warn('High burnout risk detected!', { riskLevel: result.riskLevel });
        // Ici on pourrait déclencher une notification
    }
}
