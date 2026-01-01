'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Check, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { TimerDisplay } from './timer-display';
import { NotesSection } from './notes-section';
import { useToast } from '@/hooks/use-toast';
import { useFocusSettings } from '@/hooks/use-focus-settings';

interface FocusModeProps {
  taskName: string;
  taskId: string;
  onClose?: () => void;
  onTaskComplete?: (taskId: string, actualDurationMinutes?: number) => void | Promise<void>;
  onNoteSaved?: (taskId: string, note: string) => void | Promise<void>;
}

export function FocusMode({ 
  taskName, 
  taskId,
  onClose,
  onTaskComplete,
  onNoteSaved
}: FocusModeProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { settings } = useFocusSettings();
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [elapsedWorkSeconds, setElapsedWorkSeconds] = useState(0);

  const handleSessionComplete = (isWorkSession: boolean) => {
    if (isWorkSession) {
      setSessionsCompleted(prev => prev + 1);
      
      // Feedback après chaque session de travail
      toast({
        title: "Bien joué !",
        description: `Session ${sessionsCompleted + 1} terminée. Continuez comme ça !`,
      });
    }
  };

  const handleBack = () => {
    if (onClose) {
      onClose();
    } else {
      router.back();
    }
  };

  const handleTaskComplete = async () => {
    const actualDurationMinutes = Math.max(0, Math.round(elapsedWorkSeconds / 60));
    await Promise.resolve(onTaskComplete?.(taskId, actualDurationMinutes));
    
    // Afficher le toast de félicitations
    toast({
      title: "Tâche terminée !",
      description: "Félicitations pour avoir accompli cette tâche ! 🎉",
    });
    
    // Fermer le mode focus
    handleBack();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="relative w-full max-w-2xl bg-card/50 p-6 rounded-3xl border border-white/10 shadow-2xl"
      >
        <div className="absolute -inset-2 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 rounded-3xl -z-10 blur-md"></div>
        <header className="flex justify-between items-center mb-6">
            <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleBack}
            className="rounded-full"
            >
            <ArrowLeft className="h-5 w-5" />
            <span className="ml-2">Retour</span>
            </Button>
            
            <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => void handleTaskComplete()}
            className="rounded-full text-green-600 hover:text-green-700 hover:bg-green-50"
            >
            <Check className="h-5 w-5" />
            <span className="ml-2">Terminé</span>
            </Button>
        </header>

        <main className="space-y-8">
            <div className="text-center">
                <h2 className="text-xl font-light truncate">{taskName}</h2>
            </div>
            
            {/* Timer Display */}
            <TimerDisplay 
              workDuration={settings.workDuration} 
              breakDuration={settings.breakDuration}
              onSessionComplete={handleSessionComplete}
              onWorkElapsedSecondsChange={setElapsedWorkSeconds}
            />
            
            <p className="text-center text-sm text-muted-foreground">
              Sessions complétées: {sessionsCompleted}
            </p>
            
            {/* Notes Section */}
            <NotesSection
              taskId={taskId}
              autoSaveDelay={settings.autoSaveNotes ? 2000 : 0}
              onSave={(note) => void Promise.resolve(onNoteSaved?.(taskId, note))}
            />
        </main>

      </motion.div>
    </div>
  );
}
