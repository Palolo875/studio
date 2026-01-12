/**
 * ENHANCED TASK DATABASE - PHASE 3.3
 * Extension de la base de données pour inclure toutes les structures nécessaires
 * 
 * Intègre les corrections identifiées dans la méta-analyse :
 * - Table Tasks complète
 * - Table BrainDecisions avec contexte complet
 * - Table Overrides
 * - Table ModeTransitions
 * - Validation d'intégrité
 */

import Dexie, { Table } from 'dexie';
import { Task, BrainDecision, OverrideEvent, ModeTransition, PruningPolicy, DEFAULT_PRUNING_POLICY, IntegrityValidator } from '../storageStructures';

// Interface pour la base de données améliorée
export interface EnhancedTaskDatabaseSchema {
  tasks: Task;
  brainDecisions: BrainDecision;
  overrides: OverrideEvent;
  modeTransitions: ModeTransition;
  settings: { id: string; value: any };
  pruningLogs: { id: string; timestamp: Date; action: string; entity: string; recordsProcessed: number; recordsRemoved: number; message: string };
}

export class EnhancedTaskDatabase extends Dexie {
  // Tables
  tasks!: Table<Task, string>;
  brainDecisions!: Table<BrainDecision, string>;
  overrides!: Table<OverrideEvent, string>;
  modeTransitions!: Table<ModeTransition, string>;
  settings!: Table<{ id: string; value: any }, string>;
  pruningLogs!: Table<{ id: string; timestamp: Date; action: string; entity: string; recordsProcessed: number; recordsRemoved: number; message: string }, string>;

  // Validation
  private validator = new IntegrityValidator();
  
  // Politique de pruning
  private pruningPolicy = DEFAULT_PRUNING_POLICY;

  constructor() {
    super('EnhancedTaskDatabase');
    this.version(1).stores({
      tasks: 'id, title, origin, outcomeType, scheduledTime, createdAt, updatedAt, deadline, visibleToUser, userArchived, systemManaged', // Clé primaire et index
      brainDecisions: 'id, taskId, sessionId, timestamp, inputs.decisionPolicy.level, outputs.decisionMode', // Clé primaire et index
      overrides: 'id, taskId, sessionId, timestamp, invariantTouched, createdBy, source', // Clé primaire et index
      modeTransitions: 'id, fromMode, toMode, timestamp, triggeredBy', // Clé primaire et index
      settings: 'id', // Clé primaire
      pruningLogs: 'id, timestamp, entity, action' // Clé primaire et index
    });
  }

  // --- CRUD pour Tasks ---
  
  async addTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const validation = this.validator.validateTask({
      ...task,
      id: 'temp',
      createdAt: new Date(),
      updatedAt: new Date()
    } as Task);
    
    if (!validation.isValid) {
      throw new Error(`Validation échouée pour la tâche: ${validation.errors.join(', ')}`);
    }
    
    const id = crypto.randomUUID(); // Génère un nouvel ID
    const now = new Date();
    
    const fullTask: Task = {
      ...task,
      id,
      createdAt: now,
      updatedAt: now
    };
    
