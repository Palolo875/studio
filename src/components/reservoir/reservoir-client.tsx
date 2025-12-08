"use client";

import { useState } from "react";
import type { Task } from "@/lib/types";
import { addDays, format, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { ReservoirTaskCard } from "./reservoir-task-card";
import { Plus, SlidersHorizontal } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";

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
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;

    if (isCreatingNewTask) {
      const newTask: Task = {
        id: `task-${Date.now()}`,
        name,
        // description,
        completed: false,
        subtasks: 0,
        lastAccessed: new Date().toISOString(),
        completionRate: 0,
      };
      setTasks([newTask, ...tasks]);
    } else if (selectedTask) {
      const updatedTasks = tasks.map((task) =>
        task.id === selectedTask.id ? { ...task, name, description } : task
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Réservoir</h1>
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
                  variant={isSelected ? "default" : "outline"}
                  className={`flex flex-col h-auto p-3 rounded-2xl ${
                    isSelected
                      ? "bg-primary text-primary-foreground shadow-lg"
                      : "bg-card"
                  }`}
                  onClick={() => setSelectedDate(date)}
                >
                  <span className="text-xs capitalize font-medium text-muted-foreground">
                    {format(date, "EEE", { locale: fr })}
                  </span>
                  <span className="text-xl font-bold mt-1">
                    {format(date, "dd")}
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTasks.map((task) => (
          <div key={task.id} onClick={() => handleTaskClick(task)}>
            <ReservoirTaskCard task={task} />
          </div>
        ))}
      </div>

       {/* Task Detail/Edit Sheet */}
       <Sheet open={isSheetOpen} onOpenChange={handleSheetClose}>
        <SheetContent className="flex flex-col">
          <SheetHeader>
            <SheetTitle>
              {isCreatingNewTask
                ? "Créer une nouvelle tâche"
                : "Détails de la tâche"}
            </SheetTitle>
            <SheetDescription>
              {isCreatingNewTask
                ? "Remplissez les détails ci-dessous."
                : "Modifiez les informations de votre tâche."}
            </SheetDescription>
          </SheetHeader>
          <form onSubmit={handleSaveTask} className="flex-1 flex flex-col justify-between space-y-4 py-4">
            <div className="space-y-4">
               <div className="space-y-2">
                <Label htmlFor="name">Titre de la tâche</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={selectedTask?.name || ""}
                  placeholder="Ex: Appeler le client"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={(selectedTask as any)?.description || ""}
                  placeholder="Ajouter plus de détails..."
                  rows={4}
                />
              </div>
            </div>
            <SheetFooter className="mt-auto">
                {!isCreatingNewTask && selectedTask && (
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={() => handleDeleteTask(selectedTask.id)}
                        className="mr-auto"
                    >
                        Supprimer
                    </Button>
                )}
                <Button type="button" variant="outline" onClick={handleSheetClose}>
                    Annuler
                </Button>
                <Button type="submit">Enregistrer</Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
