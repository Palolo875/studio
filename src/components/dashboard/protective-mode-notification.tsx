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
import { Shield, GraphUp, Moon, Warning } from 'lucide-react';

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
        return <GraphUp className="h-4 w-4" />;
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
        return 'Charge élevée depuis plusieurs jours';
      case 'sleepDebt':
        return 'Repos insuffisant récemment';
      case 'constantOverrides':
        return 'Beaucoup de décisions forcées';
      case 'zeroCompletion':
        return 'Taux de complétion très faible';
      case 'erraticBehavior':
        return 'Comportement erratique détecté';
      case 'taskAccumulation':
        return 'Accumulation excessive de tâches';
      default:
        return signal;
    }
  };

  return (
    <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-yellow-500" />
          Mode protection activé
        </CardTitle>
        <CardDescription>
          J'ai détecté plusieurs signaux qui suggèrent que tu forces trop en ce moment :
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
            <h3 className="font-medium mb-2">Pendant les prochaines 24h :</h3>
            <ul className="text-sm space-y-1">
              <li>• Max 2 tâches par session</li>
              <li>• Seulement tâches légères ou urgentes</li>
              <li>• Suggestions de repos</li>
            </ul>
          </div>
          
          <div className="rounded-md bg-yellow-100 dark:bg-yellow-900/20 p-4">
            <p className="text-sm">
              <strong>Tu gardes le contrôle :</strong> tu peux forcer des décisions,
              mais cela désactive les protections pendant 24h.
            </p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            onClick={onExitRequest}
            className="flex-1"
          >
            Demander à sortir du mode protectif
          </Button>
          <Button 
            onClick={onUnderstand}
            className="flex-1"
          >
            J'ai compris
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}