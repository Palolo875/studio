/**
 * Genkit is disabled (local-first). Stub kept to avoid import errors.
 */

export type PersonalizedTaskRecommendationsInput = {
  energyLevel: string;
  intention: string;
  focus: string;
  timeOfDay: string;
  tasks: Array<{
    id: string;
    name: string;
    subtasks: number;
    lastAccessed: string;
    completionRate: number;
  }>;
};

export type PersonalizedTaskRecommendationsOutput = {
  recommendedTasks: Array<{ id: string; reason: string }>;
};

export async function personalizedTaskRecommendations(
  _input: PersonalizedTaskRecommendationsInput
): Promise<PersonalizedTaskRecommendationsOutput> {
  throw new Error('Genkit flow disabled in local-first mode.');
}