    await this.tasks.add(fullTask);
    return id;
  }
  
  async updateTask(id: string, updates: Partial<Task>): Promise<void> {
    const existingTask = await this.tasks.get(id);
    if (!existingTask) {
      throw new Error(`Tâche avec ID ${id} introuvable`);
    }
    
    const updatedTask: Task = {
      ...existingTask,
      ...updates,
      updatedAt: new Date()
    };
    
    const validation = this.validator.validateTask(updatedTask);
    if (!validation.isValid) {
      throw new Error(`Validation échouée pour la tâche mise à jour: ${validation.errors.join(', ')}`);
    }
    
    await this.tasks.update(id, updatedTask);
  }
  
  async getTask(id: string): Promise<Task | undefined> {
    return await this.tasks.get(id);
  }
  
  async getAllTasks(): Promise<Task[]> {
    return await this.tasks.toArray();
  }
  
  async deleteTask(id: string): Promise<void> {
    await this.tasks.delete(id);
  }
  
  // --- CRUD pour BrainDecisions ---
  
  async addBrainDecision(decision: Omit<BrainDecision, 'id'>): Promise<string> {
    const validation = this.validator.validateBrainDecision({
      ...decision,
      id: 'temp'
    } as BrainDecision);
    
    if (!validation.isValid) {
      throw new Error(`Validation échouée pour la décision: ${validation.errors.join(', ')}`);
    }
    
    const id = crypto.randomUUID();
    const fullDecision: BrainDecision = {
      ...decision,
      id
    };
    
    await this.brainDecisions.add(fullDecision);
    return id;
  }
  
  async getBrainDecision(id: string): Promise<BrainDecision | undefined> {
    return await this.brainDecisions.get(id);
  }
  
  async getDecisionsByTask(taskId: string): Promise<BrainDecision[]> {
    return await this.brainDecisions.where('taskId').equals(taskId).toArray();
  }
  
  async getRecentDecisions(limit: number = 50): Promise<BrainDecision[]> {
    return await this.brainDecisions.orderBy('timestamp').reverse().limit(limit).toArray();
  }
  
  // --- CRUD pour Overrides ---
  
  async addOverride(override: Omit<OverrideEvent, 'id'>): Promise<string> {
    const validation = this.validator.validateOverride({
      ...override,
      id: 'temp'
    } as OverrideEvent);
    
    if (!validation.isValid) {
      throw new Error(`Validation échouée pour l'override: ${validation.errors.join(', ')}`);
    }
    
    const id = crypto.randomUUID();
    const fullOverride: OverrideEvent = {
      ...override,
      id
    };
    
    await this.overrides.add(fullOverride);
    return id;
  }
  
  async getOverride(id: string): Promise<OverrideEvent | undefined> {
    return await this.overrides.get(id);
  }
  
  async getOverridesByTask(taskId: string): Promise<OverrideEvent[]> {
    return await this.overrides.where('taskId').equals(taskId).toArray();
  }
  
  async getRecentOverrides(limit: number = 50): Promise<OverrideEvent[]> {
    return await this.overrides.orderBy('timestamp').reverse().limit(limit).toArray();
  }
  
  // --- CRUD pour ModeTransitions ---
  
  async addModeTransition(transition: Omit<ModeTransition, 'id'>): Promise<string> {
    const validation = this.validator.validateModeTransition({
      ...transition,
      id: 'temp'
    } as ModeTransition);
    
    if (!validation.isValid) {
      throw new Error(`Validation échouée pour la transition de mode: ${validation.errors.join(', ')}`);
    }
    
    const id = crypto.randomUUID();
    const fullTransition: ModeTransition = {
      ...transition,
      id
    };
    
    await this.modeTransitions.add(fullTransition);
    return id;
  }
  
  async getModeTransition(id: string): Promise<ModeTransition | undefined> {
    return await this.modeTransitions.get(id);
  }
  
  async getRecentModeTransitions(limit: number = 50): Promise<ModeTransition[]> {
    return await this.modeTransitions.orderBy('timestamp').reverse().limit(limit).toArray();
  }
  
  async getCurrentMode(): Promise<ModeTransition | null> {
    const recentTransitions = await this.modeTransitions.orderBy('timestamp').reverse().limit(1).toArray();
    return recentTransitions.length > 0 ? recentTransitions[0] : null;
  }
  
  // --- Gestion des paramètres ---
  
  async setSetting(key: string, value: any): Promise<void> {
    await this.settings.put({ id: key, value });
  }
  
  async getSetting<T>(key: string, defaultValue?: T): Promise<T | undefined> {
    const record = await this.settings.get(key);
    return record ? record.value as T : defaultValue;
  }
  
  // --- Journalisation du pruning ---
  
  async logPruningAction(action: string, entity: string, recordsProcessed: number, recordsRemoved: number, message: string): Promise<void> {
    const id = crypto.randomUUID();
    await this.pruningLogs.add({
      id,
      timestamp: new Date(),
      action,
      entity,
      recordsProcessed,
      recordsRemoved,
      message
    });
  }
  
  async getPruningLogs(limit: number = 100): Promise<any[]> {
    return await this.pruningLogs.orderBy('timestamp').reverse().limit(limit).toArray();
  }
  
  // --- Méthodes utilitaires ---
  
  // Obtenir les tâches avec leurs décisions récentes
  async getTasksWithDecisions(): Promise<Array<{ task: Task; decisions: BrainDecision[] }>> {
    const tasks = await this.getAllTasks();
    const result = [];
    
    for (const task of tasks) {
      const decisions = await this.getDecisionsByTask(task.id);
      result.push({ task, decisions });
    }
    
    return result;
  }
  
  // Obtenir les statistiques de la base de données
  async getDatabaseStats(): Promise<{
    tasks: number;
    brainDecisions: number;
    overrides: number;
    modeTransitions: number;
    totalSizeEstimate: number;
  }> {
    const tasksCount = await this.tasks.count();
    const brainDecisionsCount = await this.brainDecisions.count();
    const overridesCount = await this.overrides.count();
    const modeTransitionsCount = await this.modeTransitions.count();
    
    // Estimation de la taille (approximative)
    const totalSizeEstimate = tasksCount * 1024 + brainDecisionsCount * 512 + overridesCount * 256 + modeTransitionsCount * 128;
    
    return {
      tasks: tasksCount,
      brainDecisions: brainDecisionsCount,
      overrides: overridesCount,
      modeTransitions: modeTransitionsCount,
      totalSizeEstimate
    };
  }
  
  // Méthode pour vérifier l'intégrité de la base de données
  async validateDatabaseIntegrity(): Promise<{ isValid: boolean; issues: string[] }> {
    const issues: string[] = [];
    
    // Vérifier les tâches orphelines (sans décisions si elles devraient en avoir)
    const tasks = await this.getAllTasks();
    for (const task of tasks) {
      // Ajouter des vérifications spécifiques selon les besoins
      if (task.completedAt && !task.startedAt) {
        issues.push(`Tâche ${task.id} complétée sans date de début: ${task.title}`);
      }
    }
    
    // Vérifier les références valides
    const overrides = await this.overrides.toArray();
    for (const override of overrides) {
      const taskExists = await this.tasks.get(override.taskId);
      if (!taskExists) {
        issues.push(`Override ${override.id} référence une tâche inexistante: ${override.taskId}`);
      }
    }
    
    return {
      isValid: issues.length === 0,
      issues
    };
  }
  
  // Méthode pour exporter les données
  async exportData(): Promise<any> {
    return {
      tasks: await this.getAllTasks(),
      brainDecisions: await this.brainDecisions.toArray(),
      overrides: await this.overrides.toArray(),
      modeTransitions: await this.modeTransitions.toArray(),
      settings: await this.settings.toArray(),
      metadata: {
        exportDate: new Date(),
        version: '3.3-enhanced',
        stats: await this.getDatabaseStats()
      }
    };
  }
  
  // Méthode pour importer des données
  async importData(data: any): Promise<void> {
    // Commencer une transaction pour garantir l'intégrité
    await this.transaction('rw', [this.tasks, this.brainDecisions, this.overrides, this.modeTransitions, this.settings], async () => {
      // Effacer les données existantes
      await this.tasks.clear();
      await this.brainDecisions.clear();
      await this.overrides.clear();
      await this.modeTransitions.clear();
      await this.settings.clear();
      
      // Insérer les nouvelles données
      if (data.tasks) {
        for (const task of data.tasks) {
          await this.tasks.add(task);
        }
      }
      
      if (data.brainDecisions) {
        for (const decision of data.brainDecisions) {
          await this.brainDecisions.add(decision);
        }
      }
      
      if (data.overrides) {
        for (const override of data.overrides) {
          await this.overrides.add(override);
        }
      }
      
      if (data.modeTransitions) {
        for (const transition of data.modeTransitions) {
          await this.modeTransitions.add(transition);
        }
      }
      
      if (data.settings) {
        for (const setting of data.settings) {
          await this.settings.add(setting);
        }
      }
    });
  }
}

