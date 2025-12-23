/**
 * Floating Action Buttons - Boutons d'actions flottants
 */
'use client';

import { Siren, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FloatingActionsProps {
    onPanicClick: () => void;
    onGovernanceClick: () => void;
}

export function FloatingActions({
    onPanicClick,
    onGovernanceClick,
}: FloatingActionsProps) {
    return (
        <div className="fixed bottom-6 right-6 flex flex-col gap-2 z-20">
            {/* Panic button for urgent tasks */}
            <Button
                onClick={onPanicClick}
                className="h-16 w-16 rounded-full shadow-2xl"
                size="icon"
                aria-label="Ajouter une tâche urgente"
            >
                <Siren className="h-8 w-8" />
            </Button>

            {/* Governance panel button */}
            <Button
                onClick={onGovernanceClick}
                className="h-12 w-12 rounded-full shadow-2xl bg-purple-600 hover:bg-purple-700"
                size="icon"
                aria-label="Ouvrir le panneau de gouvernance"
            >
                <Shield className="h-5 w-5" />
            </Button>
        </div>
    );
}
