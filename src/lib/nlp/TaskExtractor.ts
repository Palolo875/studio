/**
 * Extracteur de tâches avec winkNLP SOTA
 * Transforme le texte brut en tâches structurées avec une approche state-of-the-art
 */
import winkNLP from 'wink-nlp';
import model from 'wink-eng-lite-web-model';

const nlp = winkNLP(model);
const its = nlp.its;
const as = nlp.as;

import { LanguageDetector } from '@/lib/nlp/LanguageDetector';
import { RawTaskWithContract, createTaskWithContract } from '@/lib/nlp/NLPContract';
export type { RawTaskWithContract } from '@/lib/nlp/NLPContract';

import { cohesionAnalyzer } from '@/lib/nlp/CohesionAnalyzer';
import { linguisticFatigueDetector } from '@/lib/nlp/LinguisticFatigueDetector';

// Interface pour les tâches brutes extraites
export interface RawTask {
  id: string;
  action: string;           // "appeler", "écrire"
  object: string;           // "Marc", "rapport Q4"
  deadline: string | null;  // "demain 15h"
  effortHint: 'S' | 'M' | 'L';
  rawText: string;
  sentence: string;
  confidence: number;       // Score de confiance de l'extraction
  entities: Record<string, string>; // Entités extraites
}

// Modèles d'entités par langue
const ENTITY_PATTERNS = {
  fr: {
    person: /\b(Marc|Jean|Marie|Paul|Sophie|Thomas|Camille|Antoine|Julie|Pierre)\b/i,
    time: /\b(\d{1,2}h(?:\d{2})?|\d{1,2}[:h]\d{2}|midi|minuit)\b/i,
    date: /\b(demain|lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche|aujourd'hui)\b/i,
    project: /\b(rapport|présentation|projet|document|fichier|dossier)\b/i,
  },
  en: {
    person: /\b(John|Mary|James|Patricia|Robert|Jennifer|Michael|Linda|William|Elizabeth)\b/i,
    time: /\b(\d{1,2}(?::\d{2})?\s*(?:am|pm)?|\d{1,2}[:h]\d{2}|noon|midnight)\b/i,
    date: /\b(tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|today)\b/i,
    project: /\b(report|presentation|project|document|file|folder)\b/i,
  },
  es: {
    person: /\b(Juan|María|Pedro|Ana|Luis|Carmen|Carlos|Isabel|José|Laura)\b/i,
    time: /\b(\d{1,2}h(?:\d{2})?|\d{1,2}[:h]\d{2}|mediodía|medianoche)\b/i,
    date: /\b(mañana|lunes|martes|miércoles|jueves|viernes|sábado|domingo|hoy)\b/i,
    project: /\b(informe|presentación|proyecto|documento|archivo|carpeta)\b/i,
  },
};

// Verbes d'action par langue avec poids
const ACTION_VERBS = {
  fr: new Map([
    ['appeler', 0.9],
    ['écrire', 0.85],
    ['faire', 0.7],
    ['envoyer', 0.8],
    ['lire', 0.75],
    ['répondre', 0.8],
    ['planifier', 0.75],
    ['préparer', 0.8],
    ['organiser', 0.75],
    ['terminer', 0.85],
    ['commencer', 0.7],
    ['mettre à jour', 0.75],
    ['vérifier', 0.7],
    ['confirmer', 0.75],
    ['acheter', 0.8],
    ['commander', 0.8],
    ['voir', 0.6],
    ['aller', 0.6],
    ['manger', 0.6],
    ['boire', 0.6],
    ['courir', 0.7],
    ['sport', 0.7],
    ['musique', 0.6],
    ['jouer', 0.7],
    ['travailler', 0.7],
    ['étudier', 0.7],
    ['apprendre', 0.7],
    ['réviser', 0.8]
  ]),
  en: new Map([
    ['call', 0.9],
    ['write', 0.85],
    ['do', 0.7],
    ['send', 0.8],
    ['read', 0.75],
    ['reply', 0.8],
    ['plan', 0.75],
    ['prepare', 0.8],
    ['organize', 0.75],
    ['finish', 0.85],
    ['start', 0.7],
    ['update', 0.75],
    ['check', 0.7],
    ['confirm', 0.75]
  ]),
  es: new Map([
    ['llamar', 0.9],
    ['escribir', 0.85],
    ['hacer', 0.7],
    ['enviar', 0.8],
    ['leer', 0.75],
    ['responder', 0.8],
    ['planificar', 0.75],
    ['preparar', 0.8],
    ['organizar', 0.75],
    ['terminar', 0.85],
    ['comenzar', 0.7],
    ['actualizar', 0.75],
    ['verificar', 0.7],
    ['confirmar', 0.75]
  ])
};

// Patterns de date par langue
const DATE_PATTERNS = {
  fr: /(demain|lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)(?:\s+(\d{1,2})h?)?/i,
  en: /(tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)(?:\s+(\d{1,2})(am|pm)?)?/i,
  es: /(mañana|lunes|martes|miércoles|jueves|viernes|sábado|domingo)(?:\s+(las? \d{1,2})h?)?/i
};

// Indices d'effort avec poids
const EFFORT_HINTS = {
  S: [
    { hint: 'rapide', weight: 0.8 },
    { hint: '5min', weight: 0.9 },
    { hint: '15min', weight: 0.9 },
    { hint: 'email', weight: 0.7 },
    { hint: 'appeler', weight: 0.8 },
    { hint: 'sms', weight: 0.8 },
    { hint: 'message', weight: 0.7 }
  ],
  M: [
    { hint: '1h', weight: 0.9 },
    { hint: '2h', weight: 0.9 },
    { hint: 'rapport', weight: 0.8 },
    { hint: 'réunion', weight: 0.8 },
    { hint: 'meeting', weight: 0.8 },
    { hint: 'présentation', weight: 0.85 },
    { hint: 'document', weight: 0.75 }
  ],
  L: [
    { hint: 'projet', weight: 0.9 },
    { hint: 'gros', weight: 0.8 },
    { hint: 'complexe', weight: 0.85 },
    { hint: '3h', weight: 0.9 },
    { hint: 'long', weight: 0.8 },
    { hint: 'développement', weight: 0.85 },
    { hint: 'analyse', weight: 0.8 }
  ]
};

// Type pour le résultat de guessEffort
interface EffortResult {
  effort: 'S' | 'M' | 'L';
  score: number;
}

/**
 * Extraction de tâches à partir d'un texte avec approche SOTA
 * @param text Le texte à analyser
 * @param uiLang Langue de l'interface (pour le fallback)
 * @returns Liste de tâches brutes avec scores de confiance
 */
export function extractTasks(text: string, uiLang: 'fr' | 'en' | 'es' = 'fr'): RawTaskWithContract[] {
  // 1. Analyse avec wink-nlp
  const doc = nlp.readDoc(text);
  const entities = doc.entities().out(its.detail);
  
  // 2. Détecter la langue (Règles Phase 2)
  const langDetection = LanguageDetector.detect(text, uiLang);
  const lang = langDetection.lang;

  // 2. Détecter la fatigue linguistique
  const fatigueState = linguisticFatigueDetector.detectFatigue(text);
  // Réduire radicalement le seuil pour ne pas bloquer l'utilisateur
  const confidenceThreshold = 0.1; 

  // Normaliser le texte
  const normalizedText = text.trim();
  if (!normalizedText) return [];

  // 3. Séparer en phrases (simulé)
  const sentences = splitIntoSentences(normalizedText, lang);
  const tasks: RawTaskWithContract[] = [];

  // 4. Traiter chaque phrase
  for (const sentence of sentences) {
    const clauses = splitCompoundSentence(sentence, lang);

    for (const clause of clauses) {
      // Extraire les verbes potentiels avec scores
      const potentialVerbs = extractPotentialVerbsWithScores(clause, lang);

      // Règle Phase 2 : Limiter à l'action la plus probable par clause
      let bestAction: [string, number] | null = null;
      for (const [verb, score] of potentialVerbs) {
        if (!bestAction || score > bestAction[1]) {
          bestAction = [verb, score];
        }
      }

      if (bestAction && bestAction[1] > confidenceThreshold) {
        const [verb, score] = bestAction;

        const isFromSplit = clause.trim() !== sentence.trim();
        const task = createTaskWithContract(
          {
            id: generateId(),
            action: verb,
            object: extractObject(clause, verb),
            deadline: parseDateNL(clause, lang),
            effortHint: guessEffort(clause),
            rawText: clause,
            sentence: clause,
            confidence: score * langDetection.confidence, // Pondérer par la confiance de la langue
            entities: extractEntities(clause, lang),
          },
          {
            inferred: false,
            decided: false,
            corrected: false,
            extracted: true,
            classified: false,
            confidence: score,
          },
          {
            low_confidence: score < 0.7,
            mixed_language: langDetection.reason === 'low_model_score_fallback_to_char',
            linguistic_fatigue: fatigueState.level !== 'LOW',
            split_from_compound: isFromSplit,
          }
        );

        // Injecter la langue détectée dans les métadonnées
        task.metadata.detectedLang = lang;

        tasks.push(task);
      } else {
        // FALLBACK: Si aucune action n'est détectée avec certitude, on prend toute la clause comme tâche
        const isFromSplit = clause.trim() !== sentence.trim();
        const task = createTaskWithContract(
          {
            id: generateId(),
            action: 'tâche',
            object: clause.trim(),
            deadline: parseDateNL(clause, lang),
            effortHint: guessEffort(clause),
            rawText: clause,
            sentence: clause,
            confidence: 0.5,
            entities: extractEntities(clause, lang),
          },
          {
            inferred: true,
            decided: false,
            corrected: false,
            extracted: true,
            classified: false,
            confidence: 0.5,
          },
          {
            unknown: true,
            split_from_compound: isFromSplit,
          }
        );
        task.metadata.detectedLang = lang;
        tasks.push(task);
      }
    }
  }

  // Trier par confiance décroissante
  tasks.sort((a, b) => b.confidence - a.confidence);

  // Limiter à 20 tâches maximum par session de capture
  return tasks.slice(0, 20);
}

function splitCompoundSentence(sentence: string, lang: string): string[] {
  const normalized = sentence.trim();
  if (!normalized) return [];

  const verbMap = ACTION_VERBS[lang as keyof typeof ACTION_VERBS];
  if (!verbMap) return [normalized];

  const lower = normalized.toLowerCase();
  const verbsInSentence = Array.from(verbMap.keys()).filter((v) => lower.includes(v));
  if (verbsInSentence.length < 2) return [normalized];

  const separators = /\s+(?:et|puis|ensuite)\s+|\s*[;,]\s*/i;
  const parts = normalized
    .split(separators)
    .map((s) => s.trim())
    .filter(Boolean);

  const clauses = parts.filter((part) => {
    const partLower = part.toLowerCase();
    return Array.from(verbMap.keys()).some((v) => partLower.includes(v));
  });

  return clauses.length >= 2 ? clauses : [normalized];
}

/**
 * Divise le texte en phrases avec détection avancée
 */
function splitIntoSentences(text: string, lang: string): string[] {
  const raw = text.replace(/\r\n/g, '\n').trim();
  if (!raw) return [];

  const blocks = raw
    .split(/\n{2,}/)
    .flatMap((block) =>
      block
        .split(/\n\s*(?:[-*•]|\d+[.)]|\[[x ]\])\s+/g)
        .map((s) => s.trim())
        .filter(Boolean)
    );

  const sentences = blocks.flatMap((block) =>
    block
      .split(/[.!?]+|\s*[;:]+\s*|\s*[，、]+\s*/g)
      .map((s) => s.trim())
      .filter(Boolean)
  );

  return sentences.filter((s) => s.length > 0 && /[a-zA-ZÀ-ÖØ-öø-ÿ]/.test(s));
}

