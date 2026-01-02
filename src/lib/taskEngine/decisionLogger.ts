// Système de logging des décisions du cerveau - Phase 3.4
import { BrainDecision, BrainVersion } from './brainContracts';
import { db, type DBBrainDecision } from '@/lib/database';
import { createLogger } from '@/lib/logger';

const logger = createLogger('DecisionLogger');

const decisionCache = new Map<string, BrainDecision>();

/**
 * Loggue une décision du cerveau
 */
export async function logBrainDecision(decision: BrainDecision): Promise<void> {
  const record: DBBrainDecision = {
    id: decision.id,
    timestamp: decision.timestamp.getTime(),
    brainVersion: decision.brainVersion.id,
    input: decision.inputs,
    output: decision.outputs,
    trace: decision,
  };

  decisionCache.set(decision.id, decision);
  await db.brainDecisions.put(record);
}

export function getCachedBrainDecision(decisionId: string): BrainDecision | undefined {
  return decisionCache.get(decisionId);
}

/**
 * Récupère une décision par son ID
 */
export async function getBrainDecision(decisionId: string): Promise<BrainDecision | undefined> {
  const record = await db.brainDecisions.get(decisionId);
  const resolved = (record?.trace as BrainDecision | undefined) ?? undefined;
  if (resolved) decisionCache.set(decisionId, resolved);
  return resolved;
}

/**
 * Récupère toutes les décisions
 */
export async function getAllBrainDecisions(): Promise<BrainDecision[]> {
  const records = await db.brainDecisions.toArray();
  return records
    .map(r => r.trace as BrainDecision)
    .filter(Boolean);
}

/**
 * Rejoue une décision précédente
 */
export async function replayDecision(decisionId: string): Promise<BrainDecision | null> {
  const decision = await getBrainDecision(decisionId);
  if (!decision) {
    logger.warn('Décision non trouvée pour le replay', { decisionId });
    return null;
  }
  return decision;
}

/**
 * Enregistre une version du cerveau
 */
export async function registerBrainVersion(version: BrainVersion): Promise<void> {
  await db.brainVersions.put(version);
}

/**
 * Récupère une version du cerveau par son ID
 */
export async function getBrainVersion(versionId: string): Promise<BrainVersion | undefined> {
  return db.brainVersions.get(versionId);
}

/**
 * Génère un ID de version basé sur le hash des règles
 */
export function generateVersionId(rules: any): string {
  const payload = JSON.stringify(rules ?? {});
  let hash = 5381;
  for (let i = 0; i < payload.length; i += 1) {
    hash = (hash * 33) ^ payload.charCodeAt(i);
  }
  return `version_${(hash >>> 0).toString(16)}`;
}

/**
 * Nettoie l'historique des décisions (pour éviter l'explosion mémoire)
 */
export async function pruneDecisionHistory(maxAgeDays: number = 30): Promise<number> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - maxAgeDays);
  const cutoffTs = cutoff.getTime();

  const deleted = await db.brainDecisions.where('timestamp').below(cutoffTs).delete();
  return deleted;
}

/**
 * Archive les décisions anciennes
 */
export async function archiveOldDecisions(maxAgeDays: number = 7): Promise<number> {
  // Pour l’instant, on “archive” en supprimant (pas de table d’archive dédiée).
  return pruneDecisionHistory(maxAgeDays);
}