"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { handleGeneratePlaylist } from "@/app/actions";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { DailyRituals, Task } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Music } from "lucide-react";
import { decideSessionWithTrace } from "@/lib/taskEngine/brainEngine";
import type { BrainInput } from "@/lib/taskEngine/brainContracts";

interface PlaylistGeneratorProps {
  onPlaylistGenerated: (tasks: Task[]) => void;
  dailyRituals?: DailyRituals;
}

const initialState = {
  message: "",
  errors: null,
  tasks: [],
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Génération en cours..." : <>
        <Music className="mr-2 h-4 w-4" /> Générer ma playlist
      </>
      }
    </Button>
  );
}

export function PlaylistGenerator({ onPlaylistGenerated, dailyRituals = { playlistShuffledCount: 0, completedTaskCount: 0, completedTasks: [] } }: PlaylistGeneratorProps) {
  const [state, formAction] = useActionState(handleGeneratePlaylist, initialState);
  const { toast } = useToast();

  useEffect(() => {
    if (state.message && !state.errors && state.tasks.length > 0) {
      onPlaylistGenerated(state.tasks);

      try {
        const energyLevel = (document.getElementById('energyLevel') as HTMLSelectElement | null)?.value as
          | 'high'
          | 'medium'
          | 'low'
          | undefined;
        const intention = (document.getElementById('intention') as HTMLSelectElement | null)?.value as
          | 'focus'
          | 'learning'
          | 'creativity'
          | 'planning'
          | undefined;

        if (energyLevel && intention) {
          const brainTasks = state.tasks.map((t: Task) => {
            const now = new Date();
            return {
              id: t.id,
              title: t.name,
              description: t.description,
              duration: t.estimatedDuration ?? 30,
              effort: (t.energyRequired ?? 'medium') as 'low' | 'medium' | 'high',
              urgency: (t.priority ?? 'medium') as 'low' | 'medium' | 'high' | 'urgent',
              impact: 'medium' as const,
              deadline: t.scheduledDate ? new Date(t.scheduledDate) : undefined,
              scheduledTime: undefined,
              completionHistory: [],
              category: (t.tags && t.tags[0]) || 'general',
              status: t.completed ? 'done' : 'todo',
              activationCount: 0,
              lastActivated: t.lastAccessed ? new Date(t.lastAccessed) : now,
              createdAt: now,
              origin: 'self_chosen' as const,
              hasTangibleResult: true,
            };
          });

          const input: BrainInput = {
            tasks: brainTasks,
            userState: {
              energy: energyLevel,
              stability: 'stable',
              linguisticFatigue: false,
            },
            temporal: {
              currentTime: new Date(),
              availableTime: 8 * 60,
              timeOfDay:
                new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening',
            },
            budget: {
              daily: {
                maxLoad: 100,
                usedLoad: 0,
                remaining: 100,
                lockThreshold: 10,
              },
              session: {
                maxDuration: 90,
                maxTasks: 5,
                maxComplexity: 10,
              },
            },
            constraints: [],
            history: [],
            decisionPolicy: {
              level: 'ASSISTED',
              userConsent: true,
              overrideCostVisible: true,
            },
          };

          decideSessionWithTrace(input);
        }
      } catch {
        // ignore
      }

      toast({
        title: "Succès",
        description: state.message,
      });
    } else if (state.errors) {
       const errorMessages = Object.values(state.errors).flat().join('\n');
       toast({
        variant: "destructive",
        title: "Erreur",
        description: state.message + (errorMessages ? `\n${errorMessages}` : ''),
      });
    }
  }, [state, onPlaylistGenerated, toast]);

  return (
    <form action={formAction} className="space-y-4 pt-4">
       <input type="hidden" name="dailyRituals" value={JSON.stringify(dailyRituals)} />
      <div className="space-y-2">
        <Label htmlFor="goals">Objectifs du jour</Label>
        <Textarea
          id="goals"
          name="goals"
          placeholder="Ex: Finaliser la proposition de projet, préparer la réunion d'équipe"
          required
        />
        {state.errors?.goals && (
          <p className="text-sm text-destructive">{state.errors.goals[0]}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="priorities">Priorités principales</Label>
        <Textarea
          id="priorities"
          name="priorities"
          placeholder="Ex: Se concentrer sur les retours clients, bloquer du temps pour le travail de fond"
          required
        />
        {state.errors?.priorities && (
          <p className="text-sm text-destructive">{state.errors.priorities[0]}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="energyLevel">Niveau d'énergie</Label>
        <select 
          id="energyLevel" 
          name="energyLevel" 
          className="w-full p-2 rounded-md border bg-background"
        >
          <option value="high">Énergie élevée</option>
          <option value="medium">Énergie moyenne</option>
          <option value="low">Énergie faible</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="intention">Intention du jour</Label>
        <select 
          id="intention" 
          name="intention" 
          className="w-full p-2 rounded-md border bg-background"
        >
          <option value="focus">Concentration</option>
          <option value="learning">Apprentissage</option>
          <option value="creativity">Créativité</option>
          <option value="planning">Planification</option>
        </select>
      </div>
      <SubmitButton />
    </form>
  );
}
