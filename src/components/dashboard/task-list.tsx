

"use client";

import type { Task } from "@/lib/types";
import { Checkbox } from "@/components/ui/checkbox";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Lightbulb } from "lucide-react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";

interface TaskListProps {
  tasks: Task[];
  onToggleCompletion: (taskId: string) => void;
}

const listVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.3,
        }
    }
};

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.3 } },
};


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
    <motion.div 
        className="space-y-3"
        variants={listVariants}
        initial="hidden"
        animate="visible"
    >
      <AnimatePresence>
        {tasks.map((task) => (
          <motion.div
            key={task.id}
            variants={itemVariants}
            exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col space-y-4 p-4 rounded-2xl bg-card"
          >
            <div className="flex items-start space-x-4">
               <Checkbox
                id={task.id}
                checked={task.completed}
                onCheckedChange={() => onToggleCompletion(task.id)}
                aria-label={`Mark task ${task.name} as ${
                  task.completed ? "incomplete" : "complete"
                }`}
                className="h-6 w-6 rounded-md mt-1"
              />
              <div className="flex-1 space-y-2">
                <label
                  htmlFor={task.id}
                  className={`text-base font-medium leading-none cursor-pointer ${
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
                    <p className="text-xs text-muted-foreground">{task.subtasks} subtasks</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border -m-4 p-4 mt-0">
               <Button variant="ghost" size="sm" className="text-muted-foreground">
                <Lightbulb className="mr-2 h-4 w-4" />
                Comment l'aborder ?
              </Button>
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                Voir les étapes
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
