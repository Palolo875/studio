/**
 * Fabrique de tâches complètes
 * Fusionne les données brutes et la classification pour créer des objets Task complets
 */
import type { RawTaskWithContract } from '@/lib/nlp/NLPContract';
import type { TaskClassification } from './TaskClassifier';
import type { Task } from '@/lib/types';

export function createFullTask(
  rawTask: RawTaskWithContract,
  classification: TaskClassification & { isUncertain: boolean; unknown?: boolean }
): Task {
  const baseContent = `${rawTask.action} ${rawTask.object}`.trim();

  return {
    id: rawTask.id,
    title: baseContent,

    // Propriétés de base
    createdAt: new Date(),
    duration: effortToMinutes(classification.effort),
    effort: mapEffort(classification.effort),
    urgency: mapUrgency(classification.urgency),
    impact: 'medium', // Défaut Phase 1
    category: classification.energyType,
    status: 'todo',
    completionHistory: [],

    // Métadonnées NLP (Phase 2 - Zone de Quarantaine)
    nlpMetadata: {
      detectedLang: rawTask.metadata.detectedLang,
      energySuggestion: classification.energyType,
      effortSuggestion: classification.effort,
      confidence: Math.min(rawTask.confidence, classification.energyConfidence),
      isUncertain: classification.isUncertain || (classification.unknown ?? false),
      rawText: rawTask.rawText
    },

    description: buildNlpNotes(rawTask, classification),
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