'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

const POMODORO_DURATION = 25 * 60; // 25 minutes in seconds

export default function FocusPage() {
  const params = useParams();
  const router = useRouter();
  const { taskId } = params;

  const [timeRemaining, setTimeRemaining] = useState(POMODORO_DURATION);
  const [isActive, setIsActive] = useState(false);

  const taskName = taskId 
    ? decodeURIComponent(taskId as string)
    : 'votre tâche';

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isActive && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((time) => time - 1);
      }, 1000);
    } else if (timeRemaining === 0) {
      setIsActive(false);
      // Optionnel: Gérer la fin du Pomodoro (ex: notification, son)
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeRemaining]);

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeRemaining(POMODORO_DURATION);
  };

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  const progress = useMemo(() => {
    return (timeRemaining / POMODORO_DURATION) * 100;
  }, [timeRemaining]);
  
  const circumference = 2 * Math.PI * 90; // 2 * pi * radius
  const strokeDashoffset = circumference - (progress / 100) * circumference;


  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center p-4">
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
        >
            <Card className="w-full max-w-md shadow-2xl rounded-3xl">
                <CardHeader>
                    <div className="flex justify-between items-center text-sm text-muted-foreground">
                        <Button variant="ghost" size="sm" onClick={() => router.back()}>Close</Button>
                        <span>{minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}</span>
                    </div>
                    <CardTitle className="text-3xl font-bold pt-4">{taskName}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-8 flex flex-col items-center">
                    
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
                                stroke="hsl(var(--primary))"
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
                            <span className="text-muted-foreground text-sm mt-1">25 min</span>
                        </div>
                    </div>
                    
                    <div className="flex items-center justify-center space-x-4 pb-4">
                        <Button variant="ghost" size="icon" className="h-14 w-14 rounded-full" onClick={resetTimer}>
                            <RefreshCw className="h-6 w-6" />
                        </Button>
                        <Button size="icon" className="h-20 w-20 rounded-full shadow-lg" onClick={toggleTimer}>
                            {isActive ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-14 w-14 rounded-full" disabled>
                            {/* Placeholder for another action */}
                        </Button>
                    </div>

                </CardContent>
            </Card>
        </motion.div>
    </div>
  );
}
