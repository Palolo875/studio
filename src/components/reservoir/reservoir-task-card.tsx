"use client";

import type { Task } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MoreHorizontal, Share2 } from "lucide-react";
import { format } from 'date-fns';
import { motion } from "framer-motion";

interface ReservoirTaskCardProps {
  task: Task;
}

const colorVariants = {
  high: "bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800/50",
  medium: "bg-yellow-100 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800/50",
  low: "bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800/50",
};

const priorityMap: { [key: number]: "low" | "medium" | "high" } = {
  1: "low",
  2: "medium",
  3: "high"
}

export function ReservoirTaskCard({ task }: ReservoirTaskCardProps) {
  const priority = priorityMap[task.subtasks] || "medium";
  const cardColor = colorVariants[priority];

  return (
    <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.3 }}
    >
        <Card className={`rounded-3xl p-6 flex flex-col justify-between h-full shadow-lg ${cardColor}`}>
            <div>
                <div className="flex justify-between items-start">
                    <span className="text-sm font-medium text-muted-foreground">
                        {format(new Date(task.lastAccessed), 'dd MMM')}
                    </span>
                    <Badge variant="outline" className="capitalize bg-background/50">
                        {priority}
                    </Badge>
                </div>
                <h3 className="text-lg font-bold text-card-foreground mt-4 mb-8">
                    {task.name}
                </h3>
            </div>
            <div className="flex justify-between items-center">
                <div className="flex -space-x-2">
                    <Avatar className="h-6 w-6 border-2 border-background">
                        <AvatarFallback>J</AvatarFallback>
                    </Avatar>
                    <Avatar className="h-6 w-6 border-2 border-background">
                        <AvatarFallback>D</AvatarFallback>
                    </Avatar>
                </div>
                <div className="flex items-center space-x-2">
                    <Share2 className="h-4 w-4 text-muted-foreground" />
                    <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                </div>
            </div>
        </Card>
    </motion.div>
  );
}
