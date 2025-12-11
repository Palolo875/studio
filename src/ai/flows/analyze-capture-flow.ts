'use server';

/**
 * @fileOverview Analyzes raw text input to extract structured tasks and notes.
 *
 * - analyzeCapture - A function that handles the text analysis.
 * - AnalyzeCaptureInput - The input type for the analyzeCapture function.
 * - AnalyzeCaptureOutput - The return type for the analyzeCapture function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeCaptureInputSchema = z.object({
  text: z.string().describe('The raw text captured by the user.'),
});
export type AnalyzeCaptureInput = z.infer<typeof AnalyzeCaptureInputSchema>;

const TaskSchema = z.object({
    title: z.string().describe('The concise title of the task.'),
    deadline: z
      .string()
      .optional()
      .describe(
        'The suggested deadline in a human-readable format, e.g., "demain", "vendredi", "dans 2 semaines".'
      ),
    priority: z
      .enum(['high', 'medium', 'low'])
      .optional()
      .describe('The inferred priority of the task.'),
});

const AnalyzeCaptureOutputSchema = z.object({
  tasks: z.array(TaskSchema).describe('A list of structured tasks extracted from the text.'),
  notes: z.string().optional().describe('Any remaining text or thoughts that are not actionable tasks.'),
  sentiment: z
    .string()
    .optional()
    .describe(
      'The inferred sentiment or energy level of the user based on the text (e.g., "fatigué", "motivé", "stressé").'
    ),
});
export type AnalyzeCaptureOutput = z.infer<typeof AnalyzeCaptureOutputSchema>;

export async function analyzeCapture(input: AnalyzeCaptureInput): Promise<AnalyzeCaptureOutput> {
  return analyzeCaptureFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeCapturePrompt',
  input: {schema: AnalyzeCaptureInputSchema},
  output: {schema: AnalyzeCaptureOutputSchema},
  prompt: `You are an expert assistant specialized in parsing unstructured text and organizing it into actionable tasks and notes.

Analyze the following text provided by the user. Your goal is to:
1. Identify and extract any concrete tasks. For each task, determine a clear title. If a deadline is mentioned (like "demain", "vendredi", "pour le 15"), extract it. Infer a priority (high, medium, or low) based on the language used (e.g., "urgent", "il faut absolument" implies high priority).
2. Consolidate any remaining text that is not a task into a general "notes" field.
3. Briefly analyze the tone of the text to infer the user's sentiment or energy level (e.g., "fatigué", "enthousiaste").

User input:
"{{text}}"

Apply this structure to your analysis.
`,
});

const analyzeCaptureFlow = ai.defineFlow(
  {
    name: 'analyzeCaptureFlow',
    inputSchema: AnalyzeCaptureInputSchema,
    outputSchema: AnalyzeCaptureOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
