/**
 * FILTRE DE LANGAGE - KairuFlow Phase 1
 * Élimination du vocabulaire toxique et des jugements moraux
 */

export interface LanguageMapping {
  [key: string]: string;
}

// Mots INTERDITS dans le code ET l'UI
export const FORBIDDEN_TERMS: LanguageMapping = {
  // Termes moralisants
  'retard': 'fenêtre expirée',
  'échec': 'non exécuté',
  'procrastination': 'non sélection',
  'paresse': 'pause',
  'discipline': 'consistance',
  'motivation': 'énergie',
  'devrait': 'pourrait',
  'devrais': 'pourrais',
  'devrait faire': 'pourrait choisir de faire',
  'oblige': 'propose',
  'faut': 'suggère',
  
  // Termes prescriptifs
  'tu devrais': 'tu pourrais',
  'il faut': 'il est utile de',
  'objectif': 'intention',
  'performance': 'taux d\'exécution',
  'productif': 'actif',
  'improductif': 'repos',
  'productivité': 'activité utile',
  'efficacité': 'rendement',
  
  // Termes interprétatifs
  'bonne journée': 'journée intéressante',
  'mauvaise journée': 'journée complexe',
  'bien fait': 'action notée',
  'raté': 'non atteint',
  'manqué': 'non atteint',
  'réussi': 'atteint',
  'gagné': 'obtenu',
  'perdu': 'non obtenu',
  'valeur': 'intérêt',
  'importance': 'pertinence',
  
  // Émotions jugées
  'stressé': 'tension élevée',
  'fatigué': 'énergie basse',
  'anxieux': 'inquiet',
  'motivé': 'engagé',
  'démotivé': 'désengagé',
  'burnout': 'surcharge prolongée',
  'épuisé': 'énergie épuisée',
  
  // Comparaisons morales
  'mieux que': 'différent de',
  'pire que': 'différent de',
  'meilleur': 'plus adapté',
  'meilleure': 'plus adaptée',
  'supérieur': 'plus pertinent',
  'inférieur': 'moins pertinent',
  
  // Termes de responsabilité
  'je suis nul': 'je rencontre une difficulté',
  'je rate tout': 'je n\'atteins pas mes objectifs',
  'je suis paresseux': 'je manque de motivation',
  'je suis inefficace': 'je peux optimiser',
  'je devrais': 'je pourrais',
  'j\'ai tort': 'j\'ai une perspective différente',
  'j\'ai raison': 'j\'ai une perspective',
  
  // Termes de jugement
  'bon': 'utile',
  'mauvais': 'non optimal',
  'correct': 'approprié',
  'incorrect': 'non approprié',
  'juste': 'équitable',
  'faux': 'inexact',
  'vrai': 'factuel',
  'réel': 'observable'
};

/**
 * Valide et nettoie un texte pour éliminer les termes toxiques
 */
export function validateAndCleanText(text: string): { isValid: boolean; cleanedText: string; forbiddenTermsFound: string[] } {
  const forbiddenTermsFound: string[] = [];
  let cleanedText = text;
  
  // Trier les clés par ordre décroissant de longueur pour éviter les remplacements partiels
  const sortedKeys = Object.keys(FORBIDDEN_TERMS).sort((a, b) => b.length - a.length);
  
  for (const forbiddenTerm of sortedKeys) {
    const replacement = FORBIDDEN_TERMS[forbiddenTerm];
    
    // Recherche insensible à la casse
    const regex = new RegExp('\\b' + escapeRegExp(forbiddenTerm) + '\\b', 'gi');
    
    if (regex.test(cleanedText)) {
      forbiddenTermsFound.push(forbiddenTerm);
      
      // Remplacement en préservant la casse initiale
      cleanedText = cleanedText.replace(regex, (match) => {
        if (match === match.toUpperCase()) {
          return replacement.toUpperCase();
        } else if (match === match.charAt(0).toUpperCase() + match.slice(1).toLowerCase()) {
          return replacement.charAt(0).toUpperCase() + replacement.slice(1);
        }
        return replacement;
      });
    }
  }
  
  return {
    isValid: forbiddenTermsFound.length === 0,
    cleanedText,
    forbiddenTermsFound
  };
}

