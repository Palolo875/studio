// Contrôleur d'adaptation et de gouvernance - Phase 6
import { 
  Parameters, 
  ParameterDelta, 
  AdaptationHistory,
  PersistedAdaptationChange,
  clampParameters,
  ADAPTATION_CONSTRAINTS
} from './adaptationMemory';

import { createLogger } from '@/lib/logger';
import {
  getLatestAdaptationHistory,
  markAdaptationHistoryReverted,
  getAdaptationSignalsByPeriod,
  pruneAdaptationSignals,
  type DBAdaptationSignal,
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

function makeDelta<K extends ParameterDelta['parameterName']>(
  parameterName: K,
  oldValue: Extract<ParameterDelta, { parameterName: K }>['oldValue'],
  newValue: Extract<ParameterDelta, { parameterName: K }>['newValue']
): Extract<ParameterDelta, { parameterName: K }> {
  return {
    parameterName,
    oldValue,
    newValue,
  } as Extract<ParameterDelta, { parameterName: K }>;
}

function isParameterDelta(value: unknown): value is ParameterDelta {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return typeof v.parameterName === 'string' && 'oldValue' in v && 'newValue' in v;
}

function isPersistedAdaptationChange(value: unknown): value is PersistedAdaptationChange {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  if (typeof v.id !== 'string') return false;
  if (typeof v.timestamp !== 'number') return false;
  if (!Array.isArray(v.parameterChanges)) return false;
  if (!v.parameterChanges.every(isParameterDelta)) return false;
  if (v.userConsent !== 'ACCEPTED' && v.userConsent !== 'REJECTED' && v.userConsent !== 'POSTPONED') return false;
  return true;
}

// Fonction pour inverser les deltas de paramètres (pour rollback)
export function invertDelta(delta: ParameterDelta[]): ParameterDelta[] {
  return delta.map((d) => {
    switch (d.parameterName) {
      case 'maxTasks':
        return makeDelta('maxTasks', d.newValue, d.oldValue);
      case 'strictness':
        return makeDelta('strictness', d.newValue, d.oldValue);
      case 'coachFrequency':
        return makeDelta('coachFrequency', d.newValue, d.oldValue);
      case 'coachEnabled':
        return makeDelta('coachEnabled', d.newValue, d.oldValue);
      case 'energyForecastMode':
        return makeDelta('energyForecastMode', d.newValue, d.oldValue);
      case 'defaultMode':
        return makeDelta('defaultMode', d.newValue, d.oldValue);
      case 'sessionBuffer':
        return makeDelta('sessionBuffer', d.newValue, d.oldValue);
      case 'estimationFactor':
        return makeDelta('estimationFactor', d.newValue, d.oldValue);
      default:
        return d;
    }
  });
}

// Permet rollback
export async function rollbackAdaptation(adaptationId: string) {
  const latest = await getLatestAdaptationHistory();
  if (!latest || !isPersistedAdaptationChange(latest.change)) {
    logger.warn('Rollback requested but no persisted adaptation history found', { adaptationId });
    return;
  }

  const change = latest.change;
  if (change.id !== adaptationId || change.parameterChanges.length === 0) {
    logger.warn('Rollback refused: adaptation id mismatch or missing deltas', { adaptationId });
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
  if (!latest || !isPersistedAdaptationChange(latest.change)) {
    logger.warn('Rollback latest requested but no persisted adaptation history found');
    return;
  }

  const change = latest.change;
  const id = change.id;
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
    switch (d.parameterName) {
      case 'maxTasks':
        next.maxTasks = d.newValue;
        break;
      case 'strictness':
        next.strictness = d.newValue;
        break;
      case 'coachFrequency':
        next.coachFrequency = d.newValue;
        break;
      case 'coachEnabled':
        next.coachEnabled = d.newValue;
        break;
      case 'energyForecastMode':
        next.energyForecastMode = d.newValue;
        break;
      case 'defaultMode':
        next.defaultMode = d.newValue;
        break;
      case 'sessionBuffer':
        next.sessionBuffer = d.newValue;
        break;
      case 'estimationFactor':
        next.estimationFactor = d.newValue;
        break;
      default:
        break;
    }
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
  if (before.maxTasks !== after.maxTasks) deltas.push(makeDelta('maxTasks', before.maxTasks, after.maxTasks));
  if (before.strictness !== after.strictness) deltas.push(makeDelta('strictness', before.strictness, after.strictness));
  if (before.coachFrequency !== after.coachFrequency)
    deltas.push(makeDelta('coachFrequency', before.coachFrequency, after.coachFrequency));
  if (before.coachEnabled !== after.coachEnabled)
    deltas.push(makeDelta('coachEnabled', before.coachEnabled, after.coachEnabled));
  if (before.energyForecastMode !== after.energyForecastMode)
    deltas.push(makeDelta('energyForecastMode', before.energyForecastMode, after.energyForecastMode));
  if (before.defaultMode !== after.defaultMode) deltas.push(makeDelta('defaultMode', before.defaultMode, after.defaultMode));
  if (before.sessionBuffer !== after.sessionBuffer)
    deltas.push(makeDelta('sessionBuffer', before.sessionBuffer, after.sessionBuffer));
  if (before.estimationFactor !== after.estimationFactor)
    deltas.push(makeDelta('estimationFactor', before.estimationFactor, after.estimationFactor));

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
export function showAdaptationProposal(adjustment: { maxTasks: number }): {
  title: string;
  body: string;
  actions: { label: string; value: string }[];
} {
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
export async function exportEncryptedArchive(signals: DBAdaptationSignal[]) {
  const now = Date.now();
  const name = `adaptation_signals_export_${now}`;
  await saveSnapshot({
    name,
    timestamp: now,
    snapshot: {
      type: 'adaptation_signals_export',
      createdAt: now,
      count: signals.length,
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
    const parametersToCheck: Array<'strictness' | 'maxTasks'> = ['strictness', 'maxTasks'];
    
    for (const param of parametersToCheck) {
      const recentValues = recent.map((p) => (param === 'strictness' ? p.strictness : p.maxTasks));
      const baselineValues = baseline.map((p) => (param === 'strictness' ? p.strictness : p.maxTasks));
      
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