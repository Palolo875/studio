/**
 * Service de détection des keystone habits pour l'algorithme de playlist SOTA
 * Identifie les habitudes clés basées sur les patterns historiques
 */

// Définition minimale du type Task pour éviter les problèmes d'importation
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

export interface KeystoneHabit {
  id: string;
  name: string;
  pattern: string; // Description du pattern détecté
  frequency: number; // Fréquence de l'habitude (0-1)
  preferredDay?: number; // Jour de la semaine préféré (0-6, dimanche-samedi)
  preferredTime?: string; // Moment préféré (matin, après-midi, soir)
  estimatedDuration: number; // Durée estimée en minutes
  energyRequirement: 'low' | 'medium' | 'high'; // Niveau d'énergie requis
}

export interface WeeklyPattern {
  day: number; // 0-6 (dimanche-samedi)
  taskTypes: string[]; // Types de tâches fréquents
  energyLevel: 'low' | 'medium' | 'high'; // Niveau d'énergie typique
  productivityScore: number; // Score de productivité (0-100)
}

export class KeystoneDetector {
  private userHistory: Task[] = [];
  private keystoneHabits: Map<string, KeystoneHabit> = new Map();
  private weeklyPatterns: WeeklyPattern[] = [];

  constructor(userHistory: Task[] = []) {
    this.userHistory = userHistory;
    this.analyzeHistoricalPatterns();
  }

  /**
   * Analyse les patterns historiques pour identifier les keystone habits
   */
  private analyzeHistoricalPatterns(): void {
    this.identifyRecurringTasks();
    this.analyzeWeeklyPatterns();
    this.detectKeystoneHabits();
  }

  /**
   * Identifie les tâches récurrentes qui pourraient être des keystone habits
   */
  private identifyRecurringTasks(): void {
    const taskFrequency: Map<string, { count: number; tasks: Task[] }> = new Map();

    // Compter la fréquence des tâches par tags
    this.userHistory.forEach(task => {
      if (!task.tags || task.tags.length === 0) return;

      task.tags.forEach(tag => {
        const key = tag.toLowerCase();
        const existing = taskFrequency.get(key);
        
        if (existing) {
          existing.count += 1;
          existing.tasks.push(task);
        } else {
          taskFrequency.set(key, { count: 1, tasks: [task] });
        }
      });
    });

    // Identifier les tâches avec une fréquence élevée
    const totalTasks = this.userHistory.length;
    taskFrequency.forEach((data, tag) => {
      const frequency = data.count / totalTasks;
      
      // Si une tâche représente plus de 10% des tâches totales, c'est potentiellement un keystone habit
      if (frequency > 0.10) {
        const habit: KeystoneHabit = {
          id: `keystone-${tag}`,
          name: this.capitalizeFirstLetter(tag),
          pattern: `Tâche récurrente (${Math.round(frequency * 100)}% des tâches)`,
          frequency,
          estimatedDuration: this.calculateAverageDuration(data.tasks),
          energyRequirement: this.determineEnergyRequirement(data.tasks)
        };

        this.keystoneHabits.set(tag, habit);
      }
    });
  }

  /**
   * Analyse les patterns hebdomadaires
   */
  private analyzeWeeklyPatterns(): void {
    const dayData: Map<number, { tasks: Task[]; energyLevels: string[] }> = new Map();

    // Initialiser les données pour chaque jour de la semaine
    for (let i = 0; i < 7; i++) {
      dayData.set(i, { tasks: [], energyLevels: [] });
    }

    // Regrouper les tâches par jour de la semaine
    this.userHistory.forEach(task => {
      if (task.lastAccessed) {
        const date = new Date(task.lastAccessed);
        const dayOfWeek = date.getDay(); // 0-6 (dimanche-samedi)
        
        const dayInfo = dayData.get(dayOfWeek);
        if (dayInfo) {
          dayInfo.tasks.push(task);
          
          // Déterminer le niveau d'énergie requis pour cette tâche
          if (task.effort) {
            dayInfo.energyLevels.push(task.effort);
          }
        }
      }
    });

    // Analyser chaque jour
    dayData.forEach((data, day) => {
      if (data.tasks.length > 0) {
        const taskTypes = this.extractCommonTaskTypes(data.tasks);
        const energyLevel = this.calculateAverageEnergyLevel(data.energyLevels);
        const productivityScore = this.calculateProductivityScore(data.tasks);

        this.weeklyPatterns.push({
          day,
          taskTypes,
          energyLevel,
          productivityScore
        });
      }
    });

    // Trier par score de productivité décroissant
    this.weeklyPatterns.sort((a, b) => b.productivityScore - a.productivityScore);
  }

