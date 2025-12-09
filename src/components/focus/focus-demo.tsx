'use client';

import { FocusMode } from '@/components/focus/focus-mode';

export function FocusDemo() {
  return (
    <div className="flex items-center justify-center min-h-[400px] bg-background rounded-lg border p-4">
      <div className="text-center">
        <h3 className="text-lg font-medium mb-2">Démo du Mode Focus Adaptatif</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Cliquez sur le bouton ci-dessous pour voir le mode focus en action
        </p>
        <FocusMode taskName="Exemple de tâche importante" />
      </div>
    </div>
  );
}