// Point d'entrée principal pour la Phase 7
// Intègre tous les composants de la Phase 7

import { AuthorityContract, AuthorityContext, NON_NEGOTIABLES } from './phase7Implementation';
import { calculateBurnoutScore, BurnoutDetectionResult } from './burnoutEngine';
import { SovereigntyManager, SovereigntyMode } from './modeEngine';
import { computeOverrideCost } from './costEngine';
import { VoteEngine, ConsensusMode } from './voteEngine';
import { GovernanceDashboard } from './governanceDashboard';
import { ConflictResolver } from './conflictResolution';
import { ProtectiveModeManager } from './protectiveMode';
import { Session, Task } from './types';

// Interface pour l'état utilisateur
export interface UserState {
  energy: "HIGH" | "MEDIUM" | "LOW";
  dailyBudget: {
    remaining: number;
    total: number;
  };
  burnoutScore: number;
  overridesLast2h: number;
  sessions: Session[];
  tasks: Task[];
  overrides: { timestamp: number }[];
  decisions: number;
  sleepData: { date: Date; hours: number }[];
}

// Classe principale pour la Phase 7
export class Phase7Manager {
  private authorityContract: AuthorityContract;
  private authorityContext: AuthorityContext;
  private sovereigntyManager: SovereigntyManager;
  private voteEngine: VoteEngine;
  private governanceDashboard: GovernanceDashboard;
  private conflictResolver: ConflictResolver;
  private protectiveModeManager: ProtectiveModeManager;

  constructor() {
    // Initialiser le contrat d'autorité
    this.authorityContract = {
      userAuthority: {
        canOverride: true,
        canDisableBrain: true,
        canResetAdaptation: true
      },
      systemAuthority: {
        canRefuseTasks: true,
        canFreezeAdaptation: true,
        canEnterSafeMode: true
      },
      sharedRules: {
        transparencyMandatory: true,
        reversibilityGuaranteed: true,
        userConsentRequired: true
      }
    };

    // Initialiser le contexte d'autorité
    this.authorityContext = {
      user: {
        tasks: "FULL",
        data: "FULL",
        modes: "SUGGEST_ONLY",
        parameters: "FULL",
        consent: "FULL"
      },
      system: {
        safetyLimits: "ENFORCE",
        dataIntegrity: "ENFORCE",
        performance: "ENFORCE",
        adaptation: "SUGGEST",
        warnings: "INFORM"
      },
      negotiated: {
        overrides: {
          allowed: true,
          cost: "EXPLICIT",
          limit: "SOFT"
        },
        protectiveMode: {
          trigger: "AUTOMATIC",
          exit: "USER_REQUEST",
          duration: "24h minimum"
        }
      }
    };

    // Initialiser les gestionnaires
    this.sovereigntyManager = new SovereigntyManager();
    this.voteEngine = new VoteEngine();
    this.governanceDashboard = new GovernanceDashboard();
    this.conflictResolver = new ConflictResolver(this.voteEngine, this.sovereigntyManager);
    this.protectiveModeManager = new ProtectiveModeManager(this.sovereigntyManager);
  }

