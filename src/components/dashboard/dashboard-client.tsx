'use client';

import { useState, useTransition, useEffect } from 'react';
import type { DailyRituals, Task } from '@/lib/types';
import { Recommendations } from './recommendations';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { RefreshCw, Search, Siren, CalendarClock, Shield } from 'lucide-react';
import { PlaylistGenerator } from './playlist-generator';
import { Button } from '../ui/button';
import { DailyGreeting } from './daily-greeting';
import { generatePlaylistClient } from '@/lib/playlistClient';
import { dbTaskToUiTask, uiTaskToDbTask } from '@/lib/taskMapping';
import { useToast } from '@/hooks/use-toast';
import { AnimatePresence, motion } from 'framer-motion';
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
import { useRouter } from 'next/navigation';
import { TimelineView } from './timeline-view';
import { TaskList } from './task-list';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { EnergyCheckIn } from './energy-check-in';
import { phase7Manager } from '@/lib/phase7Main';
import { SovereigntyMode } from '@/lib/phase7Implementation';
import { ConflictResolutionModal } from './conflict-resolution-modal';
import { OverrideConfirmation } from './override-confirmation';
import { ProtectiveModeNotification } from './protective-mode-notification';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  getAllTasks,
  upsertTasks,
  completeTask as completeDbTask,
  updateTask as updateDbTask,
  createSession as createDbSession,
  updateSession as updateDbSession,
  getSessionsByDate,
  recordOverride,
  recordSleepData,
  recordTaskProposals,
  recordTaskSkips,
  getSetting,
  setSetting,
} from '@/lib/database';


type EnergyState =
  | 'energized'
  | 'normal'
  | 'slow'
  | 'focused'
  | 'creative'
  | null;

const dynamicMessages: Record<string, string> = {
  energized: 'Prêt à déplacer des montagnes ! Voici vos défis :',
  normal: 'Une bonne énergie pour une journée productive. Voici votre plan :',
  slow: 'On y va en douceur. Voici 3 tâches simples pour bien démarrer :',
  focused: 'Mode concentration activé. Voici vos objectifs pour rester dans la zone :',
  creative: "L'inspiration est là ! Voici comment la canaliser et créer quelque chose de génial :",
};

function toDbEnergyLevel(energy: EnergyState): 'low' | 'medium' | 'high' | undefined {
  if (!energy) return undefined;
  if (energy === 'slow') return 'low';
  if (energy === 'normal') return 'medium';
  return 'high';
}

