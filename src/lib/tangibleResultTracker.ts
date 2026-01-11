/**
 * TANGIBLE RESULT TRACKER - PHASE 3 IMPLEMENTATION
 * Implements tracking of tangible results to address the contradiction between 
 * "no hidden priority modifications" and "productivity enhancement"
 */

import { TaskOutcome, EnhancedTaskWithContext } from './phase3Contracts';

export interface TangibleResultDetection {
  declared: boolean;          // User declared the task produces a tangible result
  inferred: boolean;          // System inferred the task produces a tangible result
  confidence: number;         // Confidence level of the inference (0-1)
  detectionMethod: 'user-declared' | 'heuristic' | 'verb-analysis' | 'post-completion';
}

export interface TangibleResultClassifier {
  /**
   * Determines if a task produces a tangible result
   */
  classifyTask(task: EnhancedTaskWithContext): TangibleResultDetection;
  
  /**
   * Updates classification based on task completion data
   */
  updateClassification(task: EnhancedTaskWithContext, completed: boolean, resultAchieved: boolean): void;
}

/**
 * Default implementation of tangible result classifier
 */
export class DefaultTangibleResultClassifier implements TangibleResultClassifier {
  private readonly ACTION_VERBS: string[] = [
    'envoyer', 'publier', 'livrer', 'finaliser', 'soumettre', 'créer', 'produire', 
    'générer', 'construire', 'développer', 'coder', 'écrire', 'designer', 'compléter',
    'terminer', 'achever', 'réaliser', 'fabriquer', 'composer', 'monter', 'assembler',
    'envoyer', 'transmettre', 'distribuer', 'partager', 'diffuser', 'poster', 'upload',
    'exporter', 'valider', 'approuver', 'signer', 'envoyer', 'envoi', 'envoyé', 'envoie'
  ];
  
  private readonly TANGIBLE_INDICATORS: string[] = [
    'document', 'rapport', 'présentation', 'email', 'message', 'code', 'fichier',
    'projet', 'produit', 'article', 'vidéo', 'image', 'design', 'maquette', 'mockup',
    'dossier', 'archive', 'export', 'backup', 'facture', 'contrat', 'accord', 'devis',
    'cahier', 'spécification', 'carnet', 'note', 'plan', 'stratégie', 'business', 'étude'
  ];
  
  /**
   * Classifies a task based on multiple detection methods
   */
  classifyTask(task: EnhancedTaskWithContext): TangibleResultDetection {
    // Check if user explicitly declared it as tangible
    if (task.tangibleResult !== undefined) {
      return {
        declared: task.tangibleResult,
        inferred: false,
        confidence: 1.0,
        detectionMethod: 'user-declared'
      };
    }
    
    // Use heuristic analysis
    const heuristicResult = this.analyzeTaskForTangibleResult(task);
    
    return heuristicResult;
  }
  
  /**
   * Updates classification based on actual task completion data
   */
  updateClassification(task: EnhancedTaskWithContext, completed: boolean, resultAchieved: boolean): void {
    // In a real implementation, this would update a learning model
    // For now, we just log the result
    console.log(`Task ${task.title} completed: ${completed}, tangible result: ${resultAchieved}`);
  }
  
  /**
   * Analyzes a task for potential tangible result using multiple methods
   */
  private analyzeTaskForTangibleResult(task: EnhancedTaskWithContext): TangibleResultDetection {
    let confidence = 0;
    let detectionMethod: 'heuristic' | 'verb-analysis' | 'post-completion' = 'heuristic';
    
    // Method 1: Verb analysis
    const verbConfidence = this.analyzeVerbs(task);
    if (verbConfidence > confidence) {
      confidence = verbConfidence;
      detectionMethod = 'verb-analysis';
    }
    
    // Method 2: Content analysis
    const contentConfidence = this.analyzeContent(task);
    if (contentConfidence > confidence) {
      confidence = contentConfidence;
      detectionMethod = 'heuristic';
    }
    
    // Method 3: Category analysis
    const categoryConfidence = this.analyzeCategory(task);
    if (categoryConfidence > confidence) {
      confidence = categoryConfidence;
      detectionMethod = 'heuristic';
    }
    
    return {
      declared: false,
      inferred: confidence > 0.5,
      confidence,
      detectionMethod
    };
  }
  
  /**
   * Analyzes task title and description for action verbs that indicate tangible results
   */
  private analyzeVerbs(task: EnhancedTaskWithContext): number {
    const text = `${task.title} ${task.description || ''}`.toLowerCase();
    
    let matches = 0;
    for (const verb of this.ACTION_VERBS) {
      if (text.includes(verb)) {
        matches++;
      }
    }
    
    // Return confidence based on number of matches
    return Math.min(1.0, matches * 0.3);
  }
  
