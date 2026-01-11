/**
 * Mécanisme de récupération du budget cognitif
 * Implémente la gestion et la récupération du budget cognitif avec mécanismes de régénération
 * 
 * CORRECTION DE LA PHASE 2 : Mécanisme de récupération du budget cognitif
 */

// Interface pour le budget cognitif
export interface CognitiveBudget {
  dailyMax: number;        // Budget maximum quotidien (ex: 10.0)
  currentUsed: number;     // Montant actuellement utilisé
  currentRemaining: number; // Montant restant
  recoveryRate: number;    // Taux de récupération par heure de pause
  lastActivity: Date;      // Dernière activité
  lastRecovery: Date;      // Dernière récupération
  chronicOverwork: boolean; // Indicateur de surmenage chronique
  maxReduction: number;    // Réduction du max en cas de surmenage
}

// Interface pour les paramètres de gestion du budget
export interface BudgetManagementParams {
  dailyMax: number;        // Budget quotidien maximum
  recoveryPerHour: number; // Récupération par heure de pause
  chronicThreshold: number; // Seuil pour détecter le surmenage (ex: 120% du budget)
  chronicDays: number;     // Nombre de jours pour considérer le surmenage comme chronique
  maxReductionPercent: number; // Réduction du max en cas de surmenage (ex: 0.10 pour 10%)
  overnightReset: boolean; // Réinitialisation nocturne
}

// Interface pour les événements de budget
export interface BudgetEvent {
  type: 'consumption' | 'recovery' | 'reset' | 'penalty';
  amount: number;
  timestamp: Date;
  reason: string;
}

// Interface pour les résultats de récupération
export interface RecoveryResult {
  recoveredAmount: number;
  newRemaining: number;
  recoveryRate: number;
  elapsedTimeHours: number;
}

// Service de gestion et de récupération du budget cognitif
export class CognitiveBudgetRecoveryManager {
  private budget: CognitiveBudget;
  private params: BudgetManagementParams;
  private eventHistory: BudgetEvent[];
  private overworkHistory: { date: Date; overage: number }[];

  constructor(params?: Partial<BudgetManagementParams>) {
    this.params = {
      dailyMax: params?.dailyMax ?? 10.0,
      recoveryPerHour: params?.recoveryPerHour ?? 1.0, // 10% du budget max par heure
      chronicThreshold: params?.chronicThreshold ?? 1.20, // 120% du budget
      chronicDays: params?.chronicDays ?? 3,
      maxReductionPercent: params?.maxReductionPercent ?? 0.10, // 10% de réduction
      overnightReset: params?.overnightReset ?? true
    };

    this.budget = {
      dailyMax: this.params.dailyMax,
      currentUsed: 0,
      currentRemaining: this.params.dailyMax,
      recoveryRate: this.params.recoveryPerHour,
      lastActivity: new Date(),
      lastRecovery: new Date(),
      chronicOverwork: false,
      maxReduction: 0
    };

    this.eventHistory = [];
    this.overworkHistory = [];
  }

  /**
   * Consomme une quantité du budget cognitif
   */
  public consume(amount: number, reason: string = "Task execution"): void {
    // Mettre à jour le budget en tenant compte de la récupération passive
    this.applyPassiveRecovery();

    // Calculer le nouveau montant utilisé
    const newUsed = this.budget.currentUsed + amount;
    this.budget.currentUsed = newUsed;
    this.budget.currentRemaining = Math.max(0, this.budget.dailyMax - newUsed);
    this.budget.lastActivity = new Date();

    // Enregistrer l'événement
    this.eventHistory.push({
      type: 'consumption',
      amount,
      timestamp: new Date(),
      reason
    });

    // Vérifier si le budget a été dépassé
    if (newUsed > this.budget.dailyMax) {
      // Enregistrer l'excédent comme surmenage
      this.recordOverwork(newUsed - this.budget.dailyMax);
    }
  }

  /**
   * Applique la récupération passive du budget
   */
  public applyPassiveRecovery(): void {
    const now = new Date();
    const elapsedHours = (now.getTime() - this.budget.lastRecovery.getTime()) / (1000 * 60 * 60);

    if (elapsedHours > 0) {
      // Calculer la récupération
      const recoveryAmount = elapsedHours * this.budget.recoveryRate;

      // Mettre à jour le budget
      this.budget.currentUsed = Math.max(0, this.budget.currentUsed - recoveryAmount);
      this.budget.currentRemaining = this.budget.dailyMax - this.budget.currentUsed;
      this.budget.lastRecovery = now;

      // Enregistrer l'événement de récupération
      if (recoveryAmount > 0) {
        this.eventHistory.push({
          type: 'recovery',
          amount: recoveryAmount,
          timestamp: now,
          reason: "Recovery from inactivity"
        });
      }
    }
  }

