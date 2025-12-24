
'use client';

import { useState, useRef, useEffect, useTransition } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Bot, Mic, Sparkles, PlusCircle } from 'lucide-react';
import { useActionState } from 'react';
import { handleAnalyzeCapture } from '@/app/actions';
import type { AnalyzeCaptureOutput } from '@/ai/flows/analyze-capture-flow';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';

const initialState: { analysis: AnalyzeCaptureOutput | null; error: string | null } = {
  analysis: null,
  error: null,
};

export function CaptureClient() {
  const [content, setContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [state, formAction, isPending] = useActionState(handleAnalyzeCapture, initialState);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);
  
  const handleAddToTasks = () => {
    // In a real app, this would add the tasks to the Reservoir
    console.log("Adding tasks:", state.analysis?.tasks);
    console.log("Adding notes:", state.analysis?.notes);
    // Maybe clear the analysis after adding
  };


  return (
    <div className="flex flex-col items-center justify-start h-full pt-8">
      <form action={formAction} className="w-full max-w-2xl">
        <Textarea
          ref={textareaRef}
          name="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Écrivez librement... une idée, une tâche, une pensée..."
          className="w-full bg-transparent text-lg md:text-xl text-foreground placeholder:text-muted-foreground/50 border-0 focus-visible:ring-0 focus:ring-0 resize-none p-0 focus:outline-none shadow-none"
          minRows={5}
        />
        <div className="flex justify-end items-center gap-2 mt-4">
            <Button type="button" variant="ghost" size="icon" disabled>
                <Mic className="h-5 w-5" />
                <span className="sr-only">Capturer par la voix (bientôt)</span>
            </Button>
            <Button type="submit" disabled={!content.trim() || isPending}>
                {isPending ? 'Analyse en cours...' : 'Analyser et Trier'}
                <Sparkles className="ml-2 h-4 w-4" />
            </Button>
        </div>
      </form>

      <AnimatePresence>
        {state.analysis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-2xl mt-12"
          >
            <Card className="bg-card/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Bot className="h-6 w-6" />
                    Analyse de Kairu
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {state.analysis.tasks.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold">Tâches Suggérées</h4>
                    <ul className="space-y-2">
                      {state.analysis.tasks.map((task, index) => (
                        <li key={index} className="flex flex-col p-3 bg-muted/50 rounded-lg">
                           <span className="font-medium">{task.title}</span>
                           <div className="flex items-center gap-2 mt-1">
                            {task.deadline && <Badge variant="outline">Pour: {task.deadline}</Badge>}
                            {task.priority && <Badge variant="secondary">Priorité: {task.priority}</Badge>}
                           </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {state.analysis.notes && (
                  <div className="space-y-3">
                    <h4 className="font-semibold">Notes</h4>
                    <p className="text-muted-foreground p-3 bg-muted/50 rounded-lg whitespace-pre-wrap">{state.analysis.notes}</p>
                  </div>
                )}
                 {state.analysis.sentiment && (
                  <div className="space-y-3">
                    <h4 className="font-semibold">Sentiment</h4>
                    <p className="text-muted-foreground p-3 bg-muted/50 rounded-lg capitalize">{state.analysis.sentiment}</p>
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
