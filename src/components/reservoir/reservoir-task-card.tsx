"use client";

import type { Task } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MoreHorizontal, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Book, Code, PenTool } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ReservoirTaskCardProps {
  task: Task;
}

const cardStyles = [
  {
    icon: Book,
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
    pattern: (
      <div className="absolute top-0 right-0 h-full w-full">
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <path
            d="M 50 0 C 75 0 100 25 100 50 L 100 100 L 0 100 L 0 50 C 0 25 25 0 50 0 Z"
            fill="rgba(192, 132, 252, 0.2)"
          />
        </svg>
      </div>
    ),
  },
  {
    icon: Code,
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
    pattern: (
      <div className="absolute top-0 right-0 h-full w-full">
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <path
            d="M 100 0 L 100 100 L 0 100 L 0 0 C 50 50 50 50 100 0 Z"
            fill="rgba(96, 165, 250, 0.2)"
          />
        </svg>
      </div>
    ),
  },
  {
    icon: PenTool,
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
    pattern: (
      <div className="absolute top-0 right-0 h-full w-full">
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <path
            d="M 100 0 L 100 100 L 0 100 L 0 50 C 25 75 75 25 100 0 Z"
            fill="rgba(251, 146, 60, 0.2)"
          />
        </svg>
      </div>
    ),
  },
];

export const priorityStyles: Record<string, string> = {
  low: "bg-green-200/50 text-green-800 dark:bg-green-900/50 dark:text-green-200 border-green-300/50",
  medium: "bg-yellow-200/50 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200 border-yellow-300/50",
  high: "bg-red-200/50 text-red-800 dark:bg-red-900/50 dark:text-red-200 border-red-300/50",
};

export function ReservoirTaskCard({ task }: ReservoirTaskCardProps) {
  const style = cardStyles[parseInt(task.id.replace(/[^0-9]/g, "") || "0", 10) % cardStyles.length];
  const Icon = style.icon;
  const subtasksCount = task.subtasks?.length || 0;
  const completedSubtasks = task.subtasks?.filter(st => st.completed).length || 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      className="h-full cursor-pointer"
    >
      <Card
        className={cn(
          "rounded-3xl p-6 flex flex-col justify-between h-full shadow-lg relative overflow-hidden",
          style.bgColor
        )}
      >
        {style.pattern}
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-background/50 rounded-full p-2">
              <Icon className="h-5 w-5" />
            </div>
            <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
          </div>
          <h3 className="text-md font-bold text-card-foreground mb-2">
            {task.name}
          </h3>
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {task.priority && (
                <Badge variant="outline" className={cn("capitalize text-xs", priorityStyles[task.priority])}>
                  {task.priority}
                </Badge>
            )}
             {task.tags && task.tags.slice(0, 2).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
            ))}
          </div>

          {(subtasksCount > 0) ? (
            <div>
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{completedSubtasks} / {subtasksCount}</span>
                </div>
                <span className="text-sm font-semibold text-muted-foreground">{task.completionRate}%</span>
              </div>
              <Progress value={task.completionRate} className="h-2" />
            </div>
          ) : (
            <div>
                <div className="flex justify-between items-center mb-1">
                    <p className="text-sm text-muted-foreground">Progression</p>
                    <span className="text-sm font-semibold text-muted-foreground">{task.completionRate}%</span>
                </div>
                <Progress value={task.completionRate} className="h-2" />
            </div>
          )}


        </div>
        <div className="relative z-10 flex justify-between items-center mt-4">
          <div className="flex -space-x-2">
            <Avatar className="h-8 w-8 border-2 border-background">
              <AvatarFallback>J</AvatarFallback>
            </Avatar>
            <Avatar className="h-8 w-8 border-2 border-background">
              <AvatarFallback>D</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
