/**
 * Capture brute de texte pour le mode RAW_CAPTURE_ONLY
 * Enregistre le texte tel quel sans traitement NLP avancé
 */

export interface RawCaptureTask {
  id: string;
  content: string;
  effort: 'S' | 'M' | 'L';
  priority: 'low' | 'medium' | 'high';
  status: 'todo';
  createdAt: Date;
  sourceType: 'nlp_capture' | 'nlp_full';
  notes?: string;
  confidence?: number;
  entities?: Record<string, string>;
  tags?: string[];
  urgency?: number;
}

/**
 * Crée des tâches de capture brute à partir d'un texte
 * @param text Texte à capturer
 * @returns Tableau de tâches de capture brute
 */
export function basicRawCapture(text: string): RawCaptureTask[] {
  // Séparer le texte en phrases
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  return sentences.map((sentence, index) => {
    // Extraire l'action (premier mot)
    const words = sentence.trim().split(/\s+/);
    const action = words[0] || 'tâche';
    
    return {
      id: `raw-${Date.now()}-${index}`,
      content: sentence.trim(),
      effort: 'M', // Par défaut
      priority: 'medium',
      status: 'todo',
      createdAt: new Date(),
      sourceType: 'nlp_capture',
      notes: 'Capture brute: Texte enregistré tel quel sans traitement NLP',
      tags: [action],
      confidence: 0.1, // Confiance très faible car pas de traitement
      entities: {}, // Pas d'entités extraites
      urgency: 0.1 // Urgence très faible
    };
  });
}