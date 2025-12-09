"use client";

import type { Task } from "@/lib/types";
import { Checkbox } from "@/components/ui/checkbox";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Lightbulb, BrainCircuit, ChevronsUpDown } from "lucide-react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { useState } from "react";
import Link from 'next/link';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
import { ArrowRight, Lightbulb, BrainCircuit, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from "@/components/ui/collapsible";
import { ExpandableSection } from "@/components/ui/expandable-section";
import Link from 'next/link';
import { useState } from "react";
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
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

import { FocusButton } from './focus-button';

interface TaskListProps {
  tasks: Task[];
  onToggleCompletion: (taskId: string) => void;
}

const listVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05,
        }
    }
};

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } },
    exit: { 
        opacity: 0, 
        scale: 0.9,
        transition: { duration: 0.3 } 
    }
};

// Fonction pour extraire les raisons des tâches
function extractReasonBadges(reason: string | undefined): string[] {
  if (!reason) return [];
  
  const badges: string[] = [];
  const reasons = reason.split(', ');
  
  for (const r of reasons) {
    if (r.includes('Deadline')) {
      badges.push('Deadline proche');
    } else if (r.includes('Énergie') || r.includes('Matche')) {
      badges.push('Matche votre énergie');
    } else if (r.includes('Priorité') && r.includes('Haute')) {
      badges.push('Haute priorité');
    } else if (r.includes('historique') && r.includes('Bonus')) {
      badges.push('Bon historique');
    } else if (r.includes('Aligné')) {
      badges.push('Aligné avec votre intention');
    } else if (r.includes('Quick Win')) {
      badges.push('Quick Win');
    }
  }
  
  return [...new Set(badges)]; // Supprimer les doublons
}

// Fonction pour obtenir la couleur du badge
function getBadgeVariant(reason: string): "default" | "secondary" | "destructive" | "outline" {
  switch (reason) {
    case 'Deadline proche':
      return 'destructive'; // rouge pastel
    case 'Quick Win':
      return 'secondary'; // jaune pastel
    case 'Matche votre énergie':
      return 'default'; // bleu pastel
    case 'Haute priorité':
      return 'outline'; // violet pastel
    case 'Aligné avec votre intention':
      return 'secondary'; // rose pastel
    default:
      return 'secondary';
  }
}

