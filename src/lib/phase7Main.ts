// Point d'entrée principal pour la Phase 7
// Intègre tous les composants de la Phase 7 et connecte les moteurs

import { AuthorityContract, AuthorityContext, NON_NEGOTIABLES } from './phase7Implementation';
import { calculateBurnoutScore, type BurnoutDetectionResult } from './burnout/BurnoutEngine';
import { SovereigntyManager, SovereigntyMode } from './modeEngine';
import { computeOverrideCost, UserContext } from './costEngine';
import { VoteEngine, ConsensusMode, type Task as VoteTask } from './voteEngine';

import { GovernanceDashboard } from './governanceDashboard';
import { ConflictResolver } from './conflictResolution';
import { ProtectiveModeManager } from './protectiveMode';
import { getSessionsByDate, getOverridesByPeriod } from './database/index';
import { createLogger } from '@/lib/logger';
import { db } from '@/lib/database';

type TaskLike = {
  effort?: string;
};

const logger = createLogger('Phase7Main');

// Classe principale pour la Phase 7
export class Phase7Manager {
  private authorityContract: AuthorityContract;
  private authorityContext: AuthorityContext;
  private sovereigntyManager: SovereigntyManager;
  private voteEngine: VoteEngine;
  private governanceDashboard: GovernanceDashboard;
  private conflictResolver: ConflictResolver;
  private protectiveModeManager: ProtectiveModeManager;
  private lastBurnoutResult: BurnoutDetectionResult | null = null;

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
  async checkBurnoutAndProtect(): Promise<BurnoutDetectionResult | null> {
    try {
      // Calculer le score de burnout via le moteur connecté à la DB
      const burnoutResult = await calculateBurnoutScore();
      this.lastBurnoutResult = burnoutResult;

      // Mettre à jour le risque de burnout dans le tableau de bord
      this.governanceDashboard.updateBurnoutRisk(burnoutResult.score);

      // Mettre à jour le taux d'overrides avec les données réelles (7 jours)
      try {
        const now = Date.now();
        const periodStart = now - (7 * 24 * 60 * 60 * 1000);
        const overrides = await getOverridesByPeriod(periodStart);
        const sessions = await db.sessions.where('timestamp').above(periodStart).toArray();
        const totalDecisions = sessions.reduce((sum: number, s: { plannedTasks?: number }) => sum + (s.plannedTasks ?? 0), 0);
        const overrideRate = totalDecisions > 0 ? overrides.length / totalDecisions : 0;
        this.governanceDashboard.updateOverrideRate(overrideRate);
      } catch {
        this.governanceDashboard.updateOverrideRate(0);
      }

      // Vérifier si le mode protectif doit être activé
      if (burnoutResult.riskLevel === 'high' || burnoutResult.riskLevel === 'critical' || burnoutResult.score >= 0.75) {
        // Générer une notification
        const notification = this.protectiveModeManager.generateNotification(burnoutResult);
        logger.warn('Burnout Alert', { notification });

        // Activer le mode protectif
        this.protectiveModeManager.activate("Signaux de burnout détectés");
      }

      // Appliquer les restrictions du mode protectif si actif
      if (this.protectiveModeManager.isActive()) {
        this.protectiveModeManager.applyRestrictions();
      }

      return burnoutResult;
    } catch (error) {
      logger.error('Erreur lors de la vérification du burnout', error as Error);
      return this.lastBurnoutResult;
    }
  }

  getLastBurnoutResult(): BurnoutDetectionResult | null {
    return this.lastBurnoutResult;
  }

  // Calculer le coût d'un override en récupérant le contexte actuel
  async calculateOverrideCost(task: TaskLike) {
    // Récupérer les données pour le contexte
    const burnoutResult = await calculateBurnoutScore();

    // Récupérer la dernière session pour l'énergie
    const today = new Date();
    const sessions = await getSessionsByDate(today);
    const lastSession = sessions[sessions.length - 1];

    const totalPlanned = sessions.reduce((sum: number, s: { plannedTasks?: number }) => sum + (s.plannedTasks ?? 0), 0);
    const totalCompleted = sessions.reduce((sum: number, s: { completedTasks?: number }) => sum + (s.completedTasks ?? 0), 0);
    const budgetTotal = Math.max(totalPlanned, 1);
    const budgetRemaining = Math.max(budgetTotal - totalCompleted, 0);

    const energy =
      lastSession?.energyLevel === 'high'
        ? 'HIGH'
        : lastSession?.energyLevel === 'low'
          ? 'LOW'
          : 'MEDIUM';

    // Récupérer les overrides récents (2h)
    const twoHoursAgo = Date.now() - (2 * 60 * 60 * 1000);
    const recentOverrides = await getOverridesByPeriod(twoHoursAgo);

    // Construire le contexte utilisateur
    const userContext: UserContext = {
      energy,
      dailyBudget: {
        remaining: budgetRemaining,
        total: budgetTotal,
      },
      burnoutScore: burnoutResult.score,
      overridesLast2h: recentOverrides.length
    };

    return computeOverrideCost(task, userContext);
  }

  // Trouver un consensus en cas de conflit
  findConsensus(userWants: VoteTask, systemRefuses: any) {
    return this.voteEngine.findConsensus(userWants, systemRefuses);
  }

  // Enregistrer un conflit
  registerConflict(userRequest: VoteTask, systemRejection: any) {
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
        logger.info('Impossible de changer de mode. Le mode protectif est actif.');
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

      logger.info('Mode changé', { from: SovereigntyMode[currentMode], to: SovereigntyMode[newMode] });
      return true;
    } catch (error) {
      logger.error('Erreur lors du changement de mode', error as Error);
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

  // Vérifier les contraintes non négociables avec les données réelles
  async checkNonNegotiables(): Promise<string[]> {
    const violations: string[] = [];

    try {
      // 1. Vérifier la charge quotidienne maximale
      const today = new Date();
      // On utilise la fonction real de burnoutEngine (qui est maintenant exportée)
      // Note: Je dois m'assurer d'importer calculateDailyLoad si je veux l'utiliser ici
      // Ou utiliser calculateBurnoutScore qui me donne déjà des signaux

      const burnoutResult = await calculateBurnoutScore();

      // Si signal de surcharge chronique, c'est une violation
      if (burnoutResult.signals.chronicOverload) {
        violations.push("Surcharge chronique détectée (limite système atteinte)");
      }

      // 2. Vérifier le temps de récupération minimum
      // On récupère la dernière donnée de sommeil
      // Note: getSleepDataByPeriod est dispo dans database
      // Mais burnoutResult a déjà analysé sleepDebt

      if (burnoutResult.signals.sleepDebt) {
        violations.push("Dette de sommeil critique (récupération insuffisante)");
      }

      // 3. Vérifier les signaux éthiques (refus système)
      if (burnoutResult.signals.overrideAbuse) {
        violations.push("Abus du mécanisme de contournement (autorité système compromise)");
      }

    } catch (error) {
      logger.error('Erreur lors de la vérification des non-négociables', error as Error);
    }

    return violations;
  }
}

// Instance singleton du gestionnaire de Phase 7
export const phase7Manager = new Phase7Manager();