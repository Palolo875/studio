// Transparence des adaptations - Phase 6
import { Parameters, PersistedAdaptationChange } from './adaptationMemory';
import { getSetting, getRecentAdaptationHistory, getSnapshotsByNamePrefix, type DBAdaptationHistory } from './database/index';

// Interface pour les logs d'adaptation
interface AdaptationLogEntry {
  date: number;
  change: string;
  reason: string;
  adaptationId?: string;
}

function getChangeEnvelope(entry: DBAdaptationHistory): PersistedAdaptationChange | undefined {
  if (!entry.change || typeof entry.change !== 'object') return undefined;
  const v = entry.change as Partial<PersistedAdaptationChange>;
  if (typeof v.id !== 'string') return undefined;
  if (typeof v.timestamp !== 'number') return undefined;
  if (!Array.isArray(v.parameterChanges)) return undefined;
  if (v.userConsent !== 'ACCEPTED' && v.userConsent !== 'REJECTED' && v.userConsent !== 'POSTPONED') return undefined;

  return v as PersistedAdaptationChange;
}

function formatDeltaLine(delta: PersistedAdaptationChange['parameterChanges'][number]): string {
  return `${delta.parameterName}: ${String(delta.oldValue)} → ${String(delta.newValue)}`;
}

// Component exemple pour l'UI de transparence
export async function AdaptationPanel() {
  const currentParams = await getSetting<Parameters>('adaptation_parameters');
  const safeParams: Parameters = currentParams ?? {
    maxTasks: 5,
    strictness: 0.6,
    coachFrequency: 1 / 30,
    coachEnabled: true,
    energyForecastMode: 'ACCURATE',
    defaultMode: 'STRICT',
    sessionBuffer: 10,
    estimationFactor: 1.0,
  };

  const history = await getRecentAdaptationHistory(20);
  const logs: AdaptationLogEntry[] = history.map((h) => {
    const env = getChangeEnvelope(h);
    const deltas = Array.isArray(env?.parameterChanges) ? env?.parameterChanges : [];
    const lines = deltas.map(formatDeltaLine).join(' | ');

    const reason =
      typeof env?.qualityBefore === 'number' && typeof env?.qualityAfter === 'number'
        ? `quality ${env.qualityBefore.toFixed(2)} → ${env.qualityAfter.toFixed(2)}`
        : '—';

    return {
      date: h.timestamp,
      change: lines || '—',
      reason: h.reverted ? `REVERTED • ${reason}` : reason,
      adaptationId: typeof env?.id === 'string' ? env.id : undefined,
    };
  });

  const exports = await getSnapshotsByNamePrefix('adaptation_signals_export_', 10);

  return {
    title: "Adaptations du système",
    alert: {
      type: "info",
      message: "Le système s'ajuste en fonction de votre usage réel. Ces changements sont toujours réversibles."
    },
    currentParameters: {
      title: "Paramètres actuels",
      parameters: [
        { label: "Tâches max par session", value: safeParams.maxTasks },
        { label: "Niveau de structure", value: safeParams.strictness },
        { label: "Coach proactif", value: safeParams.coachEnabled }
      ]
    },
    recentChanges: {
      title: "Changements récents",
      logs: logs.map(log => ({
        date: new Date(log.date).toLocaleDateString(),
        change: log.change,
        reason: log.reason,
        adaptationId: log.adaptationId,
      }))
    },
    exports: {
      title: "Exports signaux (snapshots)",
      items: exports.map((s) => ({
        name: s.name,
        date: new Date(s.timestamp).toLocaleDateString(),
      })),
    },
    actions: [
      { label: "Réinitialiser tous les ajustements", action: "resetAdaptation" },
      { label: "Rollback dernière adaptation", action: "rollbackLatest" }
    ]
  };
}

// Fonction pour formater une date
function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}