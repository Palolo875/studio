'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import type { Subtask, Task } from '@/lib/types';
import { addDays, format, isSameDay, startOfDay, subDays, endOfWeek } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { ReservoirTaskCard, priorityStyles } from './reservoir-task-card';
import { Calendar as CalendarIcon, Plus, SlidersHorizontal, Zap, Search, Grid, List, Archive, Trash2, Star, MoreHorizontal, ChevronDown, PlusCircle, Edit, Check, KanbanSquare, LayoutGrid, Tag as TagIcon } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
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
} from "@/components/ui/alert-dialog";
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { energyLevels } from '@/lib/data';
import { Checkbox } from '../ui/checkbox';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '../ui/progress';
import {
  getAllTasks,
  createTask,
  updateTask as updateDbTask,
  deleteTask as deleteDbTask,
  completeTask as completeDbTask,
  addTaskHistory,
  type DBTask,
} from '@/lib/database';
import { dbTaskToUiTask } from '@/lib/taskMapping';

type ReservoirStatus = 'todo' | 'active' | 'frozen' | 'done';
type ReservoirTask = Task & { status?: ReservoirStatus };

function dbStatusToReservoirStatus(status: DBTask['status']): ReservoirStatus {
  if (status === 'cancelled') return 'frozen';
  return status;
}

function reservoirStatusToDbStatus(status?: ReservoirStatus): DBTask['status'] {
  return status ?? 'todo';
}

type Filters = {
  status: 'all' | 'completed' | 'not_completed';
  priorities: ('low' | 'medium' | 'high')[];
  energy: ('low' | 'medium' | 'high')[];
  tags: string[];
  deadline: 'all' | 'today' | 'tomorrow' | 'this-week' | 'none';
};

type GroupedTasks = {
  [key: string]: ReservoirTask[];
};

type ViewMode = 'list' | 'grid' | 'masonry' | 'kanban';

function dbToUiTask(t: DBTask): ReservoirTask {
  const uiEffort: ReservoirTask['effort'] = t.duration <= 15 ? 'S' : t.duration <= 120 ? 'M' : 'L';
  const base = dbTaskToUiTask(t);
  return {
    ...base,
    status: dbStatusToReservoirStatus(t.status),
    effort: uiEffort,
  };
}

function uiPriorityToUrgency(priority?: Task['priority']): DBTask['urgency'] {
  if (!priority) return 'medium';
  if (priority === 'high') return 'high';
  if (priority === 'low') return 'low';
  return 'medium';
}

function uiEnergyToEffort(energy?: Task['energyRequired']): DBTask['effort'] {
  if (!energy) return 'medium';
  if (energy === 'low' || energy === 'medium' || energy === 'high') return energy;
  return 'medium';
}

