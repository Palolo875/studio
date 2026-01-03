'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { FocusMode } from '@/components/focus/focus-mode';
import { addTaskHistory, completeTask, getTaskById, getSetting } from '@/lib/database';

export default function FocusPage() {
  const params = useParams();
  const { taskId } = params as { taskId?: string };

  const decodedTaskId = taskId ? decodeURIComponent(taskId) : 'task-id-placeholder';
  const [taskName, setTaskName] = useState('votre tâche');
  const [sessionId] = useState(() => `focus_${Date.now()}`);
  const [energyLevel, setEnergyLevel] = useState<'low' | 'medium' | 'high'>('medium');

  function toDbEnergyLevel(
    energy: 'energized' | 'normal' | 'slow' | 'focused' | 'creative'
  ): 'low' | 'medium' | 'high' {
    if (energy === 'slow') return 'low';
    if (energy === 'normal') return 'medium';
    return 'high';
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!decodedTaskId || decodedTaskId === 'task-id-placeholder') return;
      const task = await getTaskById(decodedTaskId);
      if (cancelled) return;
      if (task?.title) setTaskName(task.title);

      const storedEnergy = await getSetting<'energized' | 'normal' | 'slow' | 'focused' | 'creative'>(
        'morning.todayEnergyLevel'
      );
      if (cancelled) return;
      const mappedEnergy = storedEnergy ? toDbEnergyLevel(storedEnergy) : 'medium';
      setEnergyLevel(mappedEnergy);

      await addTaskHistory(decodedTaskId, 'started', { sessionId, energyLevel: mappedEnergy });
    }

    load().catch(() => null);

    return () => {
      cancelled = true;
    };
  }, [decodedTaskId]);
  
  // Fonction pour marquer la tâche comme terminée
  const handleTaskComplete = async (completedTaskId: string, actualDurationMinutes?: number) => {
    await completeTask(completedTaskId, {
      duration: actualDurationMinutes,
      energyLevel,
      sessionId,
    });
  };

  const handleNoteSaved = async (id: string, note: string) => {
    if (!id || id === 'task-id-placeholder') return;
    await addTaskHistory(id, 'note_saved', { notes: note, sessionId, energyLevel });
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
