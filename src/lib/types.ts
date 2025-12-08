
export type Task = {
  id: string;
  name: string;
  completed: boolean;
  subtasks: number;
  lastAccessed: string; // ISO string
  completionRate: number; // 0-100
  description?: string;
  priority?: "low" | "medium" | "high";
  energyRequired?: "low" | "medium" | "high";
  estimatedDuration?: number;
  objective?: string;
  autoSelected?: boolean;
  tags?: string[];
};

export type DailyRituals = {
  playlistShuffledCount: number;
};
