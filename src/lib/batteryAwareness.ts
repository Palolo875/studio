/**
 * Système de détection et d'adaptation au mode économie d'énergie - Phase 4
 * Implémente l'adaptation de l'application selon l'état de la batterie
 */

import { createLogger } from '@/lib/logger';

const logger = createLogger('BatteryAwareness');

// Interface pour l'état de la batterie
export interface BatteryState {
  charging: boolean;        // En charge
  level: number;            // Niveau de batterie (0-1)
  chargingTime: number;     // Temps restant avant charge complète (secondes)
  dischargingTime: number;  // Temps restant avant décharge complète (secondes)
}

// Interface pour le mode d'économie d'énergie
export interface PowerSaveState {
  enabled: boolean;         // Mode économie d'énergie activé
  level: 'low' | 'medium' | 'high'; // Niveau d'économie
}

// Configuration par défaut
export const BATTERY_CONFIG = {
  criticalLevel: 0.15,      // 15% - niveau critique
  lowLevel: 0.30,           // 30% - niveau bas
  refreshRate: {
    normal: 60,             // 60 secondes
    powerSave: 600          // 600 secondes (10 minutes)
  },
  powerSaveThreshold: 0.20  // 20% - seuil pour activer l'économie d'énergie
};

/**
 * Classe de gestion de la conscience batterie
 */
export class BatteryAwareness {
  private battery: any = null; // Objet Battery API
  private powerSaveState: PowerSaveState = { enabled: false, level: 'low' };
  private currentRefreshRate: number = BATTERY_CONFIG.refreshRate.normal;
  private onBatteryChangeCallback: ((state: BatteryState) => void) | null = null;
  private onPowerSaveChangeCallback: ((state: PowerSaveState) => void) | null = null;
  
  /**
   * Initialise le système de conscience batterie
   */
  async initialize(): Promise<void> {
    try {
      // Vérifier si l'API Battery est disponible
      if (typeof (navigator as any).getBattery === 'function') {
        this.battery = await (navigator as any).getBattery();
        
        // Écouter les changements d'état de la batterie
        this.battery.addEventListener('chargingchange', () => this.handleBatteryChange());
        this.battery.addEventListener('levelchange', () => this.handleBatteryChange());
        this.battery.addEventListener('chargingtimechange', () => this.handleBatteryChange());
        this.battery.addEventListener('dischargingtimechange', () => this.handleBatteryChange());
        
        // Vérifier l'état initial
        this.handleBatteryChange();
        
        logger.info('Système initialisé avec succès');
      } else {
        logger.warn('API Battery non disponible');
      }
    } catch (error) {
      logger.error("Erreur lors de l'initialisation", error as Error);
    }
  }
  
  /**
   * Gère les changements d'état de la batterie
   */
  private handleBatteryChange(): void {
    const batteryState = this.getBatteryState();
    
    // Appeler le callback si défini
    if (this.onBatteryChangeCallback) {
      this.onBatteryChangeCallback(batteryState);
    }
    
    // Adapter le mode économie d'énergie
    this.adaptPowerSaveMode(batteryState);
    
    logger.debug('État de la batterie', { batteryState });
  }
  
  /**
   * Adapte le mode économie d'énergie en fonction de l'état de la batterie
   * @param batteryState État actuel de la batterie
   */
  private adaptPowerSaveMode(batteryState: BatteryState): void {
    const newPowerSaveState: PowerSaveState = { ...this.powerSaveState };
    
    // Vérifier si le mode économie d'énergie du système est activé
    // Note: L'API Battery ne fournit pas directement cette information
    // Nous devons nous baser sur d'autres signaux ou l'état de la batterie
    
    // Activer l'économie d'énergie si le niveau est bas
    if (batteryState.level <= BATTERY_CONFIG.powerSaveThreshold) {
      newPowerSaveState.enabled = true;
      newPowerSaveState.level = batteryState.level <= BATTERY_CONFIG.criticalLevel ? 'high' : 'medium';
    } else {
      newPowerSaveState.enabled = false;
      newPowerSaveState.level = 'low';
    }
    
    // Mettre à jour l'état si nécessaire
    if (newPowerSaveState.enabled !== this.powerSaveState.enabled || 
        newPowerSaveState.level !== this.powerSaveState.level) {
      const oldState = { ...this.powerSaveState };
      this.powerSaveState = newPowerSaveState;
      
      logger.info('Mode économie d\'énergie', { powerSaveState: newPowerSaveState });
      
      // Appeler le callback si défini
      if (this.onPowerSaveChangeCallback) {
        this.onPowerSaveChangeCallback(newPowerSaveState);
      }
      
      // Appliquer les adaptations
      this.applyPowerSaveAdaptations(oldState, newPowerSaveState);
    }
  }
  
  /**
   * Applique les adaptations en fonction du mode économie d'énergie
   * @param oldState Ancien état
   * @param newState Nouvel état
   */
  private applyPowerSaveAdaptations(oldState: PowerSaveState, newState: PowerSaveState): void {
    // Réduire la fréquence de rafraîchissement
    this.adjustRefreshRate(newState);
    
    // Différer les opérations non critiques
    this.deferNonCriticalTasks(newState);
    
    // Réduire l'utilisation CPU
    this.reduceCPUUsage(newState);
  }
  
