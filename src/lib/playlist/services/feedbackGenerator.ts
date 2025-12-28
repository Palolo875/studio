/**
 * Service de génération de feedback intelligent pour l'algorithme de playlist SOTA
 * Fournit des insights personnalisés basés sur les performances et patterns
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

export interface FeedbackMessage {
  type: 'success' | 'warning' | 'info' | 'motivation';
  title: string;
  message: string;
  priority: number; // 1-5, 5 étant la plus haute priorité
  actionable: boolean;
  suggestedAction?: string;
}

export class FeedbackGenerator {
  private userHistory: Task[] = [];
  private keystoneHabits: KeystoneHabit[] = [];
  private momentumData: Map<string, MomentumData> = new Map();

  constructor(
    userHistory: Task[] = [],
    keystoneHabits: KeystoneHabit[] = [],
    momentumData: Map<string, MomentumData> = new Map()
  ) {
    this.userHistory = userHistory;
    this.keystoneHabits = keystoneHabits;
    this.momentumData = momentumData;
  }

  /**
   * Génère des messages de feedback basés sur les performances récentes
   */
  generatePerformanceFeedback(): FeedbackMessage[] {
    const feedback: FeedbackMessage[] = [];
    
    // Analyser les tendances récentes
    const recentTasks = this.getRecentTasks(7); // 7 derniers jours
    const completedTasks = recentTasks.filter(task => task.completedAt);
    
    if (completedTasks.length > 0) {
      // Calculer le taux d'achèvement
      const completionRate = completedTasks.length / recentTasks.length;
      
      if (completionRate >= 0.8) {
        feedback.push({
          type: 'success',
          title: 'Excellente Productivité !',
          message: `Vous avez achevé ${Math.round(completionRate * 100)}% de vos tâches cette semaine. Continuez ainsi !`,
          priority: 5,
          actionable: false
        });
      } else if (completionRate < 0.5) {
        feedback.push({
          type: 'warning',
          title: 'Besoin de Motivation ?',
          message: `Votre taux d'achèvement est de ${Math.round(completionRate * 100)}%. Essayez de vous concentrer sur moins de tâches.`,
          priority: 4,
          actionable: true,
          suggestedAction: 'Réduisez votre liste de tâches à 3 maximum par jour'
        });
      }
      
      // Analyser l'efficacité
      const efficiencyScore = this.calculateAverageEfficiency(completedTasks);
      if (efficiencyScore > 80) {
        feedback.push({
          type: 'success',
          title: 'Très Efficace !',
          message: 'Vous terminez vos tâches plus rapidement que prévu en moyenne.',
          priority: 4,
          actionable: false
        });
      } else if (efficiencyScore < 40) {
        feedback.push({
          type: 'info',
          title: 'Améliorez Votre Estimation',
          message: 'Vos tâches prennent souvent plus de temps que prévu. Revoyez vos estimations.',
          priority: 3,
          actionable: true,
          suggestedAction: 'Augmentez vos estimations de 25% pour plus de réalisme'
        });
      }
    }
    
    return feedback.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Génère des suggestions basées sur les keystone habits
   */
  generateKeystoneSuggestions(): FeedbackMessage[] {
    const feedback: FeedbackMessage[] = [];
    const today = new Date().getDay();
    
    // Vérifier si un keystone habit devrait être inclus aujourd'hui
    const todayHabit = this.keystoneHabits.find(habit => habit.preferredDay === today);
    
    if (todayHabit) {
      const isCompleted = this.isKeystoneHabitCompletedToday(todayHabit);
      
      if (!isCompleted) {
        feedback.push({
          type: 'motivation',
          title: `Habitude Clé du Jour : ${todayHabit.name}`,
          message: `N'oubliez pas votre habitude clé pour aujourd'hui : ${todayHabit.pattern}.`,
          priority: 5,
          actionable: true,
          suggestedAction: `Planifiez ${todayHabit.name} dans votre emploi du temps d'aujourd'hui`
        });
      } else {
        feedback.push({
          type: 'success',
          title: 'Habitude Clé Accomplie !',
          message: `Bravo ! Vous avez déjà accompli votre habitude clé du jour : ${todayHabit.name}.`,
          priority: 4,
          actionable: false
        });
      }
    }
    
    // Suggestion basée sur la fréquence des keystone habits
    const infrequentHabits = this.keystoneHabits.filter(habit => habit.frequency < 0.3);
    if (infrequentHabits.length > 0) {
      feedback.push({
        type: 'info',
        title: 'Renforcez Vos Habitudes',
        message: `Certaines habitudes clés sont négligées : ${infrequentHabits.map(h => h.name).join(', ')}.`,
        priority: 3,
        actionable: true,
        suggestedAction: 'Planifiez ces habitudes au moins 2 fois par semaine'
      });
    }
    
    return feedback.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Génère des insights basés sur le momentum
   */
  generateMomentumInsights(): FeedbackMessage[] {
    const feedback: FeedbackMessage[] = [];
    
    // Analyser le momentum global
    const momentumStats = this.calculateMomentumStatistics();
    
    if (momentumStats.averageEfficiency > 75) {
      feedback.push({
        type: 'success',
        title: 'Momentum Positif !',
        message: 'Vous êtes dans une période de forte productivité. Profitez-en !',
        priority: 4,
        actionable: false
      });
    } else if (momentumStats.averageEfficiency < 40) {
      feedback.push({
        type: 'warning',
        title: 'Difficultés de Concentration',
        message: 'Votre productivité est faible en ce moment. Prenez une pause ou changez de contexte.',
        priority: 4,
        actionable: true,
        suggestedAction: 'Prenez une pause de 15 minutes ou changez d\'environnement'
      });
    }
    
    // Identifier les tâches à haut momentum
    const highMomentumTasks = this.getHighMomentumTasks();
    if (highMomentumTasks.length > 0) {
      feedback.push({
        type: 'info',
        title: 'Tâches à Haut Momentum',
        message: `Vous excellez dans : ${highMomentumTasks.slice(0, 3).map(t => t.name || 'Tâche sans nom').join(', ')}.`,
        priority: 3,
        actionable: true,
        suggestedAction: 'Planifiez ces types de tâches lorsque vous êtes le plus énergique'
      });
    }
    
    return feedback.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Génère des recommandations personnalisées
   */
  generatePersonalizedRecommendations(): FeedbackMessage[] {
    const feedback: FeedbackMessage[] = [];
    
    // Analyser les patterns de productivité
    const productivityPattern = this.analyzeProductivityPattern();
    
    switch (productivityPattern) {
      case 'early-bird':
        feedback.push({
          type: 'info',
          title: 'Profil Matinal',
          message: 'Vous êtes plus productif le matin. Planifiez vos tâches importantes tôt.',
          priority: 3,
          actionable: true,
          suggestedAction: 'Déplacez vos tâches à haut impact le matin'
        });
        break;
        
      case 'night-owl':
        feedback.push({
          type: 'info',
          title: 'Profil Nocturne',
          message: 'Vous êtes plus productif en soirée. Adaptez votre emploi du temps.',
          priority: 3,
          actionable: true,
          suggestedAction: 'Planifiez vos tâches créatives en soirée'
        });
        break;
        
      case 'consistent':
        feedback.push({
          type: 'success',
          title: 'Productivité Stable',
          message: 'Votre productivité est constante tout au long de la journée.',
          priority: 3,
          actionable: false
        });
        break;
    }
    
    // Recommandations basées sur les tags
    const tagRecommendations = this.generateTagBasedRecommendations();
    feedback.push(...tagRecommendations);
    
    return feedback.sort((a, b) => b.priority - a.priority);
  }

  private analyzeProductivityPattern(): 'early-bird' | 'night-owl' | 'consistent' {
    const completed = this.userHistory.filter(t => t.completedAt);
    if (completed.length < 5) return 'consistent';

    let morning = 0;
    let evening = 0;

    for (const task of completed) {
      const ts = task.completedAt || task.lastAccessed;
      if (!ts) continue;
      const d = new Date(ts);
      if (Number.isNaN(d.getTime())) continue;

      const hour = d.getHours();
      if (hour >= 6 && hour < 12) morning += 1;
      else if (hour >= 18 || hour < 2) evening += 1;
    }

    const considered = morning + evening;
    if (considered === 0) return 'consistent';

    const morningRatio = morning / considered;
    const eveningRatio = evening / considered;
    if (morningRatio >= 0.6) return 'early-bird';
    if (eveningRatio >= 0.6) return 'night-owl';
    return 'consistent';
  }

  /**
   * Génère tous les feedbacks combinés
   */
  generateAllFeedback(): FeedbackMessage[] {
    const allFeedback = [
      ...this.generatePerformanceFeedback(),
      ...this.generateKeystoneSuggestions(),
      ...this.generateMomentumInsights(),
      ...this.generatePersonalizedRecommendations()
    ];
    
    // Supprimer les doublons et trier par priorité
    const uniqueFeedback = this.removeDuplicateFeedback(allFeedback);
    return uniqueFeedback.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Met à jour les données pour générer de nouveaux feedbacks
   */
  updateData(
    userHistory: Task[],
    keystoneHabits: KeystoneHabit[],
    momentumData: Map<string, MomentumData>
  ): void {
    this.userHistory = userHistory;
    this.keystoneHabits = keystoneHabits;
    this.momentumData = momentumData;
  }

  // Méthodes utilitaires privées
  private getRecentTasks(days: number): Task[] {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return this.userHistory.filter(task => {
      if (task.lastAccessed) {
        const taskDate = new Date(task.lastAccessed);
        return taskDate >= cutoffDate;
      }
      return false;
    });
  }

  private calculateAverageEfficiency(tasks: Task[]): number {
    if (tasks.length === 0) return 50;
    
    const efficiencyScores = tasks.map(task => {
      if (task.estimatedDuration && task.completedAt && task.lastAccessed) {
        const estimated = task.estimatedDuration;
        const actual = (new Date(task.completedAt).getTime() - new Date(task.lastAccessed).getTime()) / (1000 * 60);
        
        // Plus c'est bas, mieux c'est (efficacité)
        return Math.max(0, Math.min(100, (estimated / actual) * 50));
      }
      return 50; // Score neutre par défaut
    });
    
    const total = efficiencyScores.reduce((sum, score) => sum + score, 0);
    return total / efficiencyScores.length;
  }

  private isKeystoneHabitCompletedToday(habit: KeystoneHabit): boolean {
    const today = new Date().toDateString();
    
    return this.userHistory.some(task => {
      if (task.completedAt && task.tags) {
        const completionDate = new Date(task.completedAt).toDateString();
        return completionDate === today && task.tags.includes(habit.name.toLowerCase());
      }
      return false;
    });
  }

  private calculateMomentumStatistics(): { averageEfficiency: number } {
    const allData = Array.from(this.momentumData.values());
    
    if (allData.length === 0) return { averageEfficiency: 50 };
    
    const totalEfficiency = allData.reduce((sum, data) => sum + data.efficiencyScore, 0);
    const averageEfficiency = totalEfficiency / allData.length;
    
    return { averageEfficiency };
  }

  private getHighMomentumTasks(): Task[] {
    const highMomentumIds = Array.from(this.momentumData.entries())
      .filter(([_, data]) => data.efficiencyScore > 80)
      .map(([taskId, _]) => taskId);
    
    return this.userHistory.filter(task => highMomentumIds.includes(task.id) && task.name);
  }

  private generateTagBasedRecommendations(): FeedbackMessage[] {
    const feedback: FeedbackMessage[] = [];
    const tagCounts = new Map<string, number>();

    this.userHistory.forEach(task => {
      if (task.tags) {
        task.tags.forEach(tag => {
          const count = tagCounts.get(tag) || 0;
          tagCounts.set(tag, count + 1);
        });
      }
    });

    const sortedTags = Array.from(tagCounts.entries()).sort((a, b) => b[1] - a[1]);

    if (sortedTags.length > 0) {
      const mostFrequentTag = sortedTags[0][0];
      feedback.push({
        type: 'info',
        title: 'Domaine de Prédilection',
        message: `Vous créez souvent des tâches liées à "${mostFrequentTag}".`,
        priority: 2,
        actionable: true,
        suggestedAction: `Continuez à développer vos compétences dans "${mostFrequentTag}"`,
      });
    }

    return feedback;
  }

  private removeDuplicateFeedback(feedback: FeedbackMessage[]): FeedbackMessage[] {
    const seenTitles: Set<string> = new Set();
    const uniqueFeedback: FeedbackMessage[] = [];
    
    feedback.forEach(item => {
      if (!seenTitles.has(item.title)) {
        seenTitles.add(item.title);
        uniqueFeedback.push(item);
      }
    });
    
    return uniqueFeedback;
  }
}