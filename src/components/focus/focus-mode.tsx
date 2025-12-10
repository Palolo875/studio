'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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
  onTaskComplete?: (taskId: string) => void;
}

export function FocusMode({ 
  taskName, 
  taskId,
  onClose,
  onTaskComplete
}: FocusModeProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { settings } = useFocusSettings();
  const [sessionsCompleted, setSessionsCompleted] = useState(0);

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

  const handleTaskComplete = () => {
    // Marquer la tâche comme terminée
    onTaskComplete?.(taskId);
    
    // Afficher le toast de félicitations
    toast({
      title: "Tâche terminée !",
      description: "Félicitations pour avoir accompli cette tâche ! 🎉",
    });
    
    // Fermer le mode focus
    router.back();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="w-full max-w-2xl p-4"
      >
        <Card className="w-full shadow-2xl rounded-3xl border-0 bg-gradient-to-br from-background to-muted/50">
          <CardHeader className="pb-4">
            <div className="flex justify-between items-center">
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
                onClick={handleTaskComplete}
                className="rounded-full text-green-600 hover:text-green-700 hover:bg-green-50"
              >
                <Check className="h-5 w-5" />
                <span className="ml-2">Terminé</span>
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-8">
             <div className="text-center">
                <h2 className="text-xl font-light truncate">{taskName}</h2>
            </div>
            
            {/* Timer Display */}
            <TimerDisplay 
              workDuration={settings.workDuration} 
              breakDuration={settings.breakDuration}
              onSessionComplete={handleSessionComplete}
            />
            
            <p className="text-center text-sm text-muted-foreground">
              Sessions complétées: {sessionsCompleted}
            </p>
            
            {/* Notes Section */}
            <NotesSection autoSaveDelay={settings.autoSaveNotes ? 2000 : 0} />
            
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
