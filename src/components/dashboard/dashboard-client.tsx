"use client";

import { useState } from "react";
import type { Task } from "@/lib/types";
import { initialTasks } from "@/lib/data";
import { Recommendations } from "./recommendations";
import { TaskList } from "./task-list";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { PlaylistGenerator } from "./playlist-generator";
import { Button } from "../ui/button";
import { DailyGreeting } from "./daily-greeting";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [energyLevel, setEnergyLevel] = useState<EnergyState>(null);
  const [intention, setIntention] = useState("");

  const handleSetTasks = (newTasks: Task[]) => {
    setTasks(newTasks);
  };

  const toggleTaskCompletion = (taskId: string) => {
    setTasks(
      tasks.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const filteredTasks = tasks.filter((task) =>
    task.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const playlistMessage = energyLevel ? dynamicMessages[energyLevel] : "Voici votre journée, claire et faisable :";

  return (
    <div className="space-y-8">
      {/* Section 1: Daily Greeting */}
      <DailyGreeting 
        name="Junior" 
        onEnergyChange={setEnergyLevel}
        onIntentionChange={setIntention}
      />

      {/* Section 2: Barre de recherche */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Chercher une tâche, une note…"
          className="pl-12 h-12 rounded-2xl bg-card shadow-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Section 3: Recommandations */}
      <div>
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Ton énergie du jour</h2>
            <Button variant="link" className="text-primary">View all</Button>
        </div>
        <Recommendations tasks={tasks} />
      </div>

      {/* Section 4: Task List */}
      <div>
        <h3 className="text-lg font-medium mb-4">Votre playlist du jour</h3>
        <p className="text-lg font-medium text-foreground mt-4 mb-6">{playlistMessage}</p>
        <TaskList
            tasks={filteredTasks}
            onToggleCompletion={toggleTaskCompletion}
        />
      </div>

      {/* Playlist Generator (Hidden for now, can be a modal or separate page) */}
      <Card className="hidden">
        <CardHeader>
          <CardTitle>Daily Playlist</CardTitle>
        </CardHeader>
        <CardContent>
          <PlaylistGenerator onPlaylistGenerated={handleSetTasks} />
        </CardContent>
      </Card>
    </div>
  );
}
