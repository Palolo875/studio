// adaptiveExplanation.ts
// Implémentation du système d'explication adaptatif

import { createLogger } from '@/lib/logger';

const logger = createLogger('AdaptiveExplanation');

export type ExplanationLevel = 'SILENT' | 'SIMPLE' | 'DETAILED';

export interface Adaptation {
  id: string;
  timestamp: number;
  parameterChanged: string;
  oldValue: any;
  newValue: any;
  reason: string;
  impact: string;
}

export interface Context {
  cognitiveLoad: number;
  isCurious: boolean;
  adaptationHistory: Adaptation[];
}

export interface Explanation {
  level: ExplanationLevel;
  text?: string;
  logOnly?: boolean;
}

export class AdaptiveExplanationEngine {
  // Obtenir une explication adaptée au contexte
  getExplanation(adaptation: Adaptation, userContext: Context): Explanation {
    // En cas de charge cognitive élevée, explication simple
    if (userContext.cognitiveLoad > 0.7) {
      return {
        level: "SIMPLE",
        text: "Ajusté pour protéger votre énergie."
      };
    }
    
    // Si l'utilisateur est curieux, explication détaillée
    if (userContext.isCurious) {
      return {
        level: "DETAILED",
        text: `Ajusté car ${adaptation.reason}. Impact: ${adaptation.impact}`
      };
    }
    
    // Sinon, explication silencieuse (journalisation uniquement)
    return {
      level: "SILENT",
      logOnly: true
    };
  }
  
  // Générer une explication pour une série d'adaptations
  getBulkExplanation(adaptations: Adaptation[], userContext: Context): Explanation {
    // En cas de charge cognitive élevée, message groupé simple
    if (userContext.cognitiveLoad > 0.7) {
      return {
        level: "SIMPLE",
        text: `${adaptations.length} ajustements appliqués pour optimiser votre productivité.`
      };
    }
    
    // Si l'utilisateur est curieux, liste détaillée
    if (userContext.isCurious) {
      const reasons = adaptations.map(a => a.reason).join(", ");
      return {
        level: "DETAILED",
        text: `Ajustements appliqués pour les raisons suivantes: ${reasons}`
      };
    }
    
    // Sinon, explication silencieuse
    return {
      level: "SILENT",
      logOnly: true
    };
  }
  
  // Formater l'explication pour l'affichage
  formatExplanation(explanation: Explanation): string {
    switch (explanation.level) {
      case "SIMPLE":
        return explanation.text || "Ajustement appliqué";
      case "DETAILED":
        return explanation.text || "Ajustement détaillé appliqué";
      case "SILENT":
        return "Ajustement appliqué (voir les journaux pour plus de détails)";
      default:
        return "Ajustement appliqué";
    }
  }
  
  // Journaliser l'explication
  logExplanation(adaptation: Adaptation, explanation: Explanation): void {
    logger.info('EXPLANATION_LOGGED', {
      adaptationId: adaptation.id,
      level: explanation.level,
      text: explanation.text,
      logOnly: explanation.logOnly
    });
  }
}