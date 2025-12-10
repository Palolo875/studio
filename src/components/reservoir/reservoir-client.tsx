'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import type { Task } from '@/lib/types';
import { addDays, format, isSameDay, startOfDay, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { ReservoirTaskCard, priorityStyles } from './reservoir-task-card';
import { Calendar as CalendarIcon, Plus, SlidersHorizontal, Zap, Search, Grid, List, Archive, Trash2, Star } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { motion } from 'framer-motion';
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
import { initialTasks } from '@/lib/data';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MoreHorizontal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type Filters = {
  status: 'all' | 'completed' | 'not_completed';
  priorities: ('low' | 'medium' | 'high')[];
  energy: ('low' | 'medium' | 'high')[];
};

type GroupedTasks = {
  [key: string]: Task[];
};


export function ReservoirClient({ initialTasks: defaultTasks }: { initialTasks: Task[] }) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isCreatingNewTask, setIsCreatingNewTask] = useState(false);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    status: 'not_completed',
    priorities: [],
    energy: [],
  });
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const { toast } = useToast();

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const dateRefs = useRef<{[key: string]: HTMLDivElement | null}>({});

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    const dateString = format(date, 'yyyy-MM-dd');
    const element = dateRefs.current[dateString];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };


  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsCreatingNewTask(false);
    setIsSheetOpen(true);
  };

  const handleAddNewClick = () => {
    setSelectedTask(null);
    setIsCreatingNewTask(true);
    setIsSheetOpen(true);
  };

  const handleSheetClose = () => {
    setIsSheetOpen(false);
    setSelectedTask(null);
    setIsCreatingNewTask(false);
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(tasks.filter((task) => task.id !== taskId));
    handleSheetClose();
  };

  const handleBatchDelete = () => {
    setTasks(tasks.filter((task) => !selectedTasks.includes(task.id)));
    setSelectedTasks([]);
  };

  const handleBatchArchive = () => {
    setTasks(tasks.map(task => 
      selectedTasks.includes(task.id) ? { ...task, completed: true } : task
    ));
    setSelectedTasks([]);
  };

  const handleBatchPriorityChange = (priority: 'low' | 'medium' | 'high') => {
    setTasks(tasks.map(task => 
      selectedTasks.includes(task.id) ? { ...task, priority } : task
    ));
    setSelectedTasks([]);
  };

  const handleSaveTask = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const priority = formData.get('priority') as 'low' | 'medium' | 'high';
    const energyRequired = formData.get('energyRequired') as
      | 'low'
      | 'medium'
      | 'high'
      | undefined;
    const estimatedDuration = formData.get('estimatedDuration')
      ? Number(formData.get('estimatedDuration'))
      : undefined;
    const objective = formData.get('objective') as string | undefined;
    const autoSelected = formData.get('autoSelected') === 'on';
    const tagsString = formData.get('tags') as string;
    const tags = tagsString
      ? tagsString.split(',').map((tag) => tag.trim()).filter((tag) => tag)
      : [];
    const completionRate = formData.get('completionRate')
      ? Number(formData.get('completionRate'))
      : 0;
      
    const scheduledDateString = formData.get('scheduledDate') as string;
    const scheduledDate = scheduledDateString ? new Date(scheduledDateString).toISOString() : undefined;

    const taskData = {
      name,
      description,
      priority,
      energyRequired,
      estimatedDuration,
      objective,
      autoSelected,
      tags,
      completionRate,
      completed: completionRate === 100,
      scheduledDate,
    };

    if (isCreatingNewTask) {
      const newTask: Task = {
        id: `task-${Date.now()}`,
        ...taskData,
        subtasks: 0,
        lastAccessed: new Date().toISOString(),
      };
      setTasks([newTask, ...tasks]);
    } else if (selectedTask) {
      const updatedTasks = tasks.map((task) =>
        task.id === selectedTask.id ? { ...task, ...taskData } : task
      );
      setTasks(updatedTasks);
    }
    handleSheetClose();
  };

  const dates = Array.from({ length: 14 }).map((_, i) =>
    addDays(new Date(), i - 7)
  );

  const { filteredAndGroupedTasks, sortedGroupKeys } = useMemo(() => {
    const filtered = tasks.filter(task => {
      // Apply search filter
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

      return searchMatch && statusMatch && priorityMatch && energyMatch;
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

    return { filteredAndGroupedTasks: grouped, sortedGroupKeys: sortedKeys };

  }, [tasks, filters, debouncedSearchTerm]);


  const handleFilterChange = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleMultiSelectFilterChange = (key: 'priorities' | 'energy', value: 'low' | 'medium' | 'high') => {
    setFilters(prev => {
        const currentValues = prev[key];
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
    });
  }

  const getObsoleteTasks = () => {
    const thirtyDaysAgo = subDays(new Date(), 30);
    return tasks.filter(task => {
        return !task.scheduledDate &&
               task.completionRate === 0 &&
               new Date(task.lastAccessed) < thirtyDaysAgo;
    });
  };

  const handleCleanTasks = () => {
      const obsoleteTasks = getObsoleteTasks();
      if (obsoleteTasks.length === 0) {
          toast({
              title: "Aucune tâche obsolète",
              description: "Votre atelier est déjà bien rangé !",
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
  
  const activeFilterCount = (filters.priorities.length > 0 ? 1 : 0) + (filters.energy.length > 0 ? 1 : 0) + (filters.status !== 'not_completed' ? 1 : 0);
  
  const [sheetTaskDate, setSheetTaskDate] = useState<Date | undefined>(
    selectedTask?.scheduledDate ? new Date(selectedTask.scheduledDate) : undefined
  );

  useEffect(() => {
    setSheetTaskDate(selectedTask?.scheduledDate ? new Date(selectedTask.scheduledDate) : undefined)
  }, [selectedTask]);


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
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (isSameDay(date, today)) return "Aujourd'hui";
    if (isSameDay(date, tomorrow)) return "Demain";
    
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 7) return `Dans ${diffDays}j`;
    
    return format(date, 'dd MMM', { locale: fr });
  };

  // Get effort display
  const getEffortDisplay = (effort?: string) => {
    if (!effort) return '';
    const effortMap: Record<string, string> = {
      'S': 'Simple',
      'M': 'Moyen',
      'L': 'Long'
    };
    return effortMap[effort] || effort;
  };

  // Get energy badge
  const getEnergyBadge = (energy?: string) => {
    if (!energy) return null;
    
    const energyMap: Record<string, {label: string, color: string}> = {
      'low': { label: 'Faible', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' },
      'medium': { label: 'Moyenne', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200' },
      'high': { label: 'Haute', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200' }
    };
    
    const energyInfo = energyMap[energy];
    if (!energyInfo) return null;
    
    return (
      <Badge className={`${energyInfo.color} capitalize`}>
        {energyInfo.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-8 h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold">L'Atelier</h1>
        <div className="flex items-center gap-2 w-full md:w-auto">
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
          <Button 
            variant={viewMode === 'grid' ? 'default' : 'outline'} 
            size="icon" 
            onClick={() => setViewMode('grid')}
            className="hidden sm:inline-flex"
          >
            <Grid className="h-5 w-5" />
          </Button>
          <Button 
            variant={viewMode === 'list' ? 'default' : 'outline'} 
            size="icon" 
            onClick={() => setViewMode('list')}
            className="hidden sm:inline-flex"
          >
            <List className="h-5 w-5" />
          </Button>
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
                      <AlertDialogTitle>Nettoyer l'atelier ?</AlertDialogTitle>
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
          <Button size="icon" onClick={handleAddNewClick}>
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Batch Actions Bar */}
      {selectedTasks.length > 0 && (
        <BatchActionMenu />
      )}

      {/* Timeline */}
      <ScrollArea className="w-full whitespace-nowrap -mx-4 sm:-mx-8 px-4 sm:px-8">
        <div className="flex space-x-2 pb-4">
          {dates.map((date, index) => {
            const isSelected = isSameDay(date, selectedDate);
            const isToday = isSameDay(date, new Date());

            return (
              <motion.div
                key={index}
                whileTap={{ scale: 0.95 }}
                className="relative"
              >
                <Button
                  variant={isSelected ? 'default' : 'outline'}
                  className={`flex flex-col h-auto p-3 rounded-2xl ${
                    isSelected
                      ? 'bg-primary text-primary-foreground shadow-lg'
                      : 'bg-card'
                  }`}
                  onClick={() => handleDateSelect(date)}
                >
                  <span className="text-xs capitalize font-medium text-muted-foreground">
                    {format(date, 'EEE', { locale: fr })}
                  </span>
                  <span className="text-xl font-bold mt-1">
                    {format(date, 'dd')}
                  </span>
                  {isToday && !isSelected && (
                    <span className="absolute -bottom-1 w-1.5 h-1.5 bg-primary rounded-full"></span>
                  )}
                </Button>
              </motion.div>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Task List */}
      <ScrollArea className="flex-1 -mx-4 sm:-mx-8 px-4 sm:px-8">
        {sortedGroupKeys.length > 0 ? (
          <div className="space-y-8 pr-4 pb-4">
             {sortedGroupKeys.map(dateKey => {
                const tasksForDay = filteredAndGroupedTasks[dateKey];
                if (!tasksForDay || tasksForDay.length === 0) return null;

                const isUnplanned = dateKey === 'unplanned';
                const groupDate = isUnplanned ? null : new Date(dateKey);
                const title = isUnplanned ? 'Non planifié' : format(groupDate!, 'EEEE d MMMM', { locale: fr });
                
                return (
                  <div key={dateKey} ref={(el) => { if (!isUnplanned) dateRefs.current[dateKey] = el; }}>
                    <h2 className="text-lg font-bold sticky top-0 bg-background/80 backdrop-blur-sm py-2 z-10">{title}</h2>
                    {viewMode === 'grid' ? (
                      // Grid View
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
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
                            onDoubleClick={() => {
                              // Quick edit on double click
                              handleTaskClick(task);
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
                    ) : (
                      // List View
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12">
                              <Checkbox 
                                checked={selectedTasks.length === tasksForDay.length && tasksForDay.length > 0}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedTasks([...selectedTasks, ...tasksForDay.map(t => t.id)]);
                                  } else {
                                    setSelectedTasks(selectedTasks.filter(id => !tasksForDay.some(t => t.id === id)));
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
                                }
                              }}
                              onDoubleClick={() => {
                                // Quick edit on double click
                                handleTaskClick(task);
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
                                {task.priority && (
                                  <Badge variant="outline" className={cn("capitalize text-xs", priorityStyles[task.priority])}>
                                    {task.priority}
                                  </Badge>
                                )}
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
          <SheetHeader className="bg-card p-6 pb-4">
            <SheetTitle className="text-2xl font-bold">
              {isCreatingNewTask
                ? 'Créer une nouvelle tâche'
                : 'Détails de la tâche'}
            </SheetTitle>
            <SheetDescription>
              {isCreatingNewTask
                ? 'Remplissez les détails ci-dessous pour ajouter une tâche à votre réservoir.'
                : 'Modifiez les informations de votre tâche ci-dessous.'}
            </SheetDescription>
          </SheetHeader>
          <form
            onSubmit={handleSaveTask}
            className="flex-1 flex flex-col justify-between overflow-hidden"
          >
            <ScrollArea className="flex-1">
              <div className="space-y-6 py-6 px-6">
                 <input type="hidden" name="scheduledDate" value={sheetTaskDate ? sheetTaskDate.toISOString() : ''} />
                <div className="space-y-2">
                  <Label htmlFor="name" className="font-semibold">
                    Titre de la tâche
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    defaultValue={selectedTask?.name || ''}
                    placeholder="Ex: Appeler le client pour le feedback"
                    required
                    className="h-12 rounded-xl text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description" className="font-semibold">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    name="description"
                    defaultValue={selectedTask?.description || ''}
                    placeholder="Ajouter plus de détails, des notes ou des liens..."
                    rows={4}
                    className="rounded-xl"
                  />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="scheduledDate" className="font-semibold">
                      Date planifiée
                    </Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                            variant={"outline"}
                            className={cn(
                                "w-full justify-start text-left font-normal h-12 rounded-xl",
                                !sheetTaskDate && "text-muted-foreground"
                            )}
                            >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {sheetTaskDate ? format(sheetTaskDate, "PPP", { locale: fr }) : <span>Choisir une date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                            mode="single"
                            selected={sheetTaskDate}
                            onSelect={setSheetTaskDate}
                            initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                </div>
                <div className="space-y-3">
                  <Label className="font-semibold">Priorité</Label>
                  <RadioGroup
                    name="priority"
                    defaultValue={selectedTask?.priority || 'medium'}
                    className="grid grid-cols-3 gap-3"
                  >
                    <Label
                      htmlFor="p-low"
                      className="flex items-center justify-center gap-2 rounded-xl border p-3 cursor-pointer has-[:checked]:bg-green-100 has-[:checked]:border-green-400 dark:has-[:checked]:bg-green-900/50 dark:has-[:checked]:border-green-700 transition-all"
                    >
                      <RadioGroupItem value="low" id="p-low" className="sr-only" />
                      Basse
                    </Label>
                    <Label
                      htmlFor="p-medium"
                      className="flex items-center justify-center gap-2 rounded-xl border p-3 cursor-pointer has-[:checked]:bg-yellow-100 has-[:checked]:border-yellow-400 dark:has-[:checked]:bg-yellow-900/50 dark:has-[:checked]:border-yellow-700 transition-all"
                    >
                      <RadioGroupItem
                        value="medium"
                        id="p-medium"
                        className="sr-only"
                      />
                      Moyenne
                    </Label>
                    <Label
                      htmlFor="p-high"
                      className="flex items-center justify-center gap-2 rounded-xl border p-3 cursor-pointer has-[:checked]:bg-red-100 has-[:checked]:border-red-400 dark:has-[:checked]:bg-red-900/50 dark:has-[:checked]:border-red-700 transition-all"
                    >
                      <RadioGroupItem
                        value="high"
                        id="p-high"
                        className="sr-only"
                      />
                      Haute
                    </Label>
                  </RadioGroup>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 font-semibold">
                      <Zap size={16} /> Énergie requise
                    </Label>
                    <Select
                      name="energyRequired"
                      defaultValue={selectedTask?.energyRequired}
                    >
                      <SelectTrigger className="h-12 rounded-xl">
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
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
                    <Label
                      htmlFor="estimatedDuration"
                      className="font-semibold"
                    >
                      Durée (minutes)
                    </Label>
                    <Input
                      id="estimatedDuration"
                      name="estimatedDuration"
                      type="number"
                      defaultValue={selectedTask?.estimatedDuration || ''}
                      placeholder="Ex: 30"
                      className="h-12 rounded-xl"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="completionRate" className="font-semibold">
                    Progression (%)
                  </Label>
                  <Input
                    id="completionRate"
                    name="completionRate"
                    type="number"
                    min="0"
                    max="100"
                    defaultValue={selectedTask?.completionRate || 0}
                    placeholder="Ex: 50"
                    className="h-12 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tags" className="font-semibold">
                    Tags
                  </Label>
                  <Input
                    id="tags"
                    name="tags"
                    defaultValue={selectedTask?.tags?.join(', ') || ''}
                    placeholder="Ex: UI/UX, Dev, Marketing"
                    className="h-12 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="objective" className="font-semibold">
                    Objectif
                  </Label>
                  <Textarea
                    id="objective"
                    name="objective"
                    defaultValue={selectedTask?.objective || ''}
                    placeholder="Quel est le but final de cette tâche ?"
                    rows={2}
                    className="rounded-xl"
                  />
                </div>
                <div className="flex items-center justify-between rounded-xl border bg-card p-4 shadow-sm">
                  <div className="space-y-0.5">
                    <Label className="font-semibold">Sélection automatique</Label>
                    <p className="text-sm text-muted-foreground">
                      Autoriser l'IA à suggérer cette tâche.
                    </p>
                  </div>
                  <Switch
                    name="autoSelected"
                    defaultChecked={selectedTask?.autoSelected ?? true}
                  />
                </div>
              </div>
            </ScrollArea>

            <SheetFooter className="bg-card p-4 flex-row justify-between sm:justify-between border-t">
              <div>
                {!isCreatingNewTask && selectedTask && (
                   <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button type="button" variant="destructive">Supprimer</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Cette action ne peut pas être annulée. Cela supprimera définitivement cette tâche.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteTask(selectedTask.id)}>
                                    Supprimer
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSheetClose}
                  className="h-12 rounded-full px-6"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  className="h-12 rounded-full px-8 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Enregistrer
                </Button>
              </div>
            </SheetFooter>
          </form>
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
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
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
            
            {/* Priority Filter */}
            <div className="space-y-3">
              <Label className="font-semibold">Priorité</Label>
              <div className="space-y-2">
                {(['high', 'medium', 'low'] as const).map(priority => (
                  <div key={priority} className="flex items-center space-x-2">
                    <Checkbox
                      id={`priority-${priority}`}
                      checked={filters.priorities.includes(priority)}
                      onCheckedChange={() => handleMultiSelectFilterChange('priorities', priority)}
                    />
                    <Label htmlFor={`priority-${priority}`} className="capitalize font-normal">{priority}</Label>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Energy Filter */}
            <div className="space-y-3">
              <Label className="font-semibold">Énergie Requise</Label>
              <div className="space-y-2">
                {(['high', 'medium', 'low'] as const).map(energy => (
                  <div key={energy} className="flex items-center space-x-2">
                    <Checkbox
                      id={`energy-${energy}`}
                      checked={filters.energy.includes(energy)}
                      onCheckedChange={() => handleMultiSelectFilterChange('energy', energy)}
                    />
                    <Label htmlFor={`energy-${energy}`} className="capitalize font-normal">{energy}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <SheetFooter className="p-4 flex-row justify-between sm:justify-between border-t bg-card">
            <Button variant="outline" onClick={resetFilters}>Réinitialiser</Button>
            <Button onClick={() => setIsFilterSheetOpen(false)}>Appliquer</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}

    