// Life Change Detector - Détection des changements de vie de l'utilisateur
// Implémentation de l'étape 3.4 : Adaptation aux Changements de Vie de l'Utilisateur

import { createLogger } from '@/lib/logger';

const logger = createLogger('LifeChangeDetector');

// Interface pour les données de comportement utilisateur
export interface UserBehavior {
  userId: string;
  taskCompletionRate: number;
  sessionDuration: number;
  taskDifficultyPreference: string;
  energyLevels: number[];
  taskTypes: string[];
  dailySchedule: number[]; // Heures de la journée où l'utilisateur est actif
  weeklyPattern: number[]; // Activité par jour de la semaine
  taskTypesDistribution?: Map<string, number>;      // Distribution types tâches
  energyPatterns?: number[];            // Patterns énergie
  scheduledTimes?: number[];            // Heures préférées
  completionRates?: number[];           // Taux complétion
}

function convertStringArrayToMap(arr: string[]): Map<string, number> {
  const map = new Map<string, number>();
  arr.forEach((item) => {
    map.set(item, (map.get(item) || 0) + 1);
  });
  return map;
}

function calculateArraySimilarity(arr1: number[], arr2: number[]): number {
  if (arr1.length !== arr2.length) {
    return 0;
  }

  let sum = 0;
  for (let i = 0; i < arr1.length; i++) {
    sum += 1 - Math.abs(arr1[i] - arr2[i]) / Math.max(arr1[i], arr2[i], 1);
  }

  return sum / arr1.length;
}

export function compareBehaviorPatterns(current: UserBehavior, baseline: HistoricalBehaviorData): number {
  const taskShift = klDivergence(
    current.taskTypesDistribution || new Map(),
    convertStringArrayToMap(baseline.baselineTaskTypes)
  );

  const energyShift = 1 - correlation(current.energyPatterns || [], baseline.baselineEnergyLevels || []);

  const scheduleShift = 1 - calculateArraySimilarity(current.scheduledTimes || [], baseline.baselineDailySchedule || []);

  const completionShift = Math.abs(
    (current.completionRates?.reduce((a, b) => a + b, 0) / (current.completionRates?.length || 1) || 0) -
      (baseline.baselineTaskCompletionRate || 0)
  );

  return (
    0.3 * normalize(taskShift, 0, 5) +
    0.3 * normalize(energyShift, 0, 1) +
    0.2 * normalize(scheduleShift, 0, 1) +
    0.2 * normalize(completionShift, 0, 1)
  );
}

// Interface pour les données historiques de comportement
export interface HistoricalBehaviorData {
  userId: string;
  baselineTaskCompletionRate: number;
  baselineSessionDuration: number;
  baselineEnergyLevels: number[];
  baselineTaskTypes: string[];
  baselineDailySchedule: number[];
  baselineWeeklyPattern: number[];
}

// Interface pour les résultats de comparaison
export interface BehaviorComparisonResult {
  similarityScore: number; // 0 à 1, où 1 signifie identique
  significantChanges: string[];
  changeMagnitude: number; // 0 à 1, où 1 signifie changement très important
}

// Classe pour détecter les changements de vie
export class LifeChangeDetector {
  private historicalData: Map<string, HistoricalBehaviorData> = new Map();
  private changeThreshold: number = 0.5; // Seuil pour considérer un changement comme significatif
  
  constructor(changeThreshold: number = 0.5) {
    this.changeThreshold = changeThreshold;
  }
  
  // Définir les données historiques de comportement
  setHistoricalBehaviorData(data: HistoricalBehaviorData): void {
    this.historicalData.set(data.userId, data);
  }
  
  // Obtenir les données historiques de comportement
  getHistoricalBehaviorData(userId: string): HistoricalBehaviorData | undefined {
    return this.historicalData.get(userId);
  }
  
