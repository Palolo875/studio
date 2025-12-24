// Composant pour la notification du mode protectif
// Affiche une notification lorsque le mode protectif est activé

'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, TrendingUp, Moon, Warning } from 'lucide-react';

// Types pour les props
interface ProtectiveModeNotificationProps {
  signals: {
    chronicOverload?: boolean;
    sleepDebt?: boolean;
    constantOverrides?: boolean;
    zeroCompletion?: boolean;
    erraticBehavior?: boolean;
    taskAccumulation?: boolean;
  };
  onExitRequest?: () => void;
  onUnderstand?: () => void;
}

// Composant principal de notification du mode protectif
export function ProtectiveModeNotification({
  signals,
  onExitRequest,
  onUnderstand
}: ProtectiveModeNotificationProps) {
  // Obtenir la liste des signaux actifs
  const activeSignals = Object.entries(signals)
    .filter(([_, value]) => value)
    .map(([key, _]) => key);

  // Obtenir l'icône pour un signal
  const getSignalIcon = (signal: string) => {
    switch (signal) {
      case 'chronicOverload':
        return <TrendingUp className="h-4 w-4" />;
      case 'sleepDebt':
        return <Moon className="h-4 w-4" />;
      case 'constantOverrides':
      case 'zeroCompletion':
      case 'erraticBehavior':
      case 'taskAccumulation':
        return <Warning className="h-4 w-4" />;
      default:
        return <Warning className="h-4 w-4" />;
    }
  };

  // Obtenir le texte pour un signal
  const getSignalText = (signal: string) => {
    switch (signal) {
      case 'chronicOverload':
        return 'Charge de travail élevée et soutenue';
      case 'sleepDebt':
        return 'Manque de repos récent';
      case 'constantOverrides':
        return 'Besoin fréquent de forcer le système';
      case 'zeroCompletion':
        return 'Difficulté à terminer les tâches prévues';
      case 'erraticBehavior':
        return 'Rythme de travail très irrégulier';
      case 'taskAccumulation':
        return 'Accumulation rapide de nouvelles tâches';
      default:
        return signal;
    }
  };

  return (
    <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-yellow-500" />
          Mode Protection suggéré
        </CardTitle>
        <CardDescription>
          Pour vous aider à retrouver un rythme serein, KairuFlow a détecté des signaux de surcharge :
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="space-y-3">
          {activeSignals.map((signal) => (
            <div key={signal} className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                {getSignalIcon(signal)}
              </div>
              <span className="text-sm">{getSignalText(signal)}</span>
            </div>
          ))}
        </div>
        
        <div className="space-y-4">
          <div className="rounded-md bg-muted p-4">
            <h3 className="font-medium mb-2">Pendant les prochaines 24h, le système vous proposera :</h3>
            <ul className="text-sm space-y-1 list-disc list-inside">
              <li>Des sessions plus courtes et moins de tâches.</li>
              <li>La priorité aux tâches légères ou urgentes.</li>
              <li>Des suggestions de repos.</li>
            </ul>
          </div>
          
          <div className="rounded-md bg-yellow-100 dark:bg-yellow-900/20 p-4">
            <p className="text-sm">
              <strong>Vous gardez toujours le contrôle :</strong> vous pouvez forcer vos propres décisions, mais cela suspendra temporairement les protections.
            </p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            onClick={onExitRequest}
            className="flex-1"
          >
            Ignorer pour aujourd'hui
          </Button>
          <Button 
            onClick={onUnderstand}
            className="flex-1"
          >
            J'ai compris, merci
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
