// Auto-évaluation de la qualité du cerveau - Phase 6

type SessionLike = {
  completionRate?: number;
  completedTasks?: number;
  plannedTasks?: number;
  allowedTasks?: unknown[];
  rejectedTasks?: unknown[];
};

type OverrideLike = unknown;

type ModeTransitionLike = {
  triggeredBy?: string;
  userConfirmed?: boolean;
};

export interface BrainQualityComponents {
  // 1. Completion accuracy
  completionAccuracy: number;
  
  // = (sessions avec >70% completion) / (total sessions)
  
  // 2. Override penalty
  overridePenalty: number;
  
  // = 1 - (overrides / total decisions)
  
  // 3. User alignment score
  userAlignmentScore: number;
  
  // = weighted average of:
  // - Mode acceptance (user keeps suggested mode)
  // - Suggestion acceptance (user follows playlist)
  // - Energy alignment (predicted vs actual)
}

export function computeBrainQuality(
  sessions: SessionLike[],
  overrides: OverrideLike[],
  modeTransitions: ModeTransitionLike[]
): number {
  // 1. Completion accuracy
  const goodSessions = sessions.filter(s => {
    if (typeof s.completionRate === 'number') return s.completionRate > 0.7;
    if (typeof s.completedTasks === 'number' && typeof s.plannedTasks === 'number' && s.plannedTasks > 0) {
      return (s.completedTasks / s.plannedTasks) > 0.7;
    }
    return false;
  });
  const completionAccuracy = goodSessions.length / Math.max(sessions.length, 1);
  
  // 2. Override penalty
  const totalDecisions = sessions.reduce((sum, s) => {
    const allowed = Array.isArray(s.allowedTasks) ? s.allowedTasks.length : (typeof s.plannedTasks === 'number' ? s.plannedTasks : 0);
    const rejected = Array.isArray(s.rejectedTasks) ? s.rejectedTasks.length : 0;
    return sum + allowed + rejected;
  }, 0);
  
  const overridePenalty = 1 - (overrides.length / Math.max(totalDecisions, 1));
  
  // 3. User alignment
  const systemTriggers = modeTransitions.filter(t => t.triggeredBy === "SYSTEM");
  const modeAcceptance = systemTriggers.length > 0 ? 
    modeTransitions.filter(t => 
      t.triggeredBy === "SYSTEM" && t.userConfirmed).length / 
      systemTriggers.length : 0;
  
  const suggestionAcceptance = sessions.length > 0 ? 
    sessions.reduce((sum, s) => {
      const completed = typeof s.completedTasks === 'number' ? s.completedTasks : 0;
      const planned = Array.isArray(s.allowedTasks)
        ? s.allowedTasks.length
        : (typeof s.plannedTasks === 'number' ? s.plannedTasks : 0);
      return sum + (completed / Math.max(planned, 1));
    }, 0) / sessions.length : 0;
  
  const userAlignmentScore = (modeAcceptance + suggestionAcceptance) / 2;
  
  // Final score
  return (
    0.4 * completionAccuracy +
    0.3 * overridePenalty +
    0.3 * userAlignmentScore
  );
}

// Mode conservateur
export function enterConservativeMode() {
  return {
    maxTasks: 3,
    strictness: 0.5,
    coachEnabled: false,
    mode: "STRICT",
    reason: "Brain quality < 0.5 — Mode sécurisé activé"
  };
}