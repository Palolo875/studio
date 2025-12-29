/**
 * Classificateur de tâches avec mmBERT-small
 * Classification énergie/effort/sentiment avec modèle quantifié INT8
 */
import { RawTaskWithContract } from '@/lib/nlp/NLPContract';
import { createLogger } from '@/lib/logger';

const logger = createLogger('TaskClassifier');

// Définitions des classes multilingues
const CLASS_DEFINITIONS = {
  energy: {
    creative: [
      'fr: écrire article, design, brainstorm, idée créative',
      'en: write article, design, brainstorm, creative idea',
      'es: escribir artículo, diseño, lluvia de ideas'
    ],
    focus: [
      'fr: coder, analyse données, rédaction complexe',
      'en: code, data analysis, complex writing',
      'es: programar, análisis datos, redacción compleja'
    ],
    admin: [
      'fr: email, comptabilité, réunion, rendez-vous',
      'en: email, accounting, meeting, appointment',
      'es: email, contabilidad, reunión, cita'
    ],
    relationnel: [
      'fr: appeler client, feedback, réseau',
      'en: call client, feedback, networking',
      'es: llamar cliente, feedback, networking'
    ],
    perso: [
      'fr: sport, courses, famille',
      'en: sport, groceries, family',
      'es: deporte, compras, familia'
    ]
  },
  effort: {
    S: 'fr: rapide, 5min, 15min, email, appeler | en: quick, 5min, email, call',
    M: 'fr: 1h, 2h, rapport | en: 1h, 2h, report',
    L: 'fr: projet, gros, complexe | en: project, big, complex'
  }
};

// Interface pour la classification des tâches
export interface TaskClassification {
  energyType: 'creative' | 'focus' | 'admin' | 'relationnel' | 'perso';
  energyConfidence: number;
  effort: 'S' | 'M' | 'L';
  sentiment: 'positive' | 'neutral' | 'negative' | 'stress';
  urgency: number; // 0-1
  autoTags: string[];
}

// Simuler le classificateur pour l'instant (en attendant l'installation de @xenova/transformers)
let classifier: any = null;

/**
 * Initialisation du classificateur mmBERT
 */
export async function initClassifier() {
  // Simulation de l'initialisation
  logger.info('Initialisation du classificateur mmBERT...');

  // Dans une vraie implémentation:
  /*
  if (classifier) return classifier;

  classifier = await pipeline(
    'zero-shot-classification', 
    'Xenova/multilingual-e5-small-classifier', // ~45MB INT8
    {
      device: 'wasm',
      dtype: 'qint8',
      progress_callback: (data) => {
        if (data.status === 'progress') logger.info('MMBERT progress', { progress: data.progress });
      }
    }
  );
  */

  classifier = {
    classify: async (text: string, labels: string[]) => {
      // Simulation de classification basée sur le contenu du texte
      const scores = labels.map((label, idx) => {
        const key = `${text}::${label}::${idx}`;
        let hash = 0;
        for (let i = 0; i < key.length; i += 1) {
          hash = (hash * 31 + key.charCodeAt(i)) | 0;
        }
        const n = (hash >>> 0) % 1000;
        return (n + 1) / 1000;
      });
      // Normaliser les scores pour qu'ils summent à 1
      const sum = scores.reduce((a, b) => a + b, 0);
      const normalizedScores = scores.map(score => score / sum);
      
      // Trier les labels par score décroissant
      const sortedIndices = normalizedScores
        .map((score, index) => ({ score, index }))
        .sort((a, b) => b.score - a.score)
        .map(item => item.index);
      
      return {
        labels: sortedIndices.map(i => labels[i]),
        scores: sortedIndices.map(i => normalizedScores[i])
      };
    }
  };
  
  return classifier;
}

/**
 * Classification complète d'une tâche
 */
export async function classifyTask(rawTask: RawTaskWithContract): Promise<TaskClassification> {
  const classifier = await initClassifier();
  
  // 1. Classification énergie
  const energyLabels = Object.keys(CLASS_DEFINITIONS.energy);
  const energyResult = await classifier.classify(
    rawTask.rawText,
    energyLabels
  );
  
  // 2. Classification effort
  const effortLabels = ['S', 'M', 'L'];
  const effortResult = await classifier.classify(
    rawTask.rawText,
    effortLabels
  );
  
  // 3. Urgence/sentiment (heuristiques + ML)
  const urgencyScore = calculateUrgency(rawTask.rawText);
  
  return {
    energyType: energyResult.labels[0] as any,
    energyConfidence: energyResult.scores[0],
    effort: effortResult.labels[0] as any,
    sentiment: detectSentiment(rawTask.rawText),
    urgency: urgencyScore,
    autoTags: generateTags(rawTask, energyResult.labels[0])
  };
}

