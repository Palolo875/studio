// Système de feedback explicite - Phase 3.7
import { BrainDecision } from './brainContracts';
import { createLogger } from '@/lib/logger';

const logger = createLogger('ExplicitFeedback');

/**
 * Types de feedback utilisateur
 */
export type FeedbackAnswer = "YES" | "NO" | "PARTIALLY";

/**
 * Feedback utilisateur
 */
export interface UserFeedback {
  id: string;
  contextId: string; // ID de la décision ou de l'ajustement concerné
  question: string;
  answer: FeedbackAnswer;
  optionalComment?: string;
  timestamp: Date;
  userId?: string;
}

/**
 * Gestionnaire de feedback explicite
 */
export class ExplicitFeedbackManager {
  private feedbacks: UserFeedback[] = [];
  private feedbackCooldown: number; // Temps minimum entre deux feedbacks (en millisecondes)
  private lastFeedbackTimestamp: number = 0;
  
  constructor(feedbackCooldownMinutes: number = 60) {
    this.feedbackCooldown = feedbackCooldownMinutes * 60 * 1000;
  }
  
  /**
   * Collecte un feedback utilisateur
   */
  collectFeedback(feedback: Omit<UserFeedback, 'id' | 'timestamp'>): boolean {
    const now = Date.now();
    
    // Vérifier le cooldown
    if (now - this.lastFeedbackTimestamp < this.feedbackCooldown) {
      logger.debug('Feedback refusé - cooldown actif');
      return false;
    }
    
    // Créer le feedback complet
    const fullFeedback: UserFeedback = {
      ...feedback,
      id: `feedback_${Date.now()}`,
      timestamp: new Date()
    };
    
    // Ajouter à la liste
    this.feedbacks.push(fullFeedback);
    this.lastFeedbackTimestamp = now;
    
    logger.info('Feedback collecté', { question: feedback.question, answer: feedback.answer });
    return true;
  }
  
  /**
   * Pose une question de feedback à l'utilisateur
   */
  askFeedback(question: string, contextId: string): boolean {
    // Vérifier si une question similaire a déjà été posée récemment
    const recentFeedback = this.feedbacks.find(f => 
      f.contextId === contextId && 
      f.question === question &&
      Date.now() - f.timestamp.getTime() < this.feedbackCooldown
    );
    
    if (recentFeedback) {
      logger.debug('Question déjà posée récemment');
      return false;
    }
    
    // Dans une vraie application, cela afficherait une interface utilisateur
    // Pour l'instant, nous simulons la collecte
    logger.debug('Question posée', { question, contextId });
    return true;
  }
  
  /**
   * Obtient tous les feedbacks
   */
  getAllFeedbacks(): UserFeedback[] {
    return [...this.feedbacks];
  }
  
  /**
   * Obtient les feedbacks pour un contexte spécifique
   */
  getFeedbacksByContext(contextId: string): UserFeedback[] {
    return this.feedbacks.filter(f => f.contextId === contextId);
  }
  
  /**
   * Analyse les feedbacks pour en tirer des insights
   */
  analyzeFeedbacks(): Record<string, any> {
    if (this.feedbacks.length === 0) {
      return { message: "Aucun feedback disponible" };
    }
    
    // Compter les réponses
    const answerCounts: Record<FeedbackAnswer, number> = {
      "YES": 0,
      "NO": 0,
      "PARTIALLY": 0
    };
    
    for (const feedback of this.feedbacks) {
      answerCounts[feedback.answer]++;
    }
    
    // Calculer les pourcentages
    const total = this.feedbacks.length;
    const percentages: Record<FeedbackAnswer, number> = {
      "YES": Math.round((answerCounts.YES / total) * 100),
      "NO": Math.round((answerCounts.NO / total) * 100),
      "PARTIALLY": Math.round((answerCounts.PARTIALLY / total) * 100)
    };
    
    return {
      totalFeedbacks: total,
      answerDistribution: answerCounts,
      percentages,
      mostCommonAnswer: Object.keys(answerCounts).reduce((a, b) => 
        answerCounts[a as FeedbackAnswer] > answerCounts[b as FeedbackAnswer] ? a : b
      )
    };
  }
  
  /**
   * Réinitialise les feedbacks
   */
  reset(): void {
    this.feedbacks = [];
    this.lastFeedbackTimestamp = 0;
  }
}

// Instance singleton pour la gestion du feedback
export const feedbackManager = new ExplicitFeedbackManager();

/**
 * Questions de feedback standard
 */
export const STANDARD_FEEDBACK_QUESTIONS = {
  SUGGESTION_HELPFUL: "Cette suggestion t'a-t-elle aidé ?",
  COST_ESTIMATE_REALISTIC: "Le coût estimé était-il réaliste ?",
  DECISION_UNDERSTANDABLE: "La décision du système était-elle compréhensible ?",
  OVERRIDE_EFFECTIVE: "L'override a-t-il eu l'effet escompté ?"
};

/**
 * Pose une question de feedback standard
 */
export function askStandardFeedback(questionKey: keyof typeof STANDARD_FEEDBACK_QUESTIONS, contextId: string): boolean {
  const question = STANDARD_FEEDBACK_QUESTIONS[questionKey];
  return feedbackManager.askFeedback(question, contextId);
}

/**
 * Intègre le feedback dans le processus décisionnel
 */
export class FeedbackIntegrator {
  private feedbackManager: ExplicitFeedbackManager;
  
  constructor() {
    this.feedbackManager = feedbackManager;
  }
  
  /**
   * Intègre le feedback pour améliorer les décisions futures
   */
  integrateFeedback(decision: BrainDecision): void {
    // Obtenir les feedbacks liés à cette décision
    const feedbacks = this.feedbackManager.getFeedbacksByContext(decision.id);
    
    if (feedbacks.length === 0) {
      return;
    }
    
    logger.info('Intégration feedbacks', { feedbacksCount: feedbacks.length, decisionId: decision.id });
    
    // Analyser les feedbacks
    const negativeFeedbacks = feedbacks.filter(f => f.answer === "NO" || f.answer === "PARTIALLY");
    
    if (negativeFeedbacks.length > 0) {
      logger.info('Feedbacks négatifs détectés', { negativeFeedbacksCount: negativeFeedbacks.length, decisionId: decision.id });
      
      // Marquer la décision pour révision
      // Dans une implémentation complète, cela déclencherait un processus d'analyse plus approfondi
    }
  }
  
  /**
   * Génère un rapport d'analyse des feedbacks
   */
  generateFeedbackReport(): string {
    const analysis = this.feedbackManager.analyzeFeedbacks();
    
    if (analysis.message) {
      return analysis.message;
    }
    
    let report = "=== RAPPORT D'ANALYSE DES FEEDBACKS ===\n\n";
    report += `Total des feedbacks: ${analysis.totalFeedbacks}\n\n`;
    
    report += "Distribution des réponses:\n";
    for (const [answer, count] of Object.entries(analysis.answerDistribution)) {
      const percentage = analysis.percentages[answer as FeedbackAnswer];
      report += `- ${answer}: ${count} (${percentage}%)\n`;
    }
    
    report += `\nRéponse la plus fréquente: ${analysis.mostCommonAnswer}\n`;
    
    return report;
  }
}