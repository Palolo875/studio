/**
 * Définition des types pour le module NLP
 */

export type EnergyType = 'creative' | 'focus' | 'admin' | 'relationnel' | 'perso';
export type EffortType = 'S' | 'M' | 'L';
export type PriorityType = 'low' | 'medium' | 'high';
export type StatusType = 'todo' | 'in-progress' | 'done' | 'archived';
export type SourceType = 'manual' | 'nlp_capture' | 'nlp_full' | 'ai_suggestion';

export interface NlpMetadata {
  detectedLang: string;
  energyConfidence: number;
  urgency: number;
  rawAction: string;
  rawSentence: string;
}

export interface Task {
  id: string;
  content?: string;
  energy: EnergyType;
  effort: EffortType;
  priority: PriorityType;
  status: StatusType;
  sourceType: SourceType;
  tags?: string[];
  notes?: string;
  deadline?: Date | null;
  estimatedMinutes?: number;
  createdAt: Date;
  updatedAt?: Date;
  completedAt?: Date;
  nlpMetadata?: NlpMetadata;
}