/**
 * Calcul de l'urgence basé sur des heuristiques
 */
function calculateUrgency(text: string): number {
  const urgencyWords = {
    fr: ['urgent', 'priorité', 'deadline', 'aujourd hui', 'immédiat', 'demain', 'asap'],
    en: ['urgent', 'priority', 'deadline', 'today', 'immediate', 'tomorrow', 'asap'],
    es: ['urgente', 'prioridad', 'fecha límite', 'hoy', 'inmediato', 'mañana', 'asap']
  };
  
  // Détecter la langue du texte
  const lang = detectLanguageSimple(text);
  const words = text.toLowerCase().split(/\s+/);
  
  let urgencyCount = 0;
  for (const word of words) {
    if (urgencyWords[lang as keyof typeof urgencyWords].includes(word)) {
      urgencyCount++;
    }
  }
  
  // Normaliser le score (max 1.0)
  return Math.min(urgencyCount * 0.25, 1.0);
}

/**
 * Détection simple de la langue
 */
function detectLanguageSimple(text: string): string {
  // Compter les caractères spécifiques à chaque langue
  const frenchChars = (text.match(/[àâäéèêëïîôöùûüÿç]/gi) || []).length;
  const spanishChars = (text.match(/[áéíóúüñ]/gi) || []).length;
  
  if (frenchChars > spanishChars) return 'fr';
  if (spanishChars > frenchChars) return 'es';
  return 'en';
}

/**
 * Détection du sentiment
 */
function detectSentiment(text: string): 'positive' | 'neutral' | 'negative' | 'stress' {
  const positiveWords = {
    fr: ['bon', 'bien', 'excellent', 'super', 'génial', 'merci', 'heureux', 'content'],
    en: ['good', 'well', 'excellent', 'great', 'awesome', 'thank', 'happy', 'pleased'],
    es: ['buen', 'bien', 'excelente', 'genial', 'fantástico', 'gracias', 'feliz', 'contento']
  };
  
  const negativeWords = {
    fr: ['mauvais', 'mal', 'horrible', 'terrible', 'détesté', 'triste', 'énervé'],
    en: ['bad', 'poor', 'horrible', 'terrible', 'hate', 'sad', 'angry'],
    es: ['malo', 'mal', 'horrible', 'terrible', 'odio', 'triste', 'enojado']
  };
  
  const stressWords = {
    fr: ['stress', 'angoisse', 'panique', 'urgence', 'pressé', 'fatigué'],
    en: ['stress', 'anxiety', 'panic', 'urgency', 'rushed', 'tired'],
    es: ['estrés', 'ansiedad', 'pánico', 'urgencia', 'apurado', 'cansado']
  };
  
  const lang = detectLanguageSimple(text);
  const lowerText = text.toLowerCase();
  
  let positiveCount = 0;
  let negativeCount = 0;
  let stressCount = 0;
  
  for (const word of positiveWords[lang as keyof typeof positiveWords]) {
    if (lowerText.includes(word)) positiveCount++;
  }
  
  for (const word of negativeWords[lang as keyof typeof negativeWords]) {
    if (lowerText.includes(word)) negativeCount++;
  }
  
  for (const word of stressWords[lang as keyof typeof stressWords]) {
    if (lowerText.includes(word)) stressCount++;
  }
  
  // Déterminer le sentiment dominant
  if (stressCount > 0) return 'stress';
  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
}

/**
 * Génération automatique de tags
 */
function generateTags(rawTask: RawTask, energyType: string): string[] {
  const baseTags = [rawTask.action, energyType];
  
  // Ajouter des tags basés sur les entités
  if (rawTask.entities) {
    Object.values(rawTask.entities).forEach(entity => {
      if (entity && !baseTags.includes(entity)) {
        baseTags.push(entity);
      }
    });
  }
  
  // Ajouter un tag pour les deadlines
  if (rawTask.deadline) baseTags.push('deadline');
  
  return baseTags;
}