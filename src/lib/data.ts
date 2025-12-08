import type { Task } from "@/lib/types";

export const initialTasks: Task[] = [
  {
    id: "1",
    name: "Design the new landing page wireframes",
    completed: false,
    subtasks: 3,
    lastAccessed: new Date(Date.now() - 86400000 * 2).toISOString(),
    completionRate: 0.8,
  },
  {
    id: "2",
    name: "Develop the authentication flow",
    completed: false,
    subtasks: 5,
    lastAccessed: new Date(Date.now() - 86400000 * 1).toISOString(),
    completionRate: 0.6,
  },
  {
    id: "3",
    name: "Write documentation for the API",
    completed: true,
    subtasks: 0,
    lastAccessed: new Date(Date.now() - 86400000 * 5).toISOString(),
    completionRate: 1.0,
  },
  {
    id: "4",
    name: "Brainstorm ideas for Q3 marketing campaign",
    completed: false,
    subtasks: 0,
    lastAccessed: new Date(Date.now() - 86400000 * 3).toISOString(),
    completionRate: 0.9,
  },
];

export const energyLevels = [
  { value: "high", label: "High Energy" },
  { value: "medium", label: "Medium Energy" },
  { value: "low", label: "Low Energy" },
];

export const intentions = [
  { value: "focus", label: "Deep Focus" },
  { value: "learning", label: "Learning & Growth" },
  { value: "creativity", label: "Creative Exploration" },
  { value: "planning", label: "Planning & Organization" },
];

export const focusAreas = [
  { value: "work", label: "Work Projects" },
  { value: "personal", label: "Personal Goals" },
  { value: "health", label: "Health & Wellness" },
];
