import { CaptureClient } from '@/components/capture/capture-client';

export default function CapturePage() {
  return (
    <div className="h-full">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Capture</h1>
      </header>
      <CaptureClient />
    </div>
  );
}
