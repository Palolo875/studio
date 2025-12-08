"use client";

import { useState } from "react";
import type { Task } from "@/lib/types";
import { initialTasks } from "@/lib/data";
import { PlaylistGenerator } from "./playlist-generator";
import { Recommendations } from "./recommendations";
import { TaskList } from "./task-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, ListTodo, Sparkles } from "lucide-react";

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
  
  const completedTasks = filteredTasks.filter(task => task.completed).length;
  const progress = filteredTasks.length > 0 ? (completedTasks / filteredTasks.length) * 100 : 0;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <Card>
            <CardHeader>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                        placeholder="Search tasks..."
                        className="pl-10 w-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </CardHeader>
            <CardContent>
                <TaskList
                    tasks={filteredTasks}
                    onToggleCompletion={toggleTaskCompletion}
                    progress={progress}
                />
            </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">Daily Playlist</CardTitle>
            <ListTodo className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <PlaylistGenerator onPlaylistGenerated={handleSetTasks} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">AI Recommendations</CardTitle>
            <Sparkles className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Recommendations tasks={tasks} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
