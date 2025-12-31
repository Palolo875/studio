
'use client';

import { useState, useTransition } from 'react';
import type { Task } from '@/lib/types';
import { getRecommendationsClient } from '@/lib/playlistClient';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowRight, Lightbulb, Rocket } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card } from '../ui/card';
import { PlaylistGenerator } from './playlist-generator';
import { ScrollArea, ScrollBar } from '../ui/scroll-area';

interface RecommendationsProps {
  tasks: Task[];
}

type Recommendation = {
  id: string;
  reason: string;
};

export function Recommendations({ tasks }: RecommendationsProps) {
  const [energyLevel] = useState('medium');
  const [intention] = useState('focus');
  const [focus] = useState('work');
  const [isPending, startTransition] = useTransition();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const { toast } = useToast();

  const getRecommendations = async () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append('energyLevel', energyLevel);
      formData.append('intention', intention);
      formData.append('focus', focus);
      formData.append(
        'tasks',
        JSON.stringify(tasks.filter((t) => !t.completed))
      );

      const result = await getRecommendationsClient(formData);

      if (result.error) {
        toast({
          variant: 'destructive',
          title: 'Recommendation Error',
          description: result.error,
        });
      } else if (result.recommendations && result.recommendations.length > 0) {
        setRecommendations(result.recommendations);
        setIsAlertOpen(true);
      } else {
        setIsGeneratorOpen(true);
      }
    });
  };

  const recommendedTaskDetails = recommendations
    .map((rec) => {
      const task = tasks.find((t) => t.id === rec.id);
      return task ? { ...task, reason: rec.reason } : null;
    })
    .filter(Boolean);

  const CategoryCard = ({
    icon,
    title,
    description,
    onClick,
  }: {
    icon: React.ReactNode;
    title: string;
    description: string;
    onClick?: () => void;
  }) => (
    <Card
      className="rounded-2xl shadow-sm flex-shrink-0 w-36 flex flex-col justify-between p-4 bg-card hover:bg-accent transition-colors cursor-pointer"
      onClick={onClick}
    >
      <div>{icon}</div>
      <div>
        <p className="font-bold text-sm">{title}</p>
        <div className="flex justify-between items-center mt-2">
          <p className="text-xs text-muted-foreground">{description}</p>
          <div className="bg-muted rounded-full p-1">
            <ArrowRight className="h-3 w-3 text-foreground" />
          </div>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      <ScrollArea className="w-full whitespace-nowrap -mx-1 px-1">
        <div className="flex gap-3 pb-4">
          <CategoryCard
            icon={
              <div className="p-2 bg-secondary rounded-full w-fit">
                <Rocket className="h-5 w-5 text-secondary-foreground" />
              </div>
            }
            title="Boost d’énergie"
            description="1 tâche"
            onClick={getRecommendations}
          />
          <CategoryCard
            icon={
              <div className="p-2 bg-secondary rounded-full w-fit">
                <Lightbulb className="h-5 w-5 text-secondary-foreground" />
              </div>
            }
            title="Générer ma playlist"
            description="Explorer"
            onClick={() => setIsGeneratorOpen(true)}
          />
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tâche recommandée</AlertDialogTitle>
            <AlertDialogDescription>
              En fonction de votre énergie, voici une tâche que vous pourriez
              accomplir :
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
            {recommendedTaskDetails.map(
              (task) =>
                task && (
                  <div key={task.id} className="p-3 rounded-md bg-muted/50">
                    <p className="font-semibold">{task.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {task.reason}
                    </p>
                  </div>
                )
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogAction>Parfait !</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isGeneratorOpen} onOpenChange={setIsGeneratorOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Générer une playlist</DialogTitle>
            <DialogDescription>
              Aucune tâche ne correspond à votre énergie. Générez une nouvelle
              playlist de tâches pour aujourd'hui.
            </DialogDescription>
          </DialogHeader>
          <PlaylistGenerator
            onPlaylistGenerated={() => setIsGeneratorOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
