
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

export function PlaylistGenerator({ onPlaylistGenerated, dailyRituals = { playlistShuffledCount: 0 } }: PlaylistGeneratorProps) {
  const [state, formAction] = useActionState(handleGeneratePlaylist, initialState);
  const { toast } = useToast();

  useEffect(() => {
    if (state.message && !state.errors) {
      onPlaylistGenerated(state.tasks);
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
    <form action={formAction} className="space-y-4">
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
      <SubmitButton />
    </form>
  );
}
