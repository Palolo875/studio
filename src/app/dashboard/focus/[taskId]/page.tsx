'use client';

import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock } from 'lucide-react';

export default function FocusPage() {
  const params = useParams();
  const { taskId } = params;

  // In a real app, you would fetch the task details using the taskId
  const taskName = taskId 
    ? decodeURIComponent(taskId as string)
    : 'your task';


  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
        <Card className="w-full max-w-2xl shadow-2xl">
            <CardHeader>
                <p className="text-sm text-muted-foreground">Mode Focus</p>
                <CardTitle className="text-4xl font-bold">{taskName}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
                <div className="flex items-center justify-center text-8xl font-bold font-mono text-primary my-8">
                    <Clock className="h-20 w-20 mr-4" />
                    25:00
                </div>
                <p className="text-muted-foreground">
                    Vous êtes en mode focus. Toutes les distractions sont désactivées.
                </p>
            </CardContent>
        </Card>
    </div>
  );
}