  /**
   * Analyzes task content for tangible result indicators
   */
  private analyzeContent(task: EnhancedTaskWithContext): number {
    const text = `${task.title} ${task.description || ''} ${task.tags?.join(' ') || ''}`.toLowerCase();
    
    let matches = 0;
    for (const indicator of this.TANGIBLE_INDICATORS) {
      if (text.includes(indicator)) {
        matches++;
      }
    }
    
    // Return confidence based on number of matches
    return Math.min(1.0, matches * 0.2);
  }
  
  /**
   * Analyzes task category for likelihood of tangible results
   */
  private analyzeCategory(task: EnhancedTaskWithContext): number {
    const highTangibleCategories = ['work', 'project', 'development', 'design', 'writing', 'creation', 'production'];
    const mediumTangibleCategories = ['study', 'learning', 'research', 'analysis', 'planning'];
    
    if (highTangibleCategories.includes(task.category.toLowerCase())) {
      return 0.8;
    } else if (mediumTangibleCategories.includes(task.category.toLowerCase())) {
      return 0.5;
    }
    
    return 0.2; // Low confidence for other categories
  }
}

/**
 * Tracks tangible results over time to improve detection
 */
export class TangibleResultTracker {
  private classifier: TangibleResultClassifier;
  private taskOutcomes: Map<string, TaskOutcome[]> = new Map();
  
  constructor(classifier?: TangibleResultClassifier) {
    this.classifier = classifier || new DefaultTangibleResultClassifier();
  }
  
  /**
   * Determines if a task is likely to produce a tangible result
   */
  async predictTangibleResult(task: EnhancedTaskWithContext): Promise<TangibleResultDetection> {
    return this.classifier.classifyTask(task);
  }
  
  /**
   * Records the outcome of a task completion
   */
  recordTaskOutcome(outcome: TaskOutcome): void {
    const taskId = outcome.taskId;
    const outcomes = this.taskOutcomes.get(taskId) || [];
    outcomes.push(outcome);
    this.taskOutcomes.set(taskId, outcomes);
    
    // Update the classifier with the new information
    const task = this.createMockTask(taskId);
    this.classifier.updateClassification(task, outcome.completed, outcome.tangibleResult);
  }
  
  /**
   * Gets the historical tangible result rate for a specific task
   */
  getTaskTangibleRate(taskId: string): number {
    const outcomes = this.taskOutcomes.get(taskId);
    if (!outcomes || outcomes.length === 0) {
      return 0;
    }
    
    const tangibleCount = outcomes.filter(o => o.tangibleResult).length;
    return tangibleCount / outcomes.length;
  }
  
  /**
   * Gets the overall tangible result rate
   */
  getOverallTangibleRate(): number {
    const allOutcomes = Array.from(this.taskOutcomes.values()).flat();
    if (allOutcomes.length === 0) {
      return 0;
    }
    
    const tangibleCount = allOutcomes.filter(o => o.tangibleResult).length;
    return tangibleCount / allOutcomes.length;
  }
  
  /**
   * Creates a mock task for classifier updates (in a real system, tasks would be stored)
   */
  private createMockTask(taskId: string): EnhancedTaskWithContext {
    // In a real implementation, this would fetch the actual task
    return {
      id: taskId,
      title: 'Mock Task',
      description: '',
      duration: 30,
      effort: 'medium',
      urgency: 'medium',
      impact: 'medium',
      category: 'general',
      status: 'todo',
      pool: 'AVAILABLE',
      activationCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      origin: 'SELF_CHOSEN',
      tangibleResult: false
    };
  }
  
  /**
   * Enhances a task with tangible result prediction
   */
  async enhanceTaskWithTangiblePrediction(task: EnhancedTaskWithContext): Promise<EnhancedTaskWithContext> {
    const prediction = await this.predictTangibleResult(task);
    
    return {
      ...task,
      tangibleResult: prediction.declared || prediction.inferred,
      tangibleResultConfidence: prediction.confidence
    };
  }
}

/**
 * Helper function to detect if a task produces a tangible result
 */
export async function detectTangibleResult(
  task: EnhancedTaskWithContext,
  tracker?: TangibleResultTracker
): Promise<boolean> {
  if (task.tangibleResult !== undefined) {
    return task.tangibleResult;
  }
  
  const localTracker = tracker || new TangibleResultTracker();
  const prediction = await localTracker.predictTangibleResult(task);
  
  return prediction.declared || prediction.inferred;
}

/**
 * Helper function to create a task outcome record
 */
export function createTaskOutcome(
  taskId: string,
  completed: boolean,
  tangibleResult: boolean,
  actualDuration: number,
  perceivedEffort: number
): TaskOutcome {
  return {
    taskId,
    completed,
    actualDuration,
    perceivedEffort,
    tangibleResult
  };
}