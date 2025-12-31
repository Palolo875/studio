import { generatePlaylist } from "./playlistGenerator";
import { getUserPatternsFromDB } from "./database/index"; // Import correct
import { createLogger } from '@/lib/logger';
import { getSetting } from '@/lib/database';

type TaskLike = {
  id: string;
  name: string;
  completed: boolean;
  subtasks: unknown[];
  lastAccessed: string;
  completionRate: number;
  priority: 'low' | 'medium' | 'high';
  energyRequired?: 'high' | 'medium' | 'low';
  tags?: string[];
  scheduledDate?: string;
  effort?: 'S' | 'M' | 'L';
  deadlineDisplay?: string;
  description?: string;
  completedAt?: string;
};

const logger = createLogger('playlistExample');

/**
 * Exemple d'utilisation de l'algorithme de génération de playlist
 * 
 * Cette fonction montre comment intégrer l'algorithme dans une application réelle
 */
export async function generateDailyPlaylist(): Promise<any> {

  try {

    // 1. Récupérer les tâches depuis la base de données
    // const tasks = await db.tasks.toArray(); // À décommenter quand Dexie sera installé
    
    // Simulation de tâches
    const tasks: TaskLike[] = [];
    
    // 2. Récupérer l'historique des tâches
    // const taskHistory = await db.taskHistory.toArray(); // À décommenter quand Dexie sera installé
    
    // Simulation de l'historique
    const taskHistory: any[] = [];
    
    // 3. Récupérer les patterns utilisateur
    const userPatterns = await getUserPatternsFromDB();
    
    // 4. Obtenir le niveau d'énergie de l'utilisateur (Dexie settings)
    const energyLevel = (await getSetting<any>('morning.todayEnergyLevel')) || 'medium';
    
    // 5. Générer la playlist
    const playlist = await generatePlaylist(tasks, {
      energyLevel,
      currentTime: new Date(),
      taskHistory: taskHistory as any,
      userPatterns: userPatterns || undefined,
      maxTasks: 5,
      workdayHours: 8
    });
    
    // 6. Retourner la playlist générée
    return {
      success: true,
      playlist,
      message: `Playlist générée avec ${playlist.length} tâches`
    };
  } catch (error) {
    logger.error('Erreur lors de la génération de la playlist', error as Error);
    return {
      success: false,
      playlist: [],
      message: "Erreur lors de la génération de la playlist"
    };
  }
}

/**
 * Exemple de tâches pour tester l'algorithme
 */
export const sampleTasks: TaskLike[] = [
  {
    id: "task-1",
    name: "Finaliser le prototype de l'interface utilisateur",
    completed: false,
    subtasks: [],
    lastAccessed: new Date(Date.now() - 86400000 * 2).toISOString(), // Il y a 2 jours
    completionRate: 75,
    priority: "high",
    energyRequired: "high",
    tags: ["Development", "UI/UX", "Frontend"],
    scheduledDate: new Date(Date.now() + 86400000 * 3).toISOString(), // Dans 3 jours
    effort: "M", // 15 min - 2 heures
    deadlineDisplay: "Dans 3 jours"
  },
  {
    id: "task-2",
    name: "Préparer la présentation trimestrielle",
    completed: false,
    subtasks: [],
    lastAccessed: new Date(Date.now() - 86400000 * 1).toISOString(), // Hier
    completionRate: 40,
    priority: "high",
    energyRequired: "medium",
    tags: ["Presentation", "Communication", "Reporting"],
    scheduledDate: new Date(Date.now() + 86400000 * 1).toISOString(), // Demain
    effort: "L", // > 2 heures
    deadlineDisplay: "Demain"
  },
  {
    id: "task-3",
    name: "Lire le nouveau livre sur l'innovation",
    completed: false,
    subtasks: [],
    lastAccessed: new Date(Date.now() - 86400000 * 10).toISOString(), // Il y a 10 jours
    completionRate: 90,
    priority: "medium",
    energyRequired: "low",
    tags: ["Learning", "Reading", "Innovation"],
    scheduledDate: new Date(Date.now() + 86400000 * 7).toISOString(), // Dans 1 semaine
    effort: "S", // < 15 minutes
    deadlineDisplay: "Dans 1 semaine"
  },
  {
    id: "task-4",
    name: "Planifier les congés d'été",
    completed: false,
    subtasks: [],
    lastAccessed: new Date(Date.now() - 86400000 * 30).toISOString(), // Il y a 1 mois
    completionRate: 20,
    priority: "low",
    energyRequired: "low",
    tags: ["Personal", "Planning", "Schedule"],
    scheduledDate: new Date(Date.now() + 86400000 * 60).toISOString(), // Dans 2 mois
    effort: "S", // < 15 minutes
    deadlineDisplay: "Dans 2 mois"
  },
  {
    id: "task-5",
    name: "Session de brainstorming pour le nouveau produit",
    completed: false,
    subtasks: [],
    lastAccessed: new Date(Date.now() - 86400000 * 5).toISOString(), // Il y a 5 jours
    completionRate: 85,
    priority: "medium",
    energyRequired: "high",
    tags: ["Creativity", "Ideation", "Product"],
    scheduledDate: new Date(Date.now() + 86400000 * 2).toISOString(), // Dans 2 jours
    effort: "M", // 15 min - 2 heures
    deadlineDisplay: "Dans 2 jours"
  },
  {
    id: "task-6",
    name: "Mettre à jour la documentation technique",
    completed: false,
    subtasks: [],
    lastAccessed: new Date(Date.now() - 86400000 * 7).toISOString(), // Il y a 1 semaine
    completionRate: 60,
    priority: "medium",
    energyRequired: "medium",
    tags: ["Documentation", "Technical", "Writing"],
    scheduledDate: new Date(Date.now() + 86400000 * 5).toISOString(), // Dans 5 jours
    effort: "M", // 15 min - 2 heures
    deadlineDisplay: "Dans 5 jours"
  },
  {
    id: "task-7",
    name: "Répondre aux emails importants",
    completed: false,
    subtasks: [],
    lastAccessed: new Date().toISOString(), // Aujourd'hui
    completionRate: 95,
    priority: "high",
    energyRequired: "low",
    tags: ["Communication", "Email", "Administration"],
    scheduledDate: new Date(Date.now() + 86400000 * 1).toISOString(), // Demain
    effort: "S", // < 15 minutes
    deadlineDisplay: "Demain"
  }
];

/**
 * Exemple d'utilisation avec des tâches d'exemple
 */
export async function generateSamplePlaylist() {
  const playlist = await generatePlaylist(sampleTasks, {
    energyLevel: "high",
    currentTime: new Date(),
    maxTasks: 5,
    workdayHours: 8
  });
  
  logger.info('Playlist générée', { count: playlist.length });
  
  playlist.forEach((item, index) => {
    logger.info(`${index + 1}. ${item.task.name} (Score: ${item.score}) - ${item.reason}`);
  });
  
  return playlist;
}