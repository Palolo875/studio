// Point d'entrée principal pour l'implémentation de la Phase 6
// Adaptation, Apprentissage & Gouvernance du Système

import { 
  AdaptationSignal, 
  Parameters, 
  clampParameters,
  ADAPTATION_CONSTRAINTS
} from './adaptationMemory';
import { aggregateWeek } from './adaptationAggregator';
import { applyAdjustmentRules, logAdaptation } from './adaptationRules';
import { 
  rollbackAdaptation, 
  setupAdaptationPruning, 
  DriftMonitor,
  enterConservativeMode
} from './adaptationController';
import { computeProgressMetrics } from './progressMetrics';
import { computeBrainQuality } from './brainQuality';
import { AdaptationPanel } from './adaptationTransparency';
import { createLogger } from '@/lib/logger';
import {
  addAdaptationSignal as addAdaptationSignalToDb,
  recordAdaptationHistory,
  setSetting,
} from './database/index';

const logger = createLogger('Phase6Implementation');

const ADAPTATION_PARAMETERS_SETTING_KEY = 'adaptation_parameters';

function computeParameterDeltas(before: Parameters, after: Parameters) {
  const deltas: { parameterName: string; oldValue: any; newValue: any }[] = [];
  const keys = Object.keys(after) as Array<keyof Parameters>;
  for (const k of keys) {
    if ((after as any)[k] !== (before as any)[k]) {
      deltas.push({
        parameterName: String(k),
        oldValue: (before as any)[k],
        newValue: (after as any)[k],
      });
    }
  }
  return deltas;
}

// Classe principale pour la gestion de l'adaptation
export class AdaptationManager {
  private parameters: Parameters;
  private driftMonitor: DriftMonitor;
  
  constructor(initialParameters: Parameters) {
    this.parameters = clampParameters(initialParameters);
    this.driftMonitor = new DriftMonitor();
    
    // Démarrer le pruning automatique
    setupAdaptationPruning();

    // Persister les paramètres initiaux (best-effort)
    void setSetting(ADAPTATION_PARAMETERS_SETTING_KEY, this.parameters);
  }
  
  // Ajouter un signal d'adaptation
  addAdaptationSignal(signal: AdaptationSignal) {
    logger.info("Signal d'adaptation reçu", { signal });

    void addAdaptationSignalToDb({
      timestamp: signal.timestamp,
      type: signal.type,
      payload: signal,
    });
    
    // Tracker les paramètres pour la détection de dérive
    this.driftMonitor.track(this.parameters);
  }
  
  // Processus d'adaptation hebdomadaire
  processWeeklyAdaptation(signals: AdaptationSignal[]) {
    // Agréger les signaux de la semaine
    const aggregate = aggregateWeek(signals);
    
    // Appliquer les règles d'ajustement
    const nextParameters = applyAdjustmentRules(aggregate, this.parameters);
    const newParameters = clampParameters(nextParameters);
    
    // Vérifier si la qualité du cerveau a diminué significativement
    // (simulation - dans la vraie implémentation, cela utiliserait les vraies données)
    const brainQualityBefore = 0.7; // Simulation
    const brainQualityAfter = 0.65; // Simulation
    
    if (brainQualityAfter < brainQualityBefore - 0.15) {
      // Rollback automatique si la qualité diminue trop
      logger.warn('Qualité du cerveau diminuée significativement, rollback...');
      // rollbackAdaptation("recent_adaptation_id"); // Dans la vraie implémentation
    }
    
    // Mettre à jour les paramètres + persister
    const before = this.parameters;
    this.parameters = newParameters;
    void setSetting(ADAPTATION_PARAMETERS_SETTING_KEY, this.parameters);

    const deltas = computeParameterDeltas(before, this.parameters);
    if (deltas.length > 0) {
      const adaptationId = `adaptation_${Date.now()}`;
      void recordAdaptationHistory({
        timestamp: Date.now(),
        change: {
          id: adaptationId,
          timestamp: Date.now(),
          parameterChanges: deltas,
          qualityBefore: brainQualityBefore,
          qualityAfter: brainQualityAfter,
          userConsent: 'ACCEPTED',
        },
        reverted: false,
      });
    }
    
    // Tracker les nouveaux paramètres
    this.driftMonitor.track(this.parameters);
    
    return this.parameters;
  }
  
  // Obtenir les métriques de progression
  getProgressMetrics(tasks: any[], sessions: any[], overrides: any[]) {
    return computeProgressMetrics(tasks, sessions, overrides);
  }
  
  // Évaluer la qualité du cerveau
  evaluateBrainQuality(sessions: any[], overrides: any[], modeTransitions: any[]) {
    const quality = computeBrainQuality(sessions, overrides, modeTransitions);
    
    // Entrer en mode conservateur si la qualité est trop basse
    if (quality < 0.5) {
      const conservativeMode = enterConservativeMode();
      logger.info('Passage en mode conservateur', { conservativeMode });
      // Appliquer le mode conservateur
      this.parameters = {
        ...this.parameters,
        maxTasks: conservativeMode.maxTasks,
        strictness: conservativeMode.strictness,
        coachEnabled: conservativeMode.coachEnabled
      };
    }
    
    return quality;
  }
  
  // Obtenir l'interface de transparence
  getTransparencyPanel() {
    return AdaptationPanel();
  }
  
  // Obtenir les paramètres actuels
  getCurrentParameters(): Parameters {
    return { ...this.parameters };
  }
  
  // Détecter la dérive
  detectDrift() {
    return this.driftMonitor.detectDrift();
  }
  
  // Détecter la dérive progressive
  detectProgressiveDrift() {
    return this.driftMonitor.detectProgressiveDrift();
  }
}

// Initialisation avec des paramètres par défaut
export const DEFAULT_PARAMETERS: Parameters = {
  maxTasks: 5,
  strictness: 0.6,
  coachFrequency: 1/30,
  coachEnabled: true,
  energyForecastMode: "ACCURATE",
  defaultMode: "STRICT",
  sessionBuffer: 10,
  estimationFactor: 1.0
};

// Créer une instance du gestionnaire d'adaptation
export const adaptationManager = new AdaptationManager(DEFAULT_PARAMETERS);

// Exporter toutes les fonctionnalités pour une utilisation directe
export {
  // Mémoire d'adaptation
  clampParameters,
  ADAPTATION_CONSTRAINTS,
  
  // Agrégation
  aggregateWeek,
  
  // Règles d'ajustement
  applyAdjustmentRules,
  logAdaptation,
  
  // Contrôleur
  rollbackAdaptation,
  setupAdaptationPruning,
  DriftMonitor,
  enterConservativeMode,
  
  // Métriques de progression
  computeProgressMetrics,
  
  // Qualité du cerveau
  computeBrainQuality,
  
  // Transparence
  AdaptationPanel
};