// Instance singleton de la base de données
let enhancedDbInstance: EnhancedTaskDatabase | null = null;

export function getEnhancedTaskDatabase(): EnhancedTaskDatabase {
  if (!enhancedDbInstance) {
    enhancedDbInstance = new EnhancedTaskDatabase();
  }
  return enhancedDbInstance;
}

// Fonction utilitaire pour initialiser la base de données avec des données de test
export async function initializeDatabaseWithSampleData(db: EnhancedTaskDatabase): Promise<void> {
  // Ajouter quelques tâches d'exemple
  await db.addTask({
    title: 'Répondre aux emails urgents',
    description: 'Répondre aux emails clients importants',
    action: 'répondre',
    object: 'emails',
    effort: 'medium',
    origin: 'IMPOSED',
    outcomeType: 'DELIVERABLE',
    outcomeConfidence: 0.9,
    activationCount: 0,
    priority: 0,
    visibleToUser: true,
    systemManaged: true
  });

  await db.addTask({
    title: 'Planifier la semaine prochaine',
    description: 'Organiser les tâches pour la semaine suivante',
    action: 'planifier',
    object: 'semaine',
    effort: 'medium',
    origin: 'SELF_CHOSEN',
    outcomeType: 'PREPARATION',
    outcomeConfidence: 0.8,
    activationCount: 0,
    priority: 0,
    visibleToUser: true,
    systemManaged: true
  });

  await db.addTask({
    title: 'Apprendre TypeScript avancé',
    description: 'Approfondir les connaissances en programmation TypeScript',
    action: 'apprendre',
    object: 'TypeScript',
    effort: 'high',
    origin: 'SELF_CHOSEN',
    outcomeType: 'LEARNING',
    outcomeConfidence: 0.7,
    activationCount: 0,
    priority: 0,
    visibleToUser: true,
    systemManaged: true
  });
}