// System Autonomy - Limitation de l'autonomie systémique
// Implémentation de l'étape 3.3 : Limiter l'Autonomie Systémique et Empêcher les Dérives

import { ParameterDelta } from './adaptationMemory';
import { createLogger } from '@/lib/logger';

const logger = createLogger('SystemAutonomy');

// Interface pour les paramètres système par défaut
export interface SystemDefaults {
  maxTasks: number;
  strictness: number;
  coachFrequency: number;
  [key: string]: any;
}

// Classe pour gérer la limitation de l'autonomie systémique
export class SystemAutonomyManager {
  private static readonly MAX_ADAPTATION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 jours
  private lastAdaptationTimestamp: number = Date.now();
  private systemDefaults: SystemDefaults;
  private adaptationHistory: ParameterDelta[] = [];
  
  constructor(systemDefaults: SystemDefaults) {
    this.systemDefaults = systemDefaults;
  }
  
  // Enregistrer une adaptation
  recordAdaptation(changes: ParameterDelta[]): void {
    this.adaptationHistory.push(...changes);
    this.lastAdaptationTimestamp = Date.now();
  }
  
  // Évaluer la validité des adaptations
  evaluateAdaptationValidity(): boolean {
    const timeSinceLastAdaptation = Date.now() - this.lastAdaptationTimestamp;
    
    if (timeSinceLastAdaptation > SystemAutonomyManager.MAX_ADAPTATION_DURATION) {
      // Proposer un reset de l'adaptation
      this.showAdaptationProposal({
        proposedChanges: this.getSystemDefaultValues(),
        reason: "Les ajustements du système ont dépassé 30 jours. Un reset est recommandé.",
        userConsentRequired: true,
        consentGiven: null
      });
      return false;
    }
    
    return true;
  }
  
  // Obtenir les valeurs par défaut du système
  getSystemDefaultValues(): ParameterDelta[] {
    const defaults: ParameterDelta[] = [];
    
    for (const [key, value] of Object.entries(this.systemDefaults)) {
      // Créer un delta fictif pour représenter le retour aux valeurs par défaut
      defaults.push({
        parameterName: key,
        oldValue: "current_value", // Valeur actuelle (fictive)
        newValue: value
      });
    }
    
    return defaults;
  }
  
  // Proposer un changement d'adaptation
  showAdaptationProposal(change: {
    proposedChanges: ParameterDelta[];
    reason: string;
    userConsentRequired: boolean;
    consentGiven: boolean | null;
  }): void {
    logger.info('Showing adaptation proposal', {
      title: "Réévaluation des adaptations",
      body: change.reason,
      changes: change.proposedChanges,
      actions: [
        { label: "Accepter", value: "ACCEPT" },
        { label: "Refuser", value: "REJECT" },
        { label: "Reporter", value: "POSTPONE" }
      ]
    });
    
    // Dans une implémentation réelle, cela afficherait un modal dans l'UI
  }
  
  // Réinitialiser les adaptations
  resetAdaptations(): void {
    logger.info('Resetting adaptations to default values');
    this.adaptationHistory = [];
    this.lastAdaptationTimestamp = Date.now();
    
    // Appliquer les valeurs par défaut
    const defaultChanges = this.getSystemDefaultValues();
    this.applyChanges(defaultChanges);
  }
  
  // Appliquer les changements
  private applyChanges(changes: ParameterDelta[]): void {
    logger.debug('Applying changes', { changes });
    // Dans une implémentation réelle, cela appliquerait les changements aux paramètres du système
  }
  
  // Vérifier la stabilité des adaptations
  checkAdaptationStability(): {
    stable: boolean;
    issues: string[];
  } {
    const issues: string[] = [];
    
    // Vérifier si trop de changements ont été appliqués
    if (this.adaptationHistory.length > 50) {
      issues.push("Too many adaptations applied");
    }
    
    // Vérifier si les adaptations sont trop récentes
    const timeSinceLastAdaptation = Date.now() - this.lastAdaptationTimestamp;
    if (timeSinceLastAdaptation < 24 * 60 * 60 * 1000) { // Moins de 24 heures
      issues.push("Recent adaptations may need stabilization");
    }
    
    return {
      stable: issues.length === 0,
      issues
    };
  }
  
  // Forcer une réévaluation
  forceReevaluation(): void {
    this.lastAdaptationTimestamp = 0; // Forcer la réévaluation lors du prochain appel
  }
  
  // Obtenir le temps écoulé depuis la dernière adaptation
  getTimeSinceLastAdaptation(): number {
    return Date.now() - this.lastAdaptationTimestamp;
  }
  
  // Obtenir l'historique des adaptations
  getAdaptationHistory(): ParameterDelta[] {
    return [...this.adaptationHistory];
  }
  
  // Nettoyer l'historique des adaptations
  cleanupAdaptationHistory(maxAgeDays: number = 30): void {
    // Dans cette implémentation simplifiée, nous vidons simplement l'historique
    // Dans une implémentation réelle, nous aurions des timestamps sur chaque entrée
    const timeSinceLastAdaptation = Date.now() - this.lastAdaptationTimestamp;
    const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;
    
    if (timeSinceLastAdaptation > maxAgeMs) {
      this.adaptationHistory = [];
    }
  }
}