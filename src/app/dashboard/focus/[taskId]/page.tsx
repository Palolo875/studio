'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { FocusMode } from '@/components/focus/focus-mode';

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
  const handleTaskComplete = (completedTaskId: string) => {
    // Dans une vraie application, cela appellerait une API ou une action serveur
    console.log(`Tâche ${completedTaskId} marquée comme terminée`);
    
    // Stocker l'état de complétion dans localStorage pour le démontrer
    if (typeof window !== 'undefined') {
      const completedTasks = JSON.parse(localStorage.getItem('completedTasks') || '[]');
      completedTasks.push({
        id: completedTaskId,
        name: taskName,
        completedAt: new Date().toISOString()
      });
      localStorage.setItem('completedTasks', JSON.stringify(completedTasks));
    }
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