  /**
   * Ajuste la fréquence de rafraîchissement
   * @param powerSaveState État du mode économie d'énergie
   */
  private adjustRefreshRate(powerSaveState: PowerSaveState): void {
    let newRefreshRate: number;
    
    if (powerSaveState.enabled) {
      // En mode économie d'énergie, réduire la fréquence de rafraîchissement
      newRefreshRate = BATTERY_CONFIG.refreshRate.powerSave;
    } else {
      // En mode normal, fréquence normale
      newRefreshRate = BATTERY_CONFIG.refreshRate.normal;
    }
    
    if (newRefreshRate !== this.currentRefreshRate) {
      this.currentRefreshRate = newRefreshRate;
      logger.info('Fréquence de rafraîchissement ajustée', { refreshRateSeconds: newRefreshRate });
      
      // Notifier les autres parties de l'application
      this.notifyRefreshRateChange(newRefreshRate);
    }
  }
  
  /**
   * Diffère les opérations non critiques
   * @param powerSaveState État du mode économie d'énergie
   */
  private deferNonCriticalTasks(powerSaveState: PowerSaveState): void {
    if (powerSaveState.enabled) {
      logger.debug('Opérations non critiques différées');
      
      // Implémentation spécifique à l'application
      /*
      if (typeof taskScheduler !== 'undefined') {
        taskScheduler.deferNonCriticalTasks();
      }
      */
    }
  }
  
  /**
   * Réduit l'utilisation CPU
   * @param powerSaveState État du mode économie d'énergie
   */
  private reduceCPUUsage(powerSaveState: PowerSaveState): void {
    if (powerSaveState.enabled) {
      logger.debug('Utilisation CPU réduite');
      
      // Implémentation spécifique à l'application
      /*
      if (typeof animationController !== 'undefined') {
        animationController.reduceFPS();
      }
      */
    }
  }
  
  /**
   * Notifie les autres parties de l'application d'un changement de fréquence de rafraîchissement
   * @param refreshRate Nouvelle fréquence de rafraîchissement
   */
  private notifyRefreshRateChange(refreshRate: number): void {
    // Émettre un événement personnalisé
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('refresh-rate-change', {
        detail: { refreshRate }
      }));
    }
  }
  
  /**
   * Obtient l'état actuel de la batterie
   * @returns État de la batterie ou null si l'API n'est pas disponible
   */
  getBatteryState(): BatteryState | null {
    if (!this.battery) {
      return null;
    }
    
    return {
      charging: this.battery.charging,
      level: this.battery.level,
      chargingTime: this.battery.chargingTime,
      dischargingTime: this.battery.dischargingTime
    };
  }
  
  /**
   * Obtient l'état actuel du mode économie d'énergie
   * @returns État du mode économie d'énergie
   */
  getPowerSaveState(): PowerSaveState {
    return { ...this.powerSaveState };
  }
  
  /**
   * Vérifie si le niveau de batterie est critique
   * @returns true si le niveau est critique, false sinon
   */
  isBatteryCritical(): boolean {
    const batteryState = this.getBatteryState();
    return batteryState ? batteryState.level <= BATTERY_CONFIG.criticalLevel : false;
  }
  
  /**
   * Vérifie si le niveau de batterie est bas
   * @returns true si le niveau est bas, false sinon
   */
  isBatteryLow(): boolean {
    const batteryState = this.getBatteryState();
    return batteryState ? batteryState.level <= BATTERY_CONFIG.lowLevel : false;
  }
  
  /**
   * Obtient la fréquence de rafraîchissement actuelle
   * @returns Fréquence de rafraîchissement en secondes
   */
  getCurrentRefreshRate(): number {
    return this.currentRefreshRate;
  }
  
  /**
   * Définit le callback pour les changements d'état de la batterie
   * @param callback Fonction de rappel
   */
  onBatteryChange(callback: (state: BatteryState) => void): void {
    this.onBatteryChangeCallback = callback;
  }
  
  /**
   * Définit le callback pour les changements de mode économie d'énergie
   * @param callback Fonction de rappel
   */
  onPowerSaveChange(callback: (state: PowerSaveState) => void): void {
    this.onPowerSaveChangeCallback = callback;
  }
  
  /**
   * Force le mode économie d'énergie
   * @param enabled Activer ou désactiver le mode
   * @param level Niveau d'économie
   */
  forcePowerSaveMode(enabled: boolean, level: 'low' | 'medium' | 'high' = 'medium'): void {
    const oldState = { ...this.powerSaveState };
    this.powerSaveState = { enabled, level };
    
    logger.info('Mode économie d\'énergie forcé', { enabled, level });
    
    // Appeler le callback si défini
    if (this.onPowerSaveChangeCallback) {
      this.onPowerSaveChangeCallback(this.powerSaveState);
    }
    
    // Appliquer les adaptations
    this.applyPowerSaveAdaptations(oldState, this.powerSaveState);
  }
}

// Instance singleton du système de conscience batterie
export const batteryAwareness = new BatteryAwareness();