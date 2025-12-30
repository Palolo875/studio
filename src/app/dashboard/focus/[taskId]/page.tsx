'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { FocusMode } from '@/components/focus/focus-mode';
import { addTaskHistory, completeTask, getTaskById } from '@/lib/database';

export default function FocusPage() {
  const params = useParams();
  const { taskId } = params as { taskId?: string };

  const decodedTaskId = taskId ? decodeURIComponent(taskId) : 'task-id-placeholder';
  const [taskName, setTaskName] = useState('votre tâche');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!decodedTaskId || decodedTaskId === 'task-id-placeholder') return;
      const task = await getTaskById(decodedTaskId);
      if (cancelled) return;
      if (task?.title) setTaskName(task.title);
    }

    load().catch(() => null);

    return () => {
      cancelled = true;
    };
  }, [decodedTaskId]);
  
  // Fonction pour marquer la tâche comme terminée
  const handleTaskComplete = async (completedTaskId: string) => {
    await completeTask(completedTaskId);
  };

  const handleNoteSaved = async (id: string, note: string) => {
    if (!id || id === 'task-id-placeholder') return;
    await addTaskHistory(id, 'started', { notes: note });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <FocusMode 
        taskName={taskName}
        taskId={decodedTaskId}
        onTaskComplete={handleTaskComplete}
        onNoteSaved={handleNoteSaved}
      />
    </div>
  );
}
