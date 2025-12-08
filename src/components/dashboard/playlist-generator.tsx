"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { handleGeneratePlaylist } from "@/app/actions";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { Task } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Music } from "lucide-react";

interface PlaylistGeneratorProps {
  onPlaylistGenerated: (tasks: Task[]) => void;
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
      {pending ? "Generating..." : <>
        <Music className="mr-2 h-4 w-4" /> Generate Playlist
      </>
      }
    </Button>
  );
}

export function PlaylistGenerator({ onPlaylistGenerated }: PlaylistGeneratorProps) {
  const [state, formAction] = useActionState(handleGeneratePlaylist, initialState);
  const { toast } = useToast();

  useEffect(() => {
    if (state.message && !state.errors) {
      onPlaylistGenerated(state.tasks);
      toast({
        title: "Success",
        description: state.message,
      });
    } else if (state.errors) {
       const errorMessages = Object.values(state.errors).flat().join('\n');
       toast({
        variant: "destructive",
        title: "Error",
        description: state.message + (errorMessages ? `\n${errorMessages}` : ''),
      });
    }
  }, [state, onPlaylistGenerated, toast]);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="goals">Today's Goals</Label>
        <Textarea
          id="goals"
          name="goals"
          placeholder="e.g., Finalize project proposal, prepare for team meeting"
          required
        />
        {state.errors?.goals && (
          <p className="text-sm text-destructive">{state.errors.goals[0]}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="priorities">Top Priorities</Label>
        <Textarea
          id="priorities"
          name="priorities"
          placeholder="e.g., Focus on client feedback, block time for deep work"
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
