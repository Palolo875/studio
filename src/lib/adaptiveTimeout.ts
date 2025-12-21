/**
 * Gestionnaire de timeouts adaptatifs - Phase 4
 * Implémente des timeouts qui s'adaptent aux capacités du hardware
 */

// Interface pour les informations sur le device
export interface DeviceInfo {
  ram: number;    // RAM en GB
  cores: number;  // Nombre de cœurs CPU
}

// Configuration par défaut des timeouts
export const TIMEOUT_CONFIG = {
  base: 100,      // Timeout de base en ms
  multiplier: 2.5 // Multiplicateur pour les devices low-end
};

// Seuils pour considérer un device comme low-end
export const DEVICE_THRESHOLDS = {
  ram: 4,    // GB
  cores: 6   // Nombre de cœurs
};

/**
 * Calcule le timeout adaptatif en fonction des caractéristiques du device
 * @param device Informations sur le device
 * @returns Timeout en millisecondes
 */
export function computeTimeout(device: DeviceInfo): number {
  const base = TIMEOUT_CONFIG.base;
  
  // Vérifier si le device est considéré comme low-end
  if (device.ram < DEVICE_THRESHOLDS.ram || device.cores < DEVICE_THRESHOLDS.cores) {
    return base * TIMEOUT_CONFIG.multiplier;
  }
  
  return base;
}

/**
 * Classe de gestion des timeouts adaptatifs
 */
export class AdaptiveTimeout {
  private deviceInfo: DeviceInfo;
  
  constructor(deviceInfo?: DeviceInfo) {
    this.deviceInfo = deviceInfo || this.detectDeviceInfo();
  }
  
  /**
   * Détecte automatiquement les informations sur le device
   * @returns Informations sur le device
   */
  private detectDeviceInfo(): DeviceInfo {
    let ram = 4; // Valeur par défaut
    let cores = 4; // Valeur par défaut
    
    // Essayer d'obtenir les informations de navigation
    if (typeof navigator !== 'undefined') {
      // Approximation de la RAM disponible
      if ('deviceMemory' in navigator) {
        // @ts-ignore
        ram = navigator.deviceMemory || ram;
      }
      
      // Nombre de cœurs
      if ('hardwareConcurrency' in navigator) {
        // @ts-ignore
        cores = navigator.hardwareConcurrency || cores;
      }
    }
    
    return { ram, cores };
  }
  
  /**
   * Obtient le timeout adaptatif pour le device actuel
   * @returns Timeout en millisecondes
   */
  getTimeout(): number {
    return computeTimeout(this.deviceInfo);
  }
  
  /**
   * Exécute une fonction avec un timeout adaptatif
   * @param fn Fonction à exécuter
   * @param timeout Timeout personnalisé (optionnel)
   * @returns Promesse résolue avec le résultat de la fonction ou rejetée si timeout
   */
  async executeWithTimeout<T>(fn: () => Promise<T>, timeout?: number): Promise<T> {
    const timeoutValue = timeout || this.getTimeout();
    
    return new Promise<T>((resolve, reject) => {
      // Créer un timeout
      const timer = setTimeout(() => {
        reject(new Error(`Timeout dépassé: ${timeoutValue}ms`));
      }, timeoutValue);
      
      // Exécuter la fonction
      fn()
        .then(result => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }
  
  /**
   * Met à jour les informations sur le device
   * @param deviceInfo Nouvelles informations sur le device
   */
  updateDeviceInfo(deviceInfo: DeviceInfo): void {
    this.deviceInfo = deviceInfo;
  }
  
  /**
   * Obtient les informations sur le device actuel
   * @returns Informations sur le device
   */
  getDeviceInfo(): DeviceInfo {
    return { ...this.deviceInfo };
  }
  
  /**
   * Vérifie si le device actuel est considéré comme low-end
   * @returns true si le device est low-end, false sinon
   */
  isLowEndDevice(): boolean {
    return this.deviceInfo.ram < DEVICE_THRESHOLDS.ram || 
           this.deviceInfo.cores < DEVICE_THRESHOLDS.cores;
  }
}

// Instance singleton du gestionnaire de timeouts adaptatifs
export const adaptiveTimeout = new AdaptiveTimeout();