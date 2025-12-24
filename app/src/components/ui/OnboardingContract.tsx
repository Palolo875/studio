// components/ui/OnboardingContract.tsx
'use client';

import { Checkbox } from './checkbox';
import { Button } from './button';
import Link from 'next/link';

export function OnboardingContract() {
  return (
    <div className="space-y-4 text-center">
      <h2 className="text-2xl font-bold">Contrat d'Autorité</h2>
      <div className="text-sm text-gray-500">
        <p>En utilisant KairuFlow, vous acceptez un partenariat juste :</p>
        <ul className="list-disc list-inside mt-2">
          <li>Le système propose, vous décidez.</li>
          <li>Vos données restent les vôtres.</li>
          <li>Aucune décision n'est irréversible.</li>
        </ul>
      </div>
      <div className="flex items-center justify-center space-x-2">
        <Checkbox id="terms" />
        <label htmlFor="terms" className="text-sm font-medium">
          J'accepte le contrat
        </label>
      </div>
      <Link href="/page">
        <Button>Démarrer</Button>
      </Link>
    </div>
  );
}
