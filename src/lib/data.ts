export type Task = {
  id: string;
  name: string;
  completed: boolean;
  subtasks: Array<{ id: string; name: string; completed: boolean }>;
  lastAccessed: string;
  completionRate: number;
  priority: 'low' | 'medium' | 'high';
  description?: string;
  tags?: string[];
};

export const initialTasks: Task[] = [
  {
    id: "1",
    name: "Design the new landing page wireframes",
    completed: false,
    subtasks: [
      { id: "sub-1-1", name: "Define sections", completed: true },
      { id: "sub-1-2", name: "Create mobile wireframes", completed: false },
      { id: "sub-1-3", name: "Create desktop wireframes", completed: false },
    ],
    lastAccessed: new Date(Date.now() - 86400000 * 2).toISOString(),
    completionRate: 33,
    priority: "high",
    description: "Create detailed wireframes for all sections of the new landing page, including mobile and desktop views.",
    tags: ["UI/UX", "Design"],
  },
  {
    id: "2",
    name: "Develop the authentication flow",
    completed: false,
    subtasks: [],
    lastAccessed: new Date(Date.now() - 86400000 * 1).toISOString(),
    completionRate: 60,
    priority: "high",
    description: "Implement JWT-based authentication with email/password and Google OAuth providers.",
    tags: ["Development", "Backend"],
  },
  {
    id: "3",
    name: "Write documentation for the API",
    completed: true,
    subtasks: [],
    lastAccessed: new Date(Date.now() - 86400000 * 5).toISOString(),
    completionRate: 100,
    priority: "medium",
    description: "Document all API endpoints using Swagger/OpenAPI specification.",
    tags: ["Documentation"],
  },
  {
    id: "4",
    name: "Brainstorm ideas for Q3 marketing campaign",
    completed: false,
    subtasks: [],
    lastAccessed: new Date(Date.now() - 86400000 * 3).toISOString(),
    completionRate: 90,
    priority: "low",
    description: "Generate and evaluate creative ideas for the upcoming Q3 marketing campaign.",
    tags: ["Marketing", "Strategy"],
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
