/**
 * Générateur de playlist SOTA (State of the Art)
 * Algorithme avancé de génération de playlists de tâches avec scoring multi-facteurs
 */

// Définition minimale des types pour éviter les problèmes d'importation
interface Task {
  id: string;
  name?: string;
  tags?: string[];
  estimatedDuration?: number;
  effort?: string;
  completedAt?: string;
  lastAccessed?: string;
  completionRate?: number;
  energy?: number; // 1-10 scale
  deadline?: string; // ISO date string
  priority?: number; // 1-5 scale
}

interface KeystoneHabit {
  id: string;
  name: string;
  pattern: string;
  frequency: number;
  preferredDay?: number;
  preferredTime?: string;
  estimatedDuration: number;
  energyRequirement: 'low' | 'medium' | 'high';
}

interface ImpactMetrics {
  perceivedValue: number;
  pastMomentum: number;
  estimatedEffort: number;
  calculatedImpact: number;
}

interface MomentumData {
  taskId: string;
  completionSpeed: number;
  efficiencyScore: number;
  completionConsistency: number;
}

interface UserPreferences {
  energyLevel?: number; // 1-10
  focusTime?: 'morning' | 'afternoon' | 'evening';
  productivityPattern?: 'early-bird' | 'night-owl' | 'consistent';
}

export interface PlaylistTask extends Task {
  score: number;
  factors: {
    energy: number;
    impact: number;
    deadline: number;
    effort: number;
    pattern: number;
  };
  isKeystoneHabit: boolean;
  isHighImpact: boolean;
}

export class PlaylistGeneratorSOTA {
  private userHistory: Task[] = [];
  private keystoneHabits: KeystoneHabit[] = [];
  private momentumData: Map<string, MomentumData> = new Map();
  private userPreferences: UserPreferences = {};

  constructor(
    userHistory: Task[] = [],
    keystoneHabits: KeystoneHabit[] = [],
    momentumData: Map<string, MomentumData> = new Map(),
    userPreferences: UserPreferences = {}
  ) {
    this.userHistory = userHistory;
    this.keystoneHabits = keystoneHabits;
    this.momentumData = momentumData;
    this.userPreferences = userPreferences;
  }

  /**
   * Génère une playlist de tâches optimisée avec l'algorithme SOTA
   */
  generatePlaylist(tasks: Task[], maxTasks: number = 4): PlaylistTask[] {
    // 1. Calculer les scores pour chaque tâche
    const scoredTasks = tasks.map(task => this.calculateTaskScore(task));
    
    // 2. Trier par score décroissant
    const sortedTasks = scoredTasks.sort((a, b) => b.score - a.score);
    
    // 3. Appliquer les règles métier
    const filteredTasks = this.applyBusinessRules(sortedTasks);
    
    // 4. Limiter à maxTasks tâches
    const limitedTasks = filteredTasks.slice(0, maxTasks);
    
    // 5. Ajouter une tâche keystone habit si nécessaire
    const finalTasks = this.ensureKeystoneHabit(limitedTasks);
    
    return finalTasks;
  }

  /**
   * Calcule le score d'une tâche selon l'algorithme SOTA
   * Pondérations : Énergie (40%), Impact (15%), Deadline/Priorité (20%), Effort (15%), Patterns (10%)
   */
  private calculateTaskScore(task: Task): PlaylistTask {
    // Calculer chaque facteur
    const energyFactor = this.calculateEnergyFactor(task);
    const impactFactor = this.calculateImpactFactor(task);
    const deadlineFactor = this.calculateDeadlineFactor(task);
    const effortFactor = this.calculateEffortFactor(task);
    const patternFactor = this.calculatePatternFactor(task);
    
    // Appliquer les pondérations
    const energyScore = energyFactor * 0.40;
    const impactScore = impactFactor * 0.15;
    const deadlineScore = deadlineFactor * 0.20;
    const effortScore = effortFactor * 0.15;
    const patternScore = patternFactor * 0.10;
    
    // Calculer le score total
    const totalScore = energyScore + impactScore + deadlineScore + effortScore + patternScore;
    
    // Déterminer si c'est une keystone habit ou une tâche à haut impact
    const isKeystoneHabit = this.isTaskKeystoneHabit(task);
    const isHighImpact = impactFactor > 0.8;
    
    return {
      ...task,
      score: totalScore,
      factors: {
        energy: energyScore,
        impact: impactScore,
        deadline: deadlineScore,
        effort: effortScore,
        pattern: patternScore
      },
      isKeystoneHabit,
      isHighImpact
    };
  }

