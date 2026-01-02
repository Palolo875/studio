// Composant pour la résolution de conflits
// Affiche un modal pour résoudre les conflits entre l'utilisateur et le système

'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Clock, Split, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

// Types pour les props
interface ConflictResolutionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userRequest: {
    title: string;
    priority: string;
    effort: string;
  };
  systemRejection: {
    reason: string;
    code: string;
  };
  onResolve: (choice: number) => void;
}

// Composant principal de résolution de conflits
export function ConflictResolutionModal({
  open,
  onOpenChange,
  userRequest,
  systemRejection,
  onResolve
}: ConflictResolutionModalProps) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  // Options de résolution basées sur le contexte
  const resolutionOptions = [
    {
      id: 0,
      title: "Accepter la décision du système",
      description: `Le système refuse cette tâche pour la raison suivante : ${systemRejection.reason}`,
      icon: <AlertTriangle className="h-5 w-5" />,
      cost: null
    },
    {
      id: 1,
      title: "Forcer la tâche (avec coût)",
      description: "Vous pouvez forcer la tâche mais cela aura un impact sur votre budget futur (coût calculé à l'étape suivante).",
      icon: <AlertTriangle className="h-5 w-5" />,
      cost: null
    },
    // Options contextuelles
    ...(userRequest.priority === "URGENT" && systemRejection.code === "BURNOUT" ? [
      {
        id: 2,
        title: "Découper en micro-tâches",
        description: "Diviser la tâche en sous-tâches plus petites pour réduire la charge cognitive.",
        icon: <Split className="h-5 w-5" />,
        cost: "0%"
      }
    ] : []),
    ...((userRequest.priority === "LOW" || userRequest.priority === "MEDIUM") && systemRejection.code === "BUDGET" ? [
      {
        id: 3,
        title: "Reporter à demain",
        description: "Reporter la tâche à demain pour mieux l'aborder avec un budget frais.",
        icon: <Clock className="h-5 w-5" />,
        cost: "0%"
      },
      {
        id: 4,
        title: "Demander l'avis d'un tiers",
        description: "Envoyer une demande d'avis à un ami ou coach pour aider à la décision.",
        icon: <Users className="h-5 w-5" />,
        cost: "0%"
      }
    ] : [])
  ];

  // Gérer la sélection d'une option
  const handleSelectOption = (optionId: number) => {
    setSelectedOption(optionId);
  };

  // Gérer la confirmation
  const handleConfirm = () => {
    if (selectedOption !== null) {
      onResolve(selectedOption);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Conflit détecté
          </DialogTitle>
          <DialogDescription>
            Le système et vous-même avez des opinions différentes sur cette tâche.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-medium">Votre demande</h3>
              <Card>
                <CardContent className="p-3">
                  <p className="font-medium">{userRequest.title}</p>
                  <div className="flex gap-2 mt-2">
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {userRequest.priority}
                    </span>
                    <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                      {userRequest.effort}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium">Refus du système</h3>
              <Card className="border-red-200 bg-red-50 dark:bg-red-900/10">
                <CardContent className="p-3">
                  <p className="text-sm">{systemRejection.reason}</p>
                </CardContent>
              </Card>
            </div>
          </div>
          
          <div className="space-y-3">
            <h3 className="font-medium">Propositions de résolution</h3>
            <div className="space-y-2">
              {resolutionOptions.map((option) => (
                <Card 
                  key={option.id}
                  className={`cursor-pointer transition-colors ${
                    selectedOption === option.id 
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" 
                      : "hover:bg-muted"
                  }`}
                  onClick={() => handleSelectOption(option.id)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 text-blue-500">
                        {option.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <h4 className="font-medium text-sm">{option.title}</h4>
                          {option.cost && (
                            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                              Coût: {option.cost}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {option.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex justify-end gap-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Fermer
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={selectedOption === null}
          >
            Confirmer le choix
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}