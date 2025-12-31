import {
    AdaptationSignal,
    AdaptationAggregate,
    Parameters,
    ParameterDelta,
    ADAPTATION_CONSTRAINTS,
    clampParameters
} from './adaptationMemory';
import { aggregateWeek } from './adaptationAggregator';
import { applyAdjustmentRules } from './adaptationRules';
import { AdaptationGovernanceManager } from './adaptationGovernance';
import { AdaptationRollbackManager } from './adaptationRollback';
import { DriftMonitor } from './adaptationController';
import { AntiOverfittingEngine, AdaptationSample } from './antiOverfitting';
import { computeProgressMetrics, UserProgressMetrics } from './progressMetrics';
import { AdaptationValidationManager, AdaptationProposal } from './adaptationValidation';
import { createLogger } from '@/lib/logger';

type TaskLike = {
    tangibleResult?: boolean;
    status?: string;
    estimatedDuration?: number;
    actualDuration?: number;
    createdAt?: Date | number;
};

type SessionLike = {
    plannedTasks: number;
    completedTasks: number;
};

type OverrideLike = {
    timestamp: number;
};

const logger = createLogger('AdaptationEngine');

/**
 * AdaptationEngine - Moteur central d'adaptation et d'apprentissage (Phase 6)
 * Intègre la mémoire, l'agrégation, les règles, la gouvernance et l'anti-overfitting.
 */
export class AdaptationEngine {
    private governance: AdaptationGovernanceManager;
    private rollback: AdaptationRollbackManager;
    private driftMonitor: DriftMonitor;
    private antiOverfitting: AntiOverfittingEngine;
    private validation: AdaptationValidationManager;

    private currentParams: Parameters;
    private signals: AdaptationSignal[] = [];

    constructor(initialParams: Parameters) {
        this.currentParams = initialParams;
        this.governance = new AdaptationGovernanceManager();
        this.rollback = new AdaptationRollbackManager();
        this.driftMonitor = new DriftMonitor();
        this.antiOverfitting = new AntiOverfittingEngine();
        this.validation = new AdaptationValidationManager();

        this.driftMonitor.track(this.currentParams);
    }

    /**
     * Enregistre un signal d'adaptation (Phase 6.1)
     */
    recordSignal(signal: AdaptationSignal): void {
        // Invariant XLVIII : Max 500 signaux
        if (this.signals.length >= ADAPTATION_CONSTRAINTS.ADAPTATION_MEMORY.maxSize) {
            this.signals.shift(); // FIFO pruning
        }
        this.signals.push(signal);

        // Aligner avec l'anti-overfitting
        this.antiOverfitting.addAdaptationSample({
            id: `sample_${Date.now()}`,
            timestamp: Date.now(),
            inputData: signal.context,
            predictedOutput: null,
            actualOutput: signal.type,
            accuracy: 1.0 // Par défaut
        });
    }

    /**
     * Cycle d'adaptation hebdomadaire (Phase 6.2 & 6.3)
     */
    async runWeeklyAdaptation(): Promise<AdaptationProposal | null> {
        // 1. Invariant L : Protection Abus
        const last30DaysSignals = this.signals.filter(s => s.timestamp > Date.now() - 30 * 24 * 60 * 60 * 1000);
        const overrides = last30DaysSignals.filter(s => s.type === "FORCED_TASK").length;
        const total = Math.max(last30DaysSignals.length, 1);
        const overrideRate = overrides / total;

        if (overrideRate > ADAPTATION_CONSTRAINTS.ABUSE_PROTECTION.maxOverrideRate && total > 20) {
            logger.warn("Adaptation gelée : Taux d'abus trop élevé (Invariant L).", { overrideRate, total });
            return null;
        }

        // 2. Invariant XLIX : Budget de Transparence (Max 3/semaine)
        const recentAdaptations = this.rollback.getAdaptationHistory().filter(a => a.timestamp > Date.now() - 7 * 24 * 60 * 60 * 1000);
        if (recentAdaptations.length >= ADAPTATION_CONSTRAINTS.TRANSPARENCY_BUDGET.maxPerWeek) {
            logger.info('Budget de transparence atteint pour cette semaine (Invariant XLIX).', { count: recentAdaptations.length });
            return null;
        }

        // Invariant XLVII : Fenêtre d'observation min 30 jours (simulée ici avec 50 signaux)
        if (this.signals.length < 50) {
            logger.info('Pas assez de signaux pour adapter.', { signals: this.signals.length });
            return null;
        }

        // 3. Agrégation
        const aggregate = aggregateWeek(this.signals);

        // 4. Application des règles
        const proposedParams = applyAdjustmentRules(aggregate, this.currentParams);

        // 5. Calcul du delta
        const deltas: ParameterDelta[] = [];
        for (const key in proposedParams) {
            const k = key as keyof Parameters;
            if (proposedParams[k] !== this.currentParams[k]) {
                deltas.push({
                    parameterName: k,
                    oldValue: this.currentParams[k],
                    newValue: proposedParams[k]
                });
            }
        }

        if (deltas.length === 0) return null;

        // 6. Invariant XLV : Validation et Consentement
        const requiresConsent = deltas.some(d => {
            if (d.parameterName === 'maxTasks' && d.newValue > ADAPTATION_CONSTRAINTS.ADAPTATION_VALIDATION.threshold.maxTasks) return true;
            if (d.parameterName === 'strictness' && d.newValue < ADAPTATION_CONSTRAINTS.ADAPTATION_VALIDATION.threshold.strictness) return true;
            return false;
        });

        const proposal = this.validation.proposeAdaptationChange({
            proposedChanges: deltas,
            reason: "Optimisation basée sur vos patterns d'utilisation de la semaine dernière.",
            userConsentRequired: requiresConsent,
            impact: {
                currentBehavior: "Configuration standard",
                proposedBehavior: "Configuration optimisée pour votre rythme",
                estimatedEffect: "POSITIVE",
                confidence: 0.85
            }
        });

        // Si pas de consentement requis, on applique tout de suite
        if (!requiresConsent) {
            this.applyProposal(proposal);
        }

        return proposal;
    }

    /**
     * Applique une proposition validée
     */
    applyProposal(proposal: AdaptationProposal): void {
        // Applique les changements
        proposal.proposedChanges.forEach(d => {
            (this.currentParams as any)[d.parameterName] = d.newValue;
        });

        // Clamp final (Invariant XLII, XLIII, XLIV)
        this.currentParams = clampParameters(this.currentParams);

        // Invariant XLVI : Tracking historique
        this.rollback.recordAdaptation({
            id: proposal.id,
            timestamp: proposal.timestamp,
            parameterChanges: proposal.proposedChanges,
            qualityBefore: 0.8, // Mock
            qualityAfter: 0.85, // Mock
            userConsent: proposal.consentGiven ? "ACCEPTED" : "POSTPONED"
        });

        // Drift Monitoring
        this.driftMonitor.track(this.currentParams);

        logger.info('Adaptation appliquée', { proposalId: proposal.id });
    }

    /**
     * Calcule les métriques de progression (Phase 6.4)
     */
    getProgress(tasks: TaskLike[], sessions: SessionLike[], overrides: OverrideLike[]): UserProgressMetrics {
        return computeProgressMetrics(tasks, sessions, overrides);
    }

    /**
     * Invariants de Gouvernance
     */
    checkInvariants(): boolean {
        const drift = this.driftMonitor.detectDrift();
        if (drift) {
            logger.warn('Dérive détectée', { parameter: drift.parameter });
            return false;
        }
        return true;
    }

    getCurrentParams(): Parameters {
        return { ...this.currentParams };
    }
}