  /**
   * Calcule le facteur d'énergie (40%)
   * Basé sur l'énergie requise par la tâche vs l'énergie de l'utilisateur
   */
  private calculateEnergyFactor(task: Task): number {
    // Énergie de la tâche (1-10)
    const taskEnergy = task.energy || 5;
    
    // Énergie de l'utilisateur (1-10)
    const userEnergy = this.userPreferences.energyLevel || 5;
    
    // Calculer la compatibilité (plus c'est proche, mieux c'est)
    const difference = Math.abs(taskEnergy - userEnergy);
    const compatibility = Math.max(0, 1 - (difference / 10));
    
    return compatibility;
  }

  /**
   * Calcule le facteur d'impact (15%)
   * Basé sur la valeur perçue et le momentum passé
   */
  private calculateImpactFactor(task: Task): number {
    // Simuler le calcul d'impact
    // Dans une implémentation réelle, cela utiliserait ImpactAnalyzer
    const perceivedValue = this.calculatePerceivedValue(task);
    const pastMomentum = this.calculatePastMomentum(task);
    const estimatedEffort = task.estimatedDuration || 60;
    
    // Éviter la division par zéro
    const calculatedImpact = estimatedEffort > 0 
      ? (perceivedValue + pastMomentum) / estimatedEffort
      : 0;
    
    // Normaliser entre 0 et 1
    return Math.min(1, calculatedImpact / 100);
  }

  /**
   * Calcule le facteur deadline/priorité (20%)
   * Basé sur l'urgence et l'importance
   */
  private calculateDeadlineFactor(task: Task): number {
    // Priorité explicite (1-5)
    const explicitPriority = task.priority || 3;
    const normalizedPriority = explicitPriority / 5; // 0.2 - 1.0
    
    // Urgence basée sur la deadline
    let urgency = 0.5; // Valeur par défaut
    if (task.deadline) {
      const deadline = new Date(task.deadline);
      const now = new Date();
      const timeLeft = deadline.getTime() - now.getTime();
      const daysLeft = timeLeft / (1000 * 3600 * 24);
      
      // Plus la deadline est proche, plus l'urgence est grande
      if (daysLeft <= 1) {
        urgency = 1.0;
      } else if (daysLeft <= 3) {
        urgency = 0.8;
      } else if (daysLeft <= 7) {
        urgency = 0.6;
      } else {
        urgency = 0.3;
      }
    }
    
    // Combiner priorité et urgence
    return (normalizedPriority + urgency) / 2;
  }

  /**
   * Calcule le facteur d'effort (15%)
   * Basé sur la durée estimée et la complexité
   */
  private calculateEffortFactor(task: Task): number {
    const estimatedDuration = task.estimatedDuration || 60;
    
    // Normaliser l'effort entre 0 et 1 (plus c'est court, mieux c'est pour ce facteur)
    // Mais inverser car un effort faible est bon pour ce facteur
    const normalizedEffort = Math.min(1, estimatedDuration / 240); // 240 minutes = 4 heures
    return 1 - normalizedEffort; // Inverser : moins d'effort = meilleur score
  }

  /**
   * Calcule le facteur de patterns (10%)
   * Basé sur les habitudes passées et les préférences
   */
  private calculatePatternFactor(task: Task): number {
    let patternScore = 0.5; // Score neutre par défaut
    
    // Bonus si la tâche correspond aux préférences de l'utilisateur
    if (this.userPreferences.focusTime) {
      // Cette logique nécessiterait des données horaires détaillées
      patternScore += 0.1;
    }
    
    // Bonus si la tâche est similaire à des tâches réussies dans le passé
    if (this.userHistory.length > 0) {
      const similarTasks = this.userHistory.filter(historyTask => {
        if (!historyTask.tags || !task.tags) return false;
        
        const commonTags = historyTask.tags.filter(tag => 
          task.tags?.includes(tag)
        );
        
        return commonTags.length > 0;
      });
      
      if (similarTasks.length > 0) {
        // Calculer le taux de succès des tâches similaires
        const successfulTasks = similarTasks.filter(t => t.completedAt);
        const successRate = successfulTasks.length / similarTasks.length;
        patternScore += successRate * 0.3; // Max 0.3 bonus
      }
    }
    
    return Math.min(1, patternScore);
  }

  /**
   * Applique les règles métier
   */
  private applyBusinessRules(tasks: PlaylistTask[]): PlaylistTask[] {
    // Ne pas inclure les tâches déjà achevées
    const pendingTasks = tasks.filter(task => !task.completedAt);
    
    // Limiter à 4 tâches maximum
    return pendingTasks.slice(0, 4);
  }

