// Life Change Detector - Détection des changements de vie de l'utilisateur
// Implémentation de l'étape 3.4 : Adaptation aux Changements de Vie de l'Utilisateur

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
      console.log(`No historical data for user ${userBehaviorData.userId}`);
      return false;
    }
    
    // Comparer les comportements
    const changeMagnitude = compareBehaviorPatterns(userBehaviorData, baselineData);
    
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
export function compareBehaviorPatterns(
  currentUserData: UserBehavior,
  baselineData: HistoricalBehaviorData
): number {
  
  // 1. Comparer la distribution des types de tâches
  let taskTypeSimilarity = 1.0;
  if (currentUserData.taskTypesDistribution && baselineData.baselineTaskTypes) {
    taskTypeSimilarity = calculateStringMapSimilarity(
      currentUserData.taskTypesDistribution,
      new Map(Object.entries(baselineData.baselineTaskTypes))
    );
  }
  
  // 2. Comparer les patterns d'énergie
  let energyPatternSimilarity = 1.0;
  if (currentUserData.energyPatterns && baselineData.baselineEnergyLevels) {
    energyPatternSimilarity = calculateArraySimilarity(
      currentUserData.energyPatterns,
      baselineData.baselineEnergyLevels
    );
  }
  
  // 3. Comparer les heures préférées
  let scheduleSimilarity = 1.0;
  if (currentUserData.scheduledTimes && baselineData.baselineDailySchedule) {
    scheduleSimilarity = calculateArraySimilarity(
      currentUserData.scheduledTimes,
      baselineData.baselineDailySchedule
    );
  }
  
  // 4. Comparer les taux de complétion
  let completionRateSimilarity = 1.0;
  if (currentUserData.completionRates && baselineData.baselineTaskCompletionRate) {
    // Convertir le taux de complétion en tableau pour la comparaison
    const currentCompletionArray = [currentUserData.completionRates.reduce((a, b) => a + b, 0) / currentUserData.completionRates.length];
    const baselineCompletionArray = [baselineData.baselineTaskCompletionRate];
    completionRateSimilarity = calculateArraySimilarity(currentCompletionArray, baselineCompletionArray);
  }
  
  // Pondérer les différentes similarités
  const weights = {
    taskTypes: 0.3,
    energyPatterns: 0.3,
    schedule: 0.2,
    completion: 0.2
  };
  
  const weightedSimilarity =
    (taskTypeSimilarity * weights.taskTypes) +
    (energyPatternSimilarity * weights.energyPatterns) +
    (scheduleSimilarity * weights.schedule) +
    (completionRateSimilarity * weights.completion);
  
  // Retourner l'inverse de la similarité comme mesure de changement
  // (plus la similarité est faible, plus le changement est important)
  return 1 - weightedSimilarity;
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
  
  // Calculer la similarité entre deux Maps de chaînes
function calculateStringMapSimilarity(map1: Map<string, number>, map2: Map<string, number>): number {
  if (map1.size === 0 && map2.size === 0) {
    return 1;
  }
  
  // Calculer l'intersection et l'union des clés
  const keys1 = new Set(map1.keys());
  const keys2 = new Set(map2.keys());
  
  const intersection = new Set([...keys1].filter(x => keys2.has(x)));
  const union = new Set([...keys1, ...keys2]);
  
  if (union.size === 0) {
    return 1;
  }
  
  // Calculer la similarité de Jaccard pour les clés
  const jaccardSimilarity = intersection.size / union.size;
  
  // Calculer la similarité des valeurs pour les clés communes
  let valueSimilarity = 0;
  if (intersection.size > 0) {
    let sum = 0;
    for (const key of intersection) {
      const val1 = map1.get(key) || 0;
      const val2 = map2.get(key) || 0;
      // Similarité basée sur la distance absolue normalisée
      sum += 1 - Math.abs(val1 - val2) / Math.max(val1, val2, 1);
    }
    valueSimilarity = sum / intersection.size;
  }
  
  // Combiner les deux similarités
  return (jaccardSimilarity + valueSimilarity) / 2;
}
  
  // Journaliser un événement
  log(event: string, data: any): void {
    console.log(`EVENT: ${event}`, data);
    // Dans une implémentation réelle, cela enregistrerait l'événement dans un système de journalisation
  }
  
  // Notifier l'utilisateur d'un changement
  notifyUser(message: string, userId: string): void {
    console.log(`NOTIFICATION to user ${userId}: ${message}`);
    // Dans une implémentation réelle, cela afficherait une notification dans l'UI
    
    // Proposer une réinitialisation des adaptations
    this.proposeAdaptationReset(userId);
  }
  
  // Proposer une réinitialisation des adaptations
  private proposeAdaptationReset(userId: string): void {
    console.log("Showing adaptation reset proposal modal:", {
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
    console.log(`Resetting adaptations for user ${userId}`);
    // Dans une implémentation réelle, cela réinitialiserait les adaptations de l'utilisateur
  }
  
  // Mettre à jour les données historiques
  updateHistoricalData(userId: string, newData: Partial<UserBehavior>): void {
    const existingData = this.historicalData.get(userId);
    
    if (existingData) {
      // Mettre à jour les données existantes
      // Note: Dans une implémentation réelle, cela serait plus complexe
      console.log(`Updating historical data for user ${userId}`);
    } else {
      // Créer de nouvelles données historiques
      console.log(`Creating historical data for user ${userId}`);
    }
  }
}