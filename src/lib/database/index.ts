/**
 * KairuFlow Database - Implémentation Dexie.js
 * Base de données IndexedDB pour le stockage local des tâches et sessions
 * 
 * Features:
 * - Stockage persistant côté client
 * - Requêtes indexées performantes
 * - Support hors-ligne
 * - Migration de schéma automatique
 */

import Dexie, { type Table } from 'dexie';
import { createLogger } from '@/lib/logger';

const logger = createLogger('Database');

// ============================================
// Types pour la base de données
// ============================================

export interface DBTask {
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
    status: 'todo' | 'active' | 'frozen' | 'done' | 'cancelled';
    activationCount: number;
    lastActivated?: Date;
    createdAt: Date;
    updatedAt: Date;
    completedAt?: Date;
    tags?: string[];
}

/**
 * Upsert en masse des tâches (utilisé pour synchroniser depuis le Brain/playlist)
 */
export async function upsertTasks(tasks: DBTask[]): Promise<void> {
    try {
        await db.tasks.bulkPut(tasks);
        logger.debug('Tasks upserted', { count: tasks.length });
    } catch (error) {
        logger.error('Failed to upsert tasks', error as Error);
        throw error;
    }
}

/**
 * Récupère toutes les tâches (tous statuts)
 */
export async function getAllTasks(): Promise<DBTask[]> {
    try {
        return await db.tasks.toArray();
    } catch (error) {
        logger.error('Failed to get all tasks', error as Error);
        return [];
    }
}

export interface DBSession {
    id: string;
    timestamp: number;
    startTime: number;
    endTime?: number;
    plannedTasks: number;
    completedTasks: number;
    state: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'EXHAUSTED' | 'BLOCKED';
    energyLevel?: 'low' | 'medium' | 'high';
    energyStability?: 'volatile' | 'stable';
    taskIds: string[];
    createdAt: Date;
}

export interface DBTaskHistory {
    id?: number;
    taskId: string;
    action: 'created' | 'started' | 'completed' | 'skipped' | 'rescheduled';
    timestamp: Date;
    duration?: number;
    energyLevel?: 'low' | 'medium' | 'high';
    notes?: string;
}

export interface DBUserPattern {
    id: string;
    userId: string;
    patternType: string;
    data: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}

export interface DBOverride {
    id?: number;
    timestamp: number;
    originalDecision: string;
    userDecision: string;
    reason?: string;
}

export interface DBSleepData {
    id?: number;
    date: Date;
    hours: number;
    quality?: 'poor' | 'fair' | 'good' | 'excellent';
    createdAt: Date;
}

export interface DBBrainDecision {
    id: string;
    timestamp: number;
    brainVersion: string;
    input: unknown;
    output: unknown;
    trace?: unknown;
}

export interface DBDecisionExplanation {
    id: string;
    decisionId: string;
    timestamp: number;
    explanation: unknown;
}

export interface DBAdaptationSignal {
    id?: number;
    timestamp: number;
    type: string;
    payload: unknown;
}

export interface DBAdaptationHistory {
    id?: number;
    timestamp: number;
    change: unknown;
    reverted?: boolean;
}

export interface DBSnapshot {
    id?: number;
    name?: string;
    timestamp: number;
    snapshot: unknown;
}

// ============================================
// Classe de base de données
// ============================================

class KairuFlowDatabase extends Dexie {
    tasks!: Table<DBTask, string>;
    sessions!: Table<DBSession, string>;
    taskHistory!: Table<DBTaskHistory, number>;
    userPatterns!: Table<DBUserPattern, string>;
    overrides!: Table<DBOverride, number>;
    sleepData!: Table<DBSleepData, number>;

    brainDecisions!: Table<DBBrainDecision, string>;
    decisionExplanations!: Table<DBDecisionExplanation, string>;
    adaptationSignals!: Table<DBAdaptationSignal, number>;
    adaptationHistory!: Table<DBAdaptationHistory, number>;
    snapshots!: Table<DBSnapshot, number>;

