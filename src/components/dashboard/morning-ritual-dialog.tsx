/**
 * Morning Ritual Dialog - Composant pour le rituel matinal
 */
'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { EnergyCheckIn } from './energy-check-in';
import { useToast } from '@/hooks/use-toast';
import { setSetting } from '@/lib/database';

export type EnergyState =
    | 'energized'
    | 'normal'
    | 'slow'
    | 'focused'
    | 'creative'
    | null;

interface MorningRitualDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onComplete: (energyLevel: EnergyState, intention: string) => void;
}

export function MorningRitualDialog({
    open,
    onOpenChange,
    onComplete,
}: MorningRitualDialogProps) {
    const [energyLevel, setEnergyLevel] = useState<EnergyState>(null);
    const [energyStability, setEnergyStability] = useState<'stable' | 'volatile'>('stable');
    const [intention, setIntention] = useState('');
    const { toast } = useToast();

    const handleSubmit = () => {
        if (!energyLevel) {
            toast({
                variant: 'destructive',
                title: 'Oups !',
                description: "Veuillez sélectionner votre niveau d'énergie.",
            });
            return;
        }

        const today = new Date().toISOString().split('T')[0];
        void setSetting('morning.lastCheckin', today);
        void setSetting('morning.todayEnergyLevel', energyLevel);
        void setSetting('morning.todayEnergyStability', energyStability);
        void setSetting('morning.todayIntention', intention || '');

        onComplete(energyLevel, intention);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[480px] p-8">
                <DialogHeader>
                    <DialogTitle className="text-2xl text-center">
                        Comment tu te sens ce matin ?
                    </DialogTitle>
                </DialogHeader>

                <EnergyCheckIn
                    onEnergyChange={setEnergyLevel}
                    onIntentionChange={setIntention}
                    onStabilityChange={setEnergyStability}
                />

                <DialogFooter className="!justify-center pt-4">
                    <Button
                        size="lg"
                        className="h-12 rounded-full px-8"
                        onClick={handleSubmit}
                        disabled={!energyLevel}
                    >
                        Valider
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