  // Vérifier les signaux de burnout et activer le mode protectif si nécessaire
  async checkBurnoutAndProtect(userState: UserState): Promise<void> {
  // Calculer le score de burnout
    const burnoutResult = await calculateBurnoutScore(
      "user-id", // À remplacer par l'ID utilisateur réel
      userState.sessions,
      userState.tasks,
      userState.overrides,
      userState.decisions,
      userState.sleepData
    );

    // Mettre à jour le risque de burnout dans le tableau de bord
    this.governanceDashboard.updateBurnoutRisk(burnoutResult.score);

    // Vérifier si le mode protectif doit être activé
    if (burnoutResult.score > 0.75) {
      // Générer une notification
      const notification = this.protectiveModeManager.generateNotification(burnoutResult);
      console.log(notification);

      // Activer le mode protectif
      this.protectiveModeManager.activate("Signaux de burnout détectés");
    }

    // Appliquer les restrictions du mode protectif si actif
    if (this.protectiveModeManager.isActive()) {
      this.protectiveModeManager.applyRestrictions();
    }
  }

// Calculer le coût d'un override
  calculateOverrideCost(task: Task, userState: UserState) {
    return computeOverrideCost(task, {
      energy: userState.energy,
      dailyBudget: userState.dailyBudget,
      burnoutScore: userState.burnoutScore,
      overridesLast2h: userState.overridesLast2h
    });
  }

// Trouver un consensus en cas de conflit
  findConsensus(userWants: Task, systemRefuses: any) {
    return this.voteEngine.findConsensus(userWants, systemRefuses);
  }

// Enregistrer un conflit
  registerConflict(userRequest: Task, systemRejection: any) {
    return this.conflictResolver.registerConflict(userRequest, systemRejection);
  }

  // Résoudre un conflit
  resolveConflict(conflictId: string, userChoice: number) {
    return this.conflictResolver.resolveInternally(conflictId, userChoice);
  }

  // Mettre à jour le mode de souveraineté
  updateSovereigntyMode(newMode: SovereigntyMode) {
    // Vérifier si la transition est autorisée
    const currentMode = this.sovereigntyManager.currentMode;
    
    // Certains changements de mode nécessitent une confirmation
    if (currentMode === SovereigntyMode.PROTECTIVE) {
      if (!this.protectiveModeManager.canExit()) {
        console.log("Impossible de changer de mode. Le mode protectif est actif.");
        return false;
      }
    }
    
    // Effectuer la transition
    try {
      // Pour cet exemple, nous simulons une transition utilisateur
      // Dans une implémentation réelle, cela utiliserait les méthodes appropriées
      this.sovereigntyManager.currentMode = newMode;
      this.sovereigntyManager.lastActivityTimestamp = Date.now();
      this.governanceDashboard.updateCurrentMode(newMode);
      
      console.log(`Mode changé: ${SovereigntyMode[currentMode]} → ${SovereigntyMode[newMode]}`);
      return true;
    } catch (error) {
      console.error("Erreur lors du changement de mode:", error);
      return false;
    }
  }

  // Obtenir le tableau de bord de gouvernance
  getGovernanceDashboard() {
    return this.governanceDashboard;
  }

  // Obtenir le gestionnaire de souveraineté
  getSovereigntyManager() {
    return this.sovereigntyManager;
  }

  // Obtenir le gestionnaire de mode protectif
  getProtectiveModeManager() {
    return this.protectiveModeManager;
  }

  // Obtenir le résolveur de conflits
  getConflictResolver() {
    return this.conflictResolver;
  }

  // Générer un rapport de gouvernance
  generateGovernanceReport() {
    return this.governanceDashboard.generateReport();
  }

  // Vérifier les contraintes non négociables
  checkNonNegotiables(userState: UserState): string[] {
    const violations: string[] = [];

    // Vérifier la charge quotidienne maximale
    // (Simulation - dans une implémentation réelle, cela utiliserait les données réelles)
    const dailyLoad = 1.0; // Valeur simulée
    if (dailyLoad > NON_NEGOTIABLES.maxDailyLoad) {
      violations.push("Charge quotidienne maximale dépassée");
    }

    // Vérifier le temps de récupération minimum
    // (Simulation - dans une implémentation réelle, cela utiliserait les données réelles)
    const recoveryTime = 7 * 60 * 60 * 1000; // 7 heures en ms (valeur simulée)
    if (recoveryTime < NON_NEGOTIABLES.minRecoveryTime) {
      violations.push("Temps de récupération minimum non respecté");
    }

    return violations;
  }
}

// Instance singleton du gestionnaire de Phase 7
export const phase7Manager = new Phase7Manager();