/**
 * Moniteur de croissance de la base de données - Phase 5
 * Surveille l'utilisation de l'espace de stockage de IndexedDB
 */

// Seuil d'utilisation de la base de données (en octets)
const DB_SIZE_WARNING_THRESHOLD = 30 * 1024 * 1024; // 30 MB
const DB_SIZE_CRITICAL_THRESHOLD = 45 * 1024 * 1024; // 45 MB
const DB_SIZE_MAXIMUM = 50 * 1024 * 1024; // 50 MB

/**
 * Surveille la croissance de la base de données
 */
export class DbGrowthMonitor {
  private monitoringInterval: NodeJS.Timeout | null = null;
  private isMonitoring: boolean = false;
  
  /**
   * Démarre la surveillance de la croissance de la base de données
   * @param interval Intervalle de surveillance en millisecondes (défaut: 30 minutes)
   */
  startMonitoring(interval: number = 30 * 60 * 1000): void {
    if (this.monitoringInterval) {
      console.warn('[DbGrowthMonitor] Surveillance déjà active');
      return;
    }
    
    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      this.checkDbGrowth();
    }, interval);
    
    console.log(`[DbGrowthMonitor] Surveillance démarrée (intervalle: ${interval}ms)`);
    
    // Effectuer une vérification immédiate
    this.checkDbGrowth();
  }
  
  /**
   * Arrête la surveillance de la croissance de la base de données
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      this.isMonitoring = false;
      console.log('[DbGrowthMonitor] Surveillance arrêtée');
    }
  }
  
  /**
   * Vérifie la croissance de la base de données
   */
  async checkDbGrowth(): Promise<void> {
    try {
      // Obtenir les informations de stockage
      const storageInfo = await navigator.storage?.estimate();
      
      if (!storageInfo) {
        console.warn('[DbGrowthMonitor] API de stockage non disponible');
        return;
      }
      
      const { usage, quota } = storageInfo;
      
      if (usage === undefined || quota === undefined) {
        console.warn('[DbGrowthMonitor] Informations de stockage incomplètes');
        return;
      }
      
      // Calculer le pourcentage d'utilisation
      const usagePercentage = (usage / quota) * 100;
      
      console.log(`[DbGrowthMonitor] Utilisation: ${formatBytes(usage)} / ${formatBytes(quota)} (${usagePercentage.toFixed(2)}%)`);
      
      // Vérifier les seuils
      if (usage > DB_SIZE_CRITICAL_THRESHOLD) {
        this.handleCriticalUsage(usage);
      } else if (usage > DB_SIZE_WARNING_THRESHOLD) {
        this.handleWarningUsage(usage);
      }
    } catch (error) {
      console.error('[DbGrowthMonitor] Erreur lors de la vérification de la croissance:', error);
    }
  }
  
  /**
   * Gère l'utilisation critique de l'espace de stockage
   * @param usage Utilisation actuelle en octets
   */
  private handleCriticalUsage(usage: number): void {
    console.error(`[DbGrowthMonitor] Utilisation critique de la base de données: ${formatBytes(usage)}`);
    
    // Afficher un message à l'utilisateur
    showUserMessage(
      "La base de données est presque pleine. Pensez à archiver vos anciennes données.",
      "critical"
    );
    
    // Activer l'auto-pruning
    this.enableAutoPrune();
  }
  
  /**
   * Gère l'utilisation élevée de l'espace de stockage
   * @param usage Utilisation actuelle en octets
   */
  private handleWarningUsage(usage: number): void {
    console.warn(`[DbGrowthMonitor] Utilisation élevée de la base de données: ${formatBytes(usage)}`);
    
    // Afficher un message à l'utilisateur
    showUserMessage(
      "La base de données commence à être volumineuse. Pensez à archiver vos anciennes données.",
      "warning"
    );
  }
  
  /**
   * Active l'auto-pruning des données anciennes
   */
  private enableAutoPrune(): void {
    console.log('[DbGrowthMonitor] Activation de l'auto-pruning...');
    
    // Dans une implémentation réelle, cela déclencherait le pruning
    // des données de plus de 7 jours par exemple
    
    // Exemple de pseudo-code:
    // storageGuard.pruneOldData(7);
  }
  
  /**
   * Vérifie si la surveillance est active
   * @returns true si la surveillance est active, false sinon
   */
  isMonitoringActive(): boolean {
    return this.isMonitoring;
  }
}

/**
 * Formate un nombre d'octets en une chaîne lisible
 * @param bytes Nombre d'octets
 * @returns Chaîne formatée
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Affiche un message à l'utilisateur
 * @param message Message à afficher
 * @param type Type de message (info, warning, critical)
 */
function showUserMessage(message: string, type: 'info' | 'warning' | 'critical' = 'info'): void {
  // Dans une application réelle, cela utiliserait un système de notifications
  console.log(`[USER MESSAGE] ${message}`);
  
  // Exemple d'affichage dans l'interface utilisateur
  if (typeof window !== 'undefined') {
    // Créer un élément de notification
    const notification = document.createElement('div');
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.padding = '15px';
    notification.style.borderRadius = '4px';
    notification.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
    notification.style.zIndex = '10000';
    notification.style.maxWidth = '300px';
    
    // Appliquer le style selon le type
    switch (type) {
      case 'warning':
        notification.style.backgroundColor = '#fff3cd';
        notification.style.border = '1px solid #ffeaa7';
        notification.style.color = '#856404';
        break;
      case 'critical':
        notification.style.backgroundColor = '#f8d7da';
        notification.style.border = '1px solid #f5c6cb';
        notification.style.color = '#721c24';
        break;
      default:
        notification.style.backgroundColor = '#d1ecf1';
        notification.style.border = '1px solid #bee5eb';
        notification.style.color = '#0c5460';
    }
    
    notification.textContent = message;
    
    // Ajouter à la page
    document.body.appendChild(notification);
    
    // Supprimer automatiquement après 5 secondes
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 5000);
  }
}

// Instance singleton du moniteur
export const dbGrowthMonitor = new DbGrowthMonitor();