  /**
   * S'assure qu'une keystone habit est incluse
   */
  private ensureKeystoneHabit(tasks: PlaylistTask[]): PlaylistTask[] {
    // Vérifier si une keystone habit est déjà présente
    const hasKeystoneHabit = tasks.some(task => task.isKeystoneHabit);
    
    if (!hasKeystoneHabit && this.keystoneHabits.length > 0) {
      // Trouver la keystone habit la plus pertinente
      const relevantKeystone = this.getMostRelevantKeystoneHabit();
      
      if (relevantKeystone) {
        // Créer une tâche fictive pour la keystone habit
        const keystoneTask: PlaylistTask = {
          id: `keystone-${relevantKeystone.id}`,
          name: relevantKeystone.name,
          tags: [relevantKeystone.name.toLowerCase()],
          estimatedDuration: relevantKeystone.estimatedDuration,
          energy: this.mapEnergyRequirementToNumber(relevantKeystone.energyRequirement),
          score: 0.9, // Score élevé
          factors: {
            energy: 0.36,
            impact: 0.14,
            deadline: 0.18,
            effort: 0.14,
            pattern: 0.09
          },
          isKeystoneHabit: true,
          isHighImpact: false
        };
        
        // Ajouter la keystone habit en tête de liste
        return [keystoneTask, ...tasks.slice(0, 3)]; // Max 4 tâches
      }
    }
    
    return tasks;
  }

  /**
   * Vérifie si une tâche est une keystone habit
   */
  private isTaskKeystoneHabit(task: Task): boolean {
    if (!task.tags || this.keystoneHabits.length === 0) return false;
    
    return this.keystoneHabits.some(habit => 
      task.tags?.includes(habit.name.toLowerCase())
    );
  }

  /**
   * Obtient la keystone habit la plus pertinente
   */
  private getMostRelevantKeystoneHabit(): KeystoneHabit | null {
    if (this.keystoneHabits.length === 0) return null;
    
    // Pour l'instant, retourner la première
    // Dans une implémentation réelle, cela serait basé sur le contexte
    return this.keystoneHabits[0];
  }

  /**
   * Met à jour les données pour générer de nouvelles playlists
   */
  updateData(
    userHistory: Task[],
    keystoneHabits: KeystoneHabit[],
    momentumData: Map<string, MomentumData>,
    userPreferences: UserPreferences
  ): void {
    this.userHistory = userHistory;
    this.keystoneHabits = keystoneHabits;
    this.momentumData = momentumData;
    this.userPreferences = userPreferences;
  }

  // Méthodes utilitaires pour les calculs d'impact
  private calculatePerceivedValue(task: Task): number {
    let value = 0;
    
    // Vérifier les tags
    if (task.tags) {
      const highValueTags = ['revenu', 'client', 'prospect', 'important', 'urgent'];
      if (task.tags.some((tag: string) => highValueTags.includes(tag.toLowerCase()))) {
        value += 20;
      }
    }
    
    // Vérifier le contenu de la tâche
    const content = task.name?.toLowerCase() || '';
    const highValueKeywords = [
      'client', 'prospect', 'revenu', 'argent', 'paiement',
      'contrat', 'deal', 'vente', 'business', 'stratégie'
    ];
    
    if (highValueKeywords.some(keyword => content.includes(keyword))) {
      value += 20;
    }
    
    return value;
  }

  private calculatePastMomentum(task: Task): number {
    if (!task.tags || this.userHistory.length === 0) return 0;
    
    // Trouver des tâches similaires dans l'historique
    const similarTasks = this.userHistory.filter(historyTask => {
      if (!historyTask.tags) return false;
      
      const commonTags = historyTask.tags.filter((tag: string) => 
        task.tags?.includes(tag)
      );
      
      return commonTags.length > 0;
    });
    
    if (similarTasks.length === 0) return 0;
    
    // Calculer l'efficacité moyenne des tâches similaires
    const efficiencySum = similarTasks.reduce((sum, similarTask) => {
      if (similarTask.estimatedDuration && similarTask.completedAt) {
        // Calculer le temps réel pris
        const createdAt = new Date(similarTask.lastAccessed || new Date().toISOString());
        const completedAt = new Date(similarTask.completedAt);
        const actualMinutes = (completedAt.getTime() - createdAt.getTime()) / (1000 * 60);
        
        // Si terminé plus vite que prévu, c'est efficace
        if (actualMinutes < similarTask.estimatedDuration) {
          return sum + 15; // Bonus pour efficacité
        }
      }
      return sum;
    }, 0);
    
    return efficiencySum / similarTasks.length;
  }

  private mapEnergyRequirementToNumber(energyRequirement: 'low' | 'medium' | 'high'): number {
    switch (energyRequirement) {
      case 'low': return 3;
      case 'medium': return 6;
      case 'high': return 9;
      default: return 5;
    }
  }
}