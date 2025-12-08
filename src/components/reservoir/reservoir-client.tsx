'use client';

import { useState } from 'react';
import type { Task } from '@/lib/types';
import { addDays, format, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { ReservoirTaskCard } from './reservoir-task-card';
import { Plus, SlidersHorizontal } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { motion } from 'framer-motion';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { energyLevels } from '@/lib/data';

interface ReservoirClientProps {
  initialTasks: Task[];
}

export function ReservoirClient({ initialTasks }: ReservoirClientProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isCreatingNewTask, setIsCreatingNewTask] = useState(false);

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsCreatingNewTask(false);
    setIsSheetOpen(true);
  };

  const handleAddNewClick = () => {
    setSelectedTask(null);
    setIsCreatingNewTask(true);
    setIsSheetOpen(true);
  };

  const handleSheetClose = () => {
    setIsSheetOpen(false);
    setSelectedTask(null);
    setIsCreatingNewTask(false);
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(tasks.filter((task) => task.id !== taskId));
    handleSheetClose();
  };

  const handleSaveTask = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const priority = formData.get('priority') as 'low' | 'medium' | 'high';
    const energyRequired = formData.get('energyRequired') as
      | 'low'
      | 'medium'
      | 'high'
      | undefined;
    const estimatedDuration = formData.get('estimatedDuration')
      ? Number(formData.get('estimatedDuration'))
      : undefined;
    const objective = formData.get('objective') as string | undefined;
    const autoSelected = formData.get('autoSelected') === 'on';
    const tagsString = formData.get('tags') as string;
    const tags = tagsString
      ? tagsString.split(',').map((tag) => tag.trim()).filter((tag) => tag)
      : [];
    const completionRate = formData.get('completionRate')
      ? Number(formData.get('completionRate'))
      : 0;

    const taskData = {
      name,
      description,
      priority,
      energyRequired,
      estimatedDuration,
      objective,
      autoSelected,
      tags,
      completionRate,
      completed: completionRate === 100,
    };

    if (isCreatingNewTask) {
      const newTask: Task = {
        id: `task-${Date.now()}`,
        ...taskData,
        subtasks: 0,
        lastAccessed: new Date().toISOString(),
      };
      setTasks([newTask, ...tasks]);
    } else if (selectedTask) {
      const updatedTasks = tasks.map((task) =>
        task.id === selectedTask.id ? { ...task, ...taskData } : task
      );
      setTasks(updatedTasks);
    }
    handleSheetClose();
  };

  const dates = Array.from({ length: 7 }).map((_, i) =>
    addDays(new Date(), i - 3)
  );

  const filteredTasks = tasks;

  return (
    <div className="space-y-8 h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">L'Atelier</h1>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <SlidersHorizontal className="h-5 w-5" />
          </Button>
          <Button size="icon" onClick={handleAddNewClick}>
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Timeline */}
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex space-x-2 pb-4">
          {dates.map((date, index) => {
            const isSelected = isSameDay(date, selectedDate);
            const isToday = isSameDay(date, new Date());

            return (
              <motion.div
                key={index}
                whileTap={{ scale: 0.95 }}
                className="relative"
              >
                <Button
                  variant={isSelected ? 'default' : 'outline'}
                  className={`flex flex-col h-auto p-3 rounded-2xl ${
                    isSelected
                      ? 'bg-primary text-primary-foreground shadow-lg'
                      : 'bg-card'
                  }`}
                  onClick={() => setSelectedDate(date)}
                >
                  <span className="text-xs capitalize font-medium text-muted-foreground">
                    {format(date, 'EEE', { locale: fr })}
                  </span>
                  <span className="text-xl font-bold mt-1">
                    {format(date, 'dd')}
                  </span>
                  {isToday && !isSelected && (
                    <span className="absolute -bottom-1 w-1.5 h-1.5 bg-primary rounded-full"></span>
                  )}
                </Button>
              </motion.div>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Task List */}
      <ScrollArea className="flex-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pr-4 pb-4">
          {filteredTasks.map((task) => (
            <div key={task.id} onClick={() => handleTaskClick(task)}>
              <ReservoirTaskCard task={task} />
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Task Detail/Edit Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={handleSheetClose}>
        <SheetContent className="flex flex-col w-full sm:max-w-lg p-0">
          <SheetHeader className="bg-card p-6 pb-4">
            <SheetTitle className="text-2xl font-bold">
              {isCreatingNewTask
                ? 'Créer une nouvelle tâche'
                : 'Détails de la tâche'}
            </SheetTitle>
            <SheetDescription>
              {isCreatingNewTask
                ? 'Remplissez les détails ci-dessous pour ajouter une tâche à votre réservoir.'
                : 'Modifiez les informations de votre tâche ci-dessous.'}
            </SheetDescription>
          </SheetHeader>
          <form
            onSubmit={handleSaveTask}
            className="flex-1 flex flex-col justify-between overflow-hidden"
          >
            <ScrollArea className="flex-1">
              <div className="space-y-6 py-6 px-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="font-semibold">
                    Titre de la tâche
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    defaultValue={selectedTask?.name || ''}
                    placeholder="Ex: Appeler le client pour le feedback"
                    required
                    className="h-12 rounded-xl text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description" className="font-semibold">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    name="description"
                    defaultValue={selectedTask?.description || ''}
                    placeholder="Ajouter plus de détails, des notes ou des liens..."
                    rows={4}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="font-semibold">Priorité</Label>
                  <RadioGroup
                    name="priority"
                    defaultValue={selectedTask?.priority || 'medium'}
                    className="grid grid-cols-3 gap-3"
                  >
                    <Label
                      htmlFor="p-low"
                      className="flex items-center justify-center gap-2 rounded-xl border p-3 cursor-pointer has-[:checked]:bg-green-100 has-[:checked]:border-green-400 dark:has-[:checked]:bg-green-900/50 dark:has-[:checked]:border-green-700 transition-all"
                    >
                      <RadioGroupItem value="low" id="p-low" className="sr-only" />
                      Basse
                    </Label>
                    <Label
                      htmlFor="p-medium"
                      className="flex items-center justify-center gap-2 rounded-xl border p-3 cursor-pointer has-[:checked]:bg-yellow-100 has-[:checked]:border-yellow-400 dark:has-[:checked]:bg-yellow-900/50 dark:has-[:checked]:border-yellow-700 transition-all"
                    >
                      <RadioGroupItem
                        value="medium"
                        id="p-medium"
                        className="sr-only"
                      />
                      Moyenne
                    </Label>
                    <Label
                      htmlFor="p-high"
                      className="flex items-center justify-center gap-2 rounded-xl border p-3 cursor-pointer has-[:checked]:bg-red-100 has-[:checked]:border-red-400 dark:has-[:checked]:bg-red-900/50 dark:has-[:checked]:border-red-700 transition-all"
                    >
                      <RadioGroupItem
                        value="high"
                        id="p-high"
                        className="sr-only"
                      />
                      Haute
                    </Label>
                  </RadioGroup>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 font-semibold">
                      <Zap size={16} /> Énergie requise
                    </Label>
                    <Select
                      name="energyRequired"
                      defaultValue={selectedTask?.energyRequired}
                    >
                      <SelectTrigger className="h-12 rounded-xl">
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        {energyLevels.map((level) => (
                          <SelectItem key={level.value} value={level.value}>
                            {level.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="estimatedDuration"
                      className="font-semibold"
                    >
                      Durée (minutes)
                    </Label>
                    <Input
                      id="estimatedDuration"
                      name="estimatedDuration"
                      type="number"
                      defaultValue={selectedTask?.estimatedDuration || ''}
                      placeholder="Ex: 30"
                      className="h-12 rounded-xl"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="completionRate" className="font-semibold">
                    Progression (%)
                  </Label>
                  <Input
                    id="completionRate"
                    name="completionRate"
                    type="number"
                    min="0"
                    max="100"
                    defaultValue={selectedTask?.completionRate || 0}
                    placeholder="Ex: 50"
                    className="h-12 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tags" className="font-semibold">
                    Tags
                  </Label>
                  <Input
                    id="tags"
                    name="tags"
                    defaultValue={selectedTask?.tags?.join(', ') || ''}
                    placeholder="Ex: UI/UX, Dev, Marketing"
                    className="h-12 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="objective" className="font-semibold">
                    Objectif
                  </Label>
                  <Textarea
                    id="objective"
                    name="objective"
                    defaultValue={selectedTask?.objective || ''}
                    placeholder="Quel est le but final de cette tâche ?"
                    rows={2}
                    className="rounded-xl"
                  />
                </div>
                <div className="flex items-center justify-between rounded-xl border bg-card p-4 shadow-sm">
                  <div className="space-y-0.5">
                    <Label className="font-semibold">Sélection automatique</Label>
                    <p className="text-sm text-muted-foreground">
                      Autoriser l'IA à suggérer cette tâche.
                    </p>
                  </div>
                  <Switch
                    name="autoSelected"
                    defaultChecked={selectedTask?.autoSelected ?? true}
                  />
                </div>
              </div>
            </ScrollArea>

            <SheetFooter className="bg-card p-4 flex-row justify-between sm:justify-between border-t">
              <div>
                {!isCreatingNewTask && selectedTask && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => handleDeleteTask(selectedTask.id)}
                  >
                    Supprimer
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSheetClose}
                  className="h-12 rounded-full px-6"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  className="h-12 rounded-full px-8 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Enregistrer
                </Button>
              </div>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
