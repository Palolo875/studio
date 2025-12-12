/**
 * Service d'analyse d'impact pour l'algorithme de playlist SOTA
 * Calcule l'impact des tâches basé sur la valeur perçue et le momentum passé
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
}

export interface ImpactMetrics {
  perceivedValue: number;
  pastMomentum: number;
  estimatedEffort: number;
  calculatedImpact: number;
}

export class ImpactAnalyzer {
  /**
   * Calcule l'impact d'une tâche selon la formule :
   * Impact = (Valeur Perçue + Momentum Passé) / Effort Estimé
   */
  static calculateImpact(task: Task, userHistory: Task[] = []): ImpactMetrics {
    const perceivedValue = this.calculatePerceivedValue(task);
    const pastMomentum = this.calculatePastMomentum(task, userHistory);
    const estimatedEffort = this.estimateEffort(task);
    
    // Éviter la division par zéro
    const calculatedImpact = estimatedEffort > 0 
      ? (perceivedValue + pastMomentum) / estimatedEffort
      : 0;
    
    return {
      perceivedValue,
      pastMomentum,
      estimatedEffort,
      calculatedImpact
    };
  }

  /**
   * Calcule la valeur perçue d'une tâche
   * +20 si taguée "revenu/client" ou liée à l'intention du jour
   */
  private static calculatePerceivedValue(task: Task): number {
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

  /**
   * Calcule le momentum passé basé sur l'historique
   * +15 si des tâches similaires ont été complétées efficacement
   */
  private static calculatePastMomentum(task: Task, userHistory: Task[]): number {
    if (!userHistory.length) return 0;
    
    // Trouver des tâches similaires dans l'historique
    const similarTasks = userHistory.filter(historyTask => {
      if (!historyTask.tags || !task.tags) return false;
      
      // Comparer les tags
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

  /**
   * Estime l'effort requis pour une tâche
   */
  private static estimateEffort(task: Task): number {
    // Utiliser l'effort estimé si disponible
    if (task.estimatedDuration) {
      return task.estimatedDuration;
    }
    
    // Sinon, utiliser l'effort S/M/L
    if (task.effort) {
      const effortMapping = {
        'S': 15,
        'M': 60,
        'L': 120
      };
      return effortMapping[task.effort as keyof typeof effortMapping] || 60;
    }
    
    // Par défaut
    return 60;
  }
}