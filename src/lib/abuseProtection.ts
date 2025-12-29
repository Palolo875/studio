// Abuse Protection - Protection contre l'abus utilisateur
// Implémentation du garde-fou contre l'abus de l'utilisateur

import { createLogger } from '@/lib/logger';

const logger = createLogger('AbuseProtection');

// Interface pour la protection contre l'abus
export interface AbuseProtectionConfig {
  maxOverrideRate: number;  // Taux maximum d'overrides autorisé
  maxConsecutiveDays: number;  // Nombre maximum de jours consécutifs
  adaptationFreeze: boolean;  // Gel des adaptations en cas d'abus
  suggestManualMode: boolean;  // Suggestion de passer en mode manuel
}

// Configuration par défaut pour la protection contre l'abus
export const ABUSE_PROTECTION_CONFIG: AbuseProtectionConfig = {
  maxOverrideRate: 0.8,  // 80% d'overrides
  maxConsecutiveDays: 14,  // 14 jours consécutifs
  adaptationFreeze: true,  // Gel des adaptations
  suggestManualMode: true  // Suggestion de mode manuel
};

// Interface pour le suivi des overrides
export interface OverrideTracking {
  userId: string;
  timestamp: number;
  taskId?: string;
  reason?: string;
}

// Classe pour gérer la protection contre l'abus
export class AbuseProtectionManager {
  private config: AbuseProtectionConfig;
  private overrideHistory: OverrideTracking[] = [];
  private adaptationFrozen: boolean = false;
  private manualModeSuggested: boolean = false;
  
  constructor(config: Partial<AbuseProtectionConfig> = {}) {
    this.config = {
      ...ABUSE_PROTECTION_CONFIG,
      ...config
    };
  }
  
  // Obtenir la configuration actuelle
  getConfig(): AbuseProtectionConfig {
    return { ...this.config };
  }
  
  // Mettre à jour la configuration
  updateConfig(newConfig: Partial<AbuseProtectionConfig>): void {
    this.config = {
      ...this.config,
      ...newConfig
    };
  }
  
  // Enregistrer un override
  recordOverride(override: OverrideTracking): void {
    this.overrideHistory.push(override);
    
    // Vérifier s'il y a un abus potentiel
    this.checkForAbuse();
  }
  
  // Vérifier s'il y a un abus potentiel
  private checkForAbuse(): void {
    const now = Date.now();
    const periodStart = now - (this.config.maxConsecutiveDays * 24 * 60 * 60 * 1000);
    
    // Filtrer les overrides dans la période
    const recentOverrides = this.overrideHistory.filter(
      override => override.timestamp > periodStart
    );
    
    // Calculer le taux d'overrides (simplifié - nécessiterait un dénominateur réel)
    const overrideRate = recentOverrides.length / Math.max(1, this.overrideHistory.length);
    
    // Vérifier si le taux dépasse le seuil
    if (overrideRate > this.config.maxOverrideRate) {
      this.handlePotentialAbuse();
    }
  }
  
  // Gérer un abus potentiel
  private handlePotentialAbuse(userCognitiveStatus: 'NORMAL' | 'DEPLETED' = 'NORMAL'): void {
    logger.warn('POTENTIAL_ABUSE_DETECTED');
    
    // Principe de Protection Asymétrique
    if (userCognitiveStatus === 'DEPLETED') {
      // En état de fatigue cognitive : protection automatique + notification simple
      this.applyProtectiveChanges();
      this.showSimpleNotification("Mode protecteur activé. Reposez-vous.");
    } else {
      // En état normal : consentement explicite
      // Afficher un message bienveillant à l'utilisateur
      this.showBenevolentMessage({
        tone: "concern",  // Pas accusateur
        title: "Pattern détecté",
        body: `J'ai remarqué que tu forces beaucoup de décisions depuis 2 semaines.

**Deux possibilités :**
1. Les règles par défaut ne te correspondent pas
2. Tu traverses une période exceptionnelle

Qu'est-ce qui correspond le mieux ?`,
        actions: [
          {
            label: "Ajuster les règles",
            action: () => this.openParametersWizard()
          },
          {
            label: "Période temporaire",
            action: () => this.acknowledgeTemporaryPeriod()
          },
          {
            label: "Passer en mode manuel",
            action: () => this.switchToManualMode()
          }
        ]
      });
    }
    
    // Geler les adaptations si configuré
    if (this.config.adaptationFreeze) {
      this.freezeAdaptation();
    }
    
    // Suggérer le mode manuel si configuré
    if (this.config.suggestManualMode) {
      this.suggestManualMode();
    }
  }
  
  // Afficher un message bienveillant à l'utilisateur
  private showBenevolentMessage(message: {
    tone: string;
    title: string;
    body: string;
    actions: { label: string; action: () => void }[];
  }): void {
    logger.info('MESSAGE_TO_USER', { tone: message.tone, title: message.title });
    logger.info('MESSAGE_BODY', { body: message.body });
    logger.info('Actions disponibles', { actions: message.actions.map((a) => a.label) });
    // Dans une implémentation réelle, cela afficherait une notification dans l'UI avec des boutons d'action
  }
  
  // Appliquer les changements protecteurs automatiquement
  private applyProtectiveChanges(): void {
    logger.warn('PROTECTIVE_CHANGES_APPLIED: Mode protecteur activé');
    // Dans une implémentation réelle, cela appliquerait des changements
    // spécifiques pour protéger l'utilisateur (réduction de charge, etc.)
  }
  
  // Afficher une notification simple en mode protecteur
  private showSimpleNotification(message: string): void {
    logger.info('NOTIFICATION', { message });
    // Dans une implémentation réelle, cela afficherait une notification
    // simple dans l'interface utilisateur
  }
  
  // Geler les adaptations
  freezeAdaptation(): void {
    this.adaptationFrozen = true;
    logger.warn('ADAPTATION_FROZEN');
    // Dans une implémentation réelle, cela désactiverait le mécanisme d'adaptation
  }
  
  // Suggérer le mode manuel
  suggestManualMode(): void {
    this.manualModeSuggested = true;
    logger.info('MANUAL_MODE_SUGGESTED');
    // Dans une implémentation réelle, cela proposerait à l'utilisateur de passer en mode manuel
  }
  
  // Vérifier si les adaptations sont gelées
  isAdaptationFrozen(): boolean {
    return this.adaptationFrozen;
  }
  
  // Vérifier si le mode manuel a été suggéré
  isManualModeSuggested(): boolean {
    return this.manualModeSuggested;
  }
  
  // Réinitialiser les indicateurs
  resetIndicators(): void {
    this.adaptationFrozen = false;
    this.manualModeSuggested = false;
  }
  
  // Ouvrir l'assistant de paramètres
  private openParametersWizard(): void {
    logger.info('Opening parameters wizard');
    // Dans une implémentation réelle, cela ouvrirait un assistant pour ajuster les paramètres
  }
  
  // Acknowledger une période temporaire
  private acknowledgeTemporaryPeriod(): void {
    logger.info('Acknowledging temporary period');
    // Dans une implémentation réelle, cela enregistrerait que l'utilisateur traverse une période temporaire
  }
  
  // Nettoyer l'historique des overrides (pour éviter une accumulation infinie)
  cleanupHistory(daysToKeep: number = 30): void {
    const cutoffTime = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
    this.overrideHistory = this.overrideHistory.filter(
      override => override.timestamp > cutoffTime
    );
  }
}