'use client';

import { useRouter } from 'next/navigation';

export default function OnboardingTestPage() {
  const router = useRouter();

  const handleNext = () => {
    // This was the source of the error, pointing to a non-existent page.
    // In a real scenario, this would go to the next step, e.g., '/onboarding/energy-quiz'
    router.push('/dashboard'); 
  };

  return (
    <div className="text-center">
      <h1 className="text-2xl font-bold">Onboarding Test Page</h1>
      <p className="text-muted-foreground mt-2">
        This is a test page for the onboarding flow.
      </p>
      <button
        onClick={handleNext}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
      >
        Go to /dashboard (Test)
      </button>
    </div>
  );
}
