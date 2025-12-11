'use client';

import {useState, useTransition, useEffect} from 'react';
import type {DailyRituals, Task} from '@/lib/types';
import {initialTasks} from '@/lib/data';
import {Recommendations} from './recommendations';
import {TaskList} from './task-list';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Input} from '@/components/ui/input';
import {RefreshCw, Search, Siren, CalendarClock} from 'lucide-react';
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import {useRouter} from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TimelineView } from './timeline-view';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { EnergyCheckIn } from './energy-check-in';

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
  const [tasks, setTasks] = useState<Task[]>([]);
  const [initialTaskCount, setInitialTaskCount] = useState<number>(0);
  const [dailyRituals, setDailyRituals] = useState<DailyRituals>({
    playlistShuffledCount: 0,
    completedTaskCount: 0,
    completedTasks: [],
  });
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [energyLevel, setEnergyLevel] = useState<EnergyState>(null);
  const [intention, setIntention] = useState<string>('');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [showBonusCard, setShowBonusCard] = useState<boolean>(false);
  const router = useRouter();

  const [urgentTaskName, setUrgentTaskName] = useState('');
  const [replaceTask, setReplaceTask] = useState(false);
  const [isPanicModalOpen, setIsPanicModalOpen] = useState(false);
  
  const [showMorningRitual, setShowMorningRitual] = useState(false);
  const [morningRitualCompleted, setMorningRitualCompleted] = useState(false);

  useEffect(() => {
    const lastCheckin = localStorage.getItem('lastMorningCheckin');
    const today = new Date().toISOString().split('T')[0];
    if (lastCheckin !== today) {
        setShowMorningRitual(true);
    } else {
        setMorningRitualCompleted(true);
        // Load tasks from somewhere if ritual is already done
        setTasks(initialTasks);
        setInitialTaskCount(initialTasks.length);
    }
  }, []);

  const handleMorningRitualSubmit = () => {
    setShowMorningRitual(false);
    setMorningRitualCompleted(true);
    localStorage.setItem('lastMorningCheckin', new Date().toISOString().split('T')[0]);
    handleRegeneratePlaylist(true);
  };


  const handleSetTasks = (newTasks: Task[]) => {
    setTasks(newTasks);
    setInitialTaskCount(newTasks.length);
    if (newTasks !== initialTasks) {
      setDailyRituals((prev: DailyRituals) => ({
        ...prev,
        playlistShuffledCount: prev.playlistShuffledCount + 1,
      }));
    }
  };

  const handleRegeneratePlaylist = (isFirstGeneration = false) => {
    if (!isFirstGeneration && dailyRituals.playlistShuffledCount >= 2) {
      toast({
        variant: 'destructive',
        title: 'Limite atteinte',
        description: "Vous avez atteint votre limite de 2 régénérations par jour.",
      });
      return;
    }
    
    setIsGenerating(true);

    startTransition(async () => {
      const formData = new FormData();
      formData.append('goals', 'My current goals');
      formData.append('priorities', 'My top priorities');
      formData.append('dailyRituals', JSON.stringify(dailyRituals));
      
      if (energyLevel) {
        formData.append('energyLevel', energyLevel);
      }
      if (intention) {
        formData.append('intention', intention);
      }

      const response = await handleGeneratePlaylist(
        {tasks: tasks, errors: null, message: ''},
        formData
      );

      setIsGenerating(false);

      if (response.errors) {
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: response.message,
        });
      } else {
        setTasks(response.tasks);
        setInitialTaskCount(response.tasks.length);
        if (response.playlistShuffledCount) {
          setDailyRituals((prev: DailyRituals) => ({
            ...prev,
            playlistShuffledCount: response.playlistShuffledCount!,
          }));
        }
        if (isFirstGeneration) {
          toast({
            title: 'Votre journée est prête !',
            description: "Voici les tâches qui comptent vraiment aujourd'hui.",
          });
        }
      }
    });
  };

  const handleTaskCompletion = (taskId: string) => {
    let completedTask: Task | undefined;
    const newTasks = tasks.map((task: Task) => {
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
        : dailyRituals.completedTasks.filter((t: Task) => t.id !== taskId);

      const newDailyRituals = {
        ...dailyRituals,
        completedTaskCount: updatedCompletedTasks.length,
        completedTasks: updatedCompletedTasks,
      };
      setDailyRituals(newDailyRituals);

      if (completedTask.completed) {
        setTimeout(() => {
          const updatedTasks = newTasks.filter((t: Task) => t.id !== taskId);
          setTasks(updatedTasks);

          const remainingTasks = updatedTasks.filter((t: Task) => !t.completed);
          if (remainingTasks.length === 0) {
            setTimeout(() => handleAllTasksCompleted(newDailyRituals), 2000);
          }
        }, 800);
      }
    }
  };

  const handleAllTasksCompleted = (currentRituals: DailyRituals) => {
    const completedTaskNames = currentRituals.completedTasks
        .map(t => t.name)
        .join(',');
    router.push(
        `/dashboard/evening?completed=${encodeURIComponent(
            completedTaskNames
        )}&total=${initialTaskCount}`
    );
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
    setTasks((prev: Task[]) => [...prev, bonusTask]);
    setShowBonusCard(false);
  };

  const handleAddUrgentTask = () => {
    if (!urgentTaskName) return;

    const newTask: Task = {
      id: `urgent-${Date.now()}`,
      name: urgentTaskName,
      completed: false,
      priority: 'high',
      tags: ['Urgent'],
      subtasks: 0,
      lastAccessed: new Date().toISOString(),
      completionRate: 0,
    };

    if (replaceTask && tasks.length > 0) {
        const remainingTasks = tasks.slice(1);
        setTasks([newTask, ...remainingTasks]);
        toast({
            title: "Tâche urgente ajoutée",
            description: `"${newTask.name}" a remplacé la tâche précédente.`,
        });
    } else {
        setTasks([newTask, ...tasks]);
        toast({
            title: "Tâche urgente ajoutée",
            description: `"${newTask.name}" est maintenant en haut de votre liste.`,
        });
    }

    setUrgentTaskName('');
    setReplaceTask(false);
    setIsPanicModalOpen(false);
  };

  const filteredTasks = tasks.filter((task: Task) =>
    task.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const playlistMessage = energyLevel
    ? dynamicMessages[energyLevel]
    : 'Voici votre journée, claire et faisable :';

  return (
    <div className="space-y-8">
      <Dialog open={showMorningRitual} onOpenChange={setShowMorningRitual}>
        <DialogContent className="sm:max-w-[480px] p-8">
            <DialogHeader>
                <DialogTitle className="text-2xl text-center">Comment tu te sens ce matin ?</DialogTitle>
            </DialogHeader>
            <EnergyCheckIn
              onEnergyChange={setEnergyLevel}
              onIntentionChange={setIntention}
            />
            <DialogFooter className="!justify-center pt-4">
              <Button 
                size="lg" 
                className="h-12 rounded-full px-8"
                onClick={handleMorningRitualSubmit}
                disabled={!energyLevel}
              >
                Valider
              </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>


      <DailyGreeting
        name="Junior"
        onEnergyChange={setEnergyLevel}
        onIntentionChange={setIntention}
        energyLevel={energyLevel}
      />

      {morningRitualCompleted && (
        <>
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
            </div>
            <Recommendations tasks={tasks} />
          </div>

          <Tabs defaultValue="playlist" className="w-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <TabsList className="grid w-full grid-cols-2 bg-card h-12 rounded-2xl p-1 sm:max-w-sm">
                <TabsTrigger
                  value="playlist"
                  className="rounded-xl h-full data-[state=active]:bg-muted data-[state=active]:text-foreground"
                >
                  Ma playlist
                </TabsTrigger>
                <TabsTrigger
                  value="timeline"
                  className="rounded-xl h-full data-[state=active]:bg-muted data-[state=active]:text-foreground flex items-center gap-2"
                >
                  <CalendarClock />
                  Timeline
                </TabsTrigger>
              </TabsList>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRegeneratePlaylist(false)}
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

              <div className="overflow-hidden relative min-h-[100px]">
                <AnimatePresence mode="wait">
                  {isGenerating ? (
                    <motion.div
                      key="generating"
                      initial={{opacity: 0, y: 50}}
                      animate={{opacity: 1, y: 0}}
                      exit={{opacity: 0, y: -50}}
                      transition={{duration: 0.3}}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <p>Génération de votre playlist...</p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="tasks"
                      initial={{opacity: 0}}
                      animate={{opacity: 1}}
                      exit={{opacity: 0}}
                      transition={{duration: 0.3}}
                    >
                      <TaskList
                        tasks={filteredTasks}
                        onToggleCompletion={handleTaskCompletion}
                      />
                    </motion.div>
                  )}
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

          <AlertDialog open={isPanicModalOpen} onOpenChange={setIsPanicModalOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Gérer un imprévu</AlertDialogTitle>
                <AlertDialogDescription>
                  Ajoutez une tâche urgente à votre playlist pour aujourd'hui.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                    <Label htmlFor="urgent-task">Nom de la tâche urgente</Label>
                    <Input
                        id="urgent-task"
                        value={urgentTaskName}
                        onChange={(e) => setUrgentTaskName(e.target.value)}
                        placeholder="Ex: Appeler le client X en urgence"
                    />
                </div>
                <div className="flex items-center space-x-2">
                    <Switch id="replace-task" checked={replaceTask} onCheckedChange={setReplaceTask} />
                    <Label htmlFor="replace-task">Remplacer la tâche actuelle</Label>
                </div>
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={handleAddUrgentTask}>Ajouter en urgence</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button 
            onClick={() => setIsPanicModalOpen(true)}
            className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-2xl z-20"
            size="icon"
          >
            <Siren className="h-8 w-8" />
          </Button>

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
        </>
      )}
    </div>
  );
}
