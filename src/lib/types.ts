export type Task = {
  id: string;
  name: string;
  completed: boolean;
  subtasks: number;
  lastAccessed: string; // ISO string
  completionRate: number; // 0-1
  description?: string;
  priority?: "low" | "medium" | "high";
};
