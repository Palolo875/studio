'use client';

import type { Task } from '@/lib/types';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  ChevronDown,
  Circle,
  MoreVertical,
  HelpCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { FocusButton } from './focus-button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useState } from 'react';
import { Textarea } from '../ui/textarea';
import { motion, AnimatePresence } from 'framer-motion';
import { ExpandableSection } from '../ui/expandable-section';

interface TaskListProps {
  tasks: Task[];
  onToggleCompletion: (taskId: string) => void;
}

export function TaskList({ tasks, onToggleCompletion }: TaskListProps) {
  const [openCollapsibleId, setOpenCollapsibleId] = useState<string | null>(
    null
  );

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <CheckCircle2 className="mx-auto h-12 w-12" />
        <h3 className="mt-4 text-lg font-semibold">
          Playlist du jour terminée !
        </h3>
        <p className="mt-2 text-sm">
          Vous avez accompli toutes vos tâches. C'est le moment de célébrer !
        </p>
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-4"
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          transition: {
            staggerChildren: 0.1,
          },
        },
      }}
    >
      <AnimatePresence>
        {tasks.map(task => (
          <motion.div
            key={task.id}
            layout
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            }}
            exit={{ opacity: 0, x: -50, height: 0 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          >
            <Collapsible
              open={openCollapsibleId === task.id}
              onOpenChange={isOpen => {
                if (isOpen) {
                  setOpenCollapsibleId(task.id);
                } else {
                  setOpenCollapsibleId(null);
                }
              }}
              className="group rounded-2xl border border-border/80 bg-card shadow-sm transition-all hover:border-primary/50"
            >
              <div className="flex items-center p-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={() => onToggleCompletion(task.id)}
                >
                  {task.completed ? (
                    <CheckCircle2 className="h-6 w-6 text-green-500" />
                  ) : (
                    <Circle className="h-6 w-6 text-muted-foreground" />
                  )}
                </Button>
                <div className="flex-1 ml-4">
                  <p
                    className={cn(
                      'font-medium text-foreground',
                      task.completed && 'text-muted-foreground line-through'
                    )}
                  >
                    {task.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {task.priority && (
                      <span className="capitalize">{task.priority}</span>
                    )}
                    {task.subtasks > 0 && ` · ${task.subtasks} sous-tâches`}
                  </p>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <FocusButton taskId={task.id} taskName={task.name} />
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <HelpCircle className="h-4 w-4 mr-2" />
                      Comment l'aborder ?
                      <ChevronDown className="h-4 w-4 ml-2 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                    </Button>
                  </CollapsibleTrigger>
                </div>
              </div>
              <CollapsibleContent>
                <div className="border-t px-4 py-4 space-y-4">
                  <ExpandableSection
                    title="Technique Suggérée"
                    strategy="Utiliser le Time Blocking pour dédier une fenêtre de temps ininterrompue à cette tâche."
                    techniques={[
                      'Estimer le temps nécessaire.',
                      'Bloquer une plage horaire dans votre calendrier.',
                      'Couper toutes les notifications pendant ce bloc.',
                    ]}
                  />

                  <div className="flex justify-end pt-2">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="link" size="sm">
                          Pas maintenant
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Reporter cette tâche
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Une petite note pour plus tard ? Savoir pourquoi
                            vous reportez peut vous aider à mieux planifier.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <Textarea placeholder="Ex: Pas la bonne énergie, besoin d'infos de X..." />
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction>Sauvegarder & Reporter</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
