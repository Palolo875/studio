// Adaptation Rollback - Système de rollback des adaptations
// Implémentation de la fonctionnalité de retour arrière des adaptations

import { ParameterDelta } from './adaptationMemory';

// Interface pour l'historique des adaptations
export interface AdaptationHistory {
  id: string;
  timestamp: number;
  parameterChanges: ParameterDelta[];
  qualityBefore: number;
  qualityAfter: number;
  userConsent: "ACCEPTED" | "REJECTED" | "POSTPONED";
}

// Interface pour les deltas inversés
export interface InvertedDelta {
  parameterName: string;
  oldValue: any;
  newValue: any;
}

// Fonction pour inverser un delta
export function invertDelta(delta: ParameterDelta): InvertedDelta {
  return {
    parameterName: delta.parameterName,
    oldValue: delta.newValue,  // Swap
    newValue: delta.oldValue   // Swap
  };
}

// Fonction pour inverser plusieurs deltas
export function invertDeltas(deltas: ParameterDelta[]): InvertedDelta[] {
  return deltas.map(delta => invertDelta(delta));
}

// Classe pour gérer le rollback des adaptations
export class AdaptationRollbackManager {
  private adaptationHistory: AdaptationHistory[] = [];
  private maxHistorySize: number = 100; // Limite pour éviter une accumulation infinie
  
  constructor(maxHistorySize: number = 100) {
    this.maxHistorySize = maxHistorySize;
  }
  
  // Enregistrer une adaptation dans l'historique
  recordAdaptation(adaptation: AdaptationHistory): void {
    this.adaptationHistory.push(adaptation);
    
    // Limiter la taille de l'historique
    if (this.adaptationHistory.length > this.maxHistorySize) {
      this.adaptationHistory.shift(); // Supprimer la plus ancienne entrée
    }
  }
  
  // Obtenir l'historique des adaptations
  getAdaptationHistory(): AdaptationHistory[] {
    return [...this.adaptationHistory];
  }
  
  // Obtenir une adaptation spécifique par ID
  getAdaptationById(id: string): AdaptationHistory | undefined {
    return this.adaptationHistory.find(adaptation => adaptation.id === id);
  }
  
  // Inverser un delta de paramètre
  invertDelta(delta: ParameterDelta): InvertedDelta {
    return {
      parameterName: delta.parameterName,
      oldValue: delta.newValue,
      newValue: delta.oldValue
    };
  }
  
  // Inverser tous les deltas d'une adaptation
  invertDeltas(deltas: ParameterDelta[]): InvertedDelta[] {
    return deltas.map(delta => this.invertDelta(delta));
  }
  
  // Fonction pour annuler une adaptation
  async rollbackAdaptation(adaptationId: string): Promise<boolean> {
    try {
      // Trouver l'adaptation dans l'historique
      const adaptation = this.getAdaptationById(adaptationId);
      
      if (!adaptation) {
        throw new Error(`Adaptation ${adaptationId} not found`);
      }
      
      // Inverser les deltas
      const rollback = this.invertDeltas(adaptation.parameterChanges);
      
      // Appliquer les changements inversés avec validation
      await this.applyParametersWithValidation(rollback);
      
      // Journaliser le rollback
      console.log("ADAPTATION_ROLLEDBACK", {
        adaptationId,
        timestamp: Date.now(),
        reason: "User requested rollback"
      });
      
      // Marquer l'adaptation comme rollbackée dans l'historique
      adaptation.userConsent = "REJECTED";
      
      // Notifier l'utilisateur
      console.log("NOTIFICATION: Adaptation annulée avec succès");
      
      return true;
    } catch (error) {
      console.error("Error rolling back adaptation:", error);
      return false;
    }
  }
  
  // Appliquer les paramètres avec validation
  async applyParametersWithValidation(deltas: InvertedDelta[]): Promise<void> {
    // Dans une implémentation réelle, cela appliquerait les changements aux paramètres du système
    // avec des validations appropriées
    console.log("Applying parameter changes with validation:", deltas);
    
    // Simulation d'un délai asynchrone
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Validation des paramètres
    for (const delta of deltas) {
      // Vérifier que le paramètre a un nom valide
      if (!delta.parameterName || typeof delta.parameterName !== 'string') {
        throw new Error(`Invalid parameter name: ${delta.parameterName}`);
      }
      
      // Vérifier que la nouvelle valeur n'est pas undefined
      if (delta.newValue === undefined) {
        throw new Error(`Invalid value for parameter ${delta.parameterName}`);
      }
      
      // Vérifier que l'ancienne valeur n'est pas undefined
      if (delta.oldValue === undefined) {
        throw new Error(`Invalid old value for parameter ${delta.parameterName}`);
      }
      
      // Validation spécifique selon le nom du paramètre
      switch (delta.parameterName) {
        case 'maxTasks':
          if (typeof delta.newValue !== 'number' || delta.newValue < 1 || delta.newValue > 100) {
            throw new Error(`Invalid maxTasks value: ${delta.newValue}. Must be between 1 and 100.`);
          }
          break;
        case 'dailyLoad':
          if (typeof delta.newValue !== 'number' || delta.newValue < 0 || delta.newValue > 5) {
            throw new Error(`Invalid dailyLoad value: ${delta.newValue}. Must be between 0 and 5.`);
          }
          break;
        case 'recoveryTime':
          if (typeof delta.newValue !== 'number' || delta.newValue < 1 || delta.newValue > 24) {
            throw new Error(`Invalid recoveryTime value: ${delta.newValue}. Must be between 1 and 24 hours.`);
          }
          break;
        default:
          // Pour d'autres paramètres, juste vérifier qu'ils ne sont pas null
          if (delta.newValue === null) {
            throw new Error(`Null value not allowed for parameter ${delta.parameterName}`);
          }
      }
    }
  }
  
  // Nettoyer l'historique (supprimer les adaptations trop anciennes)
  cleanupHistory(maxAgeDays: number = 90): void {
    const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;
    const cutoffTime = Date.now() - maxAgeMs;
    
    this.adaptationHistory = this.adaptationHistory.filter(
      adaptation => adaptation.timestamp > cutoffTime
    );
  }
  
  // Obtenir les adaptations pouvant être rollbackées (celles qui ont été acceptées)
  getRollbackableAdaptations(): AdaptationHistory[] {
    return this.adaptationHistory.filter(
      adaptation => adaptation.userConsent === "ACCEPTED"
    );
  }
  
  // Exporter l'historique des adaptations
  exportHistory(): string {
    return JSON.stringify(this.adaptationHistory, null, 2);
  }
}