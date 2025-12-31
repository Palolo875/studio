/**
 * Classificateur de tâches avec mmBERT-small
 * Classification énergie/effort/sentiment avec modèle quantifié INT8
 */
export { classifyTask } from '@/lib/nlp/RealTaskClassifier';
export type { TaskClassification } from '@/lib/nlp/RealTaskClassifier';