/**
 * Échappe les caractères spéciaux d'une chaîne pour une utilisation dans une expression régulière
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Vérifie si un texte contient des termes interdits
 */
export function containsForbiddenTerms(text: string): boolean {
  const lowerText = text.toLowerCase();
  return Object.keys(FORBIDDEN_TERMS).some(term => 
    lowerText.includes(term.toLowerCase())
  );
}

/**
 * Nettoie un message utilisateur
 */
export function cleanUserMessage(message: string): string {
  return validateAndCleanText(message).cleanedText;
}

/**
 * Nettoie un message système
 */
export function cleanSystemMessage(message: string): string {
  return validateAndCleanText(message).cleanedText;
}

/**
 * Liste des termes interdits (utile pour les interfaces de développement)
 */
export function getForbiddenTermsList(): string[] {
  return Object.keys(FORBIDDEN_TERMS);
}

/**
 * Remplace un terme par son équivalent neutre
 */
export function replaceForbiddenTerm(term: string): string | null {
  return FORBIDDEN_TERMS[term.toLowerCase()] || null;
}

/**
 * Vérifie si un terme est interdit
 */
export function isForbiddenTerm(term: string): boolean {
  return Object.keys(FORBIDDEN_TERMS).includes(term.toLowerCase());
}

/**
 * Filtre un ensemble de messages
 */
export function filterMessageBatch(messages: string[]): Array<{ original: string; cleaned: string; hasForbidden: boolean }> {
  return messages.map(message => {
    const result = validateAndCleanText(message);
    return {
      original: message,
      cleaned: result.cleanedText,
      hasForbidden: !result.isValid
    };
  });
}

/**
 * Filtre un objet de données pour remplacer les termes interdits
 */
export function filterDataObject(obj: any): any {
  if (typeof obj === 'string') {
    return validateAndCleanText(obj).cleanedText;
  } else if (Array.isArray(obj)) {
    return obj.map(item => filterDataObject(item));
  } else if (obj !== null && typeof obj === 'object') {
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      // Ne pas modifier les clés, seulement les valeurs
      result[key] = filterDataObject(value);
    }
    return result;
  }
  return obj;
}

/**
 * Politique de validation pour les interfaces utilisateur
 */
export function validateUIText(text: string): { isValid: boolean; issues: string[]; suggestions: string[] } {
  const result = validateAndCleanText(text);
  const issues = result.forbiddenTermsFound;
  const suggestions = issues.map(term => `"${term}" → "${FORBIDDEN_TERMS[term]}"`);
  
  return {
    isValid: result.isValid,
    issues,
    suggestions
  };
}

/**
 * Créateur de messages factuels sans jugement
 */
export function createFactualMessage(template: string, params: { [key: string]: any }): string {
  let message = template;
  
  // Remplacer les placeholders
  for (const [key, value] of Object.entries(params)) {
    message = message.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
  }
  
  // Nettoyer le message final
  return cleanSystemMessage(message);
}

/**
 * Messages standard sans termes interdits
 */
export const STANDARD_MESSAGES = {
  taskCompleted: "Tâche marquée comme terminée",
  taskSkipped: "Tâche non sélectionnée",
  sessionEnded: "Session terminée",
  deadlineExpired: "Tâche hors fenêtre temporelle",
  newTaskAdded: "Nouvelle tâche enregistrée",
  reviewRecommended: "Temps recommandé pour revoir les tâches",
  focusSuggested: "Moment propice pour se concentrer",
  breakSuggested: "Pause suggérée",
  scheduleConflict: "Conflit dans le calendrier détecté",
  capacityReached: "Capacité maximale atteinte",
  stabilityLow: "Stabilité énergétique faible détectée",
  detoxMode: "Mode de triage activé"
};