// Métriques de progression utilisateur - Phase 6

type TaskLike = {
  tangibleResult?: boolean;
  status?: string;
  estimatedDuration?: number;
  actualDuration?: number;
  createdAt?: Date | number;
};

type SessionLike = {
  plannedTasks: number;
  completedTasks: number;
};

type OverrideLike = {
  timestamp: number;
};

// Calcul métriques progression
export interface UserProgressMetrics {
  // 1. Taux complétion tangible
  tangibleCompletionRate: number; // 0-1
  
  // = (tâches tangibles complétées) / (tâches tangibles totales)
  
  // 2. Stabilité sessions
  sessionStabilityScore: number; // 0-1
  
  // = 1 - (variance completion rates)
  
  // 3. Tendance overrides
  overrideTrend: "UP" | "DOWN" | "STABLE";
  
  // Compare last 2 weeks vs previous 2 weeks
  
  // 4. Précision estimation
  estimationAccuracy: number; // 0-1
  
  // = 1 - avg(|estimated - actual| / estimated)
  
  // 5. Récurrence long-terme
  longTermRecurrence: number; // 0-1
  
  // = (tâches >7j completed) / (tâches >7j created)
}

// Constantes pour les calculs
const DAY_MS = 24 * 60 * 60 * 1000;

// Fonction utilitaire pour calculer la moyenne
function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

// Fonction utilitaire pour calculer la variance
export function computeVariance(values: number[]): number {
  if (values.length <= 1) return 0;
  
  const meanValue = mean(values);
  const squaredDiffs = values.map(value => Math.pow(value - meanValue, 2));
  return mean(squaredDiffs);
}

export function computeProgressMetrics(
  tasks: TaskLike[],
  sessions: SessionLike[],
  overrides: OverrideLike[]
): UserProgressMetrics {
  // 1. Tangible completion
  const tangibleTasks = tasks.filter(t => t.tangibleResult === true);
  const completedTangible = tangibleTasks.filter(t => String(t.status).toUpperCase() === "DONE");
  const tangibleRate = tangibleTasks.length > 0 ? completedTangible.length / tangibleTasks.length : 0;
  
  // 2. Session stability
  const completionRates = sessions
    .filter(s => s.plannedTasks > 0)
    .map(s => s.completedTasks / s.plannedTasks);
  
  const variance = completionRates.length > 0 ? computeVariance(completionRates) : 0;
  const stability = 1 - Math.min(variance, 1);
  
  // 3. Override trend
  const now = Date.now();
  const recentOverrides = overrides.filter(o => o.timestamp > now - 14 * DAY_MS);
  const previousOverrides = overrides.filter(o => 
    o.timestamp > now - 28 * DAY_MS && o.timestamp <= now - 14 * DAY_MS
  );
  
  let trend: "UP" | "DOWN" | "STABLE" = "STABLE";
  if (previousOverrides.length > 0) {
    const ratio = recentOverrides.length / previousOverrides.length;
    if (ratio > 1.2) trend = "UP";
    else if (ratio < 0.8) trend = "DOWN";
  }
  
  // 4. Estimation accuracy
  const withActual = tasks.filter(t => t.estimatedDuration && t.actualDuration);
  let accuracy = 1;
  
  if (withActual.length > 0) {
    const errors = withActual
      .map(t => Math.abs((t.estimatedDuration || 0) - (t.actualDuration || 0)) / (t.estimatedDuration || 1))
      .filter(e => !isNaN(e)); // Filtrer les valeurs invalides
    
    accuracy = errors.length > 0 ? 1 - mean(errors) : 1;
  }
  
  // 5. Long-term recurrence
  const longTermTasks = tasks.filter(t => {
    const createdAtMs = t.createdAt instanceof Date ? t.createdAt.getTime() : (typeof t.createdAt === 'number' ? t.createdAt : undefined);
    if (typeof createdAtMs !== 'number') return false;
    return createdAtMs < now - 7 * DAY_MS;
  });
  const completedLongTerm = longTermTasks.filter(t => String(t.status).toUpperCase() === "DONE");
  const recurrence = longTermTasks.length > 0 ? completedLongTerm.length / longTermTasks.length : 0;
  
  return {
    tangibleCompletionRate: tangibleRate,
    sessionStabilityScore: stability,
    overrideTrend: trend,
    estimationAccuracy: accuracy,
    longTermRecurrence: recurrence
  };
}