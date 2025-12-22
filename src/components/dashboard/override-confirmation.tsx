// Composant pour la confirmation d'override avec coût
// Affiche le coût d'une décision forcée et demande confirmation

'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// Types pour les props
interface OverrideCost {
  type: "TIME" | "ENERGY" | "FOCUS";
  explanationRequired: boolean;
  total: number;
  consequences: {
    budgetReduction: number;
    protectionDisabled: boolean;
    warningLevel: "LOW" | "MEDIUM" | "HIGH";
  };
}

interface OverrideConfirmationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskTitle: string;
  cost: OverrideCost;
  onConfirm: (reason?: string) => void;
  onCancel: () => void;
}

// Composant principal de confirmation d'override
export function OverrideConfirmation({
  open,
  onOpenChange,
  taskTitle,
  cost,
  onConfirm,
  onCancel
}: OverrideConfirmationProps) {
  const [reason, setReason] = useState<string>('');

  // Obtenir la couleur du niveau d'avertissement
  const getWarningColor = (level: "LOW" | "MEDIUM" | "HIGH") => {
    switch (level) {
      case "HIGH": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200";
      case "MEDIUM": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200";
      default: return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200";
    }
  };

  // Obtenir l'icône du niveau d'avertissement
  const getWarningIcon = (level: "LOW" | "MEDIUM" | "HIGH") => {
    switch (level) {
      case "HIGH": return <AlertTriangle className="h-4 w-4" />;
      case "MEDIUM": return <AlertTriangle className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  // Gérer la confirmation
  const handleConfirm = () => {
    if (cost.explanationRequired && !reason.trim()) {
      // Dans une implémentation réelle, afficher une erreur
      return;
    }
    
    onConfirm(reason || undefined);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Forcer cette décision ?
          </DialogTitle>
          <DialogDescription>
            Cette action contourne les protections du système.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <h3 className="font-medium">Tâche concernée</h3>
            <p className="text-sm text-muted-foreground">{taskTitle}</p>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-medium">Coût estimé</h3>
              <div className="flex items-center justify-between p-3 rounded-md bg-muted">
                <span className="text-sm">Impact sur votre budget</span>
                <Badge variant="outline">
                  {(cost.total * 100).toFixed(0)}%
                </Badge>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium">Conséquences</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Réduction budgétaire</span>
                  <span className="text-sm font-medium">
                    {(cost.consequences.budgetReduction * 100).toFixed(0)}%
                  </span>
                </div>
                
                {cost.consequences.protectionDisabled && (
                  <div className="flex items-center justify-between p-2 rounded-md bg-red-50 dark:bg-red-900/20">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <span className="text-sm">Protections désactivées</span>
                    </div>
                    <span className="text-sm text-red-500">24h</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2 p-3 rounded-md bg-yellow-50 dark:bg-yellow-900/20">
              <Badge className={getWarningColor(cost.consequences.warningLevel)}>
                <div className="flex items-center gap-1">
                  {getWarningIcon(cost.consequences.warningLevel)}
                  <span>Niveau {cost.consequences.warningLevel.toLowerCase()}</span>
                </div>
              </Badge>
              <span className="text-sm">
                {cost.consequences.warningLevel === "HIGH" && "Coût élevé, à utiliser avec prudence"}
                {cost.consequences.warningLevel === "MEDIUM" && "Coût modéré, vérifiez votre budget"}
                {cost.consequences.warningLevel === "LOW" && "Coût faible, impact limité"}
              </span>
            </div>
            
            {cost.explanationRequired && (
              <div className="space-y-2">
                <Label htmlFor="reason">
                  Pourquoi est-ce urgent ? (optionnel)
                </Label>
                <Textarea
                  id="reason"
                  placeholder="Ex: deadline client, urgence..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                />
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter className="gap-2 sm:space-x-0">
          <Button variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button onClick={handleConfirm}>
            Forcer quand même
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}