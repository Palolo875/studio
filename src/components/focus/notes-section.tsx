'use client';

import { useState, useEffect, useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Save, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { useFocusSettings } from '@/hooks/use-focus-settings';
import { getTaskHistory } from '@/lib/database';

interface NotesSectionProps {
  taskId?: string;
  onSave?: (note: string) => void;
  autoSaveDelay?: number; // en millisecondes
}

export function NotesSection({ taskId, onSave, autoSaveDelay = 2000 }: NotesSectionProps) {
  const { toast } = useToast();
  const { settings } = useFocusSettings();
  const [notes, setNotes] = useState('');
  const [savedNotes, setSavedNotes] = useState<string[]>([]);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const notesRef = useRef<HTMLTextAreaElement>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!taskId) return;
      if (taskId === 'task-id-placeholder') return;
      try {
        const history = await getTaskHistory(taskId);
        if (cancelled) return;
        const extracted = history
          .map((h) => {
            const note = (h as any)?.notes;
            return typeof note === 'string' ? note : null;
          })
          .filter((v): v is string => Boolean(v));

        setSavedNotes(extracted);
      } catch {
        // ignore
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [taskId]);

  // Gestion de la sauvegarde automatique
  useEffect(() => {
    if (settings.autoSaveNotes && autoSaveDelay > 0 && notes.trim()) {
      // Effacer le timeout précédent s'il existe
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      
      // Configurer un nouveau timeout
      autoSaveTimeoutRef.current = setTimeout(() => {
        handleAutoSave();
      }, autoSaveDelay);
    }
    
    // Nettoyer le timeout lors du démontage
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [notes, autoSaveDelay, settings.autoSaveNotes]);

  const refreshFromDb = async () => {
    if (!taskId) return;
    if (taskId === 'task-id-placeholder') return;
    try {
      const history = await getTaskHistory(taskId);
      const extracted = history
        .map((h) => {
          const note = (h as any)?.notes;
          return typeof note === 'string' ? note : null;
        })
        .filter((v): v is string => Boolean(v));
      setSavedNotes(extracted);
    } catch {
      // ignore
    }
  };

  const handleAutoSave = async () => {
    if (notes.trim()) {
      setSavedNotes(prev => [...prev, notes]);
      setNotes('');
      setLastSaved(new Date());
      
      toast({
        title: "Notes sauvegardées",
        description: "Vos notes ont été sauvegardées automatiquement.",
      });
      
      onSave?.(notes);
      await refreshFromDb();
    }
  };

  const handleManualSave = async () => {
    if (notes.trim()) {
      setSavedNotes(prev => [...prev, notes]);
      setNotes('');
      setLastSaved(new Date());
      
      toast({
        title: "Notes sauvegardées",
        description: "Vos notes ont été ajoutées à l'historique.",
      });
      
      onSave?.(notes);
      await refreshFromDb();
    }
  };

  return (
    <div className="w-full space-y-4">
      <div className="relative">
        <Textarea
          ref={notesRef}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Prenez des notes rapides pendant votre session..."
          className="min-h-[120px]"
        />
        {notes.trim() && (
          <Button
            size="sm"
            variant="ghost"
            className="absolute bottom-2 right-2"
            onClick={() => void handleManualSave()}
          >
            <Save className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      {/* Indicateur de dernière sauvegarde */}
      {lastSaved && (
        <div className="text-xs text-muted-foreground text-right">
          Dernière sauvegarde: {lastSaved.toLocaleTimeString()}
        </div>
      )}
      
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
              {[...savedNotes].reverse().map((note, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg"
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
  );
}