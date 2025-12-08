

"use client";

import { useEffect, useState, useTransition } from "react";
import type { DailyRituals, Task } from "@/lib/types";
import { initialTasks } from "@/lib/data";
import { Recommendations } from "./recommendations";
import { TaskList } from "./task-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RefreshCw, Search } from "lucide-react";
import { PlaylistGenerator } from "./playlist-generator";
import { Button } from "../ui/button";
import { DailyGreeting } from "./daily-greeting";
import { handleGeneratePlaylist } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type EnergyState = "energized" | "normal" | "slow" | "focused" | "creative" | null;

const dynamicMessages: Record<string, string> = {
  energized: "Vous êtes en feu ! Voici vos défis :",
  normal: "Voici votre journée, claire et faisable :",
  slow: "On y va doucement. Voici 3 choses simples :",
  focused: "Mode concentration activé. Voici vos défis :",
  creative: "L'inspiration est là ! Voici comment la canaliser :",
};

export function DashboardClient() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [dailyRituals, setDailyRituals] = useState<DailyRituals>({ playlistShuffledCount: 0, completedTaskCount: 0 });
  const [searchTerm, setSearchTerm] = useState("");
  const [energyLevel, setEnergyLevel] = useState<EnergyState>(null);
  const [intention, setIntention] = useState("");
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [showBonusCard, setShowBonusCard] = useState(false);

  const handleSetTasks = (newTasks: Task[]) => {
    setTasks(newTasks);
    // Also increment shuffle count if it's a regeneration
    if (newTasks !== initialTasks) {
      setDailyRituals(prev => ({...prev, playlistShuffledCount: prev.playlistShuffledCount + 1}));
    }
  };

  const handleRegeneratePlaylist = () => {
    startTransition(async () => {
        const formData = new FormData();
        // These are dummy values, the real ones should come from a form/state
        formData.append("goals", "My current goals"); 
        formData.append("priorities", "My top priorities");
        formData.append("dailyRituals", JSON.stringify(dailyRituals));

        // Create a temporary state to manage the action
        const response = await handleGeneratePlaylist({tasks: tasks, errors: null, message: ""}, formData);

        if (response.errors) {
            toast({
                variant: "destructive",
                title: "Erreur",
                description: response.message,
            });
        } else {
            setIsGenerating(true);
            setTimeout(() => {
              setTasks(response.tasks);
              if (response.playlistShuffledCount) {
                setDailyRituals(prev => ({...prev, playlistShuffledCount: response.playlistShuffledCount!}))
              }
              setIsGenerating(false);
            }, 500); // Animation duration
        }
    });
  };

  const handleTaskCompletion = (taskId: string) => {
    const newTasks = tasks.map((task) =>
      task.id === taskId 
        ? { 
            ...task, 
            completed: !task.completed,
            completedAt: !task.completed ? new Date().toISOString() : undefined 
          } 
        : task
    );
    setTasks(newTasks);

    const task = tasks.find(t => t.id === taskId);
    let newCompletedCount = dailyRituals.completedTaskCount;
    if (task && !task.completed) {
        newCompletedCount++;
    } else if (task && task.completed) {
        newCompletedCount = Math.max(0, newCompletedCount - 1);
    }
    
    setDailyRituals(prev => ({ ...prev, completedTaskCount: newCompletedCount }));

    // Disappear animation
    setTimeout(() => {
        const updatedTasks = tasks.filter(t => t.id !== taskId || !t.completed);
        setTasks(updatedTasks);
        
        // Check for completion
        const remainingTasks = updatedTasks.filter(t => !t.completed);
        if (remainingTasks.length === 0) {
          handleAllTasksCompleted();
        }
    }, 800);
  };
  
  const handleAllTasksCompleted = () => {
    const currentHour = new Date().getHours();
    if (currentHour < 16) {
      setShowBonusCard(true);
    } else {
      // Trigger evening celebration
       toast({
        title: "🎉 Bravo !",
        description: "Vous avez terminé toutes vos tâches pour aujourd'hui !",
      });
    }
  };

  const addBonusTask = () => {
    const bonusTask: Task = {
        id: `bonus-task-${Date.now()}`,
        name: "Tâche bonus : Préparer la journée de demain",
        completed: false,
        subtasks: 2,
        lastAccessed: new Date().toISOString(),
        completionRate: 0,
        priority: "low"
    };
    setTasks(prev => [...prev, bonusTask]);
    setShowBonusCard(false);
  }

  const filteredTasks = tasks.filter((task) =>
    task.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const playlistMessage = energyLevel ? dynamicMessages[energyLevel] : "Voici votre journée, claire et faisable :";

  return (
    <div className="space-y-8">
      <DailyGreeting 
        name="Junior" 
        onEnergyChange={setEnergyLevel}
        onIntentionChange={setIntention}
      />

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Chercher une tâche, une note…"
          className="pl-12 h-12 rounded-2xl bg-card shadow-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Ton énergie du jour</h2>
            <Button variant="link" className="text-primary">View all</Button>
        </div>
        <Recommendations tasks={tasks} />
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Votre playlist du jour</h3>
            <Button variant="ghost" size="sm" onClick={handleRegeneratePlaylist} disabled={isPending || dailyRituals.playlistShuffledCount >= 2}>
                <RefreshCw className={`mr-2 h-4 w-4 ${isPending || isGenerating ? 'animate-spin' : ''}`} />
                Rafraîchir la playlist
            </Button>
        </div>

        <p className="text-lg font-medium text-foreground mt-4 mb-6">{playlistMessage}</p>
        
        <div className="overflow-hidden">
            <AnimatePresence>
                <motion.div
                    key={isGenerating ? 'generating' : 'stale'}
                    initial={{ opacity: 1, y: 0 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -50 }}
                    transition={{ duration: 0.2 }}
                >
                {!isGenerating && (
                    <TaskList
                        key={tasks.map(t => t.id).join('-')}
                        tasks={filteredTasks}
                        onToggleCompletion={handleTaskCompletion}
                    />
                )}
                </motion.div>
            </AnimatePresence>
        </div>

      </div>

      <AlertDialog open={showBonusCard} onOpenChange={setShowBonusCard}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>🎉 Incroyable, vous avez fini en avance !</AlertDialogTitle>
            <AlertDialogDescription>
              Vous avez encore de l’énergie ? Voici une tâche bonus pour aujourd’hui :
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="p-3 rounded-md bg-muted/50">
            <p className="font-semibold">Préparer la journée de demain</p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowBonusCard(false)}>Non merci, je profite</AlertDialogCancel>
            <AlertDialogAction onClick={addBonusTask}>Ajouter à ma journée</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card className="hidden">
        <CardHeader>
          <CardTitle>Daily Playlist</CardTitle>
        </CardHeader>
        <CardContent>
          <PlaylistGenerator onPlaylistGenerated={handleSetTasks} dailyRituals={dailyRituals} />
        </CardContent>
      </Card>
    </div>
  );
}
