"use client";

import { useState } from "react";
import type { Task } from "@/lib/types";
import { addDays, format } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { ReservoirTaskCard } from "./reservoir-task-card";
import { SlidersHorizontal } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";

interface ReservoirClientProps {
  initialTasks: Task[];
}

export function ReservoirClient({ initialTasks }: ReservoirClientProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const dates = Array.from({ length: 7 }).map((_, i) =>
    addDays(new Date(), i - 3)
  );

  const filteredTasks = tasks; // We will add filtering logic later

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Réservoir</h1>
        <Button variant="ghost" size="icon">
          <SlidersHorizontal className="h-5 w-5" />
        </Button>
      </div>

      {/* Timeline */}
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex space-x-2 pb-4">
          {dates.map((date, index) => {
            const isSelected =
              format(date, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd");
            const isToday = format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");

            return (
              <motion.div key={index} whileTap={{ scale: 0.95 }} className="relative">
                <Button
                  variant={isSelected ? "default" : "outline"}
                  className={`flex flex-col h-auto p-3 rounded-2xl ${isSelected ? 'bg-primary text-primary-foreground shadow-lg' : 'bg-card'}`}
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
          <ReservoirTaskCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}
