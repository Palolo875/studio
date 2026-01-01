import type { DBTask, DBTaskHistory } from '@/lib/database';
import type { CompletionRecord, EnergyState, ProposalRecord, Task } from '@/lib/taskEngine/types';

function toEnergyState(level: EnergyState['level']): EnergyState {
  return {
    level,
    stability: 'stable',
  };
}

function historyToCompletionRecords(history: DBTaskHistory[]): CompletionRecord[] {
  const completed = history.filter((h) => h.action === 'completed');
  return completed.map((h) => ({
    date: h.timestamp,
    actualDuration: h.duration ?? 0,
    energy: toEnergyState(h.energyLevel ?? 'medium'),
  }));
}

function historyToProposalRecords(history: DBTaskHistory[]): ProposalRecord[] {
  const proposed = history.filter((h) => h.action === 'proposed');
  return proposed.map((h) => ({
    date: h.timestamp,
    sessionId: h.sessionId,
  }));
}

export function dbTaskToEngineTask(dbTask: DBTask, history: DBTaskHistory[] = []): Task {
  return {
    id: dbTask.id,
    title: dbTask.title,
    description: dbTask.description,
    duration: dbTask.duration,
    effort: dbTask.effort,
    urgency: dbTask.urgency,
    impact: dbTask.impact,
    deadline: dbTask.deadline,
    scheduledTime: dbTask.scheduledTime,
    completionHistory: historyToCompletionRecords(history),
    proposalHistory: historyToProposalRecords(history),
    category: dbTask.category,
    status: dbTask.status === 'cancelled' ? 'frozen' : dbTask.status,
    activationCount: dbTask.activationCount,
    lastActivated: dbTask.lastActivated,
    createdAt: dbTask.createdAt,
    nlpMetadata: dbTask.nlpHints
      ? {
          detectedLang: dbTask.nlpHints.detectedLang,
          energySuggestion: dbTask.nlpHints.energySuggestion,
          effortSuggestion: dbTask.nlpHints.effortSuggestion,
          confidence: dbTask.nlpHints.confidence,
          isUncertain: dbTask.nlpHints.isUncertain,
          rawText: dbTask.nlpHints.rawText,
        }
      : undefined,
    origin: dbTask.urgency === 'urgent' ? 'imposed' : 'self_chosen',
    hasTangibleResult: true,
  };
}

export function engineTaskToDbTask(task: Task, now: Date = new Date()): DBTask {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    duration: task.duration,
    effort: task.effort,
    urgency: task.urgency,
    impact: task.impact,
    deadline: task.deadline,
    scheduledTime: task.scheduledTime,
    category: task.category,
    status: task.status === 'frozen' ? 'cancelled' : (task.status ?? 'todo'),
    activationCount: task.activationCount ?? 0,
    lastActivated: task.lastActivated,
    createdAt: task.createdAt ?? now,
    updatedAt: now,
    completedAt: task.status === 'done' ? now : undefined,
    tags: task.nlpMetadata?.rawText ? [task.nlpMetadata.rawText] : undefined,
  };
}
