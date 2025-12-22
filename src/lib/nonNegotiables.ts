// Non-Negotiables - Lignes rouges non-négociables du système
// Implémentation des limites de sécurité du système

// Configuration de base pour les lignes rouges non-négociables avec justifications
export const BASE_NON_NEGOTIABLES = {
  maxDailyLoad: {
    value: 1.3,
    unit: "× charge soutenable",
    rationale: "Surcharge >30% = dégradation cognitive mesurable",
    source: "Cognitive Load Theory (Sweller, 1988)",
    url: "https://doi.org/10.1007/BF02504799",
    adjustable: false
  },
  
  burnoutSignalsLimit: {
    value: 3,
    unit: "signaux cumulés",
    rationale: "3+ dimensions = burnout clinique",
    source: "Maslach Burnout Inventory (MBI)",
    url: "https://doi.org/10.1002/job.4030020205",
    adjustable: false
  },
  
  minRecoveryTime: {
    value: 8,
    unit: "heures",
    rationale: "Minimum sommeil adulte recommandé",
    source: "Sleep Foundation",
    url: "https://www.sleepfoundation.org/how-sleep-works/how-much-sleep-do-we-really-need",
    adjustable: true,  // User peut choisir 7-9h
    range: [7, 9]
  },
  
  ethicalRefusal: {
    value: true,
    rationale: "Système refuse d'aider à l'auto-destruction",
    source: "Principes éthiques de l'IA",
    url: "https://doi.org/10.1038/s4159 machine-intelligence-021-00023-3",
    adjustable: false
  }
};

// Facteurs de contexte pour les seuils dynamiques
export interface ContextFactors {
  lifeEventImpact: number; // 0-1, impact d'événements de vie (maladie, vacances, etc.)
  projectIntensity: number; // 0-1, intensité du projet actuel
  seasonalVariation: number; // 0-1, variation saisonnière
  personalBaseline: number; // 0-1, baseline personnel historique
}

// Fonction pour calculer les seuils dynamiques
export function calculateDynamicThresholds(baseValues: typeof BASE_NON_NEGOTIABLES, context: ContextFactors) {
  // Ajuster maxDailyLoad selon le contexte
  const contextualMaxDailyLoad = baseValues.maxDailyLoad.value * (1 + 0.5 * context.lifeEventImpact + 0.3 * context.projectIntensity);
  
  // Ajuster burnoutSignalsLimit selon le contexte
  const contextualBurnoutLimit = Math.max(2, baseValues.burnoutSignalsLimit.value - Math.floor(1 * context.seasonalVariation));
  
  // Ajuster minRecoveryTime selon le contexte
  const contextualMinRecovery = Math.max(6, baseValues.minRecoveryTime.value - 1 * context.personalBaseline);
  
  return {
    maxDailyLoad: {
      ...baseValues.maxDailyLoad,
      value: contextualMaxDailyLoad
    },
    burnoutSignalsLimit: {
      ...baseValues.burnoutSignalsLimit,
      value: contextualBurnoutLimit
    },
    minRecoveryTime: {
      ...baseValues.minRecoveryTime,
      value: contextualMinRecovery
    },
    ethicalRefusal: baseValues.ethicalRefusal
  };
}

// Interface pour les signaux de burnout
export interface BurnoutSignals {
  // Signal 1 : Surcharge chronique
  chronicOverload: {
    trigger: "dailyLoad > 1.2 for 5+ consecutive days";
    weight: 1.0;
    detected: boolean;
  };
  
  // Signal 2 : Dette de sommeil (si tracking disponible)
  sleepDebt: {
    trigger: "reported sleep < 6h for 3+ days";
    weight: 1.5;  // Plus grave
    detected: boolean;
  };
  
  // Signal 3 : Overrides constants
  overrideAbuse: {
    trigger: "overrides > 80% of decisions for 7+ days";
    weight: 0.8;
    detected: boolean;
  };
  
  // Signal 4 : Complétion collapse
  completionCollapse: {
    trigger: "completion rate < 30% for 7+ days";
    weight: 1.0;
    detected: boolean;
  };
  
