"use client";

import type { Task } from "@/lib/types";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "../ui/scroll-area";
import { AnimatePresence, motion } from "framer-motion";

interface TaskListProps {
  tasks: Task[];
  onToggleCompletion: (taskId: string) => void;
  progress: number;
}

export function TaskList({ tasks, onToggleCompletion, progress }: TaskListProps) {
  if (tasks.length === 0) {
    return (
        <div className="text-center py-10">
            <p className="text-muted-foreground">No tasks yet.</p>
            <p className="text-sm text-muted-foreground/70">Generate a playlist to get started.</p>
        </div>
    )
  }
  
  return (
    <div className="space-y-4">
        <div>
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-md font-medium">Today's Progress</h3>
                <span className="text-sm font-semibold text-primary">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="w-full h-2" />
        </div>
        
        <ScrollArea className="h-96">
            <div className="space-y-3 pr-4">
                <AnimatePresence>
                {tasks.map((task) => (
                    <motion.div
                        key={task.id}
                        layout
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                        className="flex items-center space-x-3 p-3 rounded-lg bg-background hover:bg-muted/50 transition-colors"
                    >
                    <Checkbox
                        id={task.id}
                        checked={task.completed}
                        onCheckedChange={() => onToggleCompletion(task.id)}
                        aria-label={`Mark task ${task.name} as ${task.completed ? 'incomplete' : 'complete'}`}
                    />
                    <label
                        htmlFor={task.id}
                        className={`flex-1 text-sm font-medium leading-none cursor-pointer ${
                        task.completed ? "line-through text-muted-foreground" : ""
                        }`}
                    >
                        {task.name}
                    </label>
                    </motion.div>
                ))}
                </AnimatePresence>
            </div>
        </ScrollArea>
    </div>
  );
}