/**
 * Extrait les verbes potentiels d'une phrase avec scores de confiance
 */
function extractPotentialVerbsWithScores(sentence: string, lang: string): Map<string, number> {
  const verbMap = new Map<string, number>();
  const langVerbs = ACTION_VERBS[lang as keyof typeof ACTION_VERBS];

  // Convertir en minuscules pour la comparaison
  const lowerSentence = sentence.toLowerCase();

  // Vérifier chaque verbe connu
  for (const [verb, baseScore] of langVerbs.entries()) {
    if (lowerSentence.includes(verb)) {
      // Ajuster le score en fonction du contexte
      let adjustedScore = baseScore;

      // Bonus pour les verbes au début de phrase
      if (new RegExp(`^\\s*${verb}`, 'i').test(sentence)) {
        adjustedScore += 0.1;
      }

      // Pénalité pour les verbes très courts dans des phrases longues
      if (verb.length <= 3 && sentence.length > 50) {
        adjustedScore -= 0.1;
      }

      verbMap.set(verb, Math.min(1.0, adjustedScore));
    }
  }

  return verbMap;
}

/**
 * Extrait l'objet d'une action avec approche contextuelle
 */
function extractObject(sentence: string, verb: string): string {
  // Trouver la position du verbe
  const verbIndex = sentence.toLowerCase().indexOf(verb.toLowerCase());
  if (verbIndex === -1) return '';

  // Extraire le texte après le verbe
  const afterVerb = sentence.substring(verbIndex + verb.length).trim();

  // Utiliser une approche plus sophistiquée pour extraire l'objet
  const object = extractMainObject(afterVerb, verb);

  return object;
}

