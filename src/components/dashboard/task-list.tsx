"use client";

import type { Task } from "@/lib/types";
import { Checkbox } from "@/components/ui/checkbox";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

interface TaskListProps {
  tasks: Task[];
  onToggleCompletion: (taskId: string) => void;
}

export function TaskList({ tasks, onToggleCompletion }: TaskListProps) {
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

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {tasks.map((task) => (
          <motion.div
            key={task.id}
            layout
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="flex items-center space-x-4 p-4 rounded-2xl bg-card h-[68px]"
          >
            <Checkbox
              id={task.id}
              checked={task.completed}
              onCheckedChange={() => onToggleCompletion(task.id)}
              aria-label={`Mark task ${task.name} as ${
                task.completed ? "incomplete" : "complete"
              }`}
              className="h-6 w-6 rounded-md"
            />
            <label
              htmlFor={task.id}
              className={`flex-1 text-sm font-medium leading-none cursor-pointer ${
                task.completed ? "line-through text-muted-foreground" : ""
              }`}
            >
              <p className="font-semibold">{task.name}</p>
              {task.subtasks > 0 && (
                 <p className="text-xs text-muted-foreground">{task.subtasks} subtasks</p>
              )}
            </label>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}