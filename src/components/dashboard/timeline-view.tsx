
'use client';

import type { Task } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Check, MoreHorizontal } from 'lucide-react';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { cn } from '@/lib/utils';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Image from "next/image";

interface TimelineViewProps {
  tasks: Task[];
}

const userAvatar = PlaceHolderImages.find(img => img.id === 'user-avatar');


export function TimelineView({ tasks }: TimelineViewProps) {
  const tasksWithTime = tasks.map((task, index) => {
    // Basic time estimation logic, can be improved
    const baseTime = new Date();
    baseTime.setHours(9, 0, 0, 0);
    const duration = task.estimatedDuration || 60; // default to 60 mins
    const startTime = new Date(baseTime.getTime() + index * duration * 60000);
    
    return {
      ...task,
      time: startTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    }
  });

  if (tasks.length === 0) {
    return <div className="text-center py-10 text-muted-foreground">Aucune tâche dans la timeline.</div>;
  }

  return (
    <div className="space-y-8 relative">
        <div className="absolute left-3.5 top-2 w-0.5 h-full bg-border -z-10"></div>

        {tasksWithTime.map((task, index) => (
            <div key={task.id} className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                    <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center",
                        index === 0 ? "bg-primary" : "bg-muted"
                    )}>
                       <div className={cn(
                           "w-3 h-3 rounded-full",
                           index === 0 ? "bg-primary-foreground" : "bg-muted-foreground"
                       )}></div>
                    </div>
                </div>
                
                <div className="w-full mt-1">
                    { index === 0 ? (
                        <Card className="bg-primary text-primary-foreground shadow-lg -mt-1">
                            <CardContent className="p-4">
                                <div className="flex justify-between items-center mb-2">
                                    <p className="font-semibold">{task.name}</p>
                                    <p className="text-sm opacity-80">{task.time}</p>
                                </div>
                                <p className="text-sm opacity-80 mb-4">{task.description || "Tâche actuelle de la playlist."}</p>
                                <div className="flex justify-between items-center">
                                    <div className="flex -space-x-2">
                                        <Avatar className="h-8 w-8 border-2 border-primary">
                                            {userAvatar && <Image src={userAvatar.imageUrl} alt="User Avatar" width={32} height={32} className="rounded-full" />}
                                            <AvatarFallback>J</AvatarFallback>
                                        </Avatar>
                                         <Avatar className="h-8 w-8 border-2 border-primary">
                                            <AvatarFallback>D</AvatarFallback>
                                        </Avatar>
                                    </div>
                                    <button className="h-8 w-8 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                                        <Check className="h-5 w-5 text-primary-foreground" />
                                    </button>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-foreground">{task.name}</p>
                                <p className="text-sm text-muted-foreground">{task.description || "Prochaine tâche."}</p>
                            </div>
                            <p className="text-sm text-muted-foreground">{task.time}</p>
                        </div>
                    )
                }
                </div>
            </div>
        ))}
    </div>
  );
}