  // Détecter les changements dans le comportement de l'utilisateur
  detectChanges(userBehaviorData: UserBehavior): boolean {
    const baselineData = this.getHistoricalBehaviorData(userBehaviorData.userId);
    
    if (!baselineData) {
      // Pas de données historiques, impossible de détecter des changements
      logger.info('No historical data for user', { userId: userBehaviorData.userId });
      return false;
    }
    
    // Comparer les comportements
    const changeMagnitude = this.compareBehaviorPatterns(userBehaviorData, baselineData);
    
    // Si le changement est significatif, notifier l'utilisateur
    if (changeMagnitude > this.changeThreshold) {
      this.log("LifeChangeDetected", { userId: userBehaviorData.userId, changeMagnitude });
      this.notifyUser(
        "Changement majeur détecté, souhaitez-vous réinitialiser les adaptations ?",
        userBehaviorData.userId
      );
      return true;
    }
    
    return false;
  }
  
  // Fonction pour comparer les modèles de comportement
  private compareBehaviorPatterns(
    current: UserBehavior,
    baseline: HistoricalBehaviorData
  ): number {
    // 1. Comparer la distribution des types de tâches avec la divergence de Kullback-Leibler
    const taskShift = klDivergence(
      current.taskTypesDistribution || new Map(),
      this.convertStringArrayToMap(baseline.baselineTaskTypes)
    );
    
    // 2. Comparer les patterns d'énergie avec la corrélation inverse
    const energyShift = 1 - correlation(
      current.energyPatterns || [],
      baseline.baselineEnergyLevels || []
    );
    
    // 3. Comparer les horaires préférés
    const scheduleShift = 1 - this.calculateArraySimilarity(
      current.scheduledTimes || [],
      baseline.baselineDailySchedule || []
    );
    
    // 4. Comparer les taux de complétion
    const completionShift = Math.abs(
      (current.completionRates?.reduce((a, b) => a + b, 0) / (current.completionRates?.length || 1) || 0) - 
      (baseline.baselineTaskCompletionRate || 0)
    );
    
    // Pondérer les différentes mesures de changement (0-1)
    return 0.3 * normalize(taskShift, 0, 5) + 
           0.3 * normalize(energyShift, 0, 1) + 
           0.2 * normalize(scheduleShift, 0, 1) + 
           0.2 * normalize(completionShift, 0, 1);
  }
  
  // Convertir un tableau de strings en Map pour la compatibilité
  private convertStringArrayToMap(arr: string[]): Map<string, number> {
    const map = new Map<string, number>();
    arr.forEach(item => {
      map.set(item, (map.get(item) || 0) + 1);
    });
    return map;
  }
  
  // Calculer la similarité entre deux tableaux
  private calculateArraySimilarity(arr1: number[], arr2: number[]): number {
    if (arr1.length !== arr2.length) {
      return 0;
    }
    
    let sum = 0;
    for (let i = 0; i < arr1.length; i++) {
      // Utiliser la distance absolue normalisée
      sum += 1 - Math.abs(arr1[i] - arr2[i]) / Math.max(arr1[i], arr2[i], 1);
    }
    
    return sum / arr1.length;
  }
  
  // Calculer la similarité globale
  private calculateOverallSimilarity(
    currentUserData: UserBehavior,
    baselineData: HistoricalBehaviorData,
    energyLevelSimilarity: number
  ): number {
    // Pondérer différents aspects du comportement
    const weights = {
      taskCompletion: 0.3,
      sessionDuration: 0.2,
      energyLevels: 0.3,
      taskTypes: 0.1,
      schedule: 0.1
    };
    
    // Calculer la similarité pour chaque aspect
    const taskCompletionSimilarity = 1 - Math.abs(
      currentUserData.taskCompletionRate - baselineData.baselineTaskCompletionRate
    );
    
    const sessionDurationSimilarity = 1 - Math.abs(
      currentUserData.sessionDuration - baselineData.baselineSessionDuration
    ) / Math.max(baselineData.baselineSessionDuration, 1);
    
    const taskTypeSimilarity = this.calculateStringArraySimilarity(
      currentUserData.taskTypes,
      baselineData.baselineTaskTypes
    );
    
    const scheduleSimilarity = this.calculateArraySimilarity(
      currentUserData.dailySchedule,
      baselineData.baselineDailySchedule
    );
    
    // Calculer la similarité pondérée
    const weightedSimilarity =
      (taskCompletionSimilarity * weights.taskCompletion) +
      (sessionDurationSimilarity * weights.sessionDuration) +
      (energyLevelSimilarity * weights.energyLevels) +
      (taskTypeSimilarity * weights.taskTypes) +
      (scheduleSimilarity * weights.schedule);
    
    return weightedSimilarity;
  }
  
