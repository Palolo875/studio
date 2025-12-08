'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Moon, Sparkles, Wind } from 'lucide-react';
import Link from 'next/link';

export default function EveningPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
      <Card className="w-full max-w-2xl shadow-2xl animate-fade-in-up">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <Sparkles className="h-12 w-12 text-yellow-400" />
          </div>
          <CardTitle className="text-4xl font-bold">
            Félicitations !
          </CardTitle>
          <p className="text-muted-foreground pt-2">
            Votre journée est terminée.
          </p>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="flex items-center justify-center text-lg font-medium text-foreground my-8">
            <Moon className="h-6 w-6 mr-3 text-purple-400" />
            <p>Il est temps de vous déconnecter et de vous détendre.</p>
            <Wind className="h-6 w-6 ml-3 text-blue-300" />
          </div>
          <p className="text-muted-foreground">
            L'esprit libre, la soirée vous appartient.
          </p>
          <Link href="/dashboard">
            <Button>Retourner au tableau de bord</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
