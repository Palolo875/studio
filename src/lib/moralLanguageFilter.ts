/**
 * FILTRE DE LANGAGE MORAL - KairuFlow Phase 1
 * Remplace les termes à connotation morale par des termes factuels
 */

export interface TranslationMap {
  [key: string]: string;
}

// Mapping des termes toxiques vers des termes factuels
export const MORAL_TO_FACTUAL_MAP: TranslationMap = {
  // Retard / Échéance
  'retard': 'fenêtre expirée',
  'en retard': 'hors fenêtre',
  'tardive': 'après échéance',
  'deadline dépassée': 'échéance expirée',
  
  // Échec / Succès
  'échec': 'non-exécuté',
  'raté': 'non-complété',
  'manqué': 'non-atteint',
  'succès': 'atteint',
  'réussi': 'complété',
  
  // Procrastination / Dilayage
  'procrastine': 'non-sélectionné',
  'procrastination': 'non-sélection récurrente',
  'dilate': 'reporte',
  'remet à plus tard': 'reporte',
  'diffère': 'décale',
  
  // Obligation / Devoir
  'devrait': 'pourrait',
  'devrais': 'pourrais',
  'devrait faire': 'pourrait choisir de faire',
  'obligé': 'disponible',
  
  // Jugement de valeur
  'mauvais': 'non-optimal',
  'bon': 'utile',
  'correct': 'approprié',
  'incorrect': 'non-approprié',
  'juste': 'équitable',
  'faux': 'inexact',
  
  // Responsabilité personnelle
  'je suis nul': 'je rencontre une difficulté',
  'je rate tout': 'je n\'atteins pas mes objectifs',
  'je suis paresseux': 'je manque de motivation',
  'je suis inefficace': 'je peux optimiser',
  
  // Performance
  'productif': 'actif',
  'improductif': 'repos',
  'productivité': 'activité utile',
  'efficacité': 'rendement',
  
  // Comparaison
  'mieux que': 'différent de',
  'pire que': 'différent de',
  'meilleur': 'plus adapté',
  'meilleure': 'plus adaptée',
  
  // Émotion
  'stressé': 'tension élevée',
  'fatigué': 'énergie basse',
  'anxieux': 'inquiet',
  'motivé': 'engagé',
  'démotivé': 'désengagé'
};

/**
 * Traduit un texte en remplaçant les termes moraux par des termes factuels
 */
export function translateMoralLanguage(text: string): string {
  let translatedText = text;
  
  // Trier les clés par ordre décroissant de longueur pour éviter les remplacements partiels
  const sortedKeys = Object.keys(MORAL_TO_FACTUAL_MAP).sort((a, b) => b.length - a.length);
  
  for (const moralTerm of sortedKeys) {
    const factualTerm = MORAL_TO_FACTUAL_MAP[moralTerm];
    
    // Remplacement sensible à la casse
    const regex = new RegExp('\\b' + escapeRegExp(moralTerm) + '\\b', 'gi');
    translatedText = translatedText.replace(regex, (match) => {
      // Conserver la casse initiale
      if (match === match.toUpperCase()) {
        return factualTerm.toUpperCase();
      } else if (match === match.charAt(0).toUpperCase() + match.slice(1).toLowerCase()) {
        return factualTerm.charAt(0).toUpperCase() + factualTerm.slice(1);
      }
      return factualTerm;
    });
  }
  
  return translatedText;
}

/**
 * Échappe les caractères spéciaux d'une chaîne pour une utilisation dans une expression régulière
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Nettoie un message d'erreur pour enlever les jugements moraux
 */
export function cleanErrorMessage(message: string): string {
  return translateMoralLanguage(message);
}

/**
 * Nettoie un message d'information pour enlever les jugements moraux
 */
export function cleanInfoMessage(message: string): string {
  return translateMoralLanguage(message);
}

/**
 * Crée un message d'explication factuel à partir d'une situation
 */
export function createFactualExplanation(taskStatus: 'completed' | 'pending' | 'overdue', 
                                       timeStatus: 'ontime' | 'late' | 'early',
                                       effortStatus: 'high' | 'medium' | 'low'): string {
  let explanation = '';
  
  switch(taskStatus) {
    case 'completed':
      explanation += 'Tâche exécutée';
      break;
    case 'pending':
      explanation += 'Tâche non-exécutée';
      break;
    case 'overdue':
      explanation += 'Tâche hors fenêtre';
      break;
  }
  
  switch(timeStatus) {
    case 'ontime':
      explanation += ', dans les délais';
      break;
    case 'late':
      explanation += ', hors fenêtre temporelle';
      break;
    case 'early':
      explanation += ', anticipée';
      break;
  }
  
  switch(effortStatus) {
    case 'high':
      explanation += ', forte charge';
      break;
    case 'medium':
      explanation += ', charge moyenne';
      break;
    case 'low':
      explanation += ', faible charge';
      break;
  }
  
  return explanation;
}

/**
 * Vérifie si un texte contient des termes moraux
 */
export function containsMoralLanguage(text: string): boolean {
  const lowerText = text.toLowerCase();
  return Object.keys(MORAL_TO_FACTUAL_MAP).some(term => 
    lowerText.includes(term.toLowerCase())
  );
}

/**
 * Filtre et transforme une liste de messages pour enlever les jugements moraux
 */
export function filterMoralMessages(messages: string[]): string[] {
  return messages.map(msg => translateMoralLanguage(msg));
}

/**
 * Filtre un objet de données pour remplacer les termes moraux par des termes factuels
 */
export function filterMoralData(data: any): any {
  if (typeof data === 'string') {
    return translateMoralLanguage(data);
  } else if (Array.isArray(data)) {
    return data.map(item => filterMoralData(item));
  } else if (data !== null && typeof data === 'object') {
    const result: any = {};
    for (const [key, value] of Object.entries(data)) {
      result[key] = filterMoralData(value);
    }
    return result;
  }
  return data;
}

/**
 * Options pour la politique de gestion des échecs
 */
export interface FailurePolicyOptions {
  noPenalty: boolean;
  noReminder: boolean;
  noReformulation: boolean;
  silenceAfter: number;
}

/**
 * Politique de gestion des échecs sans jugement moral
 */
export const DEFAULT_FAILURE_POLICY: FailurePolicyOptions = {
  noPenalty: true,
  noReminder: true,
  noReformulation: true,
  silenceAfter: 3
};

/**
 * Applique la politique de gestion des échecs
 */
export function applyFailurePolicy(
  policy: FailurePolicyOptions, 
  failureCount: number, 
  context: any
): any {
  if (failureCount >= policy.silenceAfter) {
    // Réduire les interventions sans punition
    return {
      ...context,
      interventionLevel: 'observation_only',
      showNotifications: false,
      logOnly: true
    };
  }
  
  // Retourner le contexte sans changement - le système observe, se tait, ajuste
  return context;
}

/**
 * Journal d'événements sans jugement moral
 */
export interface BehavioralEvent {
  timestamp: Date;
  eventType: 'task_selected' | 'task_started' | 'task_completed' | 'task_skipped' | 'session_ended';
  taskId?: string;
  sessionId?: string;
  context?: any; // Informations objectives sans évaluation
}

/**
 * Crée un événement comportemental factuel
 */
export function createBehavioralEvent(
  eventType: 'task_selected' | 'task_started' | 'task_completed' | 'task_skipped' | 'session_ended',
  context?: any
): BehavioralEvent {
  return {
    timestamp: new Date(),
    eventType,
    context: filterMoralData(context) // S'assurer que le contexte est exempt de langage moral
  };
}