export function DashboardClient() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [initialTaskCount, setInitialTaskCount] = useState<number>(0);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sleepHours, setSleepHours] = useState<number | null>(null);
  const [dailyRituals, setDailyRituals] = useState<DailyRituals>({
    playlistShuffledCount: 0,
    completedTaskCount: 0,
    completedTasks: [],
  });
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [energyLevel, setEnergyLevel] = useState<EnergyState>(null);
  const [energyStability, setEnergyStability] = useState<'stable' | 'volatile'>('stable');
  const [intention, setIntention] = useState<string>('');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [showBonusCard, setShowBonusCard] = useState<boolean>(false);
  const router = useRouter();

  const [urgentTaskName, setUrgentTaskName] = useState('');
  const [replaceTask, setReplaceTask] = useState(false);
  const [isPanicModalOpen, setIsPanicModalOpen] = useState(false);

  // États de la Phase 7
  const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [isProtectiveNotificationOpen, setIsProtectiveNotificationOpen] = useState(false);
  const [currentConflict, setCurrentConflict] = useState<any>(null);
  const [pendingTask, setPendingTask] = useState<Task | null>(null);
  const [overrideCost, setOverrideCost] = useState<any>(null);
  const [burnoutSignals, setBurnoutSignals] = useState<any>({});

  const [showMorningRitual, setShowMorningRitual] = useState(false);
  const [morningRitualCompleted, setMorningRitualCompleted] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const today = new Date().toISOString().split('T')[0];
      const lastCheckin = await getSetting<string>('morning.lastCheckin');

      if (cancelled) return;

      if (lastCheckin !== today) {
        setShowMorningRitual(true);
        return;
      }

      setMorningRitualCompleted(true);

      const storedEnergy = await getSetting<EnergyState>('morning.todayEnergyLevel');
      const storedStability = await getSetting<'stable' | 'volatile'>('morning.todayEnergyStability');
      const storedIntention = await getSetting<string>('morning.todayIntention');
      if (cancelled) return;
      if (storedEnergy) setEnergyLevel(storedEnergy);
      if (storedStability) setEnergyStability(storedStability);
      if (storedIntention) setIntention(storedIntention);

      // Charger depuis Dexie
      getAllTasks()
        .then(dbTasks => {
          const adapted = dbTasks.map(dbTaskToUiTask);
          if (!cancelled) {
            setTasks(adapted);
            setInitialTaskCount(adapted.length);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setTasks([]);
            setInitialTaskCount(0);
          }
        });

      try {
        const sessions = await getSessionsByDate(new Date());
        if (!cancelled && sessions.length) {
          setCurrentSessionId(sessions[sessions.length - 1].id);
        }
      } catch {
        // ignore
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleMorningRitualSubmit = () => {
    if (!energyLevel) {
      toast({
        variant: "destructive",
        title: "Oups !",
        description: "Veuillez sélectionner votre niveau d'énergie.",
      });
      return;
    }
    setShowMorningRitual(false);
    setMorningRitualCompleted(true);
    const today = new Date().toISOString().split('T')[0];
    void setSetting('morning.lastCheckin', today);
    void setSetting('morning.todayEnergyLevel', energyLevel);
    void setSetting('morning.todayEnergyStability', energyStability);
    void setSetting('morning.todayIntention', intention || '');

    if (typeof sleepHours === 'number' && Number.isFinite(sleepHours) && sleepHours >= 0 && sleepHours <= 24) {
      const date = new Date(today);
      recordSleepData({ date, hours: sleepHours, quality: undefined }).catch(() => null);
      void setSetting('morning.sleepHours', sleepHours);
    }

    handleRegeneratePlaylist(true);
  };


  const persistTasks = async (newTasks: Task[], options: { incrementShuffle?: boolean } = {}) => {
    setTasks(newTasks);
    setInitialTaskCount(newTasks.length);
    const dbTasks = newTasks.map(t => uiTaskToDbTask(t));
    await upsertTasks(dbTasks);
    if (options.incrementShuffle) {
      setDailyRituals((prev: DailyRituals) => ({
        ...prev,
        playlistShuffledCount: prev.playlistShuffledCount + 1,
      }));
    }
  };

  const handleSetTasks = (newTasks: Task[]) => {
    persistTasks(newTasks).catch(() => null);
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

      const mappedEnergy = toDbEnergyLevel(energyLevel);
      if (mappedEnergy) {
        formData.append('energyLevel', mappedEnergy);
      }
      formData.append('energyStability', energyStability);
      if (intention) {
        formData.append('intention', intention);
      }

      const response = await generatePlaylistClient(formData);

      setIsGenerating(false);

      if (response.errors) {
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: response.message,
        });
      } else {
        await persistTasks(response.tasks.map((t: any) => t.task as Task), { incrementShuffle: true });

        const nowMs = Date.now();

        if (currentSessionId) {
          const remainingTaskIds = tasks.filter((t: Task) => !t.completed).map((t: Task) => t.id);
          await recordTaskSkips(remainingTaskIds, currentSessionId).catch(() => null);
          await updateDbSession(currentSessionId, {
            endTime: nowMs,
            state: 'EXHAUSTED',
          }).catch(() => null);
        }

        const nextSessionId = `session_${nowMs}`;
        await createDbSession({
          id: nextSessionId,
          timestamp: nowMs,
          startTime: nowMs,
          endTime: undefined,
          plannedTasks: response.tasks.length,
          completedTasks: 0,
          state: 'IN_PROGRESS',
          energyLevel: toDbEnergyLevel(energyLevel),
          energyStability,
          taskIds: response.tasks.map((t) => t.task.id),
        }).catch(() => null);

        await recordTaskProposals(
          response.tasks.map((t) => t.task.id),
          nextSessionId
        ).catch(() => null);
        setCurrentSessionId(nextSessionId);

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

      if (currentSessionId) {
        const nowMs = Date.now();
        updateDbSession(currentSessionId, {
          timestamp: nowMs,
          plannedTasks: newTasks.length,
          completedTasks: updatedCompletedTasks.length,
          state: updatedCompletedTasks.length >= newTasks.length ? 'COMPLETED' : 'IN_PROGRESS',
          endTime: updatedCompletedTasks.length >= newTasks.length ? nowMs : undefined,
          taskIds: newTasks.map((t: Task) => t.id),
        }).catch(() => null);
      }

      if (completedTask.completed) {
        completeDbTask(taskId).catch(() => null);
        setTimeout(() => {
          const updatedTasks = newTasks.filter((t: Task) => t.id !== taskId);
          setTasks(updatedTasks);
          const remainingTasks = updatedTasks.filter((t: Task) => !t.completed);
          if (remainingTasks.length === 0) {
            setTimeout(() => handleAllTasksCompleted(newDailyRituals), 2000);
          }
        }, 800);
      } else {
        updateDbTask(taskId, { status: 'todo', completedAt: undefined }).catch(() => null);
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
      subtasks: [],
      lastAccessed: new Date().toISOString(),
      completionRate: 0,
      priority: 'low',
    };
    const newTasks = [...tasks, bonusTask];
    setTasks(newTasks);
    persistTasks(newTasks).catch(() => null);
    setShowBonusCard(false);
  };

  const handleAddUrgentTask = async () => {
    if (!urgentTaskName) return;

    const newTask: Task = {
      id: `urgent-${Date.now()}`,
      name: urgentTaskName,
      completed: false,
      priority: 'high',
      tags: ['Urgent'],
      subtasks: [],
      lastAccessed: new Date().toISOString(),
      completionRate: 0,
    };

    // Phase 7 : Vérification des Lignes Rouges (Non-Negotiables)
    let violations: string[] = [];
    try {
      violations = await phase7Manager.checkNonNegotiables();
    } catch {
      violations = [];
    }

    if (violations.length > 0 || (phase7Manager.getSovereigntyManager().currentMode === SovereigntyMode.PROTECTIVE)) {
      try {
        const burnoutResult = await phase7Manager.checkBurnoutAndProtect();
        if (burnoutResult?.signals) {
          setBurnoutSignals({
            chronicOverload: burnoutResult.signals.chronicOverload,
            sleepDebt: burnoutResult.signals.sleepDebt,
            constantOverrides: burnoutResult.signals.overrideAbuse,
            zeroCompletion: burnoutResult.signals.completionCollapse,
            erraticBehavior: burnoutResult.signals.erraticBehavior,
            taskAccumulation: burnoutResult.signals.taskAccumulation,
          });
          setIsProtectiveNotificationOpen(true);
        }
      } catch {
        // ignore
      }

      // Déclencher le ConflictResolutionModal
      setCurrentConflict({
        userRequest: { title: urgentTaskName, priority: "URGENT", effort: "HEAVY" },
        systemRejection: {
          reason: violations.length > 0 ? violations[0] : "Mode protection actif : repos prioritaire.",
          code: "BURNOUT"
        }
      });
      setPendingTask(newTask);
      setIsConflictModalOpen(true);
      setIsPanicModalOpen(false);
      return;
    }

    executeAddTask(newTask);
  };

  const executeAddTask = (newTask: Task) => {
    let newTasks;
    if (replaceTask && tasks.length > 0) {
      const remainingTasks = tasks.slice(1);
      newTasks = [newTask, ...remainingTasks];
      toast({
        title: "Tâche urgente ajoutée",
        description: `"${newTask.name}" a remplacé la tâche précédente.`,
      });
    } else {
      newTasks = [newTask, ...tasks];
      toast({
        title: "Tâche urgente ajoutée",
        description: `"${newTask.name}" est maintenant en haut de votre liste.`,
      });
    }
    persistTasks(newTasks).catch(() => null);

    if (currentSessionId) {
      const nowMs = Date.now();
      updateDbSession(currentSessionId, {
        timestamp: nowMs,
        plannedTasks: newTasks.length,
        taskIds: newTasks.map((t: Task) => t.id),
      }).catch(() => null);
    }

    setUrgentTaskName('');
    setReplaceTask(false);
    setIsPanicModalOpen(false);
  };

  const handleResolveConflict = async (choice: number) => {
    setIsConflictModalOpen(false);

    if (choice === 1) { // Forcer
      if (!pendingTask) return;
      try {
        const cost = await phase7Manager.calculateOverrideCost(pendingTask as any);
        setOverrideCost(cost);
        setIsOverrideModalOpen(true);
      } catch {
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: "Impossible de calculer le coût de l'override.",
        });
      }
    } else if (choice === 2) { // Micro-tâches
      toast({ title: "Tâche découpée", description: "Vérifiez vos sous-tâches pour commencer doucement." });
      // Logique micro-tâches ici
    }
  };

  const handleConfirmOverride = (reason?: string) => {
    setIsOverrideModalOpen(false);
    if (pendingTask) {
      recordOverride({
        timestamp: Date.now(),
        originalDecision: JSON.stringify(currentConflict?.systemRejection ?? {}),
        userDecision: JSON.stringify({ action: 'FORCE_TASK', taskId: pendingTask.id }),
        reason,
      }).catch(() => null);

      executeAddTask(pendingTask);
    }
    toast({
      title: "Décision forcée",
      description: `Protections désactivées pour 24h. Coût appliqué: ${(overrideCost.total * 100).toFixed(0)}%`,
      variant: "destructive"
    });
  };

  const filteredTasks = tasks.filter((task: Task) =>
    task.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const playlistMessage = energyLevel
    ? dynamicMessages[energyLevel]
    : 'Prêt à commencer ? Voici ce qui compte aujourd\'hui :';

  return (
    <div className="space-y-8">
      <Dialog open={showMorningRitual} onOpenChange={setShowMorningRitual}>
        <DialogContent className="sm:max-w-[480px] p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl text-center">Comment te sens-tu ce matin ?</DialogTitle>
          </DialogHeader>
          <EnergyCheckIn
            onEnergyChange={setEnergyLevel}
            onIntentionChange={setIntention}
            onSleepHoursChange={setSleepHours}
            onStabilityChange={setEnergyStability}
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
        energyLevel={energyLevel}
        intention={intention}
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
                  className={`mr-2 h-4 w-4 ${isPending || isGenerating ? 'animate-spin' : ''
                    }`}
                />
                Rafraîchir la playlist
              </Button>
            </div>

            <TabsContent value="playlist" className="space-y-8">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">Ton énergie du jour</h2>
                </div>
                <Recommendations tasks={tasks} />
              </div>

              <div>
                <p className="text-lg font-medium text-foreground mb-6">
                  {playlistMessage}
                </p>

                <div className="overflow-hidden relative min-h-[100px]">
                  <AnimatePresence mode="wait">
                    {isGenerating ? (
                      <motion.div
                        key="generating"
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -50 }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-0 flex items-center justify-center"
                      >
                        <p>Génération de votre playlist...</p>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="tasks"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <TaskList
                          tasks={filteredTasks}
                          onToggleCompletion={handleTaskCompletion}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="timeline">
              <TimelineView tasks={tasks} onToggleCompletion={handleTaskCompletion} />
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

          <div className="fixed bottom-6 right-6 flex flex-col gap-2 z-20">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => setIsPanicModalOpen(true)}
                    className="h-16 w-16 rounded-full shadow-2xl"
                    size="icon"
                  >
                    <Siren className="h-8 w-8" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p>Gérer un imprévu</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => router.push('/dashboard/stats')}
                    className="h-12 w-12 rounded-full shadow-2xl bg-purple-600 hover:bg-purple-700"
                    size="icon"
                  >
                    <Shield className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p>Statistiques & Gouvernance</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Modaux Phase 7 */}
          {currentConflict && (
            <ConflictResolutionModal
              open={isConflictModalOpen}
              onOpenChange={setIsConflictModalOpen}
              userRequest={currentConflict.userRequest}
              systemRejection={currentConflict.systemRejection}
              onResolve={handleResolveConflict}
            />
          )}

          {overrideCost && pendingTask && (
            <OverrideConfirmation
              open={isOverrideModalOpen}
              onOpenChange={setIsOverrideModalOpen}
              taskTitle={pendingTask.name}
              cost={overrideCost}
              onConfirm={handleConfirmOverride}
              onCancel={() => setIsOverrideModalOpen(false)}
            />
          )}

          {isProtectiveNotificationOpen && (
            <div className="fixed top-20 right-6 w-96 z-50">
              <ProtectiveModeNotification
                signals={burnoutSignals}
                onUnderstand={() => setIsProtectiveNotificationOpen(false)}
                onExitRequest={() => toast({ title: "Demande envoyée", description: "Votre demande sera examinée sous 2h." })}
              />
            </div>
          )}

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