  /**
   * Détecte les keystone habits spécifiques aux jours
   */
  private detectKeystoneHabits(): void {
    // Pattern spécifique : Mardi = Deep Work
    const tuesdayPattern = this.weeklyPatterns.find(pattern => pattern.day === 2); // Mardi
    if (tuesdayPattern && tuesdayPattern.productivityScore > 70) {
      const deepWorkHabit: KeystoneHabit = {
        id: 'keystone-deep-work',
        name: 'Deep Work',
        pattern: 'Session de travail concentré en milieu de semaine',
        frequency: 1.0,
        preferredDay: 2,
        estimatedDuration: 90, // 90 minutes typiques pour deep work
        energyRequirement: 'high'
      };

      this.keystoneHabits.set('deep-work', deepWorkHabit);
    }

    // Pattern spécifique : Dimanche = Planification
    const sundayPattern = this.weeklyPatterns.find(pattern => pattern.day === 0); // Dimanche
    if (sundayPattern && sundayPattern.taskTypes.some(type => 
      type.includes('plan') || type.includes('organi'))) {
      const planningHabit: KeystoneHabit = {
        id: 'keystone-planning',
        name: 'Planification Hebdomadaire',
        pattern: 'Organisation et planification du travail à venir',
        frequency: 1.0,
        preferredDay: 0,
        estimatedDuration: 60,
        energyRequirement: 'medium'
      };

      this.keystoneHabits.set('planning', planningHabit);
    }
  }

  /**
   * Obtient les keystone habits détectés
   */
  getKeystoneHabits(): KeystoneHabit[] {
    return Array.from(this.keystoneHabits.values());
  }

  /**
   * Obtient les patterns hebdomadaires
   */
  getWeeklyPatterns(): WeeklyPattern[] {
    return this.weeklyPatterns;
  }

  /**
   * Vérifie si un keystone habit doit être inclus aujourd'hui
   */
  shouldIncludeKeystoneHabitToday(): KeystoneHabit | null {
    const today = new Date().getDay(); // 0-6 (dimanche-samedi)
    
    // Trouver un keystone habit associé à aujourd'hui
    for (const habit of this.keystoneHabits.values()) {
      if (habit.preferredDay === today) {
        return habit;
      }
    }

    // Si aucun keystone habit spécifique à aujourd'hui, 
    // retourner le keystone habit avec la fréquence la plus élevée
    const habits = Array.from(this.keystoneHabits.values());
    if (habits.length > 0) {
      return habits.sort((a, b) => b.frequency - a.frequency)[0];
    }

    return null;
  }

  /**
   * Obtient les recommandations de keystone habits pour la journée
   */
  getDailyKeystoneRecommendations(): KeystoneHabit[] {
    const today = new Date().getDay();
    const recommendations: KeystoneHabit[] = [];

    // Ajouter les keystone habits spécifiques au jour
    this.keystoneHabits.forEach(habit => {
      if (habit.preferredDay === today) {
        recommendations.push(habit);
      }
    });

    // Si aucun keystone habit spécifique, ajouter le plus fréquent
    if (recommendations.length === 0) {
      const habits = Array.from(this.keystoneHabits.values());
      if (habits.length > 0) {
        const mostFrequent = habits.sort((a, b) => b.frequency - a.frequency)[0];
        recommendations.push(mostFrequent);
      }
    }

    return recommendations;
  }

  /**
   * Met à jour les patterns après l'ajout de nouvelles tâches
   */
  updateWithNewTasks(newTasks: Task[]): void {
    this.userHistory = [...this.userHistory, ...newTasks];
    this.analyzeHistoricalPatterns(); // Réanalyser avec les nouvelles données
  }

