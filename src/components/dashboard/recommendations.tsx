"use client";

import { useState, useTransition } from "react";
import type { Task } from "@/lib/types";
import { handleGetRecommendations } from "@/app/actions";
import { energyLevels, intentions, focusAreas } from "@/lib/data";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { BrainCircuit, Sparkles, Target, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface RecommendationsProps {
  tasks: Task[];
}

type Recommendation = {
    id: string;
    reason: string;
}

export function Recommendations({ tasks }: RecommendationsProps) {
  const [energyLevel, setEnergyLevel] = useState("medium");
  const [intention, setIntention] = useState("focus");
  const [focus, setFocus] = useState("work");
  const [isPending, startTransition] = useTransition();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const { toast } = useToast();

  const getRecommendations = async () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("energyLevel", energyLevel);
      formData.append("intention", intention);
      formData.append("focus", focus);
      formData.append("tasks", JSON.stringify(tasks.filter(t => !t.completed)));

      const result = await handleGetRecommendations(formData);

      if (result.error) {
        toast({
            variant: "destructive",
            title: "Recommendation Error",
            description: result.error,
        })
      } else if (result.recommendations && result.recommendations.length > 0) {
        setRecommendations(result.recommendations);
        setIsAlertOpen(true);
      } else {
        toast({
            title: "No Recommendations",
            description: "No suitable tasks found for your current state.",
        })
      }
    });
  };

  const recommendedTaskDetails = recommendations.map(rec => {
    const task = tasks.find(t => t.id === rec.id);
    return task ? { ...task, reason: rec.reason } : null;
  }).filter(Boolean);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
            <Label className="flex items-center gap-2"><Zap size={16}/> Energy Level</Label>
            <Select value={energyLevel} onValueChange={setEnergyLevel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                {energyLevels.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                    {level.label}
                    </SelectItem>
                ))}
                </SelectContent>
            </Select>
        </div>
        <div className="space-y-2">
            <Label className="flex items-center gap-2"><BrainCircuit size={16}/> Intention</Label>
            <Select value={intention} onValueChange={setIntention}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                {intentions.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                    {item.label}
                    </SelectItem>
                ))}
                </SelectContent>
            </Select>
        </div>
        <div className="space-y-2">
            <Label className="flex items-center gap-2"><Target size={16}/> Focus Area</Label>
            <Select value={focus} onValueChange={setFocus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                {focusAreas.map((area) => (
                    <SelectItem key={area.value} value={area.value}>
                    {area.label}
                    </SelectItem>
                ))}
                </SelectContent>
            </Select>
        </div>
      </div>
      <Button onClick={getRecommendations} disabled={isPending || tasks.filter(t => !t.completed).length === 0} className="w-full">
        {isPending ? "Analyzing..." : <>
            <Sparkles className="mr-2 h-4 w-4" />
            Get Recommendations
        </>}
      </Button>
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Personalized Task Recommendations</AlertDialogTitle>
            <AlertDialogDescription>
              Based on your current state, here are a few tasks you could focus on:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
            {recommendedTaskDetails.map((task) => task && (
              <div key={task.id} className="p-3 rounded-md bg-muted/50">
                <p className="font-semibold">{task.name}</p>
                <p className="text-sm text-muted-foreground">{task.reason}</p>
              </div>
            ))}
          </div>
          <AlertDialogFooter>
            <AlertDialogAction>Got it!</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