    constructor() {
        super('KairuFlowDB');

        // Version 1: Schéma initial
        this.version(1).stores({
            tasks: 'id, status, urgency, deadline, category, createdAt, updatedAt',
            sessions: 'id, timestamp, state, createdAt',
            taskHistory: '++id, taskId, action, timestamp',
            userPatterns: 'id, userId, patternType, updatedAt',
            overrides: '++id, timestamp',
            sleepData: '++id, date, createdAt',
        });

        // Version 2: Tables manquantes pour snapshots / replays / adaptation
        this.version(2).stores({
            tasks: 'id, status, urgency, deadline, category, createdAt, updatedAt',
            sessions: 'id, timestamp, state, createdAt',
            taskHistory: '++id, taskId, action, timestamp',
            userPatterns: 'id, userId, patternType, updatedAt',
            overrides: '++id, timestamp',
            sleepData: '++id, date, createdAt',

            brainDecisions: 'id, timestamp, brainVersion',
            decisionExplanations: 'id, decisionId, timestamp',
            adaptationSignals: '++id, timestamp, type',
            adaptationHistory: '++id, timestamp',
            snapshots: '++id, timestamp, name',
        });

        logger.info('Database initialized');
    }
}

// Instance singleton
export const db = new KairuFlowDatabase();

// ============================================
// Fonctions utilitaires pour les tâches
// ============================================

/**
 * Récupère toutes les tâches avec un statut spécifique
 */
export async function getTasksByStatus(status: DBTask['status']): Promise<DBTask[]> {
    try {
        return await db.tasks.where('status').equals(status).toArray();
    } catch (error) {
        logger.error('Failed to get tasks by status', error as Error, { status });
        return [];
    }
}

/**
 * Récupère les tâches todo (non complétées)
 */
export async function getTodoTasks(): Promise<DBTask[]> {
    try {
        return await db.tasks
            .where('status')
            .anyOf(['todo', 'active'])
            .toArray();
    } catch (error) {
        logger.error('Failed to get todo tasks', error as Error);
        return [];
    }
}

/**
 * Récupère les tâches urgentes
 */
export async function getUrgentTasks(): Promise<DBTask[]> {
    try {
        return await db.tasks
            .where('urgency')
            .equals('urgent')
            .and((task: DBTask) => task.status !== 'done' && task.status !== 'cancelled')
            .toArray();
    } catch (error) {
        logger.error('Failed to get urgent tasks', error as Error);
        return [];
    }
}

/**
 * Récupère les tâches avec deadline aujourd'hui
 */
export async function getTodayTasks(): Promise<DBTask[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    try {
        return await db.tasks
            .where('deadline')
            .between(today, tomorrow, true, false)
            .and((task: DBTask) => task.status !== 'done' && task.status !== 'cancelled')
            .toArray();
    } catch (error) {
        logger.error('Failed to get today tasks', error as Error);
        return [];
    }
}

/**
 * Crée une nouvelle tâche
 */
export async function createTask(task: Omit<DBTask, 'createdAt' | 'updatedAt' | 'activationCount'>): Promise<DBTask> {
    const now = new Date();
    const newTask: DBTask = {
        ...task,
        activationCount: 0,
        createdAt: now,
        updatedAt: now,
    };

    try {
        await db.tasks.add(newTask);
        logger.info('Task created', { taskId: task.id, title: task.title });

        // Ajouter à l'historique
        await addTaskHistory(task.id, 'created');

        return newTask;
    } catch (error) {
        logger.error('Failed to create task', error as Error, { taskId: task.id });
        throw error;
    }
}

/**
 * Met à jour une tâche
 */
export async function updateTask(taskId: string, updates: Partial<DBTask>): Promise<void> {
    try {
        await db.tasks.update(taskId, {
            ...updates,
            updatedAt: new Date(),
        });
        logger.debug('Task updated', { taskId, updates: Object.keys(updates) });
    } catch (error) {
        logger.error('Failed to update task', error as Error, { taskId });
        throw error;
    }
}

