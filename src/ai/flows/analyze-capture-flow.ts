/**
 * @fileOverview Local-only capture analysis (no cloud). Parses unstructured text
 * into actionable tasks using the deterministic TaskExtractor pipeline.
 */

import { z } from 'zod';
import { extractTasks, type RawTaskWithContract } from '@/lib/nlp/TaskExtractor';
import { createNLPContractResult } from '@/lib/nlp/NLPContract';
import { basicRawCapture } from '@/lib/nlp/basicRawCapture';

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
  return analyzeCaptureLocal(input);
}

/**
 * Deterministic, local-only pipeline:
 * - Language detection & task extraction (pattern-based)
 * - Simple priority heuristic
 * - Lightweight sentiment heuristic
 * - Fallback to RAW capture if extraction fails
 */
async function analyzeCaptureLocal(input: AnalyzeCaptureInput): Promise<AnalyzeCaptureOutput> {
  const text = input.text.trim();
  if (!text) {
    return { tasks: [], notes: undefined, sentiment: undefined };
  }

  try {
    const rawTasks = extractTasks(text);
    const tasks = rawTasks.map(mapRawTaskToOutput);
    const sentiment = inferSentiment(text);

    // Record contract (even if not persisted yet) to stay aligned with NLP guarantees.
    createNLPContractResult(rawTasks);

    return {
      tasks,
      notes: deriveNotes(text, rawTasks),
      sentiment,
    };
  } catch (error) {
    // Fallback to RAW capture (no cloud, no inference)
    const fallback = basicRawCapture(text);
    const tasks = fallback.map(t => ({
      title: t.content,
      deadline: undefined,
    }));
    return { tasks, notes: undefined, sentiment: inferSentiment(text) };
  }
}

function mapRawTaskToOutput(task: RawTaskWithContract): { title: string; deadline?: string } {
  const title = [task.action, task.object].filter(Boolean).join(' ').trim() || task.rawText;
  return {
    title,
    deadline: task.deadline ?? undefined,
  };
}

function inferSentiment(text: string): string | undefined {
  const lower = text.toLowerCase();
  if (lower.includes('fatigu') || lower.includes('épuis')) return 'fatigué';
  if (lower.includes('stress')) return 'stressé';
  if (lower.includes('motivé') || lower.includes('hâte')) return 'motivé';
  return undefined;
}

function deriveNotes(text: string, tasks: RawTaskWithContract[]): string | undefined {
  const usedSentences = new Set(tasks.map(t => t.rawText.trim()));
  const remaining = text
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0 && !usedSentences.has(s));
  return remaining.length ? remaining.join('. ') : undefined;
}