  /**
   * Récupération active du budget (manuelle ou par pause prolongée)
   */
  public activeRecovery(durationMinutes: number, recoveryRateMultiplier: number = 1.0): RecoveryResult {
    const durationHours = durationMinutes / 60;
    const recoveryAmount = durationHours * this.budget.recoveryRate * recoveryRateMultiplier;

    // Mettre à jour le budget
    this.budget.currentUsed = Math.max(0, this.budget.currentUsed - recoveryAmount);
    this.budget.currentRemaining = this.budget.dailyMax - this.budget.currentUsed;
    this.budget.lastRecovery = new Date();

    // Enregistrer l'événement
    this.eventHistory.push({
      type: 'recovery',
      amount: recoveryAmount,
      timestamp: new Date(),
      reason: `Active recovery for ${durationMinutes} minutes`
    });

    return {
      recoveredAmount: recoveryAmount,
      newRemaining: this.budget.currentRemaining,
      recoveryRate: this.budget.recoveryRate * recoveryRateMultiplier,
      elapsedTimeHours: durationHours
    };
  }

  /**
   * Réinitialisation nocturne du budget
   */
  public overnightReset(): void {
    if (this.params.overnightReset) {
      // Détecter le surmenage chronique avant la réinitialisation
      if (this.isChronicOverwork()) {
        // Appliquer une pénalité protectrice
        this.budget.maxReduction = this.budget.dailyMax * this.params.maxReductionPercent;
        this.budget.dailyMax = Math.max(1, this.budget.dailyMax - this.budget.maxReduction);
        
        this.eventHistory.push({
          type: 'penalty',
          amount: this.budget.maxReduction,
          timestamp: new Date(),
          reason: "Penalty for chronic overwork"
        });
        
        // Réinitialiser l'historique de surmenage
        this.overworkHistory = [];
      }

      // Réinitialiser les compteurs quotidiens
      this.budget.currentUsed = 0;
      this.budget.currentRemaining = this.budget.dailyMax;
      this.budget.lastActivity = new Date();
      this.budget.lastRecovery = new Date();

      // Enregistrer l'événement de réinitialisation
      this.eventHistory.push({
        type: 'reset',
        amount: this.budget.dailyMax,
        timestamp: new Date(),
        reason: "Overnight reset"
      });
    }
  }

  /**
   * Enregistre un épisode de surmenage
   */
  private recordOverwork(overage: number): void {
    this.overworkHistory.push({
      date: new Date(),
      overage
    });

    // Garder seulement les 10 derniers épisodes
    if (this.overworkHistory.length > 10) {
      this.overworkHistory = this.overworkHistory.slice(-10);
    }
  }

  /**
   * Vérifie s'il y a un surmenage chronique
   */
  public isChronicOverwork(): boolean {
    if (this.overworkHistory.length < this.params.chronicDays) {
      return false;
    }

    // Vérifier si le surmenage a eu lieu pendant plusieurs jours consécutifs
    const recentOverwork = this.overworkHistory.filter(
      episode => episode.overage > this.budget.dailyMax * this.params.chronicThreshold
    );

    return recentOverwork.length >= this.params.chronicDays;
  }

  /**
   * Vérifie si le budget est disponible pour une certaine quantité
   */
  public isAvailable(amount: number): boolean {
    // Mettre à jour le budget avec la récupération passive
    this.applyPassiveRecovery();
    
    return this.budget.currentRemaining >= amount;
  }

  /**
   * Obtient le budget actuel
   */
  public getBudget(): CognitiveBudget {
    // Appliquer la récupération passive avant de retourner le budget
    this.applyPassiveRecovery();
    return { ...this.budget };
  }

  /**
   * Obtient les paramètres actuels
   */
  public getParams(): BudgetManagementParams {
    return { ...this.params };
  }

  /**
   * Obtient l'historique des événements
   */
  public getEventHistory(): BudgetEvent[] {
    return [...this.eventHistory];
  }

  /**
   * Obtient l'historique du surmenage
   */
  public getOverworkHistory(): { date: Date; overage: number }[] {
    return [...this.overworkHistory];
  }

  /**
   * Met à jour les paramètres
   */
  public updateParams(newParams: Partial<BudgetManagementParams>): void {
    this.params = { ...this.params, ...newParams };
    
    // Ajuster le budget quotidien si nécessaire
    if (newParams.dailyMax !== undefined) {
      this.budget.dailyMax = newParams.dailyMax;
      this.budget.currentRemaining = this.budget.dailyMax - this.budget.currentUsed;
    }
    
    if (newParams.recoveryPerHour !== undefined) {
      this.budget.recoveryRate = newParams.recoveryPerHour;
    }
  }