/**
 * Marque une tâche comme complétée
 */
export async function completeTask(taskId: string): Promise<void> {
    const now = new Date();
    try {
        await db.tasks.update(taskId, {
            status: 'done',
            completedAt: now,
            updatedAt: now,
        });

        await addTaskHistory(taskId, 'completed');
        logger.info('Task completed', { taskId });
    } catch (error) {
        logger.error('Failed to complete task', error as Error, { taskId });
        throw error;
    }
}

/**
 * Supprime une tâche
 */
export async function deleteTask(taskId: string): Promise<void> {
    try {
        await db.tasks.delete(taskId);
        logger.info('Task deleted', { taskId });
    } catch (error) {
        logger.error('Failed to delete task', error as Error, { taskId });
        throw error;
    }
}

// ============================================
// Fonctions utilitaires pour les sessions
// ============================================

/**
 * Crée une nouvelle session
 */
export async function createSession(session: Omit<DBSession, 'createdAt'>): Promise<DBSession> {
    const newSession: DBSession = {
        ...session,
        createdAt: new Date(),
    };

    try {
        await db.sessions.add(newSession);
        logger.info('Session created', { sessionId: session.id });
        return newSession;
    } catch (error) {
        logger.error('Failed to create session', error as Error, { sessionId: session.id });
        throw error;
    }
}

/**
 * Récupère les sessions d'un jour spécifique
 */
export async function getSessionsByDate(date: Date): Promise<DBSession[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    try {
        return await db.sessions
            .where('timestamp')
            .between(startOfDay.getTime(), endOfDay.getTime(), true, false)
            .toArray();
    } catch (error) {
        logger.error('Failed to get sessions by date', error as Error);
        return [];
    }
}

/**
 * Met à jour une session
 */
export async function updateSession(sessionId: string, updates: Partial<DBSession>): Promise<void> {
    try {
        await db.sessions.update(sessionId, updates);
        logger.debug('Session updated', { sessionId });
    } catch (error) {
        logger.error('Failed to update session', error as Error, { sessionId });
        throw error;
    }
}

// ============================================
// Fonctions pour l'historique
// ============================================

/**
 * Ajoute une entrée dans l'historique des tâches
 */
export async function addTaskHistory(
    taskId: string,
    action: DBTaskHistory['action'],
    data?: Partial<DBTaskHistory>
): Promise<void> {
    try {
        await db.taskHistory.add({
            taskId,
            action,
            timestamp: new Date(),
            ...data,
        });
    } catch (error) {
        logger.error('Failed to add task history', error as Error, { taskId, action });
    }
}

/**
 * Récupère l'historique d'une tâche
 */
export async function getTaskHistory(taskId: string): Promise<DBTaskHistory[]> {
    try {
        return await db.taskHistory
            .where('taskId')
            .equals(taskId)
            .reverse()
            .sortBy('timestamp');
    } catch (error) {
        logger.error('Failed to get task history', error as Error, { taskId });
        return [];
    }
}

/**
 * Récupère l'historique global sur une période
 */
export async function getHistoryByPeriod(startDate: Date, endDate: Date): Promise<DBTaskHistory[]> {
    try {
        return await db.taskHistory
            .where('timestamp')
            .between(startDate, endDate)
            .toArray();
    } catch (error) {
        logger.error('Failed to get history by period', error as Error);
        return [];
    }
}

// ============================================
// Fonctions pour les patterns utilisateur
// ============================================

/**
 * Sauvegarde un pattern utilisateur
 */
export async function saveUserPattern(pattern: DBUserPattern): Promise<void> {
    try {
        await db.userPatterns.put(pattern);
        logger.debug('User pattern saved', { patternType: pattern.patternType });
    } catch (error) {
        logger.error('Failed to save user pattern', error as Error);
        throw error;
    }
}

