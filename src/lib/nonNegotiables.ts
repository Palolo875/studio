// Non-Negotiables - Lignes rouges non-négociables du système
// Implémentation des limites de sécurité du système

// Constantes pour les lignes rouges non-négociables avec justifications
export const NON_NEGOTIABLES = {
  maxDailyLoad: {
    value: 1.3,
    unit: "× charge soutenable",
    rationale: "Cognitive Load Theory (Sweller) - surcharge >30% = dégradation",
    source: "https://doi.org/10.1007/BF02504799",
    adjustable: false
  },
  
  minRecoveryTime: {
    value: 8,
    unit: "hours",
    rationale: "Sleep Foundation - minimum sommeil adulte",
    source: "https://www.sleepfoundation.org/how-sleep-works/how-much-sleep-do-we-really-need",
    adjustable: true,  // User peut ajuster 7-9h
    range: [7, 9]
  },
  
  burnoutSignalsLimit: {
    value: 3,
    unit: "signals cumulés",
    rationale: "Maslach Burnout Inventory - 3+ dimensions = burnout clinique",
    source: "https://doi.org/10.1002/job.4030020205",
    adjustable: false
  },
  
  ethicalRefusal: {
    value: true,
    rationale: "Système refuse d'aider à l'auto-destruction",
    adjustable: false
  }
};

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
    private nonNegotiables = NON_NEGOTIABLES;
    private burnoutSignals: BurnoutSignals;
    
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
    updateNonNegotiables(newValues: Partial<typeof NON_NEGOTIABLES>) {
      this.nonNegotiables = {
        ...this.nonNegotiables,
        ...newValues
      };
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