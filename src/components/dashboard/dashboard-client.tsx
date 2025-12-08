
'use client';

import {useState, useTransition} from 'react';
import type {DailyRituals, Task} from '@/lib/types';
import {initialTasks} from '@/lib/data';
import {Recommendations} from './recommendations';
import {TaskList} from './task-list';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Input} from '@/components/ui/input';
import {RefreshCw, Search} from 'lucide-react';
import {PlaylistGenerator} from './playlist-generator';
import {Button} from '../ui/button';
import {DailyGreeting} from './daily-greeting';
import {handleGeneratePlaylist} from '@/app/actions';
import {useToast} from '@/hooks/use-toast';
import {AnimatePresence, motion} from 'framer-motion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {useRouter} from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TimelineView } from './timeline-view';

type EnergyState =
  | 'energized'
  | 'normal'
  | 'slow'
  | 'focused'
  | 'creative'
  | null;

const dynamicMessages: Record<string, string> = {
  energized: 'Vous êtes en feu ! Voici vos défis :',
  normal: 'Voici votre journée, claire et faisable :',
  slow: 'On y va doucement. Voici 3 choses simples :',
  focused: 'Mode concentration activé. Voici vos défis :',
  creative: "L'inspiration est là ! Voici comment la canaliser :",
};

export function DashboardClient() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [initialTaskCount, setInitialTaskCount] = useState(initialTasks.length);
  const [dailyRituals, setDailyRituals] = useState<DailyRituals>({
    playlistShuffledCount: 0,
    completedTaskCount: 0,
    completedTasks: [],
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [energyLevel, setEnergyLevel] = useState<EnergyState>(null);
  const [intention, setIntention] = useState('');
  const [isPending, startTransition] = useTransition();
  const {toast} = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [showBonusCard, setShowBonusCard] = useState(false);
  const router = useRouter();

  const handleSetTasks = (newTasks: Task[]) => {
    setTasks(newTasks);
    setInitialTaskCount(newTasks.length);
    // Also increment shuffle count if it's a regeneration
    if (newTasks !== initialTasks) {
      setDailyRituals(prev => ({
        ...prev,
        playlistShuffledCount: prev.playlistShuffledCount + 1,
      }));
    }
  };

  const handleRegeneratePlaylist = () => {
    startTransition(async () => {
      const formData = new FormData();
      // These are dummy values, the real ones should come from a form/state
      formData.append('goals', 'My current goals');
      formData.append('priorities', 'My top priorities');
      formData.append('dailyRituals', JSON.stringify(dailyRituals));

      // Create a temporary state to manage the action
      const response = await handleGeneratePlaylist(
        {tasks: tasks, errors: null, message: ''},
        formData
      );

      if (response.errors) {
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: response.message,
        });
      } else {
        setIsGenerating(true);
        setTimeout(() => {
          setTasks(response.tasks);
          setInitialTaskCount(response.tasks.length);
          if (response.playlistShuffledCount) {
            setDailyRituals(prev => ({
              ...prev,
              playlistShuffledCount: response.playlistShuffledCount!,
            }));
          }
          setIsGenerating(false);
        }, 500); // Animation duration
      }
    });
  };

  const handleTaskCompletion = (taskId: string) => {
    let completedTask: Task | undefined;
    const newTasks = tasks.map(task => {
      if (task.id === taskId) {
        completedTask = {
          ...task,
          completed: !task.completed,
          completedAt: !task.completed ? new Date().toISOString() : undefined,
        };
        return completedTask;
      }
      return task;
    });

    setTasks(newTasks);

    if (completedTask) {
      const updatedCompletedTasks = completedTask.completed
        ? [...dailyRituals.completedTasks, completedTask]
        : dailyRituals.completedTasks.filter(t => t.id !== taskId);

      const newDailyRituals = {
        ...dailyRituals,
        completedTaskCount: updatedCompletedTasks.length,
        completedTasks: updatedCompletedTasks,
      };
      setDailyRituals(newDailyRituals);

      if (completedTask.completed) {
        setTimeout(() => {
          const updatedTasks = newTasks.filter(t => t.id !== taskId);
          setTasks(updatedTasks);

          const remainingTasks = updatedTasks.filter(t => !t.completed);
          if (remainingTasks.length === 0) {
            setTimeout(() => handleAllTasksCompleted(newDailyRituals), 2000);
          }
        }, 800);
      }
    }
  };

  const handleAllTasksCompleted = (currentRituals: DailyRituals) => {
    const currentHour = new Date().getHours();
    if (currentHour < 16) {
      setShowBonusCard(true);
    } else {
      const completedTaskNames = currentRituals.completedTasks
        .map(t => t.name)
        .join(',');
      router.push(
        `/dashboard/evening?completed=${encodeURIComponent(
          completedTaskNames
        )}&total=${initialTaskCount}`
      );
    }
  };

  const addBonusTask = () => {
    const bonusTask: Task = {
      id: `bonus-task-${Date.now()}`,
      name: 'Tâche bonus : Préparer la journée de demain',
      completed: false,
      subtasks: 2,
      lastAccessed: new Date().toISOString(),
      completionRate: 0,
      priority: 'low',
    };
    setTasks(prev => [...prev, bonusTask]);
    setShowBonusCard(false);
  };

  const filteredTasks = tasks.filter(task =>
    task.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const playlistMessage = energyLevel
    ? dynamicMessages[energyLevel]
    : 'Voici votre journée, claire et faisable :';

  return (
    <div className="space-y-8">
      <DailyGreeting
        name="Junior"
        onEnergyChange={setEnergyLevel}
        onIntentionChange={setIntention}
        energyLevel={energyLevel}
      />

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Chercher une tâche, une note…"
          className="pl-12 h-12 rounded-2xl bg-card shadow-sm"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Ton énergie du jour</h2>
          <Button variant="link" className="text-primary">
            View all
          </Button>
        </div>
        <Recommendations tasks={tasks} />
      </div>

      <Tabs defaultValue="playlist" className="w-full">
        <div className="flex justify-between items-center mb-4">
          <TabsList className="grid w-full grid-cols-2 bg-card h-12 rounded-2xl p-1 max-w-sm">
            <TabsTrigger value="playlist" className="rounded-xl h-full data-[state=active]:bg-muted data-[state=active]:text-foreground">Ma playlist</TabsTrigger>
            <TabsTrigger value="timeline" className="rounded-xl h-full data-[state=active]:bg-muted data-[state=active]:text-foreground">Timeline</TabsTrigger>
          </TabsList>
           <Button
            variant="ghost"
            size="sm"
            onClick={handleRegeneratePlaylist}
            disabled={isPending || dailyRituals.playlistShuffledCount >= 2}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${
                isPending || isGenerating ? 'animate-spin' : ''
              }`}
            />
            Rafraîchir la playlist
          </Button>
        </div>

        <TabsContent value="playlist">
           <p className="text-lg font-medium text-foreground mt-4 mb-6">
            {playlistMessage}
          </p>

          <div className="overflow-hidden">
            <AnimatePresence>
              <motion.div
                key={isGenerating ? 'generating' : 'stale'}
                initial={{opacity: 1, y: 0}}
                animate={{opacity: 1, y: 0}}
                exit={{opacity: 0, y: -50}}
                transition={{duration: 0.2}}
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
        </TabsContent>
        <TabsContent value="timeline">
            <TimelineView tasks={tasks} />
        </TabsContent>
      </Tabs>


      <AlertDialog open={showBonusCard} onOpenChange={setShowBonusCard}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              🎉 Incroyable, vous avez fini en avance !
            </AlertDialogTitle>
            <AlertDialogDescription>
              Vous avez encore de l’énergie ? Voici une tâche bonus pour
              aujourd’hui :
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="p-3 rounded-md bg-muted/50">
            <p className="font-semibold">Préparer la journée de demain</p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowBonusCard(false)}>
              Non merci, je profite
            </AlertDialogCancel>
            <AlertDialogAction onClick={addBonusTask}>
              Ajouter à ma journée
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card className="hidden">
        <CardHeader>
          <CardTitle>Daily Playlist</CardTitle>
        </CardHeader>
        <CardContent>
          <PlaylistGenerator
            onPlaylistGenerated={handleSetTasks}
            dailyRituals={dailyRituals}
          />
        </CardContent>
      </Card>
    </div>
  );
}
