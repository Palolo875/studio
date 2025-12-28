'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { FocusMode } from '@/components/focus/focus-mode';
import { completeTask } from '@/lib/database';

export default function FocusPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { taskId: taskNameParam } = params;
  
  const taskName = taskNameParam 
    ? decodeURIComponent(taskNameParam as string)
    : 'votre tâche';
    
  // Récupérer l'ID de la tâche depuis les paramètres de recherche
  const taskId = searchParams.get('id') || 'task-id-placeholder';
  
  // Fonction pour marquer la tâche comme terminée
  const handleTaskComplete = async (completedTaskId: string) => {
    await completeTask(completedTaskId);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <FocusMode 
        taskName={taskName}
        taskId={taskId}
        onTaskComplete={handleTaskComplete}
      />
    </div>
  );
}
