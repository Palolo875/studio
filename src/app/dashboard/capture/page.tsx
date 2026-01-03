import { CaptureClient } from '@/components/capture/capture-client';
import { Suspense } from 'react';

export default function CapturePage() {
  return (
    <div className="h-full">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Capture</h1>
      </header>
      <Suspense fallback={<div className="flex items-center justify-center h-64">Chargement de l'intelligence...</div>}>
        <CaptureClient />
      </Suspense>
    </div>
  );
}
