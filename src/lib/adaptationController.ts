// Contrôleur d'adaptation et de gouvernance - Phase 6
import { 
  Parameters, 
  ParameterDelta, 
  AdaptationHistory,
  clampParameters,
  ADAPTATION_CONSTRAINTS
} from './adaptationMemory';

import { createLogger } from '@/lib/logger';
import {
  getLatestAdaptationHistory,
  markAdaptationHistoryReverted,
  getAdaptationSignalsByPeriod,
  pruneAdaptationSignals,
  getSetting,
  setSetting,
  saveSnapshot,
  recordAdaptationHistory,
} from './database/index';

const logger = createLogger('AdaptationController');

const ADAPTATION_PARAMETERS_SETTING_KEY = 'adaptation_parameters';
const ADAPTATION_SIGNALS_LAST_EXPORTED_CUTOFF_KEY = 'adaptation_signals_last_exported_cutoff';

const DEFAULT_ADAPTATION_PARAMETERS: Parameters = {
  maxTasks: 5,
  strictness: 0.6,
  coachFrequency: 1 / 30,
  coachEnabled: true,
  energyForecastMode: 'ACCURATE',
  defaultMode: 'STRICT',
  sessionBuffer: 10,
  estimationFactor: 1.0,
};

type PersistedAdaptationChange = {
  id: string;
  parameterChanges: ParameterDelta[];
};

function isParameterDelta(value: unknown): value is ParameterDelta {
  if (!value || typeof value !== 'object') return false;
  const v = value as any;
  return typeof v.parameterName === 'string' && 'oldValue' in v && 'newValue' in v;
}

function isPersistedAdaptationChange(value: unknown): value is PersistedAdaptationChange {
  if (!value || typeof value !== 'object') return false;
  const v = value as any;
  if (typeof v.id !== 'string') return false;
  if (!Array.isArray(v.parameterChanges)) return false;
  if (!v.parameterChanges.every(isParameterDelta)) return false;
  return true;
}

// Fonction pour inverser les deltas de paramètres (pour rollback)
export function invertDelta(delta: ParameterDelta[]): ParameterDelta[] {
  return delta.map(d => ({
    parameterName: d.parameterName,
    oldValue: d.newValue,
    newValue: d.oldValue
  }));
}

// Permet rollback
export async function rollbackAdaptation(adaptationId: string) {
  const latest = await getLatestAdaptationHistory();
  if (!latest || typeof latest.change !== 'object' || latest.change === null) {
    logger.warn('Rollback requested but no persisted adaptation history found', { adaptationId });
    return;
  }

  const change = latest.change as unknown;
  if (!isPersistedAdaptationChange(change) || change.id !== adaptationId || change.parameterChanges.length === 0) {
    const persistedId = (change as any)?.id;
    logger.warn('Rollback refused: adaptation id mismatch or missing deltas', { adaptationId, persistedId });
    return;
  }

  const rollback = invertDelta(change.parameterChanges);
  await applyParameters(rollback);
  if (typeof latest.id === 'number') {
    await markAdaptationHistoryReverted(latest.id);
  }
  logger.info('ADAPTATION_ROLLEDBACK', { adaptationId });
}

export async function rollbackLatestAdaptation(): Promise<void> {
  const latest = await getLatestAdaptationHistory();
  if (!latest || typeof latest.change !== 'object' || latest.change === null) {
    logger.warn('Rollback latest requested but no persisted adaptation history found');
    return;
  }

  const change = latest.change as any;
  const id = typeof change?.id === 'string' ? change.id : undefined;
  if (!id) {
    logger.warn('Rollback latest refused: missing adaptation id');
    return;
  }

  await rollbackAdaptation(id);
}

export async function runAdaptationTransparencyAction(action: string): Promise<void> {
  switch (action) {
    case 'resetAdaptation':
      await resetAdaptationToDefaults();
      return;
    case 'rollbackLatest':
      await rollbackLatestAdaptation();
      return;
    default:
      logger.warn('Unknown adaptation transparency action', { action });
      return;
  }
}

