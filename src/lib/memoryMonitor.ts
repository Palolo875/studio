/**
 * Moniteur de mémoire actif - Phase 4
 * Implémente le monitoring continu de l'utilisation mémoire avec enforcement
 */

// Interface pour les statistiques de mémoire
export interface MemoryStats {
  used: number;        // Mémoire utilisée en octets
  total: number;       // Mémoire totale en octets
  limit: number;       // Limite de mémoire en octets
  percent: number;     // Pourcentage d'utilisation
}

// Interface pour les limites de mémoire
export interface MemoryLimits {
  warningThreshold: number;  // Seuil d'avertissement (0-100)
  criticalThreshold: number;  // Seuil critique (0-100)
  checkInterval: number;     // Intervalle de vérification en ms
}

// Configuration par défaut
export const DEFAULT_MEMORY_LIMITS: MemoryLimits = {
  warningThreshold: 80,    // 80%
  criticalThreshold: 90,   // 90%
  checkInterval: 30000     // 30 secondes
};

/**
 * Classe de monitoring de la mémoire
 */
export class MemoryMonitor {
  private limits: MemoryLimits;
  private intervalId: NodeJS.Timeout | null = null;
  private isActive: boolean = false;
  private onWarningCallback: ((stats: MemoryStats) => void) | null = null;
  private onCriticalCallback: ((stats: MemoryStats) => void) | null = null;
  
  constructor(limits?: Partial<MemoryLimits>) {
    this.limits = { ...DEFAULT_MEMORY_LIMITS, ...limits };
  }
  
  /**
   * Vérifie l'utilisation actuelle de la mémoire
   * @returns Statistiques de mémoire ou null si l'API n'est pas disponible
   */
  check(): MemoryStats | null {
    // Vérifier si l'API de performance.memory est disponible (Chrome uniquement)
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      // @ts-ignore
      const mem = performance.memory;
      
      if (mem) {
        const used = mem.usedJSHeapSize;
        const total = mem.totalJSHeapSize;
        const limit = mem.jsHeapSizeLimit;
        const percent = (used / limit) * 100;
        
        return {
          used,
          total,
          limit,
          percent
        };
      }
    }
    
