/**
 * Protocole de communication optimisé pour les Web Workers - Phase 4
 * Implémente un système de communication efficace avec Transferable Objects
 */

// Constantes pour les unités
const KB = 1024;
const MB = 1024 * KB;

// Interface pour les messages worker
export interface WorkerMessage {
  id: string;          // Pour matching response
  type: string;
  payload: any;        // Payload sérialisé
  timestamp: number;
}

// Configuration du budget de communication
export const WORKER_COMMUNICATION_BUDGET = {
  max_payload_size: 100 * KB,  // Par message
  max_frequency: 10,           // Messages/sec
  timeout: 500                 // ms max réponse
};

// Types de messages supportés
export type WorkerMessageType = 
  | 'RUN_BRAIN'
  | 'RUN_NLP'
  | 'PING'
  | 'PONG'
  | 'ERROR'
  | 'RESULT';

/**
 * Classe de gestion de la communication avec les Web Workers
 */
export class WorkerCommunication {
  private worker: Worker;
  private pendingMessages: Map<string, { resolve: Function, reject: Function, timeoutId: NodeJS.Timeout }>;
  private messageCount: number = 0;
  private lastSecondTimestamp: number = 0;
  
  constructor(worker: Worker) {
    this.worker = worker;
    this.pendingMessages = new Map();
    
    // Écouter les messages du worker
    this.worker.onmessage = this.handleWorkerMessage.bind(this);
    this.worker.onerror = this.handleWorkerError.bind(this);
  }
  
  /**
   * Envoie un message au worker avec transfert d'objets
   * @param type Type de message
   * @param payload Données à envoyer
   * @param transferableObjects Objets transférables (optionnel)
   * @returns Promesse résolue avec la réponse du worker
   */
  async sendMessage(
    type: WorkerMessageType, 
    payload: any, 
    transferableObjects?: Transferable[]
  ): Promise<any> {
    // Vérifier la fréquence des messages
    if (!this.checkMessageFrequency()) {
      throw new Error('Fréquence de messages dépassée');
    }
    
    // Sérialiser le payload
    const serializedPayload = this.serializePayload(payload);
    
    // Vérifier la taille du payload
    if (!this.checkPayloadSize(serializedPayload)) {
      throw new Error('Taille du payload dépassée');
    }
    
    // Générer un ID unique pour le message
    const messageId = this.generateMessageId();
    
    // Créer une promesse pour la réponse
    const promise = new Promise((resolve, reject) => {
      // Créer un timeout
      const timeoutId = setTimeout(() => {
        this.pendingMessages.delete(messageId);
        reject(new Error(`Timeout dépassé: ${WORKER_COMMUNICATION_BUDGET.timeout}ms`));
      }, WORKER_COMMUNICATION_BUDGET.timeout);
      
      // Stocker les callbacks
      this.pendingMessages.set(messageId, { resolve, reject, timeoutId });
    });
    
    // Créer le message
    const message: WorkerMessage = {
      id: messageId,
      type,
      payload: serializedPayload,
      timestamp: Date.now()
    };
    
    // Envoyer le message au worker
    if (transferableObjects && transferableObjects.length > 0) {
      this.worker.postMessage(message, transferableObjects);
    } else {
      this.worker.postMessage(message);
    }
    
    return promise;
  }
  
  /**
   * Gère les messages reçus du worker
   * @param event Événement de message
   */
  private handleWorkerMessage(event: MessageEvent): void {
    const message: WorkerMessage = event.data;
    
    // Vérifier si c'est une réponse à un message en attente
    if (this.pendingMessages.has(message.id)) {
      const pending = this.pendingMessages.get(message.id)!;
      
      // Annuler le timeout
      clearTimeout(pending.timeoutId);
      
      // Retirer le message des messages en attente
      this.pendingMessages.delete(message.id);
      
      // Résoudre la promesse
      if (message.type === 'ERROR') {
        pending.reject(new Error(message.payload));
      } else {
        // Désérialiser le payload
        const deserializedPayload = this.deserializePayload(message.payload);
        pending.resolve(deserializedPayload);
      }
    } else {
      // Message non attendu
      console.warn('[WorkerCommunication] Message non attendu reçu:', message);
    }
  }
  
  /**
   * Gère les erreurs du worker
   * @param error Erreur
   */
  private handleWorkerError(error: ErrorEvent): void {
    console.error('[WorkerCommunication] Erreur du worker:', error);
    
    // Rejeter toutes les promesses en attente
    for (const [id, pending] of this.pendingMessages.entries()) {
      clearTimeout(pending.timeoutId);
      pending.reject(new Error(`Erreur du worker: ${error.message}`));
    }
    
    // Vider la liste des messages en attente
    this.pendingMessages.clear();
  }
  
  /**
   * Sérialise le payload pour l'envoi
   * @param payload Données à sérialiser
   * @returns Payload sérialisé
   */
  private serializePayload(payload: any): string {
    try {
      return JSON.stringify(payload);
    } catch (error) {
      throw new Error('Impossible de sérialiser le payload');
    }
  }
  
  /**
   * Désérialise le payload reçu
   * @param serializedPayload Payload sérialisé
   * @returns Données désérialisées
   */
  private deserializePayload(serializedPayload: string): any {
    try {
      return JSON.parse(serializedPayload);
    } catch (error) {
      throw new Error('Impossible de désérialiser le payload');
    }
  }
  
  /**
   * Vérifie la taille du payload
   * @param serializedPayload Payload sérialisé
   * @returns true si la taille est acceptable, false sinon
   */
  private checkPayloadSize(serializedPayload: string): boolean {
    return Buffer.byteLength(serializedPayload, 'utf8') <= WORKER_COMMUNICATION_BUDGET.max_payload_size;
  }
  
  /**
   * Vérifie la fréquence des messages
   * @returns true si la fréquence est acceptable, false sinon
   */
  private checkMessageFrequency(): boolean {
    const now = Date.now();
    
    // Réinitialiser le compteur si on est dans une nouvelle seconde
    if (now - this.lastSecondTimestamp >= 1000) {
      this.messageCount = 0;
      this.lastSecondTimestamp = now;
    }
    
    // Incrémenter le compteur
    this.messageCount++;
    
    // Vérifier si nous avons dépassé la fréquence maximale
    return this.messageCount <= WORKER_COMMUNICATION_BUDGET.max_frequency;
  }
  
  /**
   * Génère un ID unique pour un message
   * @returns ID unique
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Ferme la communication avec le worker
   */
  close(): void {
    // Rejeter toutes les promesses en attente
    for (const [id, pending] of this.pendingMessages.entries()) {
      clearTimeout(pending.timeoutId);
      pending.reject(new Error('Communication fermée'));
    }
    
    // Vider la liste des messages en attente
    this.pendingMessages.clear();
    
    // Fermer le worker
    this.worker.terminate();
  }
  
  /**
   * Ping le worker pour vérifier qu'il est actif
   * @returns Promesse résolue si le worker répond
   */
  async ping(): Promise<boolean> {
    try {
      await this.sendMessage('PING', {});
      return true;
    } catch (error) {
      return false;
    }
  }
}

/**
 * Fonction helper pour créer un worker avec communication optimisée
 * @param scriptURL URL du script du worker
 * @returns Instance de WorkerCommunication
 */
export function createOptimizedWorker(scriptURL: string): WorkerCommunication {
  const worker = new Worker(scriptURL);
  return new WorkerCommunication(worker);
}