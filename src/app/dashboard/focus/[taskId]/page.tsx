'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Play, Pause, RefreshCw, CheckCircle, Circle, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

const POMODORO_WORK_DURATION = 25 * 60; // 25 minutes in seconds
const POMODORO_BREAK_DURATION = 5 * 60; // 5 minutes in seconds

export default function FocusPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { taskId } = params;
  
  const [timeRemaining, setTimeRemaining] = useState(POMODORO_WORK_DURATION);
  const [isActive, setIsActive] = useState(false);
  const [isBreakTime, setIsBreakTime] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const [notes, setNotes] = useState('');
  const [savedNotes, setSavedNotes] = useState<string[]>([]);
  const notesRef = useRef<HTMLTextAreaElement>(null);

  const taskName = taskId 
    ? decodeURIComponent(taskId as string)
    : 'votre tâche';

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isActive && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((time) => time - 1);
      }, 1000);
    } else if (timeRemaining === 0 && isActive) {
      // Session completed
      setIsActive(false);
      
      if (!isBreakTime) {
        // Work session completed, start break
        setSessionCount(prev => prev + 1);
        setIsBreakTime(true);
        setTimeRemaining(POMODORO_BREAK_DURATION);
        
        // Show completion feedback
        toast({
          title: "Session terminée !",
          description: "Bien joué ! Prenez une pause de 5 minutes.",
        });
      } else {
        // Break completed, start new work session
        setIsBreakTime(false);
        setTimeRemaining(POMODORO_WORK_DURATION);
        
        // Show break completion feedback
        toast({
          title: "Pause terminée !",
          description: "Retour au travail. Vous pouvez le faire !",
        });
      }
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeRemaining, isBreakTime, toast]);

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setIsBreakTime(false);
    setTimeRemaining(POMODORO_WORK_DURATION);
  };

  const saveNotes = () => {
    if (notes.trim()) {
      setSavedNotes(prev => [...prev, notes]);
      setNotes('');
      
      toast({
        title: "Notes sauvegardées",
        description: "Vos notes ont été ajoutées à l'historique.",
      });
    }
  };

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  const progress = useMemo(() => {
    const totalTime = isBreakTime ? POMODORO_BREAK_DURATION : POMODORO_WORK_DURATION;
    return (timeRemaining / totalTime) * 100;
  }, [timeRemaining, isBreakTime]);
  
  const circumference = 2 * Math.PI * 90; // 2 * pi * radius
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const getSessionTitle = () => {
    if (isBreakTime) {
      return `Pause ${sessionCount > 0 ? sessionCount : ''}`;
    }
    return `Session ${sessionCount > 0 ? sessionCount : '1'}`;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <Card className="w-full max-w-md shadow-2xl rounded-3xl">
          <CardHeader>
            <div className="flex justify-between items-center">
              <Button variant="ghost" size="sm" onClick={() => router.back()}>
                Fermer
              </Button>
              <div className="text-sm font-medium text-muted-foreground">
                Session {sessionCount}
              </div>
            </div>
            <CardTitle className="text-3xl font-light pt-4">
              {taskName}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-8 flex flex-col items-center">
            {/* Timer Circle */}
            <div className="relative h-64 w-64 my-4">
              <svg className="w-full h-full" viewBox="0 0 200 200">
                {/* Background Circle */}
                <circle
                  cx="100"
                  cy="100"
                  r="90"
                  fill="none"
                  stroke="hsl(var(--muted))"
                  strokeWidth="12"
                />
                {/* Progress Circle */}
                <motion.circle
                  cx="100"
                  cy="100"
                  r="90"
                  fill="none"
                  stroke={isBreakTime ? "hsl(var(--secondary))" : "hsl(var(--primary))"}
                  strokeWidth="12"
                  strokeLinecap="round"
                  transform="rotate(-90 100 100)"
                  style={{ strokeDasharray: circumference, strokeDashoffset }}
                  transition={{ duration: 1, ease: "easeInOut" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-6xl font-bold font-mono text-foreground">
                  {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
                </span>
                <span className="text-muted-foreground text-sm mt-1">
                  {isBreakTime ? 'Pause' : 'Travail'}
                </span>
              </div>
            </div>
            
            {/* Controls */}
            <div className="flex items-center justify-center space-x-4 pb-4">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-14 w-14 rounded-full" 
                onClick={resetTimer}
              >
                <RefreshCw className="h-6 w-6" />
              </Button>
              
              <Button 
                size="icon" 
                className="h-20 w-20 rounded-full shadow-lg" 
                onClick={toggleTimer}
              >
                {isActive ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8" />}
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-14 w-14 rounded-full"
                onClick={saveNotes}
                disabled={!notes.trim()}
              >
                <Save className="h-6 w-6" />
              </Button>
            </div>
            
            {/* Notes Section */}
            <div className="w-full space-y-4">
              <Textarea
                ref={notesRef}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Prenez des notes rapides pendant votre session..."
                className="min-h-[100px]"
              />
              
              {/* Saved Notes History */}
              <AnimatePresence>
                {savedNotes.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2 text-left"
                  >
                    <h4 className="text-sm font-medium text-muted-foreground">Notes sauvegardées :</h4>
                    <ul className="space-y-2">
                      {savedNotes.map((note, index) => (
                        <motion.li
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          className="flex items-start gap-2 p-2 bg-muted/50 rounded-lg"
                        >
                          <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                          <span className="text-sm">{note}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Session Info */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                {isBreakTime 
                  ? ".pause" 
                  : ".focus"}
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                {isBreakTime 
                  ? "Profitez de cette pause pour vous reposer" 
                  : "Restez concentré sur votre tâche"}
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}