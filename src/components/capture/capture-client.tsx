
'use client';

import { useState, useRef, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Bot, Mic, Sparkles, PlusCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { upsertTasks, type DBTask } from '@/lib/database';
import { useToast } from '@/hooks/use-toast';
import { extractTasks, type RawTaskWithContract } from '@/lib/nlp/TaskExtractor';
import { basicRawCapture } from '@/lib/nlp/basicRawCapture';
import { createNLPContractResult } from '@/lib/nlp/NLPContract';
import { classifyTask } from '@/lib/nlp/RealTaskClassifier';
import { createFullTask } from '@/lib/nlp/TaskFactory';

type AnalyzeCaptureOutput = {
  rawTasks: RawTaskWithContract[];
  tasks: Array<{ title: string; deadline?: string; priority?: 'low' | 'medium' | 'high' | 'urgent' }>;
  dbTasks: DBTask[];
  notes?: string;
  sentiment?: string;
};

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

function urgencyToPriority(urgency: number | undefined): 'low' | 'medium' | 'high' | 'urgent' | undefined {
  if (urgency == null || Number.isNaN(urgency)) return undefined;
  if (urgency >= 0.9) return 'urgent';
  if (urgency >= 0.7) return 'high';
  if (urgency >= 0.4) return 'medium';
  return 'low';
}

async function analyzeCaptureLocal(text: string): Promise<AnalyzeCaptureOutput> {
  const input = text.trim();
  if (!input) return { rawTasks: [], tasks: [], dbTasks: [], notes: undefined, sentiment: undefined };

  try {
    const rawTasks = extractTasks(input);

    const classified = await Promise.all(
      rawTasks.map(async (task) => ({ raw: task, classification: await classifyTask(task) }))
    );
    const dbTasks = classified.map(({ raw, classification }) => {
      const task = createFullTask(raw, classification);
      return {
        ...task,
        nlpHints: {
          detectedLang: (raw as any).metadata?.detectedLang || 'fr',
          confidence: raw.confidence,
          isUncertain: (classification as any).isUncertain || false,
          rawText: raw.rawText
        }
      };
    });

    const tasks = classified.map(({ raw, classification }) => {
      const title =
        raw.action === 'tâche'
          ? raw.object
          : ([raw.action, raw.object].filter(Boolean).join(' ').trim() || raw.rawText);
      return {
        title,
        deadline: raw.deadline ?? undefined,
        priority: urgencyToPriority(classification.urgency),
      };
    });

    createNLPContractResult(rawTasks);

    return {
      rawTasks,
      tasks,
      dbTasks,
      notes: deriveNotes(input, rawTasks),
      sentiment: inferSentiment(input),
    };
  } catch {
    const fallback = basicRawCapture(input);
    const now = new Date();
    const dbTasks: DBTask[] = fallback.map((t, index) => ({
      id: `capture_${now.getTime()}_${index}`,
      title: t.content,
      description: t.notes,
      duration: 30,
      effort: 'medium',
      urgency: 'medium',
      impact: 'medium',
      deadline: undefined,
      scheduledTime: undefined,
      category: 'capture',
      status: 'todo',
      activationCount: 0,
      lastActivated: now,
      createdAt: now,
      updatedAt: now,
      completedAt: undefined,
      tags: t.tags,
    }));
    const tasks = fallback.map(t => ({
      title: t.content,
      deadline: undefined,
    }));

    return { rawTasks: [], tasks, dbTasks, notes: undefined, sentiment: inferSentiment(input) };
  }
}

export function CaptureClient() {
  const [content, setContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [analysis, setAnalysis] = useState<AnalyzeCaptureOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();

  const DRAFT_KEY = 'kairuflow.capture.draft.v1';

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const existing = window.sessionStorage.getItem(DRAFT_KEY);
      if (existing && !content) {
        setContent(existing);
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const timer = window.setTimeout(() => {
      try {
        if (content) {
          window.sessionStorage.setItem(DRAFT_KEY, content);
        } else {
          window.sessionStorage.removeItem(DRAFT_KEY);
        }
      } catch {
        // ignore
      }
    }, 250);

    return () => {
      window.clearTimeout(timer);
    };
  }, [content]);
  
  const handleAddToTasks = async () => {
    if (!analysis) return;

    try {
      await upsertTasks(analysis.dbTasks);
      toast({
        title: 'Ajouté',
        description: `${analysis.dbTasks.length} tâche(s) ajoutée(s) à la bibliothèque.`,
      });
      try {
        if (typeof window !== 'undefined') {
          window.sessionStorage.removeItem(DRAFT_KEY);
        }
      } catch {
        // ignore
      }
      setContent('');
      setAnalysis(null);
    } catch {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: "Impossible d'ajouter les tâches.",
      });
    }
  };

  const handleAnalyze = async () => {
    const text = content.trim();
    if (!text) return;

    setIsPending(true);
    setError(null);
    try {
      const result = await analyzeCaptureLocal(text);
      setAnalysis(result);
    } catch (e) {
      setAnalysis(null);
      setError(e instanceof Error ? e.message : "Échec de l'analyse");
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: "Échec de l'analyse de la capture.",
      });
    } finally {
      setIsPending(false);
    }
  };


  return (
    <div className="relative h-full w-full px-4 sm:px-8 md:px-12 lg:px-24 xl:px-32 py-12">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void handleAnalyze();
        }}
        className="w-full h-full flex flex-col"
      >
        <Textarea
          ref={textareaRef}
          name="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Écrivez librement..."
          className="w-full flex-1 bg-transparent text-lg md:text-xl text-foreground placeholder:text-muted-foreground/50 border-0 focus-visible:ring-0 focus:ring-0 resize-none p-0 focus:outline-none shadow-none leading-relaxed"
          minRows={5}
        />
        <div className="fixed bottom-6 right-6 flex items-center gap-2 z-20">
            <Button type="button" variant="ghost" size="icon" disabled>
                <Mic className="h-5 w-5" />
                <span className="sr-only">Capturer par la voix (bientôt)</span>
            </Button>
            <Button type="submit" disabled={!content.trim() || isPending}>
                {isPending ? 'Analyse...' : 'Analyser et Trier'}
                <Sparkles className="ml-2 h-4 w-4" />
            </Button>
        </div>
      </form>

      <AnimatePresence>
        {analysis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-3xl mt-12 mx-auto"
          >
            <Card className="bg-card/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Bot className="h-6 w-6" />
                    Analyse de Kairu
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {analysis.tasks.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold">Tâches Suggérées</h4>
                    <ul className="space-y-2">
                      {analysis.tasks.map((task, index) => (
                        <li key={index} className="flex flex-col p-3 bg-muted/50 rounded-lg">
                           <span className="font-medium">{task.title}</span>
                           <div className="flex items-center gap-2 mt-1">
                            {task.deadline && <Badge variant="outline">Pour: {task.deadline}</Badge>}
                            {/* @ts-ignore */}
                            {task.priority && <Badge variant="secondary">Priorité: {task.priority}</Badge>}
                           </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {analysis.notes && (
                  <div className="space-y-3">
                    <h4 className="font-semibold">Notes</h4>
                    <p className="text-muted-foreground p-3 bg-muted/50 rounded-lg whitespace-pre-wrap">{analysis.notes}</p>
                  </div>
                )}
                 {analysis.sentiment && (
                  <div className="space-y-3">
                    <h4 className="font-semibold">Sentiment</h4>
                    <p className="text-muted-foreground p-3 bg-muted/50 rounded-lg capitalize">{analysis.sentiment}</p>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                 <Button onClick={handleAddToTasks}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Ajouter à la Bibliothèque
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
