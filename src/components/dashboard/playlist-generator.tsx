"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { DailyRituals, Task } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Music } from "lucide-react";
import { generatePlaylistClient } from "@/lib/playlistClient";

interface PlaylistGeneratorProps {
  onPlaylistGenerated: (tasks: Task[]) => void;
  dailyRituals?: DailyRituals;
}

export function PlaylistGenerator({ onPlaylistGenerated, dailyRituals = { playlistShuffledCount: 0, completedTaskCount: 0, completedTasks: [] } }: PlaylistGeneratorProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]> | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    return () => {
      // noop
    };
  }, []);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFieldErrors(null);

    try {
      const formData = new FormData(e.currentTarget);
      const result = await generatePlaylistClient(formData);

      if (result.errors) {
        setFieldErrors(result.errors);
        const errorMessages = Object.values(result.errors).flat().join("\n");
        toast({
          variant: "destructive",
          title: "Erreur",
          description: result.message + (errorMessages ? `\n${errorMessages}` : ""),
        });
        return;
      }

      if (result.tasks.length > 0) {
        onPlaylistGenerated(result.tasks.map((t) => t.task));
      }

      toast({
        title: "Succès",
        description: result.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4 pt-4">
       <input type="hidden" name="dailyRituals" value={JSON.stringify(dailyRituals)} />
      <div className="space-y-2">
        <Label htmlFor="goals">Objectifs du jour</Label>
        <Textarea
          id="goals"
          name="goals"
          placeholder="Ex: Finaliser la proposition de projet, préparer la réunion d'équipe"
          required
        />
        {fieldErrors?.goals && (
          <p className="text-sm text-destructive">{fieldErrors.goals[0]}</p>
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
        {fieldErrors?.priorities && (
          <p className="text-sm text-destructive">{fieldErrors.priorities[0]}</p>
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
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Génération en cours..." : <>
          <Music className="mr-2 h-4 w-4" /> Générer ma playlist
        </>
        }
      </Button>
    </form>
  );
}
