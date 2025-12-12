/**
 * Fabrique de tâches complètes
 * Fusionne les données brutes et la classification pour créer des objets Task complets
 */
import type { RawTask } from './TaskExtractor';
import type { TaskClassification } from './TaskClassifier';
import type { Task } from '@/lib/types';

export function createFullTask(
  rawTask: RawTask, 
  classification: TaskClassification
): Task {
  const baseContent = `${rawTask.action} ${rawTask.object}`.trim();
  
  return {
    id: rawTask.id,
    name: baseContent, // Utiliser "name" au lieu de "content"
    
    // Provenance NLP
    sourceType: 'nlp_full',
    
    // Classification ML → Champs Task
    effort: classification.effort,
    energyRequired: classification.energyType as "low" | "medium" | "high", // Adapter le type
    priority: getPriorityFromUrgency(classification.urgency),
    
    // Métadonnées intelligentes
    tags: classification.autoTags,
    description: buildNlpNotes(rawTask, classification), // Utiliser "description" au lieu de "notes"
    
    // Dates
    deadlineDisplay: rawTask.deadline || undefined, // Utiliser "deadlineDisplay"
    
    // État initial
    completed: false,
    subtasks: [],
    lastAccessed: new Date().toISOString(),
    completionRate: 0,
    
    // Estimation de durée
    estimatedDuration: effortToMinutes(classification.effort),
    
    // NLP Metadata (pour debug/insights)
    nlpMetadata: {
      detectedLang: (rawTask as any).lang || 'unknown', // À ajouter dans RawTask
      energyConfidence: classification.energyConfidence,
      urgency: classification.urgency,
      rawAction: rawTask.action,
      rawSentence: rawTask.sentence
    }
  } as Task; // Cast pour contourner les problèmes de typage
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