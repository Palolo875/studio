'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FocusMode } from '@/components/focus/focus-mode';

export function FocusDemo() {
  const [isDemoVisible, setIsDemoVisible] = useState(false);

  const handleTaskComplete = (taskId: string) => {
    setIsDemoVisible(false);
  };
  
  if (isDemoVisible) {
    return (
      <FocusMode 
        taskName="Exemple de tâche importante"
        taskId="demo-task-1"
        onClose={() => setIsDemoVisible(false)}
        onTaskComplete={handleTaskComplete}
      />
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[400px] bg-background rounded-lg border p-4">
      <div className="text-center">
        <h3 className="text-lg font-medium mb-2">Démo du Mode Focus Adaptatif</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Cliquez sur le bouton ci-dessous pour voir le mode focus en action
        </p>
        <Button onClick={() => setIsDemoVisible(true)}>
          Lancer la démo
        </Button>
      </div>
    </div>
  );
}