/**
 * Récupère les patterns d'un utilisateur
 */
export async function getUserPatterns(userId: string): Promise<DBUserPattern[]> {
    try {
        return await db.userPatterns
            .where('userId')
            .equals(userId)
            .toArray();
    } catch (error) {
        logger.error('Failed to get user patterns', error as Error, { userId });
        return [];
    }
}

// ============================================
// Fonctions pour la détection de burnout
// ============================================

/**
 * Enregistre un override de décision
 */
export async function recordOverride(override: Omit<DBOverride, 'id'>): Promise<void> {
    try {
        await db.overrides.add(override);
        logger.debug('Override recorded');
    } catch (error) {
        logger.error('Failed to record override', error as Error);
    }
}

/**
 * Récupère les overrides sur une période
 */
export async function getOverridesByPeriod(startTimestamp: number): Promise<DBOverride[]> {
    try {
        return await db.overrides
            .where('timestamp')
            .above(startTimestamp)
            .toArray();
    } catch (error) {
        logger.error('Failed to get overrides', error as Error);
        return [];
    }
}

/**
 * Enregistre des données de sommeil
 */
export async function recordSleepData(data: Omit<DBSleepData, 'id' | 'createdAt'>): Promise<void> {
    try {
        await db.sleepData.add({
            ...data,
            createdAt: new Date(),
        });
        logger.debug('Sleep data recorded');
    } catch (error) {
        logger.error('Failed to record sleep data', error as Error);
    }
}

/**
 * Récupère les données de sommeil sur une période
 */
export async function getSleepDataByPeriod(startDate: Date, endDate: Date): Promise<DBSleepData[]> {
    try {
        return await db.sleepData
            .where('date')
            .between(startDate, endDate)
            .toArray();
    } catch (error) {
        logger.error('Failed to get sleep data', error as Error);
        return [];
    }
}

// ============================================
// Fonctions de maintenance
// ============================================

/**
 * Nettoie les anciennes données
 */
export async function cleanupOldData(daysToKeep: number = 90): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    try {
        // Nettoyer l'historique
        await db.taskHistory
            .where('timestamp')
            .below(cutoffDate)
            .delete();

        // Nettoyer les anciennes sessions
        await db.sessions
            .where('timestamp')
            .below(cutoffDate.getTime())
            .delete();

        logger.info('Old data cleaned up', { daysToKeep });
    } catch (error) {
        logger.error('Failed to cleanup old data', error as Error);
    }
}

/**
 * Exporte toutes les données (pour backup)
 */
export async function exportAllData(): Promise<{
    tasks: DBTask[];
    sessions: DBSession[];
    taskHistory: DBTaskHistory[];
    userPatterns: DBUserPattern[];
}> {
    try {
        const [tasks, sessions, taskHistory, userPatterns] = await Promise.all([
            db.tasks.toArray(),
            db.sessions.toArray(),
            db.taskHistory.toArray(),
            db.userPatterns.toArray(),
        ]);

        return { tasks, sessions, taskHistory, userPatterns };
    } catch (error) {
        logger.error('Failed to export data', error as Error);
        throw error;
    }
}

/**
 * Importe des données (pour restore)
 */
export async function importData(data: {
    tasks?: DBTask[];
    sessions?: DBSession[];
    taskHistory?: DBTaskHistory[];
    userPatterns?: DBUserPattern[];
}): Promise<void> {
    try {
        if (data.tasks) await db.tasks.bulkPut(data.tasks);
        if (data.sessions) await db.sessions.bulkPut(data.sessions);
        if (data.taskHistory) await db.taskHistory.bulkPut(data.taskHistory);
        if (data.userPatterns) await db.userPatterns.bulkPut(data.userPatterns);

        logger.info('Data imported successfully');
    } catch (error) {
        logger.error('Failed to import data', error as Error);
        throw error;
    }
}
