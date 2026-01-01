'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useFocusSettings } from '@/hooks/use-focus-settings';

interface TimerDisplayProps {
  workDuration: number;
  breakDuration: number;
  onSessionComplete?: (isWorkSession: boolean) => void;
  onComplete?: () => void;
  onWorkElapsedSecondsChange?: (elapsedSeconds: number) => void;
}

export function TimerDisplay({ 
  workDuration, 
  breakDuration, 
  onSessionComplete,
  onComplete,
  onWorkElapsedSecondsChange
}: TimerDisplayProps) {
  const { toast } = useToast();
  const { settings } = useFocusSettings();
  const [timeRemaining, setTimeRemaining] = useState(workDuration);
  const [isActive, setIsActive] = useState(false);
  const [isBreakTime, setIsBreakTime] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const [elapsedWorkSeconds, setElapsedWorkSeconds] = useState(0);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialiser l'audio pour le son de fin
  useEffect(() => {
    audioRef.current = new Audio('/sounds/timer-complete.mp3');
  }, []);

  // Gestion du timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isActive && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((time) => time - 1);
        if (!isBreakTime) {
          setElapsedWorkSeconds((prev) => prev + 1);
        }
      }, 1000);
    } else if (timeRemaining === 0 && isActive) {
      // Session terminée
      setIsActive(false);
      
      // Jouer un son discret si activé
      if (settings.soundEnabled && audioRef.current) {
        audioRef.current.play().catch(() => null);
      }
      
      if (!isBreakTime) {
        // Session de travail terminée, démarrer la pause
        setSessionCount(prev => prev + 1);
        setIsBreakTime(true);
        setTimeRemaining(breakDuration);
        
        // Notification
        toast({
          title: "Session terminée !",
          description: "Bien joué ! Prenez une pause de 5 minutes.",
        });
        
        // Callback pour la session terminée
        onSessionComplete?.(true);
      } else {
        // Pause terminée, démarrer une nouvelle session de travail
        setIsBreakTime(false);
        setTimeRemaining(workDuration);
        
        // Notification
        toast({
          title: "Pause terminée !",
          description: "Retour au travail. Vous pouvez le faire !",
        });
        
        // Callback pour la session terminée
        onSessionComplete?.(false);
      }
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeRemaining, isBreakTime, workDuration, breakDuration, toast, onSessionComplete, settings.soundEnabled]);

  useEffect(() => {
    onWorkElapsedSecondsChange?.(elapsedWorkSeconds);
  }, [elapsedWorkSeconds, onWorkElapsedSecondsChange]);

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setIsBreakTime(false);
    setTimeRemaining(workDuration);
    setSessionCount(0);
    setElapsedWorkSeconds(0);
  };

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  const totalDuration = isBreakTime ? breakDuration : workDuration;
  const progress = totalDuration > 0 ? (timeRemaining / totalDuration) * 100 : 0;
  const circumference = 2 * Math.PI * 90;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
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
            strokeWidth="14"
          />
          {/* Progress Circle */}
          <motion.circle
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke={isBreakTime ? "hsl(var(--secondary))" : "hsl(var(--primary))"}
            strokeWidth="14"
            strokeLinecap="round"
            transform="rotate(-90 100 100)"
            style={{ strokeDasharray: circumference, strokeDashoffset }}
            initial={false}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: "circOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-6xl font-bold font-mono text-foreground">
            {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
          </span>
          <span className="text-muted-foreground text-sm mt-1 uppercase tracking-widest">
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
          <RotateCcw className="h-6 w-6" />
        </Button>
        
        <Button 
          size="icon" 
          className="h-20 w-20 rounded-full shadow-lg" 
          onClick={toggleTimer}
        >
          {isActive ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8" />}
        </Button>
      </div>
      
    </div>
  );
}