  /**
   * Exporte les patterns détectés pour l'analyse externe
   */
  exportPatterns(): {
    keystoneHabits: KeystoneHabit[];
    weeklyPatterns: WeeklyPattern[];
    statistics: {
      totalHabits: number;
      mostProductiveDay: number | null;
      averageHabitFrequency: number;
    }
  } {
    const mostProductiveDay = this.weeklyPatterns.length > 0 
      ? this.weeklyPatterns[0].day 
      : null;

    const totalFrequency = Array.from(this.keystoneHabits.values())
      .reduce((sum, habit) => sum + habit.frequency, 0);
    
    const averageHabitFrequency = this.keystoneHabits.size > 0 
      ? totalFrequency / this.keystoneHabits.size 
      : 0;

    return {
      keystoneHabits: Array.from(this.keystoneHabits.values()),
      weeklyPatterns: this.weeklyPatterns,
      statistics: {
        totalHabits: this.keystoneHabits.size,
        mostProductiveDay,
        averageHabitFrequency
      }
    };
  }

  // Méthodes utilitaires privées
  private capitalizeFirstLetter(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  private calculateAverageDuration(tasks: Task[]): number {
    if (tasks.length === 0) return 60;
    
    const totalDuration = tasks.reduce((sum, task) => {
      return sum + (task.estimatedDuration || 60);
    }, 0);
    
    return totalDuration / tasks.length;
  }

  private determineEnergyRequirement(tasks: Task[]): 'low' | 'medium' | 'high' {
    const energyCounts = { low: 0, medium: 0, high: 0 };
    
    tasks.forEach(task => {
      if (task.effort === 'S') energyCounts.low++;
      else if (task.effort === 'M') energyCounts.medium++;
      else if (task.effort === 'L') energyCounts.high++;
    });
    
    // Retourner l'énergie la plus fréquente
    if (energyCounts.high >= energyCounts.medium && energyCounts.high >= energyCounts.low) {
      return 'high';
    } else if (energyCounts.medium >= energyCounts.low) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  private extractCommonTaskTypes(tasks: Task[]): string[] {
    const typeCounts: Map<string, number> = new Map();
    
    tasks.forEach(task => {
      if (task.tags) {
        task.tags.forEach(tag => {
          const count = typeCounts.get(tag) || 0;
          typeCounts.set(tag, count + 1);
        });
      }
    });
    
    // Retourner les types les plus fréquents
    return Array.from(typeCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(entry => entry[0]);
  }

  private calculateAverageEnergyLevel(energyLevels: string[]): 'low' | 'medium' | 'high' {
    if (energyLevels.length === 0) return 'medium';
    
    const counts = { S: 0, M: 0, L: 0 };
    
    energyLevels.forEach(level => {
      if (level === 'S') counts.S++;
      else if (level === 'M') counts.M++;
      else if (level === 'L') counts.L++;
    });
    
    // Convertir S/M/L en low/medium/high
    const low = counts.S;
    const medium = counts.M;
    const high = counts.L;
    
    if (high >= medium && high >= low) return 'high';
    else if (medium >= low) return 'medium';
    else return 'low';
  }

  private calculateProductivityScore(tasks: Task[]): number {
    if (tasks.length === 0) return 50;
    
    // Calculer le score basé sur le taux d'achèvement et l'efficacité
    const completedTasks = tasks.filter(task => task.completedAt);
    const completionRate = completedTasks.length / tasks.length;
    
    // Score basé sur le taux d'achèvement (0-70 points)
    let score = completionRate * 70;
    
    // Bonus pour l'efficacité (jusqu'à 30 points supplémentaires)
    if (completedTasks.length > 0) {
      const efficiencyBonus = completedTasks.reduce((bonus, task) => {
        if (task.estimatedDuration && task.completedAt && task.lastAccessed) {
          const estimated = task.estimatedDuration;
          const actual = (new Date(task.completedAt).getTime() - new Date(task.lastAccessed).getTime()) / (1000 * 60);
          
          // Si terminé plus vite que prévu, bonus
          if (actual < estimated) {
            return bonus + Math.min(10, (estimated - actual) / 5); // Max 10 points par tâche
          }
        }
        return bonus;
      }, 0);
      
      score += Math.min(30, efficiencyBonus);
    }
    
    return Math.min(100, score);
  }
}