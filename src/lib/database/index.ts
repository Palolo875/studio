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

type LegacyTask = {
    id: string;
    name: string;
    completed: boolean;
    subtasks: unknown[];
    lastAccessed: string;
    completionRate: number;
    description?: string;
    priority?: 'low' | 'medium' | 'high';
    energyRequired?: 'low' | 'medium' | 'high';
    estimatedDuration?: number;
    tags?: string[];
    completedAt?: string;
};

type LegacyUserPatterns = Record<string, unknown>;

const logger = createLogger('Database');

// ============================================
// Types pour la base de données
// ============================================

export interface DBTask {
    id: string;
    title: string;
    description?: string;
    nlpHints?: {
        detectedLang: string;
        energySuggestion?: string;
        effortSuggestion?: string;
        confidence: number;
        isUncertain: boolean;
        rawText: string;
    };
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
    if (!tasks.length) return;
    try {
        const ids = tasks.map(t => t.id);
        const existing = await db.tasks.bulkGet(ids);
        const existingById = new Map<string, DBTask>();
        for (const item of existing) {
            if (item) existingById.set(item.id, item);
        }

        const merged = tasks.map((t) => {
            const prev = existingById.get(t.id);
            if (!prev) {
                return {
                    ...t,
                    status: t.status || 'todo',
                    activationCount: t.activationCount || 0,
                    createdAt: t.createdAt || new Date(),
                    updatedAt: new Date()
                };
            }

            return {
                ...prev,
                ...t,
                id: prev.id, // Garder l'ID original
                createdAt: prev.createdAt,
                activationCount: prev.activationCount,
                nlpHints: t.nlpHints ?? prev.nlpHints,
                tags: t.tags ?? prev.tags,
                updatedAt: new Date()
            };
        });

        await db.tasks.bulkPut(merged);
        logger.debug('Tasks upserted', { count: merged.length });
    } catch (error) {
        logger.error('Failed to upsert tasks', error as Error);
        throw error;
    }
}

