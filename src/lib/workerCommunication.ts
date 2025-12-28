/**
 * Protocole de communication ultra-rapide pour Web Workers (Phase 4.1.4)
 * Utilise les Transferable Objects pour éviter la copie mémoire Main/Worker.
 */

// Configuration du budget de communication
export const WORKER_COMMUNICATION_BUDGET = {
  max_payload_size: 100 * 1024,  // 100 KB par message
  max_frequency: 10,             // Messages/sec
  timeout: 500                   // ms max réponse
};

// Types de messages supportés
export type WorkerMessageType =
  | 'RUN_BRAIN'
  | 'RUN_NLP'
  | 'PING'
  | 'PONG'
  | 'ERROR'
  | 'RESULT';

export class WorkerCommunication {
  private worker: Worker;
  private pendingMessages: Map<string, { resolve: Function, reject: Function, timeoutId: ReturnType<typeof setTimeout> }>;
  private encoder = new TextEncoder();
  private decoder = new TextDecoder();
  private messageSeq = 0;

  constructor(worker: Worker) {
    this.worker = worker;
    this.pendingMessages = new Map();
    this.worker.onmessage = this.handleWorkerMessage.bind(this);
  }

  /**
   * Envoie un message avec zéro copie (Transferable)
   */
  async sendMessage(type: WorkerMessageType, payload: any): Promise<any> {
    this.messageSeq += 1;
    const messageId = `msg_${Date.now()}_${this.messageSeq}`;

    // Sérialisation performante
    const jsonStr = JSON.stringify({ id: messageId, type, payload });
    const buffer = this.encoder.encode(jsonStr).buffer;

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        if (this.pendingMessages.has(messageId)) {
          this.pendingMessages.delete(messageId);
          reject(new Error(`Worker Timeout (${WORKER_COMMUNICATION_BUDGET.timeout}ms)`));
        }
      }, WORKER_COMMUNICATION_BUDGET.timeout);

      this.pendingMessages.set(messageId, { resolve, reject, timeoutId });

      // TRANSFER OWNERSHIP : Zéro copie mémoire
      this.worker.postMessage(buffer, [buffer]);
    });
  }

  /**
   * Gestion des messages entrants (Reçu du Worker)
   */
  private handleWorkerMessage(event: MessageEvent): void {
    let data;

    // Gérer à la fois les buffers (optimisé) et les objets (fallback)
    if (event.data instanceof ArrayBuffer) {
      const jsonStr = this.decoder.decode(event.data);
      data = JSON.parse(jsonStr);
    } else {
      data = event.data;
    }

    const { id, type, payload } = data;

    if (this.pendingMessages.has(id)) {
      const { resolve, reject, timeoutId } = this.pendingMessages.get(id)!;
      clearTimeout(timeoutId);
      this.pendingMessages.delete(id);

      if (type === 'ERROR') {
        reject(new Error(payload));
      } else {
        resolve(payload);
      }
    }
  }

  terminate(): void {
    this.worker.terminate();
    this.pendingMessages.forEach(p => clearTimeout(p.timeoutId));
    this.pendingMessages.clear();
  }
}