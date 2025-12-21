// Auto-évaluation de la qualité du cerveau - Phase 6
import { Session, Override, ModeTransition } from './types';

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
  sessions: Session[],
  overrides: Override[],
  modeTransitions: ModeTransition[]
): number {
  // 1. Completion accuracy
  const goodSessions = sessions.filter(s => s.completionRate > 0.7);
  const completionAccuracy = goodSessions.length / Math.max(sessions.length, 1);
  
  // 2. Override penalty
  const totalDecisions = sessions.reduce((sum, s) => 
    sum + s.allowedTasks.length + s.rejectedTasks.length, 0);
  
  const overridePenalty = 1 - (overrides.length / Math.max(totalDecisions, 1));
  
  // 3. User alignment
  const systemTriggers = modeTransitions.filter(t => t.triggeredBy === "SYSTEM");
  const modeAcceptance = systemTriggers.length > 0 ? 
    modeTransitions.filter(t => 
      t.triggeredBy === "SYSTEM" && t.userConfirmed).length / 
      systemTriggers.length : 0;
  
  const suggestionAcceptance = sessions.length > 0 ? 
    sessions.reduce((sum, s) => 
      sum + (s.completedTasks / Math.max(s.allowedTasks.length, 1)), 0) / sessions.length : 0;
  
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