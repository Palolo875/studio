// Adaptation Governance - Gouvernance éthique des adaptations
// Implémentation de l'étape 3.2 : Gouvernance Éthique des Adaptations

import { ParameterDelta } from './adaptationMemory';
import { createLogger } from '@/lib/logger';

const logger = createLogger('AdaptationGovernance');

// Interface pour le journal d'historique des adaptations
export interface AdaptationHistoryLog {
  id: string;
  timestamp: number;
  changes: ParameterDelta[];
  reason: string;
  userId: string;
}

// Interface pour les préférences utilisateur
export interface UserPreferences {
  userId: string;
  preferences: Record<string, unknown>;
}

// Classe pour gérer la gouvernance éthique des adaptations
export class AdaptationGovernanceManager {
  private adaptationLogs: AdaptationHistoryLog[] = [];
  private userPreferences: Map<string, UserPreferences> = new Map();
  private maxLogSize: number = 500; // Limite pour éviter une accumulation infinie
  
  constructor() {}
  
  // Enregistrer un changement d'adaptation dans le journal
  logAdaptationHistory(logEntry: Omit<AdaptationHistoryLog, 'id' | 'timestamp'>): AdaptationHistoryLog {
    const log: AdaptationHistoryLog = {
      id: this.generateId(),
      timestamp: Date.now(),
      ...logEntry
    };
    
    this.adaptationLogs.push(log);
    
    // Limiter la taille du journal
    if (this.adaptationLogs.length > this.maxLogSize) {
      this.adaptationLogs.shift(); // Supprimer la plus ancienne entrée
    }
    
    // Afficher un message à l'utilisateur
    this.showMessage(`Adaptation effectuée : ${log.reason}`);
    
    return log;
  }
  
  // Générer un ID unique
  private generateId(): string {
    return 'log_' + Date.now();
  }
  
  // Afficher un message à l'utilisateur
  private showMessage(message: string): void {
    logger.info('NOTIFICATION', { message });
    // Dans une implémentation réelle, cela afficherait une notification dans l'UI
  }
  
  // Afficher l'historique des adaptations
  showAdaptationHistory(): void {
    const logs = this.getAdaptationLogs();
    this.displayLogsOnUI(logs);
  }
  
  // Obtenir les journaux d'adaptation
  getAdaptationLogs(): AdaptationHistoryLog[] {
    return [...this.adaptationLogs];
  }
  
  // Obtenir les journaux d'adaptation pour un utilisateur spécifique
  getUserAdaptationLogs(userId: string): AdaptationHistoryLog[] {
    return this.adaptationLogs.filter(log => log.userId === userId);
  }
  
  // Afficher les journaux dans l'interface utilisateur
  displayLogsOnUI(logs: AdaptationHistoryLog[]): void {
    logs.forEach(log => {
      const logEntry = `
        Date: ${new Date(log.timestamp).toLocaleString()}
        Modifications: ${log.changes.map(c => `${c.parameterName}: ${c.oldValue} → ${c.newValue}`).join(", ")}
        Raison: ${log.reason}
      `;
      this.showNotification(logEntry);
    });
  }
  
  // Afficher une notification
  private showNotification(message: string): void {
    logger.info('NOTIFICATION', { message });
    // Dans une implémentation réelle, cela afficherait une notification dans l'UI
  }
  
  // Vérifier que l'adaptation respecte les préférences utilisateur
  validateAgainstUserPreferences(userId: string, changes: ParameterDelta[]): boolean {
    const preferences = this.userPreferences.get(userId);
    
    if (!preferences) {
      // Si aucune préférence n'est définie, l'adaptation est considérée comme valide
      return true;
    }
    
    // Vérifier chaque changement par rapport aux préférences
    for (const change of changes) {
      // Exemple de validation - dans une vraie application, cela serait plus complexe
      if (preferences.preferences.hasOwnProperty(change.parameterName)) {
        const userPref = preferences.preferences[change.parameterName];
        
        // Vérifier si le changement va à l'encontre des préférences utilisateur
        if (this.isChangeAgainstPreferences(change, userPref)) {
          return false;
        }
      }
    }
    
    return true;
  }
  
  // Vérifier si un changement va à l'encontre des préférences utilisateur
  private isChangeAgainstPreferences(change: ParameterDelta, userPref: unknown): boolean {
    // Implémentation simplifiée - dans une vraie application, cela serait plus complexe
    // Par exemple, si l'utilisateur préfère un nombre maximum de tâches et que le changement le dépasse
    if (change.parameterName === 'maxTasks' && 
        typeof change.newValue === 'number' && 
        typeof userPref === 'number' && 
        change.newValue > userPref) {
      return true;
    }
    
    return false;
  }
  
  // Définir les préférences utilisateur
  setUserPreferences(preferences: UserPreferences): void {
    this.userPreferences.set(preferences.userId, preferences);
  }
  
  // Obtenir les préférences utilisateur
  getUserPreferences(userId: string): UserPreferences | undefined {
    return this.userPreferences.get(userId);
  }
  
  // Vérifier la transparence des adaptations
  ensureTransparency(log: AdaptationHistoryLog): boolean {
    // Vérifier que le journal contient toutes les informations nécessaires
    if (!log.timestamp || !log.changes || !log.reason) {
      return false;
    }
    
    // Vérifier que chaque changement a une valeur oldValue et newValue
    for (const change of log.changes) {
      if (change.oldValue === undefined || change.newValue === undefined) {
        return false;
      }
    }
    
    return true;
  }
  
  // Nettoyer les anciens journaux
  cleanupOldLogs(maxAgeDays: number = 90): void {
    const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;
    const cutoffTime = Date.now() - maxAgeMs;
    
    this.adaptationLogs = this.adaptationLogs.filter(
      log => log.timestamp > cutoffTime
    );
  }
  
  // Exporter l'historique des adaptations
  exportAdaptationHistory(): string {
    return JSON.stringify(this.adaptationLogs, null, 2);
  }
}