// Adaptation Rollback - Système de rollback des adaptations
// Implémentation de la fonctionnalité de retour arrière des adaptations

import { type AdaptationHistory, type ParameterDelta, type Parameters } from './adaptationMemory';
import { createLogger } from '@/lib/logger';

const logger = createLogger('AdaptationRollback');

function makeDelta<K extends ParameterDelta['parameterName']>(
  parameterName: K,
  oldValue: Extract<ParameterDelta, { parameterName: K }>['oldValue'],
  newValue: Extract<ParameterDelta, { parameterName: K }>['newValue']
): Extract<ParameterDelta, { parameterName: K }> {
  return { parameterName, oldValue, newValue } as Extract<ParameterDelta, { parameterName: K }>;
}

// Fonction pour inverser un delta
export function invertDelta(delta: ParameterDelta): ParameterDelta {
  switch (delta.parameterName) {
    case 'maxTasks':
      return makeDelta('maxTasks', delta.newValue, delta.oldValue);
    case 'strictness':
      return makeDelta('strictness', delta.newValue, delta.oldValue);
    case 'coachFrequency':
      return makeDelta('coachFrequency', delta.newValue, delta.oldValue);
    case 'coachEnabled':
      return makeDelta('coachEnabled', delta.newValue, delta.oldValue);
    case 'energyForecastMode':
      return makeDelta('energyForecastMode', delta.newValue, delta.oldValue);
    case 'defaultMode':
      return makeDelta('defaultMode', delta.newValue, delta.oldValue);
    case 'sessionBuffer':
      return makeDelta('sessionBuffer', delta.newValue, delta.oldValue);
    case 'estimationFactor':
      return makeDelta('estimationFactor', delta.newValue, delta.oldValue);
    default:
      return delta;
  }
}

// Fonction pour inverser plusieurs deltas
export function invertDeltas(deltas: ParameterDelta[]): ParameterDelta[] {
  return deltas.map((d) => invertDelta(d));
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
  invertDelta(delta: ParameterDelta): ParameterDelta {
    return invertDelta(delta);
  }

  // Inverser tous les deltas d'une adaptation
  invertDeltas(deltas: ParameterDelta[]): ParameterDelta[] {
    return deltas.map((delta) => this.invertDelta(delta));
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
      logger.info('ADAPTATION_ROLLEDBACK', {
        adaptationId,
        timestamp: Date.now(),
        reason: "User requested rollback"
      });

      // Marquer l'adaptation comme rollbackée dans l'historique
      adaptation.userConsent = "REJECTED";

      // Notifier l'utilisateur
      logger.info('NOTIFICATION: Adaptation annulée avec succès');

      return true;
    } catch (error) {
      logger.error('Error rolling back adaptation', error as Error);
      return false;
    }
  }

  // Appliquer les paramètres avec validation
  async applyParametersWithValidation(deltas: ParameterDelta[]): Promise<void> {
    // Dans une implémentation réelle, cela appliquerait les changements aux paramètres du système
    // avec des validations appropriées
    logger.debug('Applying parameter changes with validation', { deltas });

    // Simulation d'un délai asynchrone
    await new Promise(resolve => setTimeout(resolve, 100));

    // Validation des paramètres
    for (const delta of deltas) {
      // Validation spécifique selon le nom du paramètre
      switch (delta.parameterName) {
        case 'maxTasks':
          {
            const d = delta as Extract<ParameterDelta, { parameterName: 'maxTasks' }>;
            if (typeof d.newValue !== 'number' || d.newValue < 1 || d.newValue > 100) {
              throw new Error(`Invalid maxTasks value: ${d.newValue}. Must be between 1 and 100.`);
            }
          }
          break;
        case 'strictness':
          {
            const d = delta as Extract<ParameterDelta, { parameterName: 'strictness' }>;
            if (typeof d.newValue !== 'number' || d.newValue < 0 || d.newValue > 1) {
              throw new Error(`Invalid strictness value: ${d.newValue}. Must be between 0 and 1.`);
            }
          }
          break;
        case 'coachFrequency':
          {
            const d = delta as Extract<ParameterDelta, { parameterName: 'coachFrequency' }>;
            if (typeof d.newValue !== 'number' || d.newValue <= 0) {
              throw new Error(`Invalid coachFrequency value: ${d.newValue}. Must be > 0.`);
            }
          }
          break;
        case 'coachEnabled':
          {
            const d = delta as Extract<ParameterDelta, { parameterName: 'coachEnabled' }>;
            if (typeof d.newValue !== 'boolean') {
              throw new Error(`Invalid coachEnabled value: ${String(d.newValue)}. Must be boolean.`);
            }
          }
          break;
        case 'energyForecastMode':
          {
            const d = delta as Extract<ParameterDelta, { parameterName: 'energyForecastMode' }>;
            if (d.newValue !== 'ACCURATE' && d.newValue !== 'CONSERVATIVE') {
              throw new Error(`Invalid energyForecastMode value: ${String(d.newValue)}.`);
            }
          }
          break;
        case 'defaultMode':
          {
            const d = delta as Extract<ParameterDelta, { parameterName: 'defaultMode' }>;
            if (typeof d.newValue !== 'string') {
              throw new Error(`Invalid defaultMode value: ${String(d.newValue)}.`);
            }
          }
          break;
        case 'sessionBuffer':
          {
            const d = delta as Extract<ParameterDelta, { parameterName: 'sessionBuffer' }>;
            if (typeof d.newValue !== 'number' || d.newValue < 0) {
              throw new Error(`Invalid sessionBuffer value: ${d.newValue}. Must be >= 0.`);
            }
          }
          break;
        case 'estimationFactor':
          {
            const d = delta as Extract<ParameterDelta, { parameterName: 'estimationFactor' }>;
            if (typeof d.newValue !== 'number' || d.newValue <= 0) {
              throw new Error(`Invalid estimationFactor value: ${d.newValue}. Must be > 0.`);
            }
          }
          break;
        default:
          break;
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