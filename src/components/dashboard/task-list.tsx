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
import { Badge } from '../ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Progress } from '../ui/progress';

interface TaskListProps {
  tasks: Task[];
  onToggleCompletion: (taskId: string) => void;
}

const effortStyles: Record<string, string> = {
    'S': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    'M': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    'L': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

const energyStyles: Record<string, string> = {
    'low': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    'medium': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    'high': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
};


export function TaskList({ tasks, onToggleCompletion }: TaskListProps) {

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
  
  const StrategyPopoverContent = () => (
    <div className="p-4 space-y-4">
        <div>
            <h4 className="font-semibold text-sm mb-2">Stratégie</h4>
            <p className="text-sm text-muted-foreground">Utiliser le Time Blocking pour dédier une fenêtre de temps ininterrompue à cette tâche.</p>
        </div>
        <div>
            <h4 className="font-semibold text-sm mb-2">Techniques</h4>
            <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
                <li>Estimer le temps nécessaire.</li>
                <li>Bloquer une plage horaire dans votre calendrier.</li>
                <li>Couper toutes les notifications pendant ce bloc.</li>
            </ul>
        </div>
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
  );


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
              className="group rounded-2xl border border-border/80 bg-card shadow-sm transition-all hover:border-primary/50"
            >
              <div className="flex items-start p-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full mt-1"
                  onClick={() => onToggleCompletion(task.id)}
                >
                  {task.completed ? (
                    <CheckCircle2 className="h-6 w-6 text-green-500" />
                  ) : (
                    <Circle className="h-6 w-6 text-muted-foreground" />
                  )}
                </Button>
                <div className="flex-1 ml-4">
                  <CollapsibleTrigger className="w-full text-left">
                    <p
                      className={cn(
                        'font-medium text-foreground',
                        task.completed && 'text-muted-foreground line-through'
                      )}
                    >
                      {task.name}
                    </p>
                  </CollapsibleTrigger>
                  <div className="flex items-center gap-2 flex-wrap mt-2">
                    {task.effort && (
                        <Badge className={cn("capitalize", effortStyles[task.effort])}>
                            Effort: {task.effort}
                        </Badge>
                    )}
                    {task.energyRequired && (
                        <Badge className={cn("capitalize", energyStyles[task.energyRequired as string] || 'bg-gray-100')}>
                            Énergie: {task.energyRequired}
                        </Badge>
                    )}
                    {task.deadlineDisplay && (
                        <Badge variant="outline">Pour: {task.deadlineDisplay}</Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <FocusButton taskId={task.id} />
                  <Popover>
                      <PopoverTrigger asChild>
                           <Button variant="ghost" size="sm">
                                <HelpCircle className="h-4 w-4 mr-2" />
                                Stratégie
                            </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80">
                         <StrategyPopoverContent />
                      </PopoverContent>
                  </Popover>
                  <CollapsibleTrigger asChild>
                     <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                     </Button>
                  </CollapsibleTrigger>
                </div>
              </div>
              <CollapsibleContent className="px-6 pb-4 space-y-4">
                 {task.description && <p className="text-sm text-muted-foreground">{task.description}</p>}
                 {task.subtasks && task.subtasks.length > 0 && (
                     <div>
                        <div className="mb-2">
                           <Progress value={task.completionRate} className="h-1.5" />
                           <p className="text-xs text-muted-foreground mt-1.5">{task.subtasks.filter(st => st.completed).length} sur {task.subtasks.length} sous-tâches terminées</p>
                        </div>
                        <ul className="space-y-2">
                           {task.subtasks.map(subtask => (
                              <li key={subtask.id} className="flex items-center gap-2 text-sm">
                                 {subtask.completed ? <CheckCircle2 className="h-4 w-4 text-green-500"/> : <Circle className="h-4 w-4 text-muted-foreground" />}
                                 <span className={cn(subtask.completed && "line-through text-muted-foreground")}>{subtask.name}</span>
                              </li>
                           ))}
                        </ul>
                     </div>
                 )}
              </CollapsibleContent>
            </Collapsible>
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
