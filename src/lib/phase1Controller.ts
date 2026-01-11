import { TaskWithContext, SessionState, EnergyState, Capacity } from './types';
import { applyPhase1Rules } from './phase1Invariants';
import { validateSystemState, DEFAULT_FAILURE_POLICY, applyFailurePolicy } from './ruleClassification';
import { translateMoralLanguage, createBehavioralEvent } from './moralLanguageFilter';
import { MorningRitual, EveningRitual, DefaultRitualHandler, RitualOptions, DEFAULT_RITUAL_OPTIONS } from './morningEveningRituals';
import { generateSession } from './sessionManagement';

/**
 * Contrôleur principal de la Phase 1
 * Coordonne tous les composants de la Phase 1
 */
export class Phase1Controller {
  private ritualHandler: DefaultRitualHandler;
  private ritualOptions: RitualOptions;
  private failureCount: number = 0;

  constructor(options?: Partial<RitualOptions>) {
    this.ritualOptions = { ...DEFAULT_RITUAL_OPTIONS, ...options };
    this.ritualHandler = new DefaultRitualHandler();
  }

  /**
   * Exécute le cycle complet de la Phase 1
   */
  public executeCycle(
    tasks: TaskWithContext[],
    energyState: EnergyState,
    availableTime: number
  ): { 
    session: SessionState | null; 
    morningRitualResult: any; 
    validationResults: any; 
    behavioralEvents: any[] 
  } {
    const events: any[] = [];

    // 1. Exécuter le rituel du matin
    let morningRitualResult = null;
    if (this.ritualOptions.enableMorningRitual) {
      morningRitualResult = this.ritualHandler.executeMorningRitual(tasks);
      if (morningRitualResult) {
        events.push(createBehavioralEvent('task_selected', { taskId: morningRitualResult.selectedTaskId }));
      }
    }

    // 2. Appliquer les règles de la Phase 1
    const phase1Results = applyPhase1Rules(tasks, energyState.level, energyState.stability, new Date(), availableTime);
    
    // 3. Valider l'état du système
    const validationResults = validateSystemState({
      tasks: phase1Results.filteredTasks,
      capacity: phase1Results.capacity,
      energyLevel: energyState.level,
      energyStability: energyState.stability,
      availableTime
    });
    
    // 4. Gérer les violations et les échecs
    if (!validationResults.isSystemHealthy) {
      this.failureCount += validationResults.hardRuleViolations.length;
      // Appliquer la politique de gestion des échecs
      const updatedContext = applyFailurePolicy(DEFAULT_FAILURE_POLICY, this.failureCount, {
        tasks: phase1Results.filteredTasks,
        energyState,
        availableTime
      });
      
      // Ne pas générer de session si violations graves
      if (validationResults.hardRuleViolations.length > 0) {
        return {
          session: null,
          morningRitualResult,
          validationResults,
          behavioralEvents: events
        };
      }
    }

    // 5. Générer la session
    const session = generateSession(
      phase1Results.filteredTasks,
      energyState,
      new Date(),
      availableTime,
      phase1Results.capacity.maxTasks
    );

    // 6. Ajouter un événement de session
    events.push(createBehavioralEvent('session_ended', { sessionId: session.id }));

    return {
      session,
      morningRitualResult,
      validationResults,
      behavioralEvents: events
    };
  }

  /**
   * Exécute le rituel du soir
   */
  public executeEveningRitual(
    scheduledTasks: TaskWithContext[],
    completedTaskIds: string[]
  ): any {
    if (!this.ritualOptions.enableEveningRitual) {
      return null;
    }
    
    return this.ritualHandler.executeEveningRitual(scheduledTasks, completedTaskIds);
  }

  /**
   * Traduit un message pour enlever les jugements moraux
   */
  public translateMessage(message: string): string {
    return translateMoralLanguage(message);
  }

  /**
   * Réinitialise le compteur d'échecs
   */
  public resetFailureCount(): void {
    this.failureCount = 0;
  }

  /**
   * Obtient le nombre d'échecs
   */
  public getFailureCount(): number {
    return this.failureCount;
  }

  /**
   * Met à jour les options des rituels
   */
  public updateRitualOptions(options: Partial<RitualOptions>): void {
    this.ritualOptions = { ...this.ritualOptions, ...options };
  }
}

/**
 * Point d'entrée principal pour la Phase 1
 */
export function createPhase1Controller(options?: Partial<RitualOptions>): Phase1Controller {
  return new Phase1Controller(options);
}

/**
 * Exemple d'utilisation
 */
export function exampleUsage() {
  // Ceci est un exemple conceptuel
  const controller = createPhase1Controller();
  
  // Données d'exemple
  const tasks: TaskWithContext[] = [
    {
      id: '1',
      title: 'Exemple de tâche',
      description: 'Ceci est une tâche descriptive',
      duration: 30,
      effort: 'medium',
      urgency: 'high',
      impact: 'high',
      category: 'work',
      status: 'todo',
      pool: 'TODAY',
      activationCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];
  
  const energyState: EnergyState = {
    level: 'high',
    stability: 'stable',
    confidence: 0.9
  };
  
  const result = controller.executeCycle(tasks, energyState, 120);
  console.log('Session générée:', result.session);
  console.log('Résultats de validation:', result.validationResults);
  
  return result;
}