  // Calculer la similarité entre deux tableaux de strings
  private calculateStringArraySimilarity(arr1: string[], arr2: string[]): number {
    if (arr1.length === 0 && arr2.length === 0) {
      return 1;
    }
    
    // Calculer l'intersection et l'union
    const set1 = new Set(arr1);
    const set2 = new Set(arr2);
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    if (union.size === 0) {
      return 1;
    }
    
    // Similarité de Jaccard
    return intersection.size / union.size;
  }
  
  // Journaliser un événement
  private log(event: string, data: any): void {
    logger.info(event, { data });
    // Dans une implémentation réelle, cela enregistrerait l'événement dans un système de journalisation
  }
  
  // Notifier l'utilisateur d'un changement
  private notifyUser(message: string, userId: string): void {
    logger.info('NOTIFICATION', { userId, message });
    // Dans une implémentation réelle, cela afficherait une notification dans l'UI
    
    // Proposer une réinitialisation des adaptations
    this.proposeAdaptationReset(userId);
  }
  
  // Proposer une réinitialisation des adaptations
  private proposeAdaptationReset(userId: string): void {
    logger.info('Showing adaptation reset proposal modal', {
      title: "Réinitialisation des adaptations",
      body: "Un changement majeur de votre comportement a été détecté. Souhaitez-vous réinitialiser les adaptations du système ?",
      actions: [
        { label: "Réinitialiser", value: "RESET" },
        { label: "Conserver", value: "KEEP" },
        { label: "Plus tard", value: "LATER" }
      ]
    });
    
    // Dans une implémentation réelle, cela afficherait un modal dans l'UI
  }
  
  // Réinitialiser les adaptations pour un utilisateur
  resetUserAdaptations(userId: string): void {
    logger.info('Resetting adaptations for user', { userId });
    // Dans une implémentation réelle, cela réinitialiserait les adaptations de l'utilisateur
  }
  
  // Mettre à jour les données historiques
  updateHistoricalData(userId: string, newData: Partial<UserBehavior>): void {
    const existingData = this.historicalData.get(userId);
    
    if (existingData) {
      // Mettre à jour les données existantes
      // Note: Dans une implémentation réelle, cela serait plus complexe
      logger.info('Updating historical data for user', { userId });
    } else {
      // Créer de nouvelles données historiques
      logger.info('Creating historical data for user', { userId });
    }
  }
}

// Fonctions utilitaires externes à la classe

// Fonction pour calculer la divergence de Kullback-Leibler
function klDivergence(p: Map<string, number>, q: Map<string, number>): number {
  let sum = 0;
  const keys = new Set([...p.keys(), ...q.keys()]);
  
  for (const key of keys) {
    const pVal = p.get(key) || 0;
    const qVal = q.get(key) || 0;
    
    // Ajouter un epsilon pour éviter log(0)
    const eps = 1e-10;
    if (pVal > 0) {
      sum += pVal * Math.log((pVal + eps) / (qVal + eps));
    }
  }
  
  return sum;
}

// Fonction pour calculer la corrélation de Pearson
function correlation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length === 0) return 0;
  
  const meanX = x.reduce((a, b) => a + b, 0) / x.length;
  const meanY = y.reduce((a, b) => a + b, 0) / y.length;
  
  let numerator = 0;
  let denomX = 0;
  let denomY = 0;
  
  for (let i = 0; i < x.length; i++) {
    numerator += (x[i] - meanX) * (y[i] - meanY);
    denomX += (x[i] - meanX) ** 2;
    denomY += (y[i] - meanY) ** 2;
  }
  
  if (denomX === 0 || denomY === 0) return 0;
  
  return numerator / Math.sqrt(denomX * denomY);
}

// Fonction pour normaliser une valeur entre 0 et 1
function normalize(value: number, min: number, max: number): number {
  if (max === min) return 0;
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}