  // Signal 5 : Patterns erratiques
  erraticBehavior: {
    trigger: "session starts/abandons spike variance > 2σ";
    weight: 0.7;
    detected: boolean;
  };
  
  // Signal 6 : Accumulation tâches
  taskAccumulation: {
    trigger: "active tasks > 50 AND growth rate > 5/day";
    weight: 0.8;
    detected: boolean;
  };
}

  // Classe pour gérer les lignes rouges non-négociables
  export class NonNegotiablesManager {
    private baseNonNegotiables = BASE_NON_NEGOTIABLES;
    private nonNegotiables = BASE_NON_NEGOTIABLES;
    private burnoutSignals: BurnoutSignals;
    private contextFactors: ContextFactors = {
      lifeEventImpact: 0,
      projectIntensity: 0,
      seasonalVariation: 0,
      personalBaseline: 0
    };
    
    constructor() {
      // Initialiser les signaux de burnout
      this.burnoutSignals = {
        chronicOverload: {
          trigger: "dailyLoad > 1.2 for 5+ consecutive days",
          weight: 1.0,
          detected: false
        },
        sleepDebt: {
          trigger: "reported sleep < 6h for 3+ days",
          weight: 1.5,
          detected: false
        },
        overrideAbuse: {
          trigger: "overrides > 80% of decisions for 7+ days",
          weight: 0.8,
          detected: false
        },
        completionCollapse: {
          trigger: "completion rate < 30% for 7+ days",
          weight: 1.0,
          detected: false
        },
        erraticBehavior: {
          trigger: "session starts/abandons spike variance > 2σ",
          weight: 0.7,
          detected: false
        },
        taskAccumulation: {
          trigger: "active tasks > 50 AND growth rate > 5/day",
          weight: 0.8,
          detected: false
        }
      };
    }
    
    // Obtenir les lignes rouges non-négociables
    getNonNegotiables() {
      return { ...this.nonNegotiables };
    }
    
    // Mettre à jour les lignes rouges non-négociables
    updateNonNegotiables(newValues: Partial<typeof BASE_NON_NEGOTIABLES>) {
      this.baseNonNegotiables = {
        ...this.baseNonNegotiables,
        ...newValues
      };
      // Recalculer les seuils dynamiques
      this.recalculateDynamicThresholds();
    }
    
    // Définir les facteurs de contexte
    setContextFactors(context: ContextFactors) {
      this.contextFactors = context;
      // Recalculer les seuils dynamiques
      this.recalculateDynamicThresholds();
    }
    
    // Recalculer les seuils dynamiques
    private recalculateDynamicThresholds() {
      this.nonNegotiables = calculateDynamicThresholds(this.baseNonNegotiables, this.contextFactors);
    }
    
    // Obtenir les signaux de burnout
    getBurnoutSignals(): BurnoutSignals {
      return { ...this.burnoutSignals };
    }
    
    // Mettre à jour un signal de burnout
    updateBurnoutSignal(signalName: keyof BurnoutSignals, detected: boolean) {
      if (this.burnoutSignals[signalName]) {
        this.burnoutSignals[signalName].detected = detected;
      }
    }
    
    // Vérifier si le nombre de signaux de burnout dépasse la limite
    isBurnoutLimitExceeded(): boolean {
      const detectedSignals = Object.values(this.burnoutSignals)
        .filter(signal => signal.detected)
        .length;
        
      return detectedSignals >= this.nonNegotiables.burnoutSignalsLimit.value;
    }
    
    // Vérifier si l'utilisateur a dépassé le seuil de force excessive
    isMaxTasksExceeded(currentTasks: number, maxAllowed: number): boolean {
      return currentTasks > maxAllowed;
    }
    
    // Appliquer les règles de sécurité en cas de dépassement
    enforceSecurityRules(burnoutSignalsCount: number): { 
      refuse: boolean; 
      suggest: string; 
      lock: string | null 
    } {
      if (burnoutSignalsCount >= this.nonNegotiables.burnoutSignalsLimit.value) {
        return {
          refuse: true,
          suggest: "Repos / décharge",
          lock: "maxTasks"
        };
      }
      
      return {
        refuse: false,
        suggest: "",
        lock: null
      };
    }
  }