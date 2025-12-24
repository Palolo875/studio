'use client';

import type { Task } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Tag, User, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Image from "next/image";
import { format, parseISO, startOfDay, addHours, addMinutes, isAfter, setHours, setMinutes } from 'date-fns';
import { fr } from 'date-fns/locale';
import React from 'react';

interface TimelineViewProps {
  tasks: Task[];
  onToggleCompletion?: (taskId: string) => void;
}

const userAvatar = PlaceHolderImages.find(img => img.id === 'user-avatar');

// Helper to get task start time, defaulting to a specific time if not set
const getTaskStartTime = (task: Task): Date | null => {
    if (task.scheduledDate) {
        const date = parseISO(task.scheduledDate);
        // If no time is specified, it might be just a date. We can handle this.
        // For now, let's assume it has a time or default to something.
        // A real implementation would parse time from a string like "14:00"
        return date;
    }
    return null;
}

export function TimelineView({ tasks, onToggleCompletion }: TimelineViewProps) {
  const now = new Date();

  // 1. Separate tasks with and without specific times
  const scheduledTasks = tasks.filter(task => getTaskStartTime(task) !== null);
  const unscheduledTasks = tasks.filter(task => getTaskStartTime(task) === null);

  // 2. Sort scheduled tasks by their start time
  scheduledTasks.sort((a, b) => {
    const timeA = getTaskStartTime(a)!;
    const timeB = getTaskStartTime(b)!;
    return timeA.getTime() - timeB.getTime();
  });

  // 3. Generate time slots for the day (e.g., 8 AM to 10 PM)
  const dayStart = setMinutes(setHours(startOfDay(now), 8), 0);
  const dayEnd = setMinutes(setHours(startOfDay(now), 22), 0);
  const timeSlots = [];
  for (let d = dayStart; d <= dayEnd; d = addHours(d, 1)) {
    timeSlots.push(d);
  }

  // Map tasks to time slots
  const timelineItems = timeSlots.map(slot => {
    const tasksInSlot = scheduledTasks.filter(task => {
        const taskStart = getTaskStartTime(task)!;
        return taskStart.getHours() === slot.getHours();
    });
    return {
        time: slot,
        tasks: tasksInSlot,
    };
  });

  const getDotColor = (task: Task) => {
    if (task.priority === 'high' || task.effort === 'L') return 'bg-red-500';
    if (task.priority === 'medium' || task.effort === 'M') return 'bg-yellow-500';
    return 'bg-blue-500';
  }

  return (
    <div className="space-y-0 relative pb-8">
      {/* Vertical Timeline Bar */}
      <div className="absolute left-4 top-0 w-0.5 h-full bg-border -z-10"></div>

      {timelineItems.map(({ time, tasks }, index) => (
        <React.Fragment key={time.toISOString()}>
          {tasks.length > 0 ? (
            tasks.map(task => (
              <div key={task.id} className="flex items-start gap-6">
                <div className="flex flex-col items-center">
                   <div className="text-sm font-medium text-muted-foreground w-10 text-right">
                    {format(getTaskStartTime(task)!, 'HH:mm')}
                   </div>
                </div>
                <div className="relative flex-1">
                   <div className={cn("absolute -left-[32px] top-1.5 h-4 w-4 rounded-full border-4 border-background", getDotColor(task))}></div>
                   <Card className="mb-6 bg-card/80 backdrop-blur-sm">
                     <CardContent className="p-4">
                       <p className="font-semibold text-foreground">{task.name}</p>
                       <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                       <div className="flex items-center gap-4 text-xs text-muted-foreground mt-3">
                         <div className="flex items-center gap-1.5">
                           <Clock className="h-3.5 w-3.5" />
                           <span>{task.estimatedDuration || 30} min</span>
                         </div>
                         {task.tags && task.tags[0] && (
                           <div className="flex items-center gap-1.5">
                             <Tag className="h-3.5 w-3.5" />
                             <span>{task.tags[0]}</span>
                           </div>
                         )}
                       </div>
                     </CardContent>
                   </Card>
                </div>
              </div>
            ))
          ) : (
             (index > 0 && timelineItems[index-1].tasks.length > 0) || index === 0 ? (
                <div className="flex items-start gap-6">
                    <div className="text-sm font-medium text-muted-foreground w-10 text-right">
                        {format(time, 'HH:mm')}
                    </div>
                    <div className="relative flex-1">
                      <div className="absolute -left-[30px] top-1.5 h-3 w-3 rounded-full bg-muted-foreground/50 border-2 border-background"></div>
                    </div>
                </div>
             ) : null
          )}
        </React.Fragment>
      ))}

      {/* Unscheduled Tasks Section */}
      {unscheduledTasks.length > 0 && (
         <div className="mt-12">
            <h3 className="text-lg font-bold mb-4 pl-14">Tâches non planifiées</h3>
             {unscheduledTasks.map(task => (
                <div key={task.id} className="flex items-start gap-6">
                    <div className="w-10"></div>
                     <div className="relative flex-1">
                       <div className={cn("absolute -left-[32px] top-1.5 h-4 w-4 rounded-full border-4 border-background", getDotColor(task))}></div>
                       <Card className="mb-6 bg-card/80 backdrop-blur-sm">
                         <CardContent className="p-4">
                           <p className="font-semibold text-foreground">{task.name}</p>
                           <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                           <div className="flex items-center gap-4 text-xs text-muted-foreground mt-3">
                             <div className="flex items-center gap-1.5">
                               <Clock className="h-3.5 w-3.5" />
                               <span>{task.estimatedDuration || 30} min</span>
                             </div>
                           </div>
                         </CardContent>
                       </Card>
                    </div>
                </div>
             ))}
         </div>
      )}
    </div>
  );
}