export function ReservoirClient() {
  const [tasks, setTasks] = useState<ReservoirTask[]>([]);
  const [selectedTask, setSelectedTask] = useState<ReservoirTask | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    status: 'not_completed',
    priorities: [],
    energy: [],
    tags: [],
    deadline: 'all',
  });
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const { toast } = useToast();

  const [sheetTaskData, setSheetTaskData] = useState<Partial<ReservoirTask>>({});
  const [newSubtask, setNewSubtask] = useState('');

  const loadTasks = async (signal?: { cancelled: boolean }) => {
    try {
      const dbTasks = await getAllTasks();
      if (signal?.cancelled) return;
      setTasks(dbTasks.map(dbToUiTask));
    } catch {
      if (signal?.cancelled) return;
      setTasks([]);
    }
  };

  useEffect(() => {
    let cancelled = false;
    void loadTasks({ cancelled });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const onFocus = () => {
      void loadTasks({ cancelled });
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        void loadTasks({ cancelled });
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('focus', onFocus);
    }
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVisibility);
    }

    return () => {
      cancelled = true;
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', onFocus);
      }
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVisibility);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const dateRefs = useRef<{[key: string]: HTMLDivElement | null}>({});

  const handleTaskClick = (task: ReservoirTask) => {
    setSelectedTask(task);
    setSheetTaskData(task);
    setIsEditing(false); // Start in read-only mode
    setIsSheetOpen(true);
  };

  const handleAddNewClick = () => {
    const newTaskTemplate: Partial<ReservoirTask> = {
      name: '',
      description: '',
      priority: 'medium',
      subtasks: [],
      completionRate: 0,
      autoSelected: true,
      status: 'todo',
    };
    setSelectedTask(null);
    setSheetTaskData(newTaskTemplate);
    setIsEditing(true); // Start in edit mode for new tasks
    setIsSheetOpen(true);
  };

  const handleSheetClose = () => {
    setIsSheetOpen(false);
    setSelectedTask(null);
    setIsEditing(false);
    setSheetTaskData({});
  };

  const handleDeleteTask = (taskId: string) => {
    void (async () => {
      await deleteDbTask(taskId);
      setTasks(current => current.filter((task) => task.id !== taskId));
      handleSheetClose();
    })();
  };

  const handleBatchDelete = () => {
    void (async () => {
      await Promise.all(selectedTasks.map(id => deleteDbTask(id)));
      setTasks(current => current.filter((task) => !selectedTasks.includes(task.id)));
      setSelectedTasks([]);
    })();
  };

  const handleBatchArchive = () => {
    void (async () => {
      await Promise.all(selectedTasks.map(id => completeDbTask(id)));
      setTasks(current => current.map(task => (
        selectedTasks.includes(task.id) ? { ...task, completed: true, completionRate: 100, completedAt: new Date().toISOString() } : task
      )));
      setSelectedTasks([]);
    })();
  };

  const handleBatchPriorityChange = (priority: 'low' | 'medium' | 'high') => {
    void (async () => {
      await Promise.all(selectedTasks.map(id => updateDbTask(id, { urgency: uiPriorityToUrgency(priority) })));
      setTasks(current => current.map(task => (
        selectedTasks.includes(task.id) ? { ...task, priority } : task
      )));
      setSelectedTasks([]);
    })();
  };

  const handleSaveTask = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const finalTaskData = { ...sheetTaskData };

    if (finalTaskData.subtasks && finalTaskData.subtasks.length > 0) {
      const completedSubtasks = finalTaskData.subtasks.filter(st => st.completed).length;
      finalTaskData.completionRate = Math.round((completedSubtasks / finalTaskData.subtasks.length) * 100);
    }
    
    finalTaskData.completed = finalTaskData.completionRate === 100;
    const nextStatus: ReservoirStatus = finalTaskData.completed ? 'done' : (finalTaskData.status ?? 'todo');
    finalTaskData.status = nextStatus;

    void (async () => {
      const now = new Date();

      if (!selectedTask) {
        const id = `task_${now.getTime()}`;
        const created: Omit<DBTask, 'createdAt' | 'updatedAt' | 'activationCount'> = {
          id,
          title: (finalTaskData.name || '').trim() || 'Sans titre',
          description: finalTaskData.description,
          duration: finalTaskData.estimatedDuration ?? 30,
          effort: uiEnergyToEffort(finalTaskData.energyRequired),
          urgency: uiPriorityToUrgency(finalTaskData.priority),
          impact: 'medium',
          deadline: finalTaskData.scheduledDate ? new Date(finalTaskData.scheduledDate) : undefined,
          scheduledTime: undefined,
          category: 'reservoir',
          status: reservoirStatusToDbStatus(nextStatus),
          lastActivated: undefined,
          completedAt: finalTaskData.completed ? now : undefined,
          tags: finalTaskData.tags,
        };
        const newDbTask = await createTask(created);
        const newUiTask = dbToUiTask(newDbTask);
        setTasks(current => [newUiTask, ...current]);
      } else {
        const prevScheduled = selectedTask.scheduledDate;
        const nextScheduled = finalTaskData.scheduledDate;
        await updateDbTask(selectedTask.id, {
          title: (finalTaskData.name || '').trim() || selectedTask.name,
          description: finalTaskData.description,
          duration: finalTaskData.estimatedDuration ?? 30,
          effort: uiEnergyToEffort(finalTaskData.energyRequired),
          urgency: uiPriorityToUrgency(finalTaskData.priority),
          deadline: finalTaskData.scheduledDate ? new Date(finalTaskData.scheduledDate) : undefined,
          tags: finalTaskData.tags,
          status: reservoirStatusToDbStatus(nextStatus),
          completedAt: finalTaskData.completed ? now : undefined,
        });

        if (prevScheduled !== nextScheduled) {
          await addTaskHistory(selectedTask.id, 'rescheduled', {
            notes: nextScheduled ? `deadline:${nextScheduled}` : 'deadline:removed',
          });
        }

        setTasks(current => current.map((task) =>
          task.id === selectedTask.id ? { ...task, ...finalTaskData, lastAccessed: now.toISOString() } as ReservoirTask : task
        ));
      }

      handleSheetClose();
    })();
  };
  
  const handleSheetDataChange = (field: keyof ReservoirTask, value: unknown) => {
    setSheetTaskData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddSubtask = () => {
    if (!newSubtask.trim()) return;
    const subtask: Subtask = {
      id: `sub-${Date.now()}`,
      name: newSubtask.trim(),
      completed: false
    };
    const updatedSubtasks = [...(sheetTaskData.subtasks || []), subtask];
    handleSheetDataChange('subtasks', updatedSubtasks);
    setNewSubtask('');
  };

  const handleToggleSubtask = (subtaskId: string) => {
    const updatedSubtasks = (sheetTaskData.subtasks || []).map(st => 
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );
    handleSheetDataChange('subtasks', updatedSubtasks);
  };
  
  const handleDeleteSubtask = (subtaskId: string) => {
    const updatedSubtasks = (sheetTaskData.subtasks || []).filter(st => st.id !== subtaskId);
    handleSheetDataChange('subtasks', updatedSubtasks);
  };

  const { filteredAndGroupedTasks, sortedGroupKeys, allTags } = useMemo(() => {
    const allTags = [...new Set(tasks.flatMap(task => task.tags || []))];
    const today = startOfDay(new Date());

    const filtered = tasks.filter(task => {
      const searchMatch = debouncedSearchTerm === '' || 
        task.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        (task.description && task.description.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) ||
        (task.tags && task.tags.some(tag => tag.toLowerCase().includes(debouncedSearchTerm.toLowerCase()))) ||
        (task.objective && task.objective.toLowerCase().includes(debouncedSearchTerm.toLowerCase()));

      const statusMatch =
        filters.status === 'all' ||
        (filters.status === 'completed' && task.completed) ||
        (filters.status === 'not_completed' && !task.completed);

      const priorityMatch =
        filters.priorities.length === 0 ||
        (task.priority && filters.priorities.includes(task.priority));
        
      const energyMatch =
        filters.energy.length === 0 ||
        (task.energyRequired && filters.energy.includes(task.energyRequired));

      const tagMatch =
        filters.tags.length === 0 ||
        (task.tags && filters.tags.every(filterTag => task.tags?.includes(filterTag)));
      
      let deadlineMatch = true;
      if (filters.deadline !== 'all') {
        const taskDate = task.scheduledDate ? startOfDay(new Date(task.scheduledDate)) : null;
        if (filters.deadline === 'none') {
            deadlineMatch = !taskDate;
        } else if (filters.deadline === 'today') {
            deadlineMatch = !!taskDate && isSameDay(taskDate, today);
        } else if (filters.deadline === 'tomorrow') {
            deadlineMatch = !!taskDate && isSameDay(taskDate, addDays(today, 1));
        } else if (filters.deadline === 'this-week') {
            deadlineMatch = !!taskDate && taskDate >= today && taskDate <= endOfWeek(today, { locale: fr });
        }
      }

      return searchMatch && statusMatch && priorityMatch && energyMatch && tagMatch && deadlineMatch;
    });

    const grouped = filtered.reduce((acc: GroupedTasks, task) => {
      const dateKey = task.scheduledDate ? format(startOfDay(new Date(task.scheduledDate)), 'yyyy-MM-dd') : 'unplanned';
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(task);
      return acc;
    }, {});
    
    const sortedKeys = Object.keys(grouped).sort((a, b) => {
        if (a === 'unplanned') return 1;
        if (b === 'unplanned') return -1;
        return new Date(a).getTime() - new Date(b).getTime();
    });

    return { filteredAndGroupedTasks: grouped, sortedGroupKeys: sortedKeys, allTags };

  }, [tasks, filters, debouncedSearchTerm]);


  const handleFilterChange = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleMultiSelectFilterChange = (key: 'priorities' | 'energy' | 'tags', value: string) => {
    setFilters(prev => {
        const currentValues = prev[key] as string[];
        if (currentValues.includes(value)) {
            return { ...prev, [key]: currentValues.filter(v => v !== value) };
        } else {
            return { ...prev, [key]: [...currentValues, value] };
        }
    });
  }

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTasks(prev => {
      if (prev.includes(taskId)) {
        return prev.filter(id => id !== taskId);
      } else {
        return [...prev, taskId];
      }
    });
  };

  const resetFilters = () => {
    setFilters({
        status: 'not_completed',
        priorities: [],
        energy: [],
        tags: [],
        deadline: 'all',
    });
  }

  const getObsoleteTasks = () => {
    const thirtyDaysAgo = subDays(new Date(), 30);
    return tasks.filter(task => {
        const lastAccessedDate = task.lastAccessed ? new Date(task.lastAccessed) : new Date(0);
        return !task.scheduledDate &&
               task.completionRate === 0 &&
               lastAccessedDate < thirtyDaysAgo;
    });
  };

  const handleCleanTasks = () => {
      const obsoleteTasks = getObsoleteTasks();
      if (obsoleteTasks.length === 0) {
          toast({
              title: "Aucune tâche obsolète",
              description: "Votre bibliothèque est déjà bien rangée !",
          });
          return;
      }
      
      const obsoleteTaskIds = new Set(obsoleteTasks.map(t => t.id));
      setTasks(currentTasks => currentTasks.filter(t => !obsoleteTaskIds.has(t.id)));

      toast({
          title: "Nettoyage réussi !",
          description: `${obsoleteTasks.length} tâche(s) obsolète(s) ont été archivée(s).`,
      });
  };
  
  const activeFilterCount = (filters.priorities.length > 0 ? 1 : 0) + (filters.energy.length > 0 ? 1 : 0) + (filters.tags.length > 0 ? 1 : 0) + (filters.status !== 'not_completed' ? 1 : 0) + (filters.deadline !== 'all' ? 1 : 0);
  
  const subtasksProgress = useMemo(() => {
    if (!sheetTaskData.subtasks || sheetTaskData.subtasks.length === 0) return 0;
    const completed = sheetTaskData.subtasks.filter(st => st.completed).length;
    return (completed / sheetTaskData.subtasks.length) * 100;
  }, [sheetTaskData.subtasks]);


  // Batch action menu
  const BatchActionMenu = () => (
    <div className="flex items-center gap-2 bg-card p-2 rounded-lg border">
      <span className="text-sm text-muted-foreground whitespace-nowrap">
        {selectedTasks.length} tâche{selectedTasks.length > 1 ? 's' : ''} sélectionnée{selectedTasks.length > 1 ? 's' : ''}
      </span>
      <Separator orientation="vertical" className="h-6" />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            Actions
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={handleBatchArchive}>
            <Archive className="mr-2 h-4 w-4" />
            Archiver
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleBatchPriorityChange('high')}>
            <Star className="mr-2 h-4 w-4" />
            Priorité haute
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleBatchPriorityChange('medium')}>
            <Star className="mr-2 h-4 w-4" />
            Priorité moyenne
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleBatchPriorityChange('low')}>
            <Star className="mr-2 h-4 w-4" />
            Priorité basse
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleBatchDelete} className="text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Supprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => setSelectedTasks([])}
      >
        Annuler
      </Button>
    </div>
  );

  // Format deadline for display
  const formatDeadline = (dateString?: string) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    const today = startOfDay(new Date());
    const tomorrow = addDays(today, 1);
    
    if (isSameDay(date, today)) return "Aujourd'hui";
    if (isSameDay(date, tomorrow)) return "Demain";
    
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 0 && diffDays <= 7) return `Dans ${diffDays}j`;
    
    return format(date, 'dd MMM yyyy', { locale: fr });
  };

  // Get effort display
  const getEffortDisplay = (effort?: 'S' | 'M' | 'L') => {
    if (!effort) return 'N/A';
    const effortMap: Record<string, string> = {
      'S': 'Simple (<15m)',
      'M': 'Moyen (15-120m)',
      'L': 'Long (>2h)'
    };
    return effortMap[effort] || effort;
  };

  // Get energy badge
  const getEnergyBadge = (energy?: 'low' | 'medium' | 'high') => {
    if (!energy) return null;
    
    const energyInfo = energyLevels.find(e => e.value === energy);
    if (!energyInfo) return null;
    
    return (
      <Badge variant="outline" className="capitalize">
        {energyInfo.label}
      </Badge>
    );
  };
  
  const getPriorityDisplay = (priority?: 'low' | 'medium' | 'high') => {
    if (!priority) return null;
    const priorityMap: Record<string, {label: string, className: string}> = {
      'low': { label: 'Basse', className: priorityStyles.low },
      'medium': { label: 'Moyenne', className: priorityStyles.medium },
      'high': { label: 'Haute', className: priorityStyles.high }
    };
    const priorityInfo = priorityMap[priority];
    return (
      <Badge variant="outline" className={cn("capitalize", priorityInfo.className)}>{priorityInfo.label}</Badge>
    );
  };

  const ReadOnlyField = ({ label, value, children }: { label: string; value?: string | React.ReactNode; children?: React.ReactNode }) => (
    <div className="space-y-1">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      {children ? <div className="text-base text-foreground">{children}</div> : <p className="text-base text-foreground">{value || 'Non défini'}</p>}
    </div>
  );
  
  const KanbanBoard = () => {
    const kanbanColumns: { title: string, status: ReservoirStatus }[] = [
        { title: 'À faire', status: 'todo' },
        { title: 'En cours', status: 'active' },
        { title: 'En attente', status: 'frozen' },
        { title: 'Terminé', status: 'done' },
    ];
    
    const allTasks = sortedGroupKeys.flatMap(key => filteredAndGroupedTasks[key]);

    const tasksByStatus = kanbanColumns.reduce((acc, col) => {
        acc[col.status] = allTasks.filter(task => (task.status || 'todo') === col.status);
        return acc;
    }, {} as Record<ReservoirStatus, ReservoirTask[]>);

    return (
      <div className="flex gap-6 pb-4">
        {kanbanColumns.map(col => (
          <div key={col.status} className="flex-1 min-w-[300px]">
            <h3 className="text-lg font-semibold mb-4 sticky top-0 bg-background/80 backdrop-blur-sm py-2 z-10">{col.title} ({tasksByStatus[col.status!]?.length || 0})</h3>
            <div className="space-y-4">
              {tasksByStatus[col.status!]?.map(task => (
                <div key={task.id} onClick={() => handleTaskClick(task)}>
                  <ReservoirTaskCard task={task} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };


  return (
    <div className="space-y-8 h-full flex flex-col">
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold">Bibliothèque</h1>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Rechercher..."
              className="pl-10 pr-4 h-10 rounded-full bg-card w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                    {viewMode === 'list' && <List className="h-5 w-5" />}
                    {viewMode === 'grid' && <Grid className="h-5 w-5" />}
                    {viewMode === 'masonry' && <LayoutGrid className="h-5 w-5" />}
                    {viewMode === 'kanban' && <KanbanSquare className="h-5 w-5" />}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setViewMode('list')}>
                    <List className="mr-2 h-4 w-4" />
                    Liste
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setViewMode('grid')}>
                    <Grid className="mr-2 h-4 w-4" />
                    Grille
                </DropdownMenuItem>
                 <DropdownMenuItem onClick={() => setViewMode('masonry')}>
                    <LayoutGrid className="mr-2 h-4 w-4" />
                    Masonry
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setViewMode('kanban')}>
                    <KanbanSquare className="mr-2 h-4 w-4" />
                    Kanban
                </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="icon" className="relative" onClick={() => setIsFilterSheetOpen(true)}>
            <SlidersHorizontal className="h-5 w-5" />
            {activeFilterCount > 0 && (
              <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 justify-center p-0 text-xs">{activeFilterCount}</Badge>
            )}
          </Button>
           <AlertDialog>
              <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon">
                      <Trash2 className="h-5 w-5" />
                  </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                  <AlertDialogHeader>
                      <AlertDialogTitle>Nettoyer la bibliothèque ?</AlertDialogTitle>
                      <AlertDialogDescription>
                          Cela archivera {getObsoleteTasks().length} tâche(s) obsolète(s) (créées il y a plus de 30 jours, sans deadline et jamais commencées).
                      </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction onClick={handleCleanTasks}>Nettoyer</AlertDialogAction>
                  </AlertDialogFooter>
              </AlertDialogContent>
          </AlertDialog>
          <Button size="icon" onClick={handleAddNewClick} className="rounded-full">
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Batch Actions Bar */}
      {selectedTasks.length > 0 && (
        <BatchActionMenu />
      )}

      {/* Task Views */}
      <ScrollArea className="flex-1 -mx-4 sm:-mx-8 px-4 sm:px-8">
        {sortedGroupKeys.length > 0 ? (
          viewMode === 'kanban' ? <KanbanBoard /> : (
            <div className="space-y-8 pr-4 pb-4">
              {sortedGroupKeys.map(dateKey => {
                  const tasksForDay = filteredAndGroupedTasks[dateKey];
                  if (!tasksForDay || tasksForDay.length === 0) return null;

                  const isUnplanned = dateKey === 'unplanned';
                  const groupDate = isUnplanned ? null : new Date(dateKey);
                  const title = isUnplanned ? 'Non planifié' : format(groupDate!, 'EEEE d MMMM', { locale: fr });
                  
                  return (
                    <div key={dateKey}>
                      <h2 className="text-lg font-bold sticky top-0 bg-background/80 backdrop-blur-sm py-2 z-10 capitalize">{title}</h2>
                      {viewMode === 'grid' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-4">
                          {tasksForDay.map(task => (
                            <div 
                              key={task.id} 
                              onClick={() => {
                                if (selectedTasks.length > 0) {
                                  toggleTaskSelection(task.id);
                                } else {
                                  handleTaskClick(task);
                                }
                              }}
                              className={`relative ${selectedTasks.includes(task.id) ? 'ring-2 ring-primary rounded-3xl' : ''}`}
                            >
                              <ReservoirTaskCard task={task} />
                              {selectedTasks.length > 0 && (
                                <div 
                                  className="absolute top-2 left-2 z-20"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleTaskSelection(task.id);
                                  }}
                                >
                                  <Checkbox checked={selectedTasks.includes(task.id)} />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      {viewMode === 'masonry' && (
                        <div className="mt-4" style={{ columnCount: 3, columnGap: '1.5rem' }}>
                          {tasksForDay.map(task => (
                            <div key={task.id} className="mb-6 break-inside-avoid" onClick={() => handleTaskClick(task)}>
                              <ReservoirTaskCard task={task} />
                            </div>
                          ))}
                        </div>
                      )}
                      {viewMode === 'list' && (
                        <Table className="mt-4">
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-12">
                                <Checkbox 
                                  checked={selectedTasks.length > 0 && tasksForDay.every(t => selectedTasks.includes(t.id))}
                                  onCheckedChange={(checked) => {
                                    const dayTaskIds = tasksForDay.map(t => t.id);
                                    if (checked) {
                                      setSelectedTasks([...new Set([...selectedTasks, ...dayTaskIds])]);
                                    } else {
                                      const dayTaskIdsSet = new Set(dayTaskIds);
                                      setSelectedTasks(selectedTasks.filter(id => !dayTaskIdsSet.has(id)));
                                    }
                                  }}
                                />
                              </TableHead>
                              <TableHead className="w-1/3">Contenu</TableHead>
                              <TableHead>Deadline</TableHead>
                              <TableHead>Priorité</TableHead>
                              <TableHead>Effort</TableHead>
                              <TableHead>Énergie</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {tasksForDay.map(task => (
                              <TableRow 
                                key={task.id}
                                className={`cursor-pointer ${selectedTasks.includes(task.id) ? 'bg-muted' : ''}`}
                                onClick={() => {
                                  if (selectedTasks.length > 0) {
                                    toggleTaskSelection(task.id);
                                  } else {
                                    handleTaskClick(task);
                                  }
                                }}
                              >
                                <TableCell>
                                  <Checkbox 
                                    checked={selectedTasks.includes(task.id)}
                                    onCheckedChange={() => toggleTaskSelection(task.id)}
                                  />
                                </TableCell>
                                <TableCell className="font-medium">{task.name}</TableCell>
                                <TableCell>{formatDeadline(task.scheduledDate)}</TableCell>
                                <TableCell>
                                  {task.priority && getPriorityDisplay(task.priority)}
                                </TableCell>
                                <TableCell>{getEffortDisplay(task.effort)}</TableCell>
                                <TableCell>{getEnergyBadge(task.energyRequired)}</TableCell>
                                <TableCell className="text-right">
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleTaskClick(task);
                                    }}
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </div>
                  )
              })}
            </div>
          )
        ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8">
                <p className="font-semibold">Aucune tâche ne correspond à vos filtres.</p>
                <p className="text-sm mt-1">Essayez d'ajuster vos critères de recherche.</p>
                <Button variant="outline" size="sm" className="mt-4" onClick={resetFilters}>Réinitialiser les filtres</Button>
            </div>
        )}
      </ScrollArea>

      {/* Task Detail/Edit Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={handleSheetClose}>
        <SheetContent className="flex flex-col w-full sm:max-w-lg p-0">
          <SheetHeader className="p-6 pb-4 flex flex-row items-center justify-between border-b">
            <div>
              <SheetTitle className="text-2xl font-bold">
                {isEditing ? (selectedTask ? 'Modifier la tâche' : 'Nouvelle tâche') : sheetTaskData.name}
              </SheetTitle>
              {!isEditing && (
                 <p className="text-sm text-muted-foreground">Créée le {sheetTaskData.lastAccessed ? format(new Date(sheetTaskData.lastAccessed), 'd MMM yyyy', {locale: fr}) : ''}</p>
              )}
            </div>
            {!isEditing && selectedTask && (
              <Button onClick={() => setIsEditing(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Modifier
              </Button>
            )}
          </SheetHeader>
          {isEditing ? (
            <form
              onSubmit={handleSaveTask}
              className="flex-1 flex flex-col justify-between overflow-hidden"
            >
              <ScrollArea className="flex-1">
                <div className="space-y-6 py-6 px-6">
                  
                  <div className="space-y-2">
                    <Label htmlFor="name" className="font-semibold">Titre</Label>
                    <Input id="name" name="name" value={sheetTaskData.name || ''} onChange={(e) => handleSheetDataChange('name', e.target.value)} placeholder="Ex: Appeler le client pour le feedback" required className="h-12 rounded-xl text-base" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description" className="font-semibold">Détails</Label>
                    <Textarea id="description" name="description" value={sheetTaskData.description || ''} onChange={(e) => handleSheetDataChange('description', e.target.value)} placeholder="Ajouter plus de détails, des notes ou des liens..." rows={4} className="rounded-xl" />
                  </div>
                  
                  <div className="space-y-4">
                    <Label className="font-semibold">Sous-tâches</Label>
                    {(sheetTaskData.subtasks && sheetTaskData.subtasks.length > 0) && (
                      <div className='space-y-1'><Progress value={subtasksProgress} className="h-2" /><p className='text-xs text-muted-foreground text-right'>{Math.round(subtasksProgress)}% complété</p></div>
                    )}
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                      {sheetTaskData.subtasks?.map(subtask => (
                        <div key={subtask.id} className="flex items-center gap-2 p-2 rounded-md hover:bg-muted">
                          <Checkbox id={`subtask-${subtask.id}`} checked={subtask.completed} onCheckedChange={() => handleToggleSubtask(subtask.id)} />
                          <Label htmlFor={`subtask-${subtask.id}`} className={cn("flex-1 cursor-pointer", subtask.completed && "line-through text-muted-foreground")}>{subtask.name}</Label>
                          <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDeleteSubtask(subtask.id)}><Trash2 className="h-4 w-4 text-muted-foreground" /></Button>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <Input id="new-subtask" placeholder="Ajouter une sous-tâche..." value={newSubtask} onChange={(e) => setNewSubtask(e.target.value)} onKeyDown={(e) => {if (e.key === 'Enter') { e.preventDefault(); handleAddSubtask(); }}} className="h-10 rounded-lg"/>
                      <Button type="button" size="icon" onClick={handleAddSubtask} className="rounded-lg flex-shrink-0"><PlusCircle className="h-5 w-5" /></Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                      <Label htmlFor="scheduledDate" className="font-semibold">Date</Label>
                      <Popover><PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal h-12 rounded-xl", !sheetTaskData.scheduledDate && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{sheetTaskData.scheduledDate ? format(new Date(sheetTaskData.scheduledDate), "PPP", { locale: fr }) : <span>Choisir une date</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={sheetTaskData.scheduledDate ? new Date(sheetTaskData.scheduledDate) : undefined} onSelect={(date) => handleSheetDataChange('scheduledDate', date?.toISOString())} initialFocus /></PopoverContent></Popover>
                  </div>
                  <div className="space-y-3">
                    <Label className="font-semibold">Priorité</Label>
                    <RadioGroup name="priority" value={sheetTaskData.priority || 'medium'} onValueChange={(value: 'low' | 'medium' | 'high') => handleSheetDataChange('priority', value)} className="grid grid-cols-3 gap-3">
                      <Label htmlFor="p-low" className="flex items-center justify-center gap-2 rounded-xl border p-3 cursor-pointer has-[:checked]:bg-green-100 has-[:checked]:border-green-400 dark:has-[:checked]:bg-green-900/50 dark:has-[:checked]:border-green-700 transition-all"><RadioGroupItem value="low" id="p-low" className="sr-only" />Basse</Label>
                      <Label htmlFor="p-medium" className="flex items-center justify-center gap-2 rounded-xl border p-3 cursor-pointer has-[:checked]:bg-yellow-100 has-[:checked]:border-yellow-400 dark:has-[:checked]:bg-yellow-900/50 dark:has-[:checked]:border-yellow-700 transition-all"><RadioGroupItem value="medium" id="p-medium" className="sr-only" />Moyenne</Label>
                      <Label htmlFor="p-high" className="flex items-center justify-center gap-2 rounded-xl border p-3 cursor-pointer has-[:checked]:bg-red-100 has-[:checked]:border-red-400 dark:has-[:checked]:bg-red-900/50 dark:has-[:checked]:border-red-700 transition-all"><RadioGroupItem value="high" id="p-high" className="sr-only" />Haute</Label>
                    </RadioGroup>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label className="flex items-center gap-2 font-semibold"><Zap size={16} /> Énergie</Label><Select name="energyRequired" value={sheetTaskData.energyRequired} onValueChange={(value: 'low' | 'medium' | 'high') => handleSheetDataChange('energyRequired', value)}><SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Sélectionner" /></SelectTrigger><SelectContent>{energyLevels.map((level) => (<SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>))}</SelectContent></Select></div>
                    <div className="space-y-2"><Label htmlFor="effort" className="font-semibold">Effort</Label><Select name="effort" value={sheetTaskData.effort} onValueChange={(value: 'S' | 'M' | 'L') => handleSheetDataChange('effort', value)}><SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Sélectionner" /></SelectTrigger><SelectContent><SelectItem value="S">Simple (&lt; 15min)</SelectItem><SelectItem value="M">Moyen (15-120min)</SelectItem><SelectItem value="L">Long (&gt; 2h)</SelectItem></SelectContent></Select></div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status" className="font-semibold">Statut</Label>
                    <Select
                      name="status"
                      value={sheetTaskData.status || 'todo'}
                      onValueChange={(value: ReservoirStatus) => handleSheetDataChange('status', value)}
                    >
                      <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todo">À faire</SelectItem>
                        <SelectItem value="active">En cours</SelectItem>
                        <SelectItem value="frozen">En attente</SelectItem>
                        <SelectItem value="done">Terminé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label htmlFor="tags" className="font-semibold">Tags</Label><Input id="tags" name="tags" value={Array.isArray(sheetTaskData.tags) ? sheetTaskData.tags.join(', ') : ''} onChange={(e) => handleSheetDataChange('tags', e.target.value.split(',').map(t => t.trim()))} placeholder="Ex: UI/UX, Dev, Marketing" className="h-12 rounded-xl" /></div>
                </div>
              </ScrollArea>
              <SheetFooter className="bg-card p-4 flex-row justify-end sm:justify-end border-t"><div className="flex gap-2"><Button type="button" variant="outline" onClick={() => setIsEditing(false)} className="h-12 rounded-full px-6">Annuler</Button><Button type="submit" className="h-12 rounded-full px-8">Enregistrer</Button></div></SheetFooter>
            </form>
          ) : (
             <ScrollArea className="flex-1">
              <div className="space-y-6 py-6 px-6">
                <ReadOnlyField label="Description" value={sheetTaskData.description} />
                <ReadOnlyField label="Objectif" value={sheetTaskData.objective} />
                 
                {sheetTaskData.subtasks && sheetTaskData.subtasks.length > 0 && (
                  <div className="space-y-2">
                    <Label className="font-semibold text-muted-foreground">Sous-tâches</Label>
                    <div className='space-y-1'><Progress value={subtasksProgress} className="h-2" /><p className='text-xs text-muted-foreground text-right'>{Math.round(subtasksProgress)}% complété</p></div>
                    <div className="space-y-2 pt-2">
                      {sheetTaskData.subtasks.map(subtask => (
                        <div key={subtask.id} className="flex items-center gap-3">
                          <Check className={cn("h-4 w-4 rounded-full p-0.5", subtask.completed ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")} />
                          <p className={cn("flex-1", subtask.completed && "line-through text-muted-foreground")}>{subtask.name}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                 
                 <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <ReadOnlyField label="Deadline" value={formatDeadline(sheetTaskData.scheduledDate)} />
                  <ReadOnlyField label="Statut" value={sheetTaskData.status || 'todo'} />
                  <ReadOnlyField label="Priorité">{getPriorityDisplay(sheetTaskData.priority)}</ReadOnlyField>
                  <ReadOnlyField label="Énergie">{getEnergyBadge(sheetTaskData.energyRequired)}</ReadOnlyField>
                  <ReadOnlyField label="Effort" value={getEffortDisplay(sheetTaskData.effort)} />
                </div>

                {sheetTaskData.tags && sheetTaskData.tags.length > 0 && (
                  <ReadOnlyField label="Tags">
                    <div className="flex flex-wrap gap-2">
                      {sheetTaskData.tags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                    </div>
                  </ReadOnlyField>
                )}
              </div>
            </ScrollArea>
          )}
        </SheetContent>
      </Sheet>

      {/* Filter Sheet */}
      <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
        <SheetContent side="right" className="flex flex-col w-full sm:max-w-md p-0">
          <SheetHeader className="p-6 pb-4 border-b">
            <SheetTitle>Filtrer les tâches</SheetTitle>
            <SheetDescription>
              Affinez votre vue pour vous concentrer sur ce qui compte.
            </SheetDescription>
          </SheetHeader>
          <ScrollArea className="flex-1">
            <div className="p-6 space-y-8">
                {/* Status Filter */}
                <div className="space-y-3">
                <Label className="font-semibold">Statut</Label>
                <RadioGroup
                    value={filters.status}
                    onValueChange={(value: 'all' | 'completed' | 'not_completed') => handleFilterChange('status', value)}
                    className="flex flex-col space-y-1"
                >
                    <div className="flex items-center space-x-2">
                    <RadioGroupItem value="all" id="status-all" />
                    <Label htmlFor="status-all">Toutes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                    <RadioGroupItem value="not_completed" id="status-not-completed" />
                    <Label htmlFor="status-not-completed">Non terminées</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                    <RadioGroupItem value="completed" id="status-completed" />
                    <Label htmlFor="status-completed">Terminées</Label>
                    </div>
                </RadioGroup>
                </div>

                <Separator />
                
                {/* Deadline Filter */}
                <div className="space-y-3">
                <Label className="font-semibold">Deadline</Label>
                <RadioGroup
                    value={filters.deadline}
                    onValueChange={(value: 'all' | 'today' | 'tomorrow' | 'this-week' | 'none') => handleFilterChange('deadline', value)}
                    className="flex flex-col space-y-1"
                >
                    <div className="flex items-center space-x-2"><RadioGroupItem value="all" id="deadline-all" /><Label htmlFor="deadline-all">Toutes</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="today" id="deadline-today" /><Label htmlFor="deadline-today">Aujourd'hui</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="tomorrow" id="deadline-tomorrow" /><Label htmlFor="deadline-tomorrow">Demain</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="this-week" id="deadline-this-week" /><Label htmlFor="deadline-this-week">Cette semaine</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="none" id="deadline-none" /><Label htmlFor="deadline-none">Aucune</Label></div>
                </RadioGroup>
                </div>

                <Separator />

                {/* Priority Filter */}
                <div className="space-y-3">
                <Label className="font-semibold">Priorité</Label>
                <div className="flex flex-wrap gap-2">
                    {(['high', 'medium', 'low'] as const).map(priority => (
                    <Button key={priority} variant={filters.priorities.includes(priority) ? 'default' : 'outline'} size="sm" onClick={() => handleMultiSelectFilterChange('priorities', priority)} className="capitalize rounded-full">{priority}</Button>
                    ))}
                </div>
                </div>

                <Separator />

                {/* Energy Filter */}
                <div className="space-y-3">
                <Label className="font-semibold">Énergie Requise</Label>
                <div className="flex flex-wrap gap-2">
                    {(['high', 'medium', 'low'] as const).map(energy => (
                    <Button key={energy} variant={filters.energy.includes(energy) ? 'default' : 'outline'} size="sm" onClick={() => handleMultiSelectFilterChange('energy', energy)} className="capitalize rounded-full">{energy}</Button>
                    ))}
                </div>
                </div>

                 <Separator />

                {/* Tags Filter */}
                <div className="space-y-3">
                <Label className="font-semibold">Tags</Label>
                <div className="flex flex-wrap gap-2">
                    {allTags.map(tag => (
                    <Button key={tag} variant={filters.tags.includes(tag) ? 'default' : 'outline'} size="sm" onClick={() => handleMultiSelectFilterChange('tags', tag)} className="rounded-full">{tag}</Button>
                    ))}
                </div>
                </div>
            </div>
          </ScrollArea>
          <SheetFooter className="p-4 flex-row justify-between sm:justify-between border-t bg-card">
            <Button variant="outline" onClick={resetFilters}>Réinitialiser</Button>
            <Button onClick={() => setIsFilterSheetOpen(false)}>Appliquer</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}

    