  /**
   * Réinitialise l'historique des événements
   */
  public resetEventHistory(): void {
    this.eventHistory = [];
  }

  /**
   * Réinitialise l'historique de surmenage
   */
  public resetOverworkHistory(): void {
    this.overworkHistory = [];
  }

  /**
   * Calcule le pourcentage de budget restant
   */
  public getRemainingPercentage(): number {
    this.applyPassiveRecovery();
    return (this.budget.currentRemaining / this.budget.dailyMax) * 100;
  }

  /**
   * Calcule le pourcentage de budget utilisé
   */
  public getUsedPercentage(): number {
    this.applyPassiveRecovery();
    return (this.budget.currentUsed / this.budget.dailyMax) * 100;
  }

  /**
   * Vérifie si le budget est en dessous d'un certain seuil (ex: 20%)
   */
  public isBelowThreshold(percentage: number): boolean {
    return this.getRemainingPercentage() < percentage;
  }

  /**
   * Obtient un message de statut pour l'utilisateur
   */
  public getStatusMessage(): string {
    const remainingPercentage = this.getRemainingPercentage();
    const usedPercentage = this.getUsedPercentage();
    
    if (usedPercentage > 100) {
      const overage = usedPercentage - 100;
      return `Budget dépassé de ${overage.toFixed(1)}%. Temps de récupération nécessaire.`;
    } else if (remainingPercentage < 20) {
      return `Budget cognitif critique (${remainingPercentage.toFixed(1)}% restant). Prenez une pause.`;
    } else if (remainingPercentage < 50) {
      return `Budget cognitif à ${remainingPercentage.toFixed(1)}%. Poursuivre avec prudence.`;
    } else {
      return `Budget cognitif à ${remainingPercentage.toFixed(1)}%. Vous êtes en bonne forme.`;
    }
  }

  /**
   * Calcule le temps de récupération estimé pour atteindre un certain niveau
   */
  public estimateRecoveryTime(targetRemaining: number): number {
    // Calculer combien de temps il faudrait pour atteindre targetRemaining
    const currentDeficit = Math.max(0, targetRemaining - this.budget.currentRemaining);
    const recoveryRatePerHour = this.budget.recoveryRate;
    
    if (recoveryRatePerHour === 0) {
      return Infinity; // Impossible de récupérer
    }
    
    return currentDeficit / recoveryRatePerHour; // Heures nécessaires
  }
}

// Instance singleton du gestionnaire de budget cognitif
let cognitiveBudgetRecoveryManager: CognitiveBudgetRecoveryManager | null = null;

export function getCognitiveBudgetManager(params?: Partial<BudgetManagementParams>): CognitiveBudgetRecoveryManager {
  if (!cognitiveBudgetRecoveryManager) {
    cognitiveBudgetRecoveryManager = new CognitiveBudgetRecoveryManager(params);
  }
  return cognitiveBudgetRecoveryManager;
}

/**
 * Fonction utilitaire pour intégrer la gestion du budget cognitif dans le système
 */
export function integrateCognitiveBudget(
  params?: Partial<BudgetManagementParams>
): {
  manager: CognitiveBudgetRecoveryManager;
  consume: (amount: number, reason?: string) => void;
  isAvailable: (amount: number) => boolean;
  getBudget: () => CognitiveBudget;
  getStatusMessage: () => string;
} {
  const manager = getCognitiveBudgetManager(params);

  return {
    manager,
    consume: (amount: number, reason: string = "Task execution") => manager.consume(amount, reason),
    isAvailable: (amount: number) => manager.isAvailable(amount),
    getBudget: () => manager.getBudget(),
    getStatusMessage: () => manager.getStatusMessage()
  };
}

/**
 * Exemple d'utilisation
 * 
 * // Initialiser le gestionnaire
 * const budgetManager = new CognitiveBudgetRecoveryManager({
 *   dailyMax: 10.0,
 *   recoveryPerHour: 1.0,
 *   chronicThreshold: 1.20,
 *   chronicDays: 3,
 *   maxReductionPercent: 0.10
 * });
 * 
 * // Consommer du budget
 * budgetManager.consume(2.5, "Traitement d'une tâche complexe");
 * 
 * // Vérifier la disponibilité
 * if (budgetManager.isAvailable(3.0)) {
 *   // La tâche peut être exécutée
 * } else {
 *   // Budget insuffisant, proposer une pause
 * }
 * 
 * // Appliquer une récupération active
 * const recoveryResult = budgetManager.activeRecovery(30); // 30 minutes de pause
 * 
 * // Obtenir le message de statut
 * console.log(budgetManager.getStatusMessage());
 */