/**
 * Extrait l'objet principal avec analyse contextuelle
 */
function extractMainObject(text: string, verb: string): string {
  // Séparer en tokens
  const tokens = text
    .replace(/[^\w\sáéíóúüñàâäôöùûüÿç]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 0);

  // Filtrer les mots de liaison et stopwords
  const filteredTokens = tokens.filter(token =>
    !['le', 'la', 'les', 'de', 'du', 'des', 'un', 'une', 'et', 'ou', 'à', 'au', 'aux', 'pour', 'avec'].includes(token.toLowerCase())
  );

  // Prendre les 3 premiers tokens significatifs
  return filteredTokens.slice(0, 3).join(' ').trim();
}

/**
 * Parse les dates en langage naturel avec approche SOTA
 */
function parseDateNL(text: string, lang: string): string | null {
  const pattern = DATE_PATTERNS[lang as keyof typeof DATE_PATTERNS];
  const match = text.match(pattern);
  return match ? `${match[1]}${match[2] ? ` ${match[2]}h` : ''}` : null;
}

/**
 * Devine l'effort requis pour une tâche avec scoring
 */
function guessEffort(text: string): 'S' | 'M' | 'L' {
  const lowerText = text.toLowerCase();
  let scores = { S: 0, M: 0, L: 0 };
  let totalCount = 0;

  // Calculer les scores pour chaque niveau d'effort
  for (const effortLevel of ['S', 'M', 'L'] as const) {
    const hints = EFFORT_HINTS[effortLevel];
    for (const { hint, weight } of hints) {
      if (lowerText.includes(hint)) {
        scores[effortLevel] += weight;
        totalCount += weight;
      }
    }
  }

  // Si aucun indice trouvé, retourner 'M' par défaut
  if (totalCount === 0) return 'M';

  // Retourner le niveau avec le score le plus élevé
  let maxEffort: 'S' | 'M' | 'L' = 'M';
  let maxScore = 0;

  for (const [effort, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      maxEffort = effort as 'S' | 'M' | 'L';
    }
  }

  return maxEffort;
}

/**
 * Extrait les entités nommées avec approche pattern-based
 */
function extractEntities(text: string, lang: string): Record<string, string> {
  const entities: Record<string, string> = {};
  const patterns = ENTITY_PATTERNS[lang as keyof typeof ENTITY_PATTERNS];

  // Extraire chaque type d'entité
  for (const [entityType, pattern] of Object.entries(patterns)) {
    const match = text.match(pattern);
    if (match) {
      entities[entityType] = match[0];
    }
  }

  return entities;
}

/**
 * Génère un ID unique avec timestamp
 */
function generateId(): string {
  const now = Date.now();
  return 'task-' + now.toString(36);
}