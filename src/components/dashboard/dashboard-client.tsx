"use client";

import { useState } from "react";
import type { Task } from "@/lib/types";
import { initialTasks } from "@/lib/data";
import { Recommendations } from "./recommendations";
import { TaskList } from "./task-list";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { UserNav } from "../user-nav";
import { PlaylistGenerator } from "./playlist-generator";
import { Button } from "../ui/button";

export function DashboardClient() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [searchTerm, setSearchTerm] = useState("");

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

  return (
    <div className="space-y-8">
      {/* Section 1: Premium Header */}
      <div 
        className="relative rounded-3xl bg-[#1A1A1A] p-8 text-white overflow-hidden"
        style={{minHeight: '160px'}}
      >
        <div className="relative z-10 flex justify-between items-start">
            <div>
                <p className="text-xl font-bold">Hey Junior !</p>
                <h1 className="text-2xl font-bold mt-1">Prêt à commencer votre journée ?</h1>
            </div>
            <div className="hidden sm:block">
              <UserNav />
            </div>
        </div>
        {/* Abstract background pattern */}
        <div className="absolute inset-0 z-0 opacity-10">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="a" patternUnits="userSpaceOnUse" width="40" height="40" patternTransform="scale(1) rotate(0)"><rect x="0" y="0" width="100%" height="100%" fill="none"/><path d="M10-10l20 20m0-40l-20 20" stroke-width="1" stroke="white" fill="none"/></pattern></defs><rect width="800%" height="800%" transform="translate(0,0)" fill="url(#a)"/></svg>
        </div>
      </div>

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
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Tasks</h2>
             <Button variant="link" className="text-primary">View all</Button>
        </div>
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