// Fonction pour appliquer les paramètres
export async function applyParameters(delta: ParameterDelta[]) {
  const current = await getSetting<Parameters>(ADAPTATION_PARAMETERS_SETTING_KEY);
  const base: Parameters = current ?? DEFAULT_ADAPTATION_PARAMETERS;

  const next: Parameters = { ...base };
  for (const d of delta) {
    (next as any)[d.parameterName] = d.newValue;
  }

  const clamped = clampParameters(next);
  await setSetting(ADAPTATION_PARAMETERS_SETTING_KEY, clamped);
  logger.info('Application des paramètres', { delta });
}

export async function resetAdaptationToDefaults(): Promise<void> {
  const current = await getSetting<Parameters>(ADAPTATION_PARAMETERS_SETTING_KEY);
  const before: Parameters = current ?? DEFAULT_ADAPTATION_PARAMETERS;
  const after: Parameters = DEFAULT_ADAPTATION_PARAMETERS;

  const deltas: ParameterDelta[] = [];
  const keys = Object.keys(after) as Array<keyof Parameters>;
  for (const k of keys) {
    if ((before as any)[k] !== (after as any)[k]) {
      deltas.push({
        parameterName: String(k),
        oldValue: (before as any)[k],
        newValue: (after as any)[k],
      });
    }
  }

  await applyParameters(deltas);

  if (deltas.length > 0) {
    const id = `adaptation_reset_${Date.now()}`;
    await recordAdaptationHistory({
      timestamp: Date.now(),
      change: {
        id,
        timestamp: Date.now(),
        parameterChanges: deltas,
        userConsent: 'ACCEPTED',
      },
      reverted: false,
    });
  }

  logger.info('Adaptation reset to defaults');
}

// Fonction pour afficher une proposition d'adaptation
export function showAdaptationProposal(adjustment: any) {
  // Dans une implémentation réelle, cela afficherait une modale
  logger.info("Proposition d'adaptation", { adjustment });
  return {
    title: "Proposition d'adaptation",
    body: `Le système suggère d'augmenter maxTasks à ${adjustment.maxTasks}`,
    actions: [
      { label: "Accepter", value: "ACCEPT" },
      { label: "Refuser", value: "REJECT" },
      { label: "Reporter", value: "POSTPONE" }
    ]
  };
}

// Fonction pour afficher un bouton de rollback
export function showButton(label: string) {
  // Dans une implémentation réelle, cela afficherait un bouton dans l'UI
  logger.info('Button', { label });
}

// Fonction pour afficher un message
export function showMessage(message: string) {
  // Dans une implémentation réelle, cela afficherait un message à l'utilisateur
  logger.info('Message', { message });
}

// Fonction pour afficher un toast
export function showToast(message: string) {
  // Dans une implémentation réelle, cela afficherait un toast
  logger.info('Toast', { message });
}

// Fonction pour exporter une archive chiffrée
export async function exportEncryptedArchive(signals: any) {
  const now = Date.now();
  const name = `adaptation_signals_export_${now}`;
  await saveSnapshot({
    name,
    timestamp: now,
    snapshot: {
      type: 'adaptation_signals_export',
      createdAt: now,
      count: Array.isArray(signals) ? signals.length : undefined,
      signals,
    },
  });
  logger.info("Exportation des signaux d'adaptation", { name });
}

