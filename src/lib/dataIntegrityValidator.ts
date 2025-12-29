/**
 * Validateur d'intégrité des données - Phase 5
 * Implémente les vérifications de cohérence des données pour détecter les corruptions logiques
 */

import { createLogger } from '@/lib/logger';

const logger = createLogger('DataIntegrity');

// Types pour les erreurs d'intégrité
export interface IntegrityError {
  type:
    | 'INVALID_TASK'
    | 'INVALID_SESSION'
    | 'INVALID_OVERRIDE'
    | 'INVALID_EXPLANATION'
    | 'INVALID_SETTING'
    | 'INVALID_EVENING_ENTRY'
    | 'INVALID_REFERENCE'
    | 'DATA_CORRUPTION';
  entityId?: string;
  relatedEntityId?: string;
  message: string;
}

export interface IntegrityReport {
  valid: boolean;
  errors: IntegrityError[];
}

/**
 * Valide l'intégrité des données dans la base
 * @param db Instance de la base de données
 * @returns Rapport d'intégrité
 */
export async function validateDataIntegrity(db: any): Promise<IntegrityReport> {
  const errors: IntegrityError[] = [];

  try {
    const tasks = await db.tasks.toArray();
    const sessions = await db.sessions.toArray();
    const overrides = db.overrides ? await db.overrides.toArray() : [];
    const decisions = db.brainDecisions ? await db.brainDecisions.toArray() : [];
    const explanations = db.decisionExplanations ? await db.decisionExplanations.toArray() : [];
    const eveningEntries = db.eveningEntries ? await db.eveningEntries.toArray() : [];
    const settings = db.settings ? await db.settings.toArray() : [];

    const taskIds = new Set(tasks.map((t: any) => t.id));
    const decisionIds = new Set(decisions.map((d: any) => d.id));

    for (const task of tasks) {
      if (!task.id || typeof task.id !== 'string') {
        errors.push({
          type: 'INVALID_TASK',
          entityId: String(task.id ?? ''),
          message: 'Task invalide: id manquant ou non-string',
        });
        continue;
      }

      if (!task.title || typeof task.title !== 'string') {
        errors.push({
          type: 'INVALID_TASK',
          entityId: task.id,
          message: `Task ${task.id} invalide: title manquant`,
        });
      }

      const validStatuses = new Set(['todo', 'active', 'frozen', 'done', 'cancelled']);
      if (!validStatuses.has(task.status)) {
        errors.push({
          type: 'INVALID_TASK',
          entityId: task.id,
          message: `Task ${task.id} invalide: status=${String(task.status)}`,
        });
      }

      if (task.status === 'done' && !task.completedAt) {
        errors.push({
          type: 'INVALID_TASK',
          entityId: task.id,
          message: `Task ${task.id} invalide: status=done sans completedAt`,
        });
      }

      if (typeof task.duration !== 'number' || task.duration <= 0) {
        errors.push({
          type: 'INVALID_TASK',
          entityId: task.id,
          message: `Task ${task.id} invalide: duration`,
        });
      }
    }

    for (const session of sessions) {
      if (!session.id || typeof session.id !== 'string') {
        errors.push({
          type: 'INVALID_SESSION',
          entityId: String(session.id ?? ''),
          message: 'Session invalide: id manquant ou non-string',
        });
        continue;
      }

      if (typeof session.timestamp !== 'number' || !Number.isFinite(session.timestamp)) {
        errors.push({
          type: 'INVALID_SESSION',
          entityId: session.id,
          message: `Session ${session.id} invalide: timestamp`,
        });
      }

      if (typeof session.startTime !== 'number' || !Number.isFinite(session.startTime)) {
        errors.push({
          type: 'INVALID_SESSION',
          entityId: session.id,
          message: `Session ${session.id} invalide: startTime`,
        });
      }

      const validStates = new Set(['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'EXHAUSTED', 'BLOCKED']);
      if (!validStates.has(session.state)) {
        errors.push({
          type: 'INVALID_SESSION',
          entityId: session.id,
          message: `Session ${session.id} invalide: state=${String(session.state)}`,
        });
      }

      if (!Array.isArray(session.taskIds)) {
        errors.push({
          type: 'INVALID_SESSION',
          entityId: session.id,
          message: `Session ${session.id} invalide: taskIds n'est pas un tableau`,
        });
        continue;
      }

      for (const taskId of session.taskIds) {
        if (!taskIds.has(taskId)) {
          errors.push({
            type: 'INVALID_REFERENCE',
            entityId: session.id,
            relatedEntityId: String(taskId),
            message: `Session ${session.id} référence Task ${String(taskId)} inexistante`,
          });
        }
      }

      if (typeof session.startTime === 'number' && typeof session.endTime === 'number') {
        if (session.endTime < session.startTime) {
          errors.push({
            type: 'INVALID_SESSION',
            entityId: session.id,
            message: `Session ${session.id} invalide: endTime < startTime`,
          });
        }
      }
    }

    for (const override of overrides) {
      if (typeof override.id !== 'number') {
        errors.push({
          type: 'INVALID_OVERRIDE',
          entityId: String(override.id ?? ''),
          message: `Override ${String(override.id ?? '')} invalide: id`,
        });
      }

      if (typeof override.timestamp !== 'number') {
        errors.push({
          type: 'INVALID_OVERRIDE',
          entityId: String(override.id ?? ''),
          message: `Override ${String(override.id ?? '')} invalide: timestamp`,
        });
      }

      if (!override.originalDecision || !override.userDecision) {
        errors.push({
          type: 'INVALID_OVERRIDE',
          entityId: String(override.id ?? ''),
          message: `Override ${String(override.id ?? '')} invalide: décisions manquantes`,
        });
      }
    }

    for (const explanation of explanations) {
      if (!explanation.decisionId || !decisionIds.has(explanation.decisionId)) {
        errors.push({
          type: 'INVALID_EXPLANATION',
          entityId: String(explanation.id ?? ''),
          relatedEntityId: String(explanation.decisionId ?? ''),
          message: `Explanation ${String(explanation.id ?? '')} référence decisionId inexistant`,
        });
      }
    }

    for (const entry of eveningEntries) {
      if (!entry.id || typeof entry.id !== 'string') {
        errors.push({
          type: 'INVALID_EVENING_ENTRY',
          entityId: String(entry.id ?? ''),
          message: 'EveningEntry invalide: id manquant ou non-string',
        });
      }
    }

    for (const row of settings) {
      if (!row.key || typeof row.key !== 'string') {
        errors.push({
          type: 'INVALID_SETTING',
          entityId: String(row.key ?? ''),
          message: 'Setting invalide: key manquant ou non-string',
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  } catch (error) {
    return {
      valid: false,
      errors: [
        {
          type: 'DATA_CORRUPTION',
          message: `Erreur lors de la validation: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        },
      ],
    };
  }
}

/**
 * Répare les erreurs d'intégrité simples
 * @param db Instance de la base de données
 * @param report Rapport d'intégrité avec les erreurs à réparer
 */
export async function repairIntegrityErrors(db: any, report: IntegrityReport): Promise<void> {
  if (report.valid) return;

  for (const error of report.errors) {
    try {
      switch (error.type) {
        case 'INVALID_TASK':
          if (error.entityId) {
            const task = await db.tasks.get(error.entityId);
            if (!task) break;

            const updates: Record<string, unknown> = {};
            const validStatuses = new Set(['todo', 'active', 'frozen', 'done', 'cancelled']);

            if (!validStatuses.has(task.status)) {
              updates.status = 'todo';
            }

            if (task.status === 'done' && !task.completedAt) {
              updates.completedAt = task.updatedAt ?? new Date();
            }

            if (typeof task.duration !== 'number' || task.duration <= 0) {
              updates.duration = 30;
            }

            if (Object.keys(updates).length > 0) {
              updates.updatedAt = new Date();
              await db.tasks.update(error.entityId, updates);
              logger.info('Task réparée', { taskId: error.entityId });
            }
          }
          break;

        case 'INVALID_SESSION':
          if (error.entityId) {
            const session = await db.sessions.get(error.entityId);
            if (!session) break;

            if (Array.isArray(session.taskIds)) {
              const tasks = await db.tasks.toArray();
              const taskIds = new Set(tasks.map((t: any) => t.id));
              const filtered = session.taskIds.filter((t: any) => taskIds.has(t));
              if (filtered.length !== session.taskIds.length) {
                await db.sessions.update(error.entityId, { taskIds: filtered });
                logger.info('Session réparée (taskIds filtrés)', { sessionId: error.entityId });
              }
            }
          }
          break;

        case 'INVALID_REFERENCE':
          if (error.entityId && error.relatedEntityId) {
            const session = await db.sessions.get(error.entityId);
            if (!session || !Array.isArray(session.taskIds)) break;
            const filtered = session.taskIds.filter((t: any) => String(t) !== String(error.relatedEntityId));
            if (filtered.length !== session.taskIds.length) {
              await db.sessions.update(error.entityId, { taskIds: filtered });
              logger.info('Référence invalide supprimée de la session', {
                sessionId: error.entityId,
                taskId: error.relatedEntityId,
              });
            }
          }
          break;

        case 'INVALID_OVERRIDE':
          if (error.entityId) {
            const idNum = Number(error.entityId);
            if (Number.isFinite(idNum) && String(error.entityId).trim() !== '') {
              await db.overrides.delete(idNum);
              logger.info('Override invalide supprimé', { overrideId: idNum });
            }
          }
          break;

        case 'INVALID_EXPLANATION':
          if (error.entityId) {
            await db.decisionExplanations.delete(error.entityId);
            logger.info('Explanation invalide supprimée', { explanationId: error.entityId });
          }
          break;

        case 'INVALID_SETTING':
          if (error.entityId) {
            await db.settings.delete(error.entityId);
            logger.info('Setting invalide supprimé', { key: error.entityId });
          }
          break;

        case 'INVALID_EVENING_ENTRY':
          if (error.entityId) {
            await db.eveningEntries.delete(error.entityId);
            logger.info('EveningEntry invalide supprimée', { id: error.entityId });
          }
          break;
      }
    } catch (repairError) {
      logger.error(`Erreur lors de la réparation de ${error.type}`, repairError as Error);
    }
  }
}

/**
 * Effectue une vérification complète de l'intégrité au démarrage
 * @param db Instance de la base de données
 */
export async function performStartupIntegrityCheck(db: any): Promise<void> {
  logger.info("Démarrage de la vérification d'intégrité");
  
  const report = await validateDataIntegrity(db);
  
  if (!report.valid) {
    logger.warn('Erreurs d\'intégrité détectées', { count: report.errors.length });
    report.errors.forEach(error => {
      logger.warn(error.message);
    });
    
    // Tenter de réparer les erreurs
    await repairIntegrityErrors(db, report);
    
    // Revérifier après réparation
    const newReport = await validateDataIntegrity(db);
    if (newReport.valid) {
      logger.info('Toutes les erreurs ont été réparées');
    } else {
      logger.error(`Erreurs persistent après réparation: ${newReport.errors.length}`, new Error('Integrity errors persist'));
    }
  } else {
    logger.info("Aucune erreur d'intégrité détectée");
  }
}