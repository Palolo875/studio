/**
 * Fabrique de tâches complètes
 * Fusionne les données brutes et la classification pour créer des objets Task complets
 */
import type { RawTask } from './TaskExtractor';
import type { TaskClassification } from './TaskClassifier';
import type { Task } from './types';

export function createFullTask(
  rawTask: RawTask, 
  classification: TaskClassification
): Task {
  const baseContent = `${rawTask.action} ${rawTask.object}`.trim();
  
  return {
    id: rawTask.id,
    content: baseContent,
    
    // Provenance NLP
    sourceType: 'nlp_full',
    
    // Classification ML → Champs Task
    effort: classification.effort,
    energy: classification.energyType,
    priority: getPriorityFromUrgency(classification.urgency),
    
    // Métadonnées intelligentes
    tags: classification.autoTags,
    notes: buildNlpNotes(rawTask, classification),
    
    // Dates
    deadline: parseDeadline(rawTask.deadline),
    
    // État initial
    status: 'todo',
    createdAt: new Date(),
    estimatedMinutes: effortToMinutes(classification.effort),
    
    // NLP Metadata (pour debug/insights)
    nlpMetadata: {
      detectedLang: (rawTask as any).lang || 'unknown', // À ajouter dans RawTask
      energyConfidence: classification.energyConfidence,
      urgency: classification.urgency,
      rawAction: rawTask.action,
      rawSentence: rawTask.sentence
    }
  };
}

function getPriorityFromUrgency(urgency: number): 'low' | 'medium' | 'high' {
  if (urgency >= 0.8) return 'high';
  if (urgency >= 0.5) return 'medium';
  return 'low';
}

function buildNlpNotes(raw: RawTask, classif: TaskClassification): string {
  return `NLP: Énergie=${classif.energyType} (${classif.energyConfidence.toFixed(2)}) | Effort=${classif.effort} | Urgence=${(classif.urgency*100).toFixed(0)}%`;
}

function effortToMinutes(effort: 'S'|'M'|'L'): number {
  const mapping = { S: 15, M: 90, L: 240 };
  return mapping[effort];
}

function parseDeadline(deadlineStr: string | null): Date | null {
  if (!deadlineStr) return null;
  
  // "demain 15h" → Date demain 15:00
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24*60*60*1000);
  
  if (deadlineStr.includes('demain')) {
    const hourMatch = deadlineStr.match(/(\d{1,2})h?/);
    if (hourMatch) {
      tomorrow.setHours(parseInt(hourMatch[1]), 0, 0, 0);
      return tomorrow;
    }
  }
  
  return null;
}