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
import { BrainCircuit, Rocket, Sparkles, Target, Zap, ArrowRight, Lightbulb } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";

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

  const CategoryCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
    <Card className="rounded-3xl shadow-sm w-full sm:w-[150px] h-[150px] flex flex-col justify-between p-4 bg-card">
        <div>{icon}</div>
        <div>
            <p className="font-bold text-sm">{title}</p>
            <div className="flex justify-end mt-2">
                <div className="bg-muted rounded-full p-1">
                    <ArrowRight className="h-4 w-4 text-foreground" />
                </div>
            </div>
        </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <CategoryCard 
            icon={<div className="p-2 bg-secondary rounded-full w-fit"><Rocket className="h-5 w-5 text-secondary-foreground" /></div>}
            title="Boost d’énergie"
            description="Concentre-toi sur 1 tâche importante ce matin."
        />
        <CategoryCard 
            icon={<div className="p-2 bg-secondary rounded-full w-fit"><Lightbulb className="h-5 w-5 text-secondary-foreground" /></div>}
            title="Créativité"
            description="Idée à explorer aujourd’hui."
        />
      </div>

       {/* Hidden selectors and button, can be triggered by cards */}
       <div className="hidden">
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
      </div>

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