export async function recordTaskSkips(taskIds: string[], sessionId?: string): Promise<void> {
    const uniqueIds = Array.from(new Set(taskIds)).filter(Boolean);
    if (uniqueIds.length === 0) return;

    const now = new Date();
    try {
        await db.taskHistory.bulkAdd(
            uniqueIds.map((taskId) => ({
                taskId,
                action: 'skipped' as const,
                timestamp: now,
                sessionId,
            }))
        );
    } catch (error) {
        logger.error('Failed to record task skips', error as Error, { count: uniqueIds.length, sessionId });
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

 /**
  * Récupère une tâche par son ID
  */
 export async function getTaskById(taskId: string): Promise<DBTask | undefined> {
     try {
         return await db.tasks.get(taskId);
     } catch (error) {
         logger.error('Failed to get task by id', error as Error, { taskId });
         return undefined;
     }
 }

// ============================================
// Fonctions Settings (remplace localStorage)
// ============================================

export async function getSetting<T>(key: string): Promise<T | undefined> {
    try {
        const row = await db.settings.get(key);
        return row?.value as T | undefined;
    } catch (error) {
        logger.error('Failed to get setting', error as Error);
        return undefined;
    }
}

export async function setSetting(key: string, value: unknown): Promise<void> {
    try {
        const now = new Date();
        const existing = await db.settings.get(key);

        const payload: DBSetting = {
            key,
            value,
            createdAt: existing?.createdAt ?? now,
            updatedAt: now,
        };

        await db.settings.put(payload);
    } catch (error) {
        logger.error('Failed to set setting', error as Error);
        throw error;
    }
}

export async function deleteSetting(key: string): Promise<void> {
    try {
        await db.settings.delete(key);
    } catch (error) {
        logger.error('Failed to delete setting', error as Error);
        throw error;
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
    action: 'created' | 'started' | 'note_saved' | 'proposed' | 'completed' | 'skipped' | 'rescheduled';
    timestamp: Date;
    duration?: number;
    energyLevel?: 'low' | 'medium' | 'high';
    notes?: string;
    sessionId?: string;
}

export interface DBUserPattern {
    id: string;
    userId: string;
    patternType: string;
    data: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}

function toLegacyTask(task: DBTask): LegacyTask {
    return {
        id: task.id,
        name: task.title,
        completed: task.status === 'done',
        subtasks: [],
        lastAccessed: (task.updatedAt || task.createdAt).toISOString(),
        completionRate: task.status === 'done' ? 100 : 0,
        description: task.description,
        priority: task.urgency === 'urgent' ? 'high' : (task.urgency as any),
        energyRequired: task.effort as any,
        estimatedDuration: task.duration,
        tags: task.tags,
        completedAt: task.completedAt ? task.completedAt.toISOString() : undefined,
    };
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

export interface DBUserChallenge {
    id: string;
    decisionId: string;
    reason: string;
    userAction: 'OVERRIDE' | 'IGNORE' | 'ASK_REVIEW';
    acknowledgedRisks: boolean;
    timestamp: number;
}

export interface DBBrainVersion {
    id: string;
    algorithmVersion: string;
    rulesHash: string;
    modelId: string;
    releasedAt: Date;
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

export interface DBModeTransition {
    id?: number;
    timestamp: number;
    userId: string;
    fromMode: string;
    toMode: string;
    triggeredBy: 'SYSTEM' | 'USER';
    userConfirmed: boolean;
    source?: 'adaptation_signal';
}

export interface DBSnapshot {
    id?: number;
    name?: string;
    timestamp: number;
    snapshot: unknown;
}

export async function saveSnapshot(snapshot: Omit<DBSnapshot, 'id'>): Promise<number | undefined> {
    try {
        const id = await db.snapshots.add(snapshot);
        logger.info('Snapshot saved', { id, name: snapshot.name });
        return id;
    } catch (error) {
        logger.error('Failed to save snapshot', error as Error);
        return undefined;
    }
}

export interface DBEveningEntry {
    id: string;
    timestamp: number;
    brainDump: string;
    actionsDetected: number;
    transformedToTasks: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface DBSetting {
    key: string;
    value: unknown;
    createdAt: Date;
    updatedAt: Date;
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
    brainVersions!: Table<DBBrainVersion, string>;
    decisionExplanations!: Table<DBDecisionExplanation, string>;
    userChallenges!: Table<DBUserChallenge, string>;
    adaptationSignals!: Table<DBAdaptationSignal, number>;
    adaptationHistory!: Table<DBAdaptationHistory, number>;
    modeTransitions!: Table<DBModeTransition, number>;
    snapshots!: Table<DBSnapshot, number>;
    eveningEntries!: Table<DBEveningEntry, string>;
    settings!: Table<DBSetting, string>;

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

        // Version 3: table dedicated to brain versions
        this.version(3).stores({
            tasks: 'id, status, urgency, deadline, category, createdAt, updatedAt',
            sessions: 'id, timestamp, state, createdAt',
            taskHistory: '++id, taskId, action, timestamp',
            userPatterns: 'id, userId, patternType, updatedAt',
            overrides: '++id, timestamp',
            sleepData: '++id, date, createdAt',

            brainDecisions: 'id, timestamp, brainVersion',
            brainVersions: 'id, releasedAt',
            decisionExplanations: 'id, decisionId, timestamp',
            adaptationSignals: '++id, timestamp, type',
            adaptationHistory: '++id, timestamp',
            snapshots: '++id, timestamp, name',
        });

        // Version 4: rituel du soir
        this.version(4).stores({
            tasks: 'id, status, urgency, deadline, category, createdAt, updatedAt',
            sessions: 'id, timestamp, state, createdAt',
            taskHistory: '++id, taskId, action, timestamp',
            userPatterns: 'id, userId, patternType, updatedAt',
            overrides: '++id, timestamp',
            sleepData: '++id, date, createdAt',

            brainDecisions: 'id, timestamp, brainVersion',
            brainVersions: 'id, releasedAt',
            decisionExplanations: 'id, decisionId, timestamp',
            adaptationSignals: '++id, timestamp, type',
            adaptationHistory: '++id, timestamp',
            snapshots: '++id, timestamp, name',

            eveningEntries: 'id, timestamp, updatedAt',
        });

        // Version 5: settings (remplace localStorage)
        this.version(5).stores({
            tasks: 'id, status, urgency, deadline, category, createdAt, updatedAt',
            sessions: 'id, timestamp, state, createdAt',
            taskHistory: '++id, taskId, action, timestamp',
            userPatterns: 'id, userId, patternType, updatedAt',
            overrides: '++id, timestamp',
            sleepData: '++id, date, createdAt',

            brainDecisions: 'id, timestamp, brainVersion',
            brainVersions: 'id, releasedAt',
            decisionExplanations: 'id, decisionId, timestamp',
            adaptationSignals: '++id, timestamp, type',
            adaptationHistory: '++id, timestamp',
            snapshots: '++id, timestamp, name',

            eveningEntries: 'id, timestamp, updatedAt',
            settings: 'key, updatedAt',
        });

        // Version 6: metadata migrations + snapshot pre-upgrade
        this.version(6)
            .stores({
                tasks: 'id, status, urgency, deadline, category, createdAt, updatedAt',
                sessions: 'id, timestamp, state, createdAt',
                taskHistory: '++id, taskId, action, timestamp',
                userPatterns: 'id, userId, patternType, updatedAt',
                overrides: '++id, timestamp',
                sleepData: '++id, date, createdAt',

                brainDecisions: 'id, timestamp, brainVersion',
                brainVersions: 'id, releasedAt',
                decisionExplanations: 'id, decisionId, timestamp',
                adaptationSignals: '++id, timestamp, type',
                adaptationHistory: '++id, timestamp',
                snapshots: '++id, timestamp, name',

                eveningEntries: 'id, timestamp, updatedAt',
                settings: 'key, updatedAt',
            })
            .upgrade(async (trans: any) => {
                const nowMs = Date.now();
                const now = new Date(nowMs);
                const snapshotName = `pre_upgrade_to_v6_${nowMs}`;

                const tableNames = [
                    'tasks',
                    'sessions',
                    'taskHistory',
                    'userPatterns',
                    'overrides',
                    'sleepData',
                    'brainDecisions',
                    'brainVersions',
                    'decisionExplanations',
                    'adaptationSignals',
                    'adaptationHistory',
                    'eveningEntries',
                    'settings',
                ];

                const dumpEntries = await Promise.all(
                    tableNames.map(async (name) => {
                        try {
                            const rows = await trans.table(name).toArray();
                            return [name, rows] as const;
                        } catch {
                            return [name, []] as const;
                        }
                    })
                );

                const snapshot: Record<string, unknown> = Object.fromEntries(dumpEntries);
                const snapshotEnvelope = {
                    meta: {
                        createdAt: now,
                        name: snapshotName,
                        reason: 'pre-upgrade',
                        toVersion: 6,
                    },
                    data: snapshot,
                };

                try {
                    await trans.table('snapshots').add({
                        timestamp: nowMs,
                        name: snapshotName,
                        snapshot: snapshotEnvelope,
                    });
                } catch (error) {
                    logger.error('Failed to create pre-upgrade snapshot (v6)', error as Error);
                }

                try {
                    const settingsTable = trans.table('settings');
                    const existing = await settingsTable.get('migration_meta');
                    const existingValue = existing?.value;
                    const baseMeta =
                        existingValue && typeof existingValue === 'object' && !Array.isArray(existingValue)
                            ? (existingValue as Record<string, unknown>)
                            : {};

                    const existingHistory = Array.isArray((baseMeta as any).history) ? ((baseMeta as any).history as unknown[]) : [];
                    const nextHistory = [
                        ...existingHistory,
                        {
                            toVersion: 6,
                            appliedAt: nowMs,
                            snapshotName,
                        },
                    ];

                    const payload: DBSetting = {
                        key: 'migration_meta',
                        value: {
                            ...baseMeta,
                            lastAppliedVersion: 6,
                            lastAppliedAt: nowMs,
                            history: nextHistory,
                        },
                        createdAt: existing?.createdAt ?? now,
                        updatedAt: now,
                    };

                    await settingsTable.put(payload);
                } catch (error) {
                    logger.error('Failed to persist migration metadata (v6)', error as Error);
                }
            });

        // Version 7: Phase 2 reversible NLP hints on tasks
        this.version(7).stores({
            tasks: 'id, status, urgency, deadline, category, createdAt, updatedAt',
            sessions: 'id, timestamp, state, createdAt',
            taskHistory: '++id, taskId, action, timestamp',
            userPatterns: 'id, userId, patternType, updatedAt',
            overrides: '++id, timestamp',
            sleepData: '++id, date, createdAt',

            brainDecisions: 'id, timestamp, brainVersion',
            brainVersions: 'id, releasedAt',
            decisionExplanations: 'id, decisionId, timestamp',
            adaptationSignals: '++id, timestamp, type',
            adaptationHistory: '++id, timestamp',
            snapshots: '++id, timestamp, name',

            eveningEntries: 'id, timestamp, updatedAt',
            settings: 'key, updatedAt',
        });

        // Version 8: persisted mode transitions
        this.version(8).stores({
            tasks: 'id, status, urgency, deadline, category, createdAt, updatedAt',
            sessions: 'id, timestamp, state, createdAt',
            taskHistory: '++id, taskId, action, timestamp',
            userPatterns: 'id, userId, patternType, updatedAt',
            overrides: '++id, timestamp',
            sleepData: '++id, date, createdAt',

            brainDecisions: 'id, timestamp, brainVersion',
            brainVersions: 'id, releasedAt',
            decisionExplanations: 'id, decisionId, timestamp',
            adaptationSignals: '++id, timestamp, type',
            adaptationHistory: '++id, timestamp',
            modeTransitions: '++id, timestamp, userId, triggeredBy, fromMode, toMode',
            snapshots: '++id, timestamp, name',

            eveningEntries: 'id, timestamp, updatedAt',
            settings: 'key, updatedAt',
        });

        // Version 9: persisted user challenges (Phase 3.4)
        this.version(9).stores({
            tasks: 'id, status, urgency, deadline, category, createdAt, updatedAt',
            sessions: 'id, timestamp, state, createdAt',
            taskHistory: '++id, taskId, action, timestamp',
            userPatterns: 'id, userId, patternType, updatedAt',
            overrides: '++id, timestamp',
            sleepData: '++id, date, createdAt',

            brainDecisions: 'id, timestamp, brainVersion',
            brainVersions: 'id, releasedAt',
            decisionExplanations: 'id, decisionId, timestamp',
            userChallenges: 'id, decisionId, timestamp, userAction',
            adaptationSignals: '++id, timestamp, type',
            adaptationHistory: '++id, timestamp',
            modeTransitions: '++id, timestamp, userId, triggeredBy, fromMode, toMode',
            snapshots: '++id, timestamp, name',

            eveningEntries: 'id, timestamp, updatedAt',
            settings: 'key, updatedAt',
        });

        logger.info('Database initialized');

    }

    /**
     * Nettoie les données anciennes pour libérer de l'espace
     * @param days Nombre de jours à conserver
     * @returns Nombre d'entrées supprimées
     */
    async pruneData(days: number): Promise<number> {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        const cutoffTs = cutoffDate.getTime();
        const deletedHistory = await this.taskHistory.where('timestamp').below(cutoffDate).delete();
        const deletedSessions = await this.sessions.where('timestamp').below(cutoffTs).delete();
        const deletedBrainDecisions = await this.brainDecisions.where('timestamp').below(cutoffTs).delete();
        const deletedDecisionExplanations = await this.decisionExplanations.where('timestamp').below(cutoffTs).delete();

        const removedCount =
            deletedHistory + deletedSessions + deletedBrainDecisions + deletedDecisionExplanations;

        logger.info('Database prune completed', {
            days,
            removedCount,
            deletedHistory,
            deletedSessions,
            deletedBrainDecisions,
            deletedDecisionExplanations,
        });
        return removedCount;
    }

}

// Instance singleton
export const db = new KairuFlowDatabase();

// ============================================
// Fonctions Evening (journal du soir)
// ============================================

export async function upsertEveningEntry(entry: {
    id: string;
    timestamp: number;
    brainDump: string;
    actionsDetected: number;
    transformedToTasks: boolean;
}): Promise<void> {
    const now = new Date();
    const existing = await db.eveningEntries.get(entry.id);
    const payload: DBEveningEntry = {
        ...entry,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
    };
    await db.eveningEntries.put(payload);
}

export async function getLatestEveningEntry(): Promise<DBEveningEntry | undefined> {
    return await db.eveningEntries.orderBy('timestamp').reverse().first();
}

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
 * Compat legacy: utilisé par l'ancien playlistGenerator (src/lib/playlistGenerator.ts)
 */
export async function getTodoTasksBulk(): Promise<LegacyTask[]> {
    const tasks = await getTodoTasks();
    return tasks.map(toLegacyTask);
}

/**
 * Compat legacy: renvoie un historique approximé basé sur les tâches complétées.
 */
export async function getTaskHistoryBulk(): Promise<LegacyTask[]> {
    try {
        const doneTasks = await db.tasks.where('status').equals('done').toArray();
        return doneTasks.map(toLegacyTask);
    } catch (error) {
        logger.error('Failed to get task history bulk', error as Error);
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
        const safeUpdates: Partial<DBTask> = { ...updates };
        if ('nlpHints' in safeUpdates && safeUpdates.nlpHints === undefined) {
            delete (safeUpdates as Partial<DBTask>).nlpHints;
        }
        if ('tags' in safeUpdates && safeUpdates.tags === undefined) {
            delete (safeUpdates as Partial<DBTask>).tags;
        }

        await db.tasks.update(taskId, {
            ...safeUpdates,
            updatedAt: new Date(),
        });
        logger.debug('Task updated', { taskId, updates: Object.keys(safeUpdates) });
    } catch (error) {
        logger.error('Failed to update task', error as Error, { taskId });
        throw error;
    }
}

/**
 * Marque une tâche comme complétée
 */
export async function completeTask(
    taskId: string,
    data?: Pick<DBTaskHistory, 'duration' | 'energyLevel' | 'sessionId'>
): Promise<void> {
    const now = new Date();
    try {
        await db.tasks.update(taskId, {
            status: 'done',
            completedAt: now,
            updatedAt: now,
        });

        await addTaskHistory(taskId, 'completed', data);
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

export async function getSessionsByPeriod(startTimestamp: number, endTimestamp: number): Promise<DBSession[]> {
    try {
        return await db.sessions
            .where('timestamp')
            .between(startTimestamp, endTimestamp)
            .toArray();
    } catch (error) {
        logger.error('Failed to get sessions by period', error as Error);
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

export async function recordTaskProposals(taskIds: string[], sessionId?: string): Promise<void> {
    const uniqueIds = Array.from(new Set(taskIds)).filter(Boolean);
    if (uniqueIds.length === 0) return;

    const now = new Date();
    try {
        await db.taskHistory.bulkAdd(
            uniqueIds.map((taskId) => ({
                taskId,
                action: 'proposed' as const,
                timestamp: now,
                sessionId,
            }))
        );
    } catch (error) {
        logger.error('Failed to record task proposals', error as Error, { count: uniqueIds.length, sessionId });
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

export async function getTaskHistoryForTaskIds(taskIds: string[]): Promise<Map<string, DBTaskHistory[]>> {
    const uniqueIds = Array.from(new Set(taskIds)).filter(Boolean);
    if (uniqueIds.length === 0) return new Map();

    try {
        const records = await db.taskHistory.where('taskId').anyOf(uniqueIds).toArray();
        const byTaskId = new Map<string, DBTaskHistory[]>();
        for (const record of records) {
            const bucket = byTaskId.get(record.taskId);
            if (bucket) bucket.push(record);
            else byTaskId.set(record.taskId, [record]);
        }
        for (const [taskId, bucket] of byTaskId) {
            bucket.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
            byTaskId.set(taskId, bucket);
        }
        return byTaskId;
    } catch (error) {
        logger.error('Failed to get task history for task ids', error as Error, { count: uniqueIds.length });
        return new Map();
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

export async function addAdaptationSignal(signal: Omit<DBAdaptationSignal, 'id'>): Promise<number | undefined> {
    try {
        const id = await db.adaptationSignals.add(signal);
        logger.debug('Adaptation signal recorded', { id, type: signal.type });

        if (signal.type === 'MODE_OVERRIDE') {
            const payload = signal.payload;
            if (payload && typeof payload === 'object') {
                const v = payload as Record<string, unknown>;
                const userId = typeof v.userId === 'string' ? v.userId : undefined;
                const ts = typeof v.timestamp === 'number' ? v.timestamp : signal.timestamp;
                const ctx = v.context;
                if (userId && ctx && typeof ctx === 'object') {
                    const c = ctx as Record<string, unknown>;
                    const toMode = typeof c.mode === 'string' ? c.mode : undefined;
                    const fromMode = typeof c.fromMode === 'string' ? c.fromMode : 'CURRENT';
                    if (toMode) {
                        void recordModeTransition({
                            timestamp: ts,
                            userId,
                            fromMode,
                            toMode,
                            triggeredBy: 'USER',
                            userConfirmed: true,
                            source: 'adaptation_signal',
                        });
                    }
                }
            }
        }

        return id;
    } catch (error) {
        logger.error('Failed to record adaptation signal', error as Error);
        return undefined;
    }
}

export async function recordModeTransition(entry: Omit<DBModeTransition, 'id'>): Promise<number | undefined> {
    try {
        const id = await db.modeTransitions.add(entry);
        logger.debug('Mode transition recorded', { id, fromMode: entry.fromMode, toMode: entry.toMode });
        return id;
    } catch (error) {
        logger.error('Failed to record mode transition', error as Error);
        return undefined;
    }
}

export async function getModeTransitionsByPeriod(startTimestamp: number, endTimestamp: number): Promise<DBModeTransition[]> {
    try {
        return await db.modeTransitions
            .where('timestamp')
            .between(startTimestamp, endTimestamp)
            .toArray();
    } catch (error) {
        logger.error('Failed to get mode transitions by period', error as Error);
        return [];
    }
}

export async function recordUserChallenge(entry: DBUserChallenge): Promise<void> {
    try {
        await db.userChallenges.put(entry);
    } catch (error) {
        logger.error('Failed to record user challenge', error as Error);
    }
}

export async function getUserChallengesByDecisionId(decisionId: string): Promise<DBUserChallenge[]> {
    try {
        return await db.userChallenges.where('decisionId').equals(decisionId).toArray();
    } catch (error) {
        logger.error('Failed to get user challenges for decision', error as Error);
        return [];
    }
}

export async function getAdaptationSignalsByPeriod(startTimestamp: number, endTimestamp: number): Promise<DBAdaptationSignal[]> {
    try {
        return await db.adaptationSignals
            .where('timestamp')
            .between(startTimestamp, endTimestamp)
            .toArray();
    } catch (error) {
        logger.error('Failed to get adaptation signals by period', error as Error);
        return [];
    }
}

export async function pruneAdaptationSignals(maxAgeMs: number, maxSize: number): Promise<number> {
    const now = Date.now();
    const cutoffTs = now - maxAgeMs;
    try {
        const deletedByAge = await db.adaptationSignals.where('timestamp').below(cutoffTs).delete();

        const remainingCount = await db.adaptationSignals.count();
        if (remainingCount <= maxSize) return deletedByAge;

        const toDelete = remainingCount - maxSize;
        const oldest: DBAdaptationSignal[] = await db.adaptationSignals.orderBy('timestamp').limit(toDelete).toArray();
        const ids = oldest
            .map((s: DBAdaptationSignal) => s.id)
            .filter((id: number | undefined): id is number => typeof id === 'number');
        if (ids.length === 0) return deletedByAge;
        const deletedBySize = await db.adaptationSignals.where('id').anyOf(ids).delete();
        return deletedByAge + deletedBySize;
    } catch (error) {
        logger.error('Failed to prune adaptation signals', error as Error);
        return 0;
    }
}

export async function recordAdaptationHistory(entry: Omit<DBAdaptationHistory, 'id'>): Promise<number | undefined> {
    try {
        const id = await db.adaptationHistory.add(entry);
        logger.info('Adaptation history recorded', { id });
        return id;
    } catch (error) {
        logger.error('Failed to record adaptation history', error as Error);
        return undefined;
    }
}

export async function getRecentAdaptationHistory(limit: number = 20): Promise<DBAdaptationHistory[]> {
    try {
        return await db.adaptationHistory.orderBy('timestamp').reverse().limit(limit).toArray();
    } catch (error) {
        logger.error('Failed to get recent adaptation history', error as Error);
        return [];
    }
}

export async function getLatestAdaptationHistory(): Promise<DBAdaptationHistory | undefined> {
    try {
        return await db.adaptationHistory.orderBy('timestamp').reverse().first();
    } catch (error) {
        logger.error('Failed to get latest adaptation history', error as Error);
        return undefined;
    }
}

export async function markAdaptationHistoryReverted(id: number): Promise<void> {
    try {
        await db.adaptationHistory.update(id, { reverted: true });
    } catch (error) {
        logger.error('Failed to mark adaptation reverted', error as Error, { id });
    }
}

export async function getSnapshotsByNamePrefix(prefix: string, limit: number = 20): Promise<DBSnapshot[]> {
    try {
        const all = await db.snapshots.orderBy('timestamp').reverse().limit(limit * 5).toArray();
        return all.filter((s: DBSnapshot) => typeof s.name === 'string' && s.name.startsWith(prefix)).slice(0, limit);
    } catch (error) {
        logger.error('Failed to get snapshots by prefix', error as Error);
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
 * Compat legacy: ancien API playlistGenerator.
 */
export async function updateUserPatternsInDB(patterns: LegacyUserPatterns): Promise<void> {
    const now = new Date();
    await saveUserPattern({
        id: 'local_playlist',
        userId: 'local',
        patternType: 'playlist',
        data: patterns as unknown as Record<string, unknown>,
        createdAt: now,
        updatedAt: now,
    });
}

/**
 * Compat legacy: ancien API playlistGenerator.
 */
export async function getUserPatternsFromDB(): Promise<LegacyUserPatterns | null> {
    try {
        const row = await db.userPatterns.get('local_playlist');
        if (!row) return null;
        return row.data as unknown as LegacyUserPatterns;
    } catch (error) {
        logger.error('Failed to get user patterns (legacy)', error as Error);
        return null;
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
