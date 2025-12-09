'use client';

import { Button } from '@/components/ui/button';
import { Focus } from 'lucide-react';
import Link from 'next/link';

interface FocusButtonProps {
  taskId: string;
  taskName: string;
}

export function FocusButton({ taskId, taskName }: FocusButtonProps) {
  // Encoder l'ID et le nom de la tâche dans l'URL
  const encodedTaskId = encodeURIComponent(taskId);
  const encodedTaskName = encodeURIComponent(taskName);
  
  return (
    <Link href={`/dashboard/focus/${encodedTaskName}?id=${encodedTaskId}`}>
      <Button 
        variant="outline" 
        size="sm"
        className="flex items-center gap-2"
      >
        <Focus className="h-4 w-4" />
        <span>Focus</span>
      </Button>
    </Link>
  );
}