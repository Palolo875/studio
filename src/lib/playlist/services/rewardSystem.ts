/**
 * Service de système de récompenses pour l'algorithme de playlist SOTA
 * Gamifie l'expérience utilisateur pour augmenter la motivation
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

export interface Reward {
  id: string;
  name: string;
  description: string;
  points: number;
  type: 'completion' | 'streak' | 'milestone' | 'achievement';
  unlocked: boolean;
  unlockedAt?: string;
  requiredForUnlock?: string; // ID de la récompense requise
}

export interface UserProgress {
  totalPoints: number;
  streakDays: number;
  lastStreakDate?: string;
  completedTasks: number;
  highImpactTasks: number;
  keystoneHabitsCompleted: number;
}

export class RewardSystem {
  private rewards: Map<string, Reward> = new Map();
  private userProgress: UserProgress;
  private unlockHistory: string[] = [];

  constructor(initialProgress?: UserProgress) {
    this.userProgress = initialProgress || {
      totalPoints: 0,
      streakDays: 0,
      completedTasks: 0,
      highImpactTasks: 0,
      keystoneHabitsCompleted: 0
    };
    
    this.initializeRewards();
  }

  /**
   * Initialise toutes les récompenses disponibles
   */
  private initializeRewards(): void {
    const baseRewards: Reward[] = [
      // Récompenses de complétion
      {
        id: 'first-task',
        name: 'Première Tâche',
        description: 'Achevez votre première tâche',
        points: 10,
        type: 'completion',
        unlocked: false
      },
      {
        id: 'ten-tasks',
        name: 'Débutant Productif',
        description: 'Achevez 10 tâches',
        points: 50,
        type: 'milestone',
        unlocked: false,
        requiredForUnlock: 'first-task'
      },
      {
        id: 'fifty-tasks',
        name: 'Producteur Confirmé',
        description: 'Achevez 50 tâches',
        points: 100,
        type: 'milestone',
        unlocked: false,
        requiredForUnlock: 'ten-tasks'
      },
      {
        id: 'hundred-tasks',
        name: 'Maître de la Productivité',
        description: 'Achevez 100 tâches',
        points: 200,
        type: 'milestone',
        unlocked: false,
        requiredForUnlock: 'fifty-tasks'
      },

      // Récompenses de série
      {
        id: 'three-day-streak',
        name: 'Consistance',
        description: 'Maintenez une série de 3 jours consécutifs',
        points: 30,
        type: 'streak',
        unlocked: false
      },
      {
        id: 'seven-day-streak',
        name: 'Discipline',
        description: 'Maintenez une série de 7 jours consécutifs',
        points: 100,
        type: 'streak',
        unlocked: false,
        requiredForUnlock: 'three-day-streak'
      },
      {
        id: 'fourteen-day-streak',
        name: 'Maître de la Discipline',
        description: 'Maintenez une série de 14 jours consécutifs',
        points: 200,
        type: 'streak',
        unlocked: false,
        requiredForUnlock: 'seven-day-streak'
      },

      // Récompenses d'habitudes clés
      {
        id: 'first-keystone',
        name: 'Habitude Clé',
        description: 'Achevez votre première habitude clé',
        points: 25,
        type: 'completion',
        unlocked: false
      },
      {
        id: 'weekly-keystone',
        name: 'Routine Établie',
        description: 'Achevez une habitude clé 5 fois en une semaine',
        points: 75,
        type: 'milestone',
        unlocked: false,
        requiredForUnlock: 'first-keystone'
      },

      // Récompenses d'impact élevé
      {
        id: 'first-high-impact',
        name: 'Focus sur l\'Essentiel',
        description: 'Achevez votre première tâche à haut impact',
        points: 20,
        type: 'completion',
        unlocked: false
      },
      {
        id: 'five-high-impact',
        name: 'Chasseur d\'Impact',
        description: 'Achevez 5 tâches à haut impact',
        points: 100,
        type: 'milestone',
        unlocked: false,
        requiredForUnlock: 'first-high-impact'
      },

      // Récompenses d'achievements spéciaux
      {
        id: 'early-bird',
        name: 'Oiseau Matinal',
        description: 'Achevez 3 tâches avant 9h',
        points: 40,
        type: 'achievement',
        unlocked: false
      },
      {
        id: 'night-owl',
        name: 'Oiseau de Nuit',
        description: 'Achevez 3 tâches après 21h',
        points: 40,
        type: 'achievement',
        unlocked: false
      },
      {
        id: 'balanced-week',
        name: 'Semaine Équilibrée',
        description: 'Achevez des tâches tous les jours de la semaine',
        points: 150,
        type: 'achievement',
        unlocked: false
      },
      {
        id: 'deep-work-session',
        name: 'Session de Deep Work',
        description: 'Achevez une session de 90 minutes sans interruption',
        points: 60,
        type: 'achievement',
        unlocked: false
      }
    ];

    baseRewards.forEach(reward => {
      this.rewards.set(reward.id, reward);
    });
  }

  /**
   * Met à jour la progression de l'utilisateur après l'achèvement d'une tâche
   */
  updateProgressAfterTaskCompletion(task: Task, isKeystoneHabit: boolean = false, isHighImpact: boolean = false): void {
    // Incrémenter le compteur de tâches achevées
    this.userProgress.completedTasks += 1;
    
    // Points pour l'achèvement de tâche
    this.userProgress.totalPoints += 5;
    
    // Si c'est une habitude clé
    if (isKeystoneHabit) {
      this.userProgress.keystoneHabitsCompleted += 1;
      this.userProgress.totalPoints += 10;
    }
    
    // Si c'est une tâche à haut impact
    if (isHighImpact) {
      this.userProgress.highImpactTasks += 1;
      this.userProgress.totalPoints += 15;
    }
    
    // Mettre à jour la série
    this.updateStreak();
    
    // Vérifier les récompenses débloquées
    this.checkUnlockedRewards();
  }

  /**
   * Met à jour la série de jours consécutifs
   */
  private updateStreak(): void {
    const today = new Date().toDateString();
    
    if (!this.userProgress.lastStreakDate) {
      // Première utilisation
      this.userProgress.streakDays = 1;
      this.userProgress.lastStreakDate = today;
      return;
    }
    
    const lastDate = new Date(this.userProgress.lastStreakDate);
    const currentDate = new Date(today);
    const timeDifference = currentDate.getTime() - lastDate.getTime();
    const dayDifference = timeDifference / (1000 * 3600 * 24);
    
    if (dayDifference === 1) {
      // Jour consécutif
      this.userProgress.streakDays += 1;
    } else if (dayDifference > 1) {
      // Série cassée
      this.userProgress.streakDays = 1;
    }
    // Si dayDifference === 0, c'est le même jour, donc on ne change rien
    
    this.userProgress.lastStreakDate = today;
  }

  /**
   * Vérifie quelles récompenses ont été débloquées
   */
  private checkUnlockedRewards(): void {
    const unlockedRewards: string[] = [];
    
    this.rewards.forEach(reward => {
      if (!reward.unlocked && this.isRewardUnlocked(reward)) {
        reward.unlocked = true;
        reward.unlockedAt = new Date().toISOString();
        unlockedRewards.push(reward.id);
        this.userProgress.totalPoints += reward.points;
      }
    });
    
    // Ajouter aux historiques de déblocage
    this.unlockHistory.push(...unlockedRewards);
  }

  /**
   * Vérifie si une récompense spécifique est débloquée
   */
  private isRewardUnlocked(reward: Reward): boolean {
    // Vérifier si la récompense requise est débloquée
    if (reward.requiredForUnlock) {
      const requiredReward = this.rewards.get(reward.requiredForUnlock);
      if (!requiredReward || !requiredReward.unlocked) {
        return false;
      }
    }
    
    // Vérifier les conditions spécifiques à chaque type de récompense
    switch (reward.id) {
      case 'first-task':
        return this.userProgress.completedTasks >= 1;
        
      case 'ten-tasks':
        return this.userProgress.completedTasks >= 10;
        
      case 'fifty-tasks':
        return this.userProgress.completedTasks >= 50;
        
      case 'hundred-tasks':
        return this.userProgress.completedTasks >= 100;
        
      case 'three-day-streak':
        return this.userProgress.streakDays >= 3;
        
      case 'seven-day-streak':
        return this.userProgress.streakDays >= 7;
        
      case 'fourteen-day-streak':
        return this.userProgress.streakDays >= 14;
        
      case 'first-keystone':
        return this.userProgress.keystoneHabitsCompleted >= 1;
        
      case 'weekly-keystone':
        return this.userProgress.keystoneHabitsCompleted >= 5;
        
      case 'first-high-impact':
        return this.userProgress.highImpactTasks >= 1;
        
      case 'five-high-impact':
        return this.userProgress.highImpactTasks >= 5;
        
      case 'early-bird':
        // Cette condition nécessiterait des données horaires
        return false;
        
      case 'night-owl':
        // Cette condition nécessiterait des données horaires
        return false;
        
      case 'balanced-week':
        // Cette condition nécessiterait des données journalières
        return false;
        
      case 'deep-work-session':
        // Cette condition nécessiterait des données de session
        return false;
        
      default:
        return false;
    }
  }

  /**
   * Obtient toutes les récompenses
   */
  getAllRewards(): Reward[] {
    return Array.from(this.rewards.values());
  }

  /**
   * Obtient les récompenses débloquées
   */
  getUnlockedRewards(): Reward[] {
    return Array.from(this.rewards.values()).filter(reward => reward.unlocked);
  }

  /**
   * Obtient les récompenses encore verrouillées
   */
  getLockedRewards(): Reward[] {
    return Array.from(this.rewards.values()).filter(reward => !reward.unlocked);
  }

  /**
   * Obtient la progression de l'utilisateur
   */
  getUserProgress(): UserProgress {
    return { ...this.userProgress }; // Retourner une copie
  }

  /**
   * Obtient l'historique des déblocages
   */
  getUnlockHistory(): string[] {
    return [...this.unlockHistory]; // Retourner une copie
  }

  /**
   * Obtient les statistiques de récompenses
   */
  getRewardStatistics(): {
    totalRewards: number;
    unlockedRewards: number;
    lockedRewards: number;
    completionRate: number;
    pointsToNextReward?: number;
  } {
    const allRewards = Array.from(this.rewards.values());
    const unlockedCount = allRewards.filter(r => r.unlocked).length;
    const totalCount = allRewards.length;
    const completionRate = totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0;
    
    // Trouver la prochaine récompense verrouillée avec le moins de conditions
    const nextReward = this.getNextUnlockableReward();
    const pointsToNextReward = nextReward 
      ? nextReward.points 
      : undefined;
    
    return {
      totalRewards: totalCount,
      unlockedRewards: unlockedCount,
      lockedRewards: totalCount - unlockedCount,
      completionRate,
      pointsToNextReward
    };
  }

  /**
   * Trouve la prochaine récompense déverrouillable
   */
  private getNextUnlockableReward(): Reward | null {
    const lockedRewards = Array.from(this.rewards.values()).filter(r => !r.unlocked);
    
    // Trier par nombre de points requis (moins c'est mieux pour commencer)
    const sortedRewards = lockedRewards.sort((a, b) => {
      // Récompenses sans prérequis en premier
      if (!a.requiredForUnlock && b.requiredForUnlock) return -1;
      if (a.requiredForUnlock && !b.requiredForUnlock) return 1;
      
      // Ensuite, trier par points
      return a.points - b.points;
    });
    
    // Retourner la première récompense déverrouillable
    for (const reward of sortedRewards) {
      if (this.isRewardUnlocked(reward)) {
        return reward;
      }
    }
    
    return null;
  }

  /**
   * Réinitialise la progression (pour les tests ou nouveaux cycles)
   */
  resetProgress(): void {
    this.userProgress = {
      totalPoints: 0,
      streakDays: 0,
      completedTasks: 0,
      highImpactTasks: 0,
      keystoneHabitsCompleted: 0
    };
    
    this.rewards.forEach(reward => {
      reward.unlocked = false;
      delete reward.unlockedAt;
    });
    
    this.unlockHistory = [];
  }
}