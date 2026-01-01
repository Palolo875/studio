import type { Task } from '@/lib/types';
import type { DBTask } from '@/lib/database';

export function dbTaskToUiTask(dbTask: DBTask): Task {
  return {
    id: dbTask.id,
    name: dbTask.title,
    completed: dbTask.status === 'done',
    subtasks: [],
    lastAccessed: (dbTask.lastActivated ?? dbTask.updatedAt ?? dbTask.createdAt ?? new Date()).toISOString(),
    completionRate: dbTask.status === 'done' ? 100 : 0,
    description: dbTask.description,
    nlpHints: dbTask.nlpHints,
    priority: dbTask.urgency === 'urgent' ? 'high' : (dbTask.urgency as Task['priority']),
    energyRequired: dbTask.effort,
    estimatedDuration: dbTask.duration,
    tags: dbTask.tags,
    completedAt: dbTask.completedAt?.toISOString(),
    scheduledDate: dbTask.deadline?.toISOString(),
  };
}

export function uiTaskToDbTask(task: Task, now: Date = new Date()): DBTask {
  return {
    id: task.id,
    title: task.name,
    description: task.description,
    nlpHints: task.nlpHints,
    duration: task.estimatedDuration ?? 30,
    effort: (task.energyRequired as DBTask['effort']) ?? 'medium',
    urgency: (task.priority as DBTask['urgency']) ?? 'medium',
    impact: 'medium',
    deadline: task.scheduledDate ? new Date(task.scheduledDate) : undefined,
    scheduledTime: undefined,
    category: (task.tags && task.tags[0]) || 'general',
    status: task.completed ? 'done' : 'todo',
    activationCount: 0,
    lastActivated: task.lastAccessed ? new Date(task.lastAccessed) : now,
    createdAt: now,
    updatedAt: now,
    completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
    tags: task.tags,
  };
}