export function TaskList({ tasks, onToggleCompletion }: TaskListProps) {
  const [openCollapsibleId, setOpenCollapsibleId] = useState<string | null>(null);
  const { toast } = useToast();

  if (tasks.length === 0) {
    return (
      <div className="text-center py-10 rounded-2xl bg-card">
        <p className="text-muted-foreground">No tasks yet.</p>
        <p className="text-sm text-muted-foreground/70">
          Generate a playlist to get started.
        </p>
      </div>
    );
  }

  const handleTaskCompletion = async (taskId: string, taskName: string) => {
    // Marquer la tâche comme terminée
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId ? { ...task, completed: true, completedAt: new Date().toISOString() } : task
      )
    );
    
    // Afficher une notification
    toast({
      title: "Tâche terminée !",
      description: `La tâche "${taskName}" a été marquée comme terminée.`,
    });
    
    // Mettre à jour les rituels quotidiens
    setDailyRituals(prev => ({
      ...prev,
      completedTaskCount: prev.completedTaskCount + 1,
      completedTasks: [...prev.completedTasks, 
        tasks.find(t => t.id === taskId) || { id: taskId, name: taskName, completed: true, subtasks: 0, lastAccessed: new Date().toISOString(), completionRate: 100 }]
    }));
  };

  return (
    <motion.div 
        className="space-y-3"
        variants={listVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
    >
      <AnimatePresence>
        {tasks.map((task) => (
          <Collapsible 
            key={task.id}
            asChild
          >
            <motion.div
              variants={itemVariants}
              exit="exit"
              layout
              className={cn(`flex flex-col p-4 rounded-2xl bg-card transition-all duration-300`, task.completed && 'opacity-50', 'data-[state=open]:ring-2 data-[state=open]:ring-primary/50')}
            >
              <div className="flex items-center justify-between gap-2">
                <Checkbox
                  id={task.id}
                  checked={task.completed}
                  onCheckedChange={() => handleTaskCompletion(task.id, task.name)}
                  aria-label={`Mark task ${task.name} as ${
                    task.completed ? "incomplete" : "complete"
                  }`}
                  className="h-6 w-6 rounded-md mt-1"
                />
                <CollapsibleTrigger asChild className="w-full">
                  <div className="flex-1 space-y-2 cursor-pointer group">
                    <label
                      htmlFor={task.id}
                      className={`text-base font-medium leading-none cursor-pointer group-hover:text-primary ${
                        task.completed ? "line-through text-muted-foreground" : ""
                      }`}
                    >
                      {task.name}
                    </label>
                    <div className="flex items-center gap-2 flex-wrap">
                      {task.priority && (
                        <Badge variant="secondary" className="capitalize text-xs">{task.priority}</Badge>
                      )}
                      {task.tags && task.tags[0] && (
                        <Badge variant="outline" className="text-xs">{task.tags[0]}</Badge>
                      )}
                      {task.subtasks > 0 && (
                        <p className="text-xs text-muted-foreground">{task.subtasks} sous-tâches</p>
                      )}
                    </div>
                  </div>
                </CollapsibleTrigger>
                 <Link href={`/dashboard/focus/${encodeURIComponent(task.name)}`} className="flex-shrink-0">
                  <Button variant="ghost" size="icon" className="h-9 w-9 p-0">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <div className="flex-1 space-y-2 cursor-pointer">
                  <label
                    htmlFor={task.id}
                    className={`text-base font-medium leading-none cursor-pointer ${
                      task.completed ? "line-through text-muted-foreground" : ""
                    }`}
                  >
                    {task.name}
                  </label>
                  {/* Badges de raison */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {task.selectionReason && extractReasonBadges(task.selectionReason).map((reason, idx) => (
                      <Badge 
                        key={idx} 
                        variant={getBadgeVariant(reason)}
                        className="text-xs capitalize"
                      >
                        {reason}
                      </Badge>
                    ))}
                    {task.priority && (
                      <Badge variant="secondary" className="capitalize text-xs">{task.priority}</Badge>
                    )}
                    {task.tags && task.tags.slice(0, 2).map((tag, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                  
                  {/* Métadonnées discrètes */}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {task.effort && (
                      <span className="flex items-center gap-1">
                        <span className="font-medium">Effort:</span>
                        <span>{task.effort}</span>
                      </span>
                    )}
                    
                    {task.deadlineDisplay && (
                      <span className="flex items-center gap-1">
                        <span className="font-medium">Deadline:</span>
                        <span>{task.deadlineDisplay}</span>
                      </span>
                    )}
                    
                    {task.subtasks > 0 && (
                      <span className="flex items-center gap-1">
                        <span className="font-medium">Sous-tâches:</span>
                        <span>{task.subtasks}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <CollapsibleContent className="mt-4 space-y-4 pt-4 border-t border-border">
                <div className="rounded-lg bg-muted/50 p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <BrainCircuit className="h-5 w-5 text-primary" />
                    <h4 className="font-semibold text-primary">Technique: Time Blocking</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">Allouez un bloc de temps spécifique uniquement à cette tâche pour éliminer les distractions.</p>
                  <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
                    <li>Définir un objectif clair pour la session.</li>
                    <li>Couper toutes les notifications.</li>
                    <li>Utiliser un minuteur.</li>
                    <li>Prévoir une courte pause après.</li>
                  </ul>
                  <a href="#" className="text-xs text-primary/80 hover:underline mt-3 block">En savoir plus sur le Time Blocking</a>
                </div>
                 <div className="flex items-center justify-end gap-2">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-muted-foreground">
                          Pas maintenant
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Reporter cette tâche ?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Pourquoi voulez-vous reporter cette tâche ? Votre réponse nous aide à mieux planifier.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="flex flex-col space-y-2">
                            <Button variant="outline" className="justify-start">Pas l’énergie maintenant</Button>
                            <Button variant="outline" className="justify-start">Bloqué (attente externe)</Button>
                            <Button variant="outline" className="justify-start">Pas prioritaire finalement</Button>
                            <Button variant="outline" className="justify-start">Mauvais moment de la journée</Button>
                        </div>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction>Confirmer le report</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
              </CollapsibleContent>
              <CollapsibleContent className="mt-4 space-y-4">
                <ExpandableSection
                  title="Technique: Time Blocking"
                  strategy="Allouez un bloc de temps spécifique uniquement à cette tâche pour éliminer les distractions."
                  techniques={[
                    "Définir un objectif clair pour la session.",
                    "Couper toutes les notifications.",
                    "Utiliser un minuteur.",
                    "Prévoir une courte pause après."
                  ]}
                  linkText="En savoir plus sur le Time Blocking"
                  linkUrl="#"
                />
              </CollapsibleContent>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border -m-4 p-4 mt-4">
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-muted-foreground">
                    <Lightbulb className="mr-2 h-4 w-4" />
                    Comment l'aborder ?
                  </Button>
                </CollapsibleTrigger>

                <FocusButton 
                  taskId={task.id} 
                  taskName={task.name} 
                  onTaskComplete={handleTaskCompletion}
                />

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-muted-foreground">
                      Pas maintenant
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Reporter cette tâche ?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Pourquoi voulez-vous reporter cette tâche ? Votre réponse nous aide à mieux planifier.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="flex flex-col space-y-2">
                        <Button variant="outline" className="justify-start">Pas l’énergie maintenant</Button>
                        <Button variant="outline" className="justify-start">Bloqué (attente externe)</Button>
                        <Button variant="outline" className="justify-start">Pas prioritaire finalement</Button>
                        <Button variant="outline" className="justify-start">Mauvais moment de la journée</Button>
                    </div>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction>Confirmer le report</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </motion.div>
          </Collapsible>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
