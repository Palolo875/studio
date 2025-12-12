/**
 * Service de suivi analytique pour l'algorithme de playlist SOTA
 * Suit les performances des tâches high-impact et les patterns d'utilisation
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
  priority?: number;
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

interface MomentumData {
  taskId: string;
  completionSpeed: number;
  efficiencyScore: number;
  completionConsistency: number;
}

export interface AnalyticsData {
  // Statistiques globales
  totalTasksGenerated: number;
  totalTasksCompleted: number;
  highImpactTasksGenerated: number;
  highImpactTasksCompleted: number;
  keystoneHabitsGenerated: number;
  keystoneHabitsCompleted: number;
  
  // Taux de conversion
  overallCompletionRate: number;
  highImpactCompletionRate: number;
  keystoneHabitCompletionRate: number;
  
  // Tendance sur 7 jours
  sevenDayCompletionRate: number;
  sevenDayHighImpactRate: number;
  
  // Patterns d'utilisation
  shuffleCount: number;
  averagePlaylistSize: number;
  focusScoreImprovement: number;
  
  // Timestamps
  firstActivityDate?: string;
  lastActivityDate?: string;
}

export interface DailyAnalytics {
  date: string;
  tasksGenerated: number;
  tasksCompleted: number;
  highImpactTasksGenerated: number;
  highImpactTasksCompleted: number;
  keystoneHabitsGenerated: number;
  keystoneHabitsCompleted: number;
  shuffleCount: number;
  focusScore: number;
}

export class AnalyticsTracker {
  private analyticsData: AnalyticsData;
  private dailyAnalytics: Map<string, DailyAnalytics> = new Map();
  private userHistory: Task[] = [];
  private keystoneHabits: KeystoneHabit[] = [];
  private momentumData: Map<string, MomentumData> = new Map();

  constructor(
    initialData?: AnalyticsData,
    userHistory: Task[] = [],
    keystoneHabits: KeystoneHabit[] = [],
    momentumData: Map<string, MomentumData> = new Map()
  ) {
    this.analyticsData = initialData || this.getDefaultAnalyticsData();
    this.userHistory = userHistory;
    this.keystoneHabits = keystoneHabits;
    this.momentumData = momentumData;
  }

  /**
   * Obtient les données analytiques par défaut
   */
  private getDefaultAnalyticsData(): AnalyticsData {
    return {
      totalTasksGenerated: 0,
      totalTasksCompleted: 0,
      highImpactTasksGenerated: 0,
      highImpactTasksCompleted: 0,
      keystoneHabitsGenerated: 0,
      keystoneHabitsCompleted: 0,
      overallCompletionRate: 0,
      highImpactCompletionRate: 0,
      keystoneHabitCompletionRate: 0,
      sevenDayCompletionRate: 0,
      sevenDayHighImpactRate: 0,
      shuffleCount: 0,
      averagePlaylistSize: 0,
      focusScoreImprovement: 0
    };
  }

  /**
   * Met à jour les analytics après la génération d'une playlist
   */
  updateAfterPlaylistGeneration(tasks: Task[], isHighImpact: (task: Task) => boolean, isKeystoneHabit: (task: Task) => boolean): void {
    // Mettre à jour les compteurs de tâches générées
    this.analyticsData.totalTasksGenerated += tasks.length;
    this.analyticsData.highImpactTasksGenerated += tasks.filter(task => isHighImpact(task)).length;
    this.analyticsData.keystoneHabitsGenerated += tasks.filter(task => isKeystoneHabit(task)).length;
    
    // Mettre à jour la taille moyenne de playlist
    this.updateAveragePlaylistSize(tasks.length);
    
    // Mettre à jour les données quotidiennes
    this.updateDailyAnalytics(tasks.length, 0, tasks.filter(task => isHighImpact(task)).length, 0, tasks.filter(task => isKeystoneHabit(task)).length, 0, 0);
    
    // Recalculer les taux
    this.recalculateRates();
  }

  /**
   * Met à jour les analytics après l'achèvement d'une tâche
   */
  updateAfterTaskCompletion(task: Task, isHighImpact: (task: Task) => boolean, isKeystoneHabit: (task: Task) => boolean): void {
    // Mettre à jour les compteurs de tâches achevées
    this.analyticsData.totalTasksCompleted += 1;
    
    if (isHighImpact(task)) {
      this.analyticsData.highImpactTasksCompleted += 1;
    }
    
    if (isKeystoneHabit(task)) {
      this.analyticsData.keystoneHabitsCompleted += 1;
    }
    
    // Mettre à jour les données quotidiennes
    this.updateDailyAnalytics(0, 1, isHighImpact(task) ? 1 : 0, isHighImpact(task) ? 1 : 0, isKeystoneHabit(task) ? 1 : 0, isKeystoneHabit(task) ? 1 : 0, 0);
    
    // Recalculer les taux
    this.recalculateRates();
  }

  /**
   * Met à jour les analytics après un shuffle
   */
  updateAfterShuffle(): void {
    this.analyticsData.shuffleCount += 1;
    
    // Mettre à jour les données quotidiennes
    this.updateDailyAnalytics(0, 0, 0, 0, 0, 0, 1);
  }

  /**
   * Met à jour le focus score
   */
  updateFocusScore(oldScore: number, newScore: number): void {
    this.analyticsData.focusScoreImprovement += (newScore - oldScore);
  }

  /**
   * Met à jour la taille moyenne de playlist
   */
  private updateAveragePlaylistSize(currentSize: number): void {
    // Pour simplifier, nous utilisons une moyenne simple
    // Dans une implémentation réelle, cela serait plus sophistiqué
    const totalPlaylists = this.getTotalPlaylistCount();
    if (totalPlaylists > 0) {
      this.analyticsData.averagePlaylistSize = (
        (this.analyticsData.averagePlaylistSize * (totalPlaylists - 1)) + currentSize
      ) / totalPlaylists;
    } else {
      this.analyticsData.averagePlaylistSize = currentSize;
    }
  }

  /**
   * Met à jour les données analytiques quotidiennes
   */
  private updateDailyAnalytics(
    tasksGenerated: number,
    tasksCompleted: number,
    highImpactTasksGenerated: number,
    highImpactTasksCompleted: number,
    keystoneHabitsGenerated: number,
    keystoneHabitsCompleted: number,
    shuffleCount: number
  ): void {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const todayData = this.dailyAnalytics.get(today) || {
      date: today,
      tasksGenerated: 0,
      tasksCompleted: 0,
      highImpactTasksGenerated: 0,
      highImpactTasksCompleted: 0,
      keystoneHabitsGenerated: 0,
      keystoneHabitsCompleted: 0,
      shuffleCount: 0,
      focusScore: 0
    };
    
    todayData.tasksGenerated += tasksGenerated;
    todayData.tasksCompleted += tasksCompleted;
    todayData.highImpactTasksGenerated += highImpactTasksGenerated;
    todayData.highImpactTasksCompleted += highImpactTasksCompleted;
    todayData.keystoneHabitsGenerated += keystoneHabitsGenerated;
    todayData.keystoneHabitsCompleted += keystoneHabitsCompleted;
    todayData.shuffleCount += shuffleCount;
    
    this.dailyAnalytics.set(today, todayData);
  }

  /**
   * Recalcule tous les taux
   */
  private recalculateRates(): void {
    // Taux global d'achèvement
    if (this.analyticsData.totalTasksGenerated > 0) {
      this.analyticsData.overallCompletionRate = 
        (this.analyticsData.totalTasksCompleted / this.analyticsData.totalTasksGenerated) * 100;
    }
    
    // Taux d'achèvement des tâches high-impact
    if (this.analyticsData.highImpactTasksGenerated > 0) {
      this.analyticsData.highImpactCompletionRate = 
        (this.analyticsData.highImpactTasksCompleted / this.analyticsData.highImpactTasksGenerated) * 100;
    }
    
    // Taux d'achèvement des keystone habits
    if (this.analyticsData.keystoneHabitsGenerated > 0) {
      this.analyticsData.keystoneHabitCompletionRate = 
        (this.analyticsData.keystoneHabitsCompleted / this.analyticsData.keystoneHabitsGenerated) * 100;
    }
    
    // Taux sur 7 jours
    this.calculateSevenDayRates();
  }

  /**
   * Calcule les taux sur 7 jours
   */
  private calculateSevenDayRates(): void {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    let totalGenerated = 0;
    let totalCompleted = 0;
    let highImpactGenerated = 0;
    let highImpactCompleted = 0;
    
    this.dailyAnalytics.forEach((data, dateStr) => {
      const date = new Date(dateStr);
      if (date >= sevenDaysAgo) {
        totalGenerated += data.tasksGenerated;
        totalCompleted += data.tasksCompleted;
        highImpactGenerated += data.highImpactTasksGenerated;
        highImpactCompleted += data.highImpactTasksCompleted;
      }
    });
    
    if (totalGenerated > 0) {
      this.analyticsData.sevenDayCompletionRate = (totalCompleted / totalGenerated) * 100;
    }
    
    if (highImpactGenerated > 0) {
      this.analyticsData.sevenDayHighImpactRate = (highImpactCompleted / highImpactGenerated) * 100;
    }
  }

  /**
   * Obtient le nombre total de playlists générées
   */
  private getTotalPlaylistCount(): number {
    let count = 0;
    this.dailyAnalytics.forEach(data => {
      // Approximation : chaque playlist contient en moyenne 3 tâches
      count += Math.ceil(data.tasksGenerated / 3);
    });
    return count;
  }

  /**
   * Obtient toutes les données analytiques
   */
  getAnalyticsData(): AnalyticsData {
    return { ...this.analyticsData };
  }

  /**
   * Obtient les données analytiques quotidiennes
   */
  getDailyAnalytics(): DailyAnalytics[] {
    return Array.from(this.dailyAnalytics.values());
  }

  /**
   * Obtient les données analytiques pour une date spécifique
   */
  getDailyAnalyticsForDate(date: string): DailyAnalytics | null {
    return this.dailyAnalytics.get(date) || null;
  }

  /**
   * Obtient les statistiques KPI essentielles
   */
  getKPIs(): {
    completionRate: number;
    highImpactRate: number;
    shuffleRate: number;
    focusScoreImprovement: number;
  } {
    return {
      completionRate: this.analyticsData.overallCompletionRate,
      highImpactRate: this.analyticsData.highImpactCompletionRate,
      shuffleRate: this.analyticsData.shuffleCount,
      focusScoreImprovement: this.analyticsData.focusScoreImprovement
    };
  }

  /**
   * Vérifie si les objectifs sont atteints
   */
  checkGoals(): {
    highImpactGoalAchieved: boolean;
    shuffleGoalAchieved: boolean;
  } {
    // Objectif : >70% de completion high-impact sur 7 jours
    const highImpactGoalAchieved = this.analyticsData.sevenDayHighImpactRate > 70;
    
    // Objectif : <20% de shuffle
    const totalActions = this.analyticsData.totalTasksGenerated + this.analyticsData.shuffleCount;
    const shuffleRate = totalActions > 0 ? (this.analyticsData.shuffleCount / totalActions) * 100 : 0;
    const shuffleGoalAchieved = shuffleRate < 20;
    
    return {
      highImpactGoalAchieved,
      shuffleGoalAchieved
    };
  }

  /**
   * Réinitialise les analytics (pour les tests)
   */
  reset(): void {
    this.analyticsData = this.getDefaultAnalyticsData();
    this.dailyAnalytics.clear();
  }
}