// Pruning hebdomadaire
export function setupAdaptationPruning() {
  setInterval(async () => {
    const maxAge = ADAPTATION_CONSTRAINTS.ADAPTATION_MEMORY.maxAge;
    const maxSize = ADAPTATION_CONSTRAINTS.ADAPTATION_MEMORY.maxSize;

    if (ADAPTATION_CONSTRAINTS.ADAPTATION_MEMORY.exportBeforePrune) {
      const cutoffTs = Date.now() - maxAge;
      const lastExported = await getSetting<number>(ADAPTATION_SIGNALS_LAST_EXPORTED_CUTOFF_KEY);
      const startTs = typeof lastExported === 'number' ? lastExported : 0;
      const safeStart = Math.min(startTs, cutoffTs);
      const oldSignals = await getAdaptationSignalsByPeriod(safeStart, cutoffTs);
      if (oldSignals.length > 0) {
        await exportEncryptedArchive(oldSignals);
        await setSetting(ADAPTATION_SIGNALS_LAST_EXPORTED_CUTOFF_KEY, cutoffTs);
      }
    }

    const deletedCount = await pruneAdaptationSignals(maxAge, maxSize);
    if (deletedCount > 0) {
      logger.info("Suppression anciens signaux d'adaptation", { count: deletedCount });
    }
  }, 7 * 24 * 60 * 60 * 1000); // Toutes les semaines
}

// Mode conservateur
export function enterConservativeMode() {
  return {
    maxTasks: ADAPTATION_CONSTRAINTS.maxTasks.min,
    strictness: 0.5,
    coachEnabled: false,
    mode: "STRICT",
    reason: "Brain quality < 0.5 — Mode sécurisé activé"
  };
}

// Détecter la dérive progressive
export class DriftMonitor {
  private history: Array<Parameters & { timestamp: number }> = [];
  
  track(params: Parameters) {
    this.history.push({ ...params, timestamp: Date.now() });
    // Keep last 90 days
    if (this.history.length > 90) {
      this.history.shift();
    }
  }
  
  detectDrift() {
    if (this.history.length < 7) return null;
    
    // Compare last week vs 3 weeks ago
    const recent = this.history.slice(-7);
    const baseline = this.history.slice(-21, -14); // 3 weeks ago
    
    // Détecter la dérive pour plusieurs paramètres
    const parametersToCheck = ['strictness', 'maxTasks'];
    
    for (const param of parametersToCheck) {
      const recentValues = recent.map(p => (p as any)[param]);
      const baselineValues = baseline.map(p => (p as any)[param]);
      
      const recentAvg = this.mean(recentValues);
      const baselineAvg = this.mean(baselineValues);
      
      const drift = Math.abs(recentAvg - baselineAvg);
      
      // Seuil de dérive différent selon le paramètre
      const threshold = param === 'strictness' ? 0.2 : 1;
      
      if (drift > threshold) {
        return {
          parameter: param,
          drift: drift,
          direction: recentAvg > baselineAvg ? "UP" : "DOWN",
          recommendation: "Consider reset"
        };
      }
    }
    
    return null;
  }
  
  // Détecter la dérive progressive (tendance sur plusieurs périodes)
  detectProgressiveDrift() {
    if (this.history.length < 28) return null; // Besoin de 4 semaines de données
    
    // Analyser la tendance sur 4 semaines
    const weeklyAverages = [];
    for (let i = 0; i < 4; i++) {
      const weekData = this.history.slice(-(i + 1) * 7, -i * 7 || undefined);
      const avg = this.mean(weekData.map(p => p.strictness));
      weeklyAverages.push(avg);
    }
    
    // Calculer la tendance
    let trend = 0;
    for (let i = 1; i < weeklyAverages.length; i++) {
      trend += weeklyAverages[i] - weeklyAverages[i - 1];
    }
    
    // Si la tendance est significative sur plusieurs semaines
    if (Math.abs(trend) > 0.3) {
      return {
        parameter: "strictness",
        drift: Math.abs(trend),
        direction: trend > 0 ? "UP" : "DOWN",
        recommendation: "Progressive drift detected over 4 weeks"
      };
    }
    
    return null;
  }
  
  // Fonction utilitaire pour calculer la moyenne
  private mean(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }
}