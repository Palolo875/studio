'use server';
/**
 * @fileOverview Recommends tasks tailored to the user's energy levels, intentions, and focus for the day.
 *
 * - personalizedTaskRecommendations - A function that handles the task recommendation process.
 * - PersonalizedTaskRecommendationsInput - The input type for the personalizedTaskRecommendations function.
 * - PersonalizedTaskRecommendationsOutput - The return type for the personalizedTaskRecommendations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PersonalizedTaskRecommendationsInputSchema = z.object({
  energyLevel: z.string().describe('The user\'s current energy level (e.g., high, medium, low).'),
  intention: z.string().describe('The user\'s intention for the day (e.g., focus, learning, creativity).'),
  focus: z.string().describe('The user\'s current focus (e.g., work, personal, health).'),
  timeOfDay: z.string().describe('The current time of day (e.g., morning, afternoon, evening).'),
  tasks: z.array(z.object({
    id: z.string().describe('The unique identifier of the task.'),
    name: z.string().describe('The name of the task.'),
    subtasks: z.number().describe('The number of subtasks the task contains.'),
    lastAccessed: z.string().describe('The last time the task was accessed (ISO format).'),
    completionRate: z.number().describe('The user\'s past completion rate for this task (0-1).'),
  })).describe('A list of tasks to consider for recommendation.'),
});
export type PersonalizedTaskRecommendationsInput = z.infer<typeof PersonalizedTaskRecommendationsInputSchema>;

const PersonalizedTaskRecommendationsOutputSchema = z.object({
  recommendedTasks: z.array(z.object({
    id: z.string().describe('The unique identifier of the recommended task.'),
    reason: z.string().describe('The reason for recommending this task.'),
  })).describe('A list of recommended tasks, with reasons.'),
});
export type PersonalizedTaskRecommendationsOutput = z.infer<typeof PersonalizedTaskRecommendationsOutputSchema>;

export async function personalizedTaskRecommendations(input: PersonalizedTaskRecommendationsInput): Promise<PersonalizedTaskRecommendationsOutput> {
  return personalizedTaskRecommendationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'personalizedTaskRecommendationsPrompt',
  input: {schema: PersonalizedTaskRecommendationsInputSchema},
  output: {schema: PersonalizedTaskRecommendationsOutputSchema},
  prompt: `You are an AI task recommendation assistant. You will receive the user\'s current energy level, intention, focus, time of day, and a list of tasks.

  Based on this information, you will recommend a subset of tasks that are best suited to the user\'s current state.

  Consider the following factors when making your recommendations:
  - Energy Level: Recommend tasks that match the user\'s energy level. For example, if the user has low energy, recommend simpler tasks.
  - Intention: Recommend tasks that align with the user\'s intention for the day. For example, if the user wants to focus, recommend tasks that require concentration.
  - Focus: Recommend tasks that align with the user\'s current focus. For example, if the user is focused on work, recommend work-related tasks.
  - Time of Day: Recommend tasks that are appropriate for the time of day. For example, if it is morning, recommend tasks that require energy.
  - Task Complexity: The number of subtasks a task has.
  - Last Accessed: The last time the task was accessed. Recommend tasks that have not been accessed recently.
  - Completion Rate: The user\'s past completion rate for the task. Recommend tasks that the user has a high completion rate for.

  User Energy Level: {{{energyLevel}}}
  User Intention: {{{intention}}}
  User Focus: {{{focus}}}
  Time of Day: {{{timeOfDay}}}

  Tasks:
  {{#each tasks}}
  - ID: {{{id}}}, Name: {{{name}}}, Subtasks: {{{subtasks}}}, Last Accessed: {{{lastAccessed}}}, Completion Rate: {{{completionRate}}}
  {{/each}}

  Recommended Tasks:`, 
});

const personalizedTaskRecommendationsFlow = ai.defineFlow(
  {
    name: 'personalizedTaskRecommendationsFlow',
    inputSchema: PersonalizedTaskRecommendationsInputSchema,
    outputSchema: PersonalizedTaskRecommendationsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
