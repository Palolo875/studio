/**
 * Panic Task Modal - Composant pour ajouter une tâche urgente
 */
'use client';

import { useState } from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import type { Task } from '@/lib/types';

interface PanicTaskModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onAddTask: (task: Task, replaceExisting: boolean) => void;
}

export function PanicTaskModal({
    open,
    onOpenChange,
    onAddTask,
}: PanicTaskModalProps) {
    const [taskName, setTaskName] = useState('');
    const [replaceTask, setReplaceTask] = useState(false);
    const { toast } = useToast();

    const handleSubmit = () => {
        if (!taskName.trim()) {
            toast({
                variant: 'destructive',
                title: 'Erreur',
                description: 'Veuillez entrer un nom de tâche.',
            });
            return;
        }

        const newTask: Task = {
            id: `urgent-${Date.now()}`,
            name: taskName,
            completed: false,
            priority: 'high',
            tags: ['Urgent'],
            subtasks: [],
            lastAccessed: new Date().toISOString(),
            completionRate: 0,
        };

        onAddTask(newTask, replaceTask);

        // Reset form
        setTaskName('');
        setReplaceTask(false);
        onOpenChange(false);
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Gérer un imprévu</AlertDialogTitle>
                    <AlertDialogDescription>
                        Ajoutez une tâche urgente à votre playlist pour aujourd'hui.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label htmlFor="urgent-task">Nom de la tâche urgente</Label>
                        <Input
                            id="urgent-task"
                            value={taskName}
                            onChange={(e) => setTaskName(e.target.value)}
                            placeholder="Ex: Appeler le client X en urgence"
                            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                        />
                    </div>

                    <div className="flex items-center space-x-2">
                        <Switch
                            id="replace-task"
                            checked={replaceTask}
                            onCheckedChange={setReplaceTask}
                        />
                        <Label htmlFor="replace-task">Remplacer la tâche actuelle</Label>
                    </div>
                </div>

                <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction onClick={handleSubmit}>
                        Ajouter en urgence
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