    // API non disponible
    return null;
  }
  
  /**
   * Applique les actions d'enforcement en fonction de l'utilisation mémoire
   * @param limits Limites de mémoire à utiliser (optionnel)
   */
  enforce(limits?: MemoryLimits): void {
    const currentLimits = limits || this.limits;
    const current = this.check();
    
    if (!current) {
      // API de mémoire non disponible
      return;
    }
    
    // Vérifier le seuil critique
    if (current.percent > currentLimits.criticalThreshold) {
      this.handleCriticalMemory(current);
      return;
    }
    
    // Vérifier le seuil d'avertissement
    if (current.percent > currentLimits.warningThreshold) {
      this.handleWarningMemory(current);
      return;
    }
  }
  
  /**
   * Gère l'utilisation mémoire critique
   * @param stats Statistiques de mémoire
   */
  private handleCriticalMemory(stats: MemoryStats): void {
    console.warn(`[MemoryMonitor] Utilisation mémoire critique: ${stats.percent.toFixed(2)}%`);
    
    // Actions de dégradation progressive
    this.unloadModels();
    this.clearCache();
    this.pruneOldData();
    
    // Mode survie
    this.enableSimpleMode();
    this.alertUser("Mémoire critique");
    
    // Appeler le callback si défini
    if (this.onCriticalCallback) {
      this.onCriticalCallback(stats);
    }
  }
  
  /**
   * Gère l'utilisation mémoire d'avertissement
   * @param stats Statistiques de mémoire
   */
  private handleWarningMemory(stats: MemoryStats): void {
    console.warn(`[MemoryMonitor] Utilisation mémoire élevée: ${stats.percent.toFixed(2)}%`);
    
    // Actions préventives
    this.unloadUnusedModels();
    this.clearOldCache();
    
    // Appeler le callback si défini
    if (this.onWarningCallback) {
      this.onWarningCallback(stats);
    }
  }
  
  /**
   * Décharge les modèles de la mémoire
   */
  private unloadModels(): void {
    // Cette fonction dépend de l'implémentation spécifique des modèles
    // Pour l'instant, nous simulons le déchargement
    console.log('[MemoryMonitor] Déchargement des modèles');
    
    // Exemple d'implémentation hypothétique:
    /*
    if (typeof modelMemoryManager !== 'undefined') {
      modelMemoryManager.unloadAllModels();
    }
    */
  }
  
  /**
   * Décharge les modèles inutilisés
   */
  private unloadUnusedModels(): void {
    // Cette fonction dépend de l'implémentation spécifique des modèles
    console.log('[MemoryMonitor] Déchargement des modèles inutilisés');
  }
  
  /**
   * Vide le cache
   */
  private clearCache(): void {
    // Cette fonction dépend de l'implémentation spécifique du cache
    console.log('[MemoryMonitor] Vidage du cache');
    
    // Exemple d'implémentation hypothétique:
    /*
    if (typeof caches !== 'undefined') {
      caches.keys().then(cacheNames => {
        cacheNames.forEach(cacheName => {
          caches.delete(cacheName);
        });
      });
    }
    */
  }
  
  /**
   * Vide l'ancien cache
   */
  private clearOldCache(): void {
    // Cette fonction dépend de l'implémentation spécifique du cache
    console.log('[MemoryMonitor] Vidage de l\'ancien cache');
  }
  
  /**
   * Archive les anciennes données
   */
  private pruneOldData(): void {
    // Cette fonction dépend de l'implémentation spécifique de la base de données
    console.log('[MemoryMonitor] Archivage des anciennes données');
    
    // Exemple d'implémentation hypothétique:
    /*
    if (typeof storageGuard !== 'undefined') {
      storageGuard.pruneOldData(30);
    }
    */
  }
  
  /**
   * Active le mode simple
   */
  private enableSimpleMode(): void {
    // Cette fonction dépend de l'implémentation spécifique de l'application
    console.log('[MemoryMonitor] Activation du mode simple');
    
    // Exemple d'implémentation hypothétique:
    /*
    if (typeof appState !== 'undefined') {
      appState.setMode('SIMPLE');
    }
    */
  }
  
  /**
   * Alerte l'utilisateur
   * @param message Message d'alerte
   */
  private alertUser(message: string): void {
    // Cette fonction dépend de l'implémentation spécifique des notifications
    console.info(`[MemoryMonitor] Alerte utilisateur: ${message}`);
    
    // Exemple d'implémentation hypothétique:
    /*
    if (typeof notificationService !== 'undefined') {
      notificationService.showWarning(message);
    }
    */
  }
  
  /**
   * Démarre le monitoring périodique
   */
  startMonitoring(): void {
    if (this.intervalId) {
      console.warn('[MemoryMonitor] Monitoring déjà actif');
      return;
    }
    
    this.isActive = true;
    this.intervalId = setInterval(() => {
      this.enforce();
    }, this.limits.checkInterval);
    
    console.log('[MemoryMonitor] Monitoring démarré');
  }
  
  /**
   * Arrête le monitoring périodique
   */
  stopMonitoring(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.isActive = false;
      console.log('[MemoryMonitor] Monitoring arrêté');
    }
  }
  
  /**
   * Met à jour les limites de mémoire
   * @param limits Nouvelles limites
   */
  updateLimits(limits: Partial<MemoryLimits>): void {
    this.limits = { ...this.limits, ...limits };
    
    // Redémarrer le monitoring si actif
    if (this.isActive) {
      this.stopMonitoring();
      this.startMonitoring();
    }
  }
  
  /**
   * Obtient les limites actuelles
   * @returns Limites actuelles
   */
  getLimits(): MemoryLimits {
    return { ...this.limits };
  }
  
  /**
   * Définit le callback pour les avertissements mémoire
   * @param callback Fonction de rappel
   */
  onWarning(callback: (stats: MemoryStats) => void): void {
    this.onWarningCallback = callback;
  }
  
  /**
   * Définit le callback pour les situations critiques
   * @param callback Fonction de rappel
   */
  onCritical(callback: (stats: MemoryStats) => void): void {
    this.onCriticalCallback = callback;
  }
  
  /**
   * Vérifie si le monitoring est actif
   * @returns true si le monitoring est actif, false sinon
   */
  isMonitoring(): boolean {
    return this.isActive;
  }
}

// Instance singleton du moniteur de mémoire
export const memoryMonitor = new MemoryMonitor();