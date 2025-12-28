/**
 * Fabrique de tâches complètes
 * Fusionne les données brutes et la classification pour créer des objets Task complets
 */
import type { RawTaskWithContract } from '@/lib/nlp/NLPContract';
import type { TaskClassification } from './TaskClassifier';
import type { DBTask } from '@/lib/database';

export function createFullTask(
  rawTask: RawTaskWithContract,
  classification: TaskClassification & { isUncertain: boolean; unknown?: boolean }
): DBTask {
  const baseContent = `${rawTask.action} ${rawTask.object}`.trim();
  const now = new Date();

  return {
    id: rawTask.id,
    title: baseContent,
    description: buildNlpNotes(rawTask, classification),
    duration: effortToMinutes(classification.effort),
    effort: mapEffort(classification.effort),
    urgency: mapUrgency(classification.urgency),
    impact: 'medium',
    deadline: undefined,
    scheduledTime: undefined,
    category: classification.energyType,
    status: 'todo',
    activationCount: 0,
    lastActivated: undefined,
    createdAt: now,
    updatedAt: now,
    completedAt: undefined,
    tags: classification.autoTags,
  };
}

function mapEffort(effort: 'S' | 'M' | 'L'): 'low' | 'medium' | 'high' {
  const map = { S: 'low', M: 'medium', L: 'high' };
  return map[effort] as any;
}

function mapUrgency(score: number): 'low' | 'medium' | 'high' | 'urgent' {
  if (score >= 0.9) return 'urgent';
  if (score >= 0.7) return 'high';
  if (score >= 0.4) return 'medium';
  return 'low';
}

function buildNlpNotes(raw: RawTaskWithContract, classif: any): string {
  const status = classif.isUncertain ? '⚠️ INCERTAIN' : '✅ FIABLE';
  return `[NLP ${status}] Énergie: ${classif.energyType} | Effort: ${classif.effort} | Confiance: ${(classif.energyConfidence * 100).toFixed(0)}%`;
}

function effortToMinutes(effort: 'S' | 'M' | 'L'): number {
  const mapping = { S: 15, M: 90, L: 240 };
  return mapping[effort];
}