/**
 * Database Snapshot Manager - Implémentation des snapshots pour Dexie
 * Fournit les fonctionnalités createSnapshot() et restoreSnapshot() manquantes
 */

import { createLogger } from '@/lib/logger';
import { db } from './database/index';

const logger = createLogger('DatabaseSnapshot');

// Interface pour un snapshot de base de données
export interface DatabaseSnapshot {
  version: number;
  timestamp: Date;
  data: {
    tasks: any[];
    sessions: any[];
    taskHistory: any[];
    overrides: any[];
    sleepData: any[];
    eveningEntries: any[];
    settings: any[];
    brainDecisions: any[];
    decisionExplanations: any[];
    adaptationSignals: any[];
    adaptationHistory: any[];
  };
  metadata: {
    totalRecords: number;
    estimatedSize: number;
    checksum: string;
  };
}

/**
 * Extension de la base de données avec les fonctionnalités de snapshot
 */
export class DatabaseSnapshotManager {
  /**
   * Crée un snapshot complet de la base de données
   * @returns Promesse résolue avec le snapshot
   */
  static async createSnapshot(): Promise<DatabaseSnapshot> {
    try {
      logger.info('Création du snapshot de la base de données');
      
      // Récupérer toutes les données de toutes les tables
      const [
        tasks,
        sessions,
        overrides,
        sleepData,
        taskHistory,
        eveningEntries,
        settings,
        brainDecisions,
        decisionExplanations,
        adaptationSignals,
        adaptationHistory,
      ] = await Promise.all([
        db.tasks.toArray(),
        db.sessions.toArray(),
        db.overrides.toArray(),
        db.sleepData.toArray(),
        db.taskHistory.toArray(),
        (db as any).eveningEntries?.toArray?.() ?? Promise.resolve([]),
        (db as any).settings?.toArray?.() ?? Promise.resolve([]),
        db.brainDecisions.toArray(),
        db.decisionExplanations.toArray(),
        db.adaptationSignals.toArray(),
        db.adaptationHistory.toArray(),
      ]);

      const data = {
        tasks,
        sessions,
        overrides,
        sleepData,
        taskHistory,
        eveningEntries,
        settings,
        brainDecisions,
        decisionExplanations,
        adaptationSignals,
        adaptationHistory,
      };

      const checksum = await this.calculateChecksum(data);

      const snapshot: DatabaseSnapshot = {
        version: (db as any).verno ?? 0,
        timestamp: new Date(),
        data,
        metadata: {
          totalRecords:
            tasks.length +
            sessions.length +
            overrides.length +
            sleepData.length +
            taskHistory.length +
            eveningEntries.length +
            settings.length +
            brainDecisions.length +
            decisionExplanations.length +
            adaptationSignals.length +
            adaptationHistory.length,
          estimatedSize: this.estimateSize(data),
          checksum,
        },
      };

      logger.info('Snapshot créé', { totalRecords: snapshot.metadata.totalRecords });
      return snapshot;
    } catch (error) {
      logger.error('Erreur lors de la création du snapshot', error as Error);
      throw error;
    }
  }

  /**
   * Restaure la base de données à partir d'un snapshot
   * @param snapshot Snapshot à restaurer
   */
  static async restoreSnapshot(snapshot: DatabaseSnapshot): Promise<void> {
    try {
      logger.info('Restauration de la base de données');

      const expected = snapshot.metadata?.checksum;
      if (expected) {
        const actual = await this.calculateChecksum(snapshot.data);
        if (actual !== expected) {
          throw new Error('Snapshot checksum mismatch');
        }
      }

      // Transaction atomique: soit tout est restauré, soit rien.
      const tables: any[] = [
        db.tasks,
        db.sessions,
        db.overrides,
        db.sleepData,
        db.taskHistory,
        db.brainDecisions,
        db.decisionExplanations,
        db.adaptationSignals,
        db.adaptationHistory,
      ];

      if ((db as any).eveningEntries) {
        tables.push((db as any).eveningEntries);
      }
      if ((db as any).settings) {
        tables.push((db as any).settings);
      }

      await (db as any).transaction(
        'rw',
        ...tables,
        async () => {
          await Promise.all([
            db.tasks.clear(),
            db.sessions.clear(),
            db.overrides.clear(),
            db.sleepData.clear(),
            db.taskHistory.clear(),
            (db as any).eveningEntries?.clear?.(),
            (db as any).settings?.clear?.(),
            db.brainDecisions.clear(),
            db.decisionExplanations.clear(),
            db.adaptationSignals.clear(),
            db.adaptationHistory.clear(),
          ]);

          await Promise.all([
            db.tasks.bulkAdd(snapshot.data.tasks),
            db.sessions.bulkAdd(snapshot.data.sessions),
            db.overrides.bulkAdd(snapshot.data.overrides),
            db.sleepData.bulkAdd(snapshot.data.sleepData),
            db.taskHistory.bulkAdd(snapshot.data.taskHistory),
            (db as any).eveningEntries?.bulkAdd?.(snapshot.data.eveningEntries ?? []),
            (db as any).settings?.bulkAdd?.(snapshot.data.settings ?? []),
            db.brainDecisions.bulkAdd(snapshot.data.brainDecisions),
            db.decisionExplanations.bulkAdd(snapshot.data.decisionExplanations),
            db.adaptationSignals.bulkAdd(snapshot.data.adaptationSignals),
            db.adaptationHistory.bulkAdd(snapshot.data.adaptationHistory),
          ]);
        }
      );

      logger.info('Restauration terminée', { totalRecords: snapshot.metadata.totalRecords });
    } catch (error) {
      logger.error('Erreur lors de la restauration du snapshot', error as Error);
      throw error;
    }
  }

  /**
   * Exporte un snapshot au format JSON string
   * @param snapshot Snapshot à exporter
   * @returns Chaîne JSON du snapshot
   */
  static exportSnapshot(snapshot: DatabaseSnapshot): string {
    return JSON.stringify(snapshot, null, 2);
  }

  /**
   * Importe un snapshot depuis une chaîne JSON
   * @param jsonString Chaîne JSON du snapshot
   * @returns Snapshot importé
   */
  static importSnapshot(jsonString: string): DatabaseSnapshot {
    try {
      const snapshot = JSON.parse(jsonString) as DatabaseSnapshot;
      
      // Validation basique
      if (typeof snapshot.version !== 'number' || !snapshot.timestamp || !snapshot.data) {
        throw new Error('Format de snapshot invalide');
      }

      if (typeof (snapshot as any).timestamp === 'string' || typeof (snapshot as any).timestamp === 'number') {
        (snapshot as any).timestamp = new Date((snapshot as any).timestamp);
      }

      return snapshot;
    } catch (error) {
      logger.error("Erreur lors de l'import du snapshot", error as Error);
      throw error;
    }
  }

  /**
   * Estime la taille approximative des données en octets
   * @param data Données à analyser
   * @returns Taille estimée en octets
   */
  private static estimateSize(data: any): number {
    return JSON.stringify(data).length * 2; // Approximation UTF-16
  }

  /**
   * Calcule un checksum simple pour vérifier l'intégrité
   * @param data Données à analyser
   * @returns Checksum MD5 simulé
   */
  private static async calculateChecksum(data: any): Promise<string> {
    const jsonString = JSON.stringify(data);

    const subtle = globalThis.crypto?.subtle;
    if (subtle) {
      const bytes = new TextEncoder().encode(jsonString);
      const digest = await subtle.digest('SHA-256', bytes);
      return Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    }

    // Fallback deterministic (non-crypto) checksum for environments without WebCrypto (ex: some test runners).
    // This is used only to detect accidental mismatches, not for security.
    let hash = 2166136261;
    for (let i = 0; i < jsonString.length; i++) {
      hash ^= jsonString.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return `fnv1a_${(hash >>> 0).toString(16)}`;
  }

  /**
   * Liste tous les snapshots stockés dans Dexie
   * @returns Tableau des snapshots disponibles (noms)
   */
  static async listStoredSnapshots(): Promise<string[]> {
    const rows = await (db as any).snapshots.orderBy('timestamp').reverse().toArray();
    return rows.map((r: any) => r.name ?? String(r.timestamp));
  }

  /**
   * Sauvegarde un snapshot dans Dexie
   * @param snapshot Snapshot à sauvegarder
   * @param name Nom optionnel pour le snapshot
   */
  static async saveSnapshotToStorage(snapshot: DatabaseSnapshot, name?: string): Promise<void> {
    const now = Date.now();
    const finalName = name ?? `snapshot_${now}`;

    await (db as any).snapshots.add({
      name: finalName,
      timestamp: now,
      snapshot,
    });

    logger.info('Snapshot sauvegardé', { name: finalName });
  }

  /**
   * Charge un snapshot depuis Dexie
   * @param name Nom du snapshot
   * @returns Snapshot chargé
   */
  static async loadSnapshotFromStorage(name: string): Promise<DatabaseSnapshot> {
    const row = await (db as any).snapshots.where('name').equals(name).first();
    if (!row?.snapshot) {
      throw new Error(`Snapshot non trouvé: ${name}`);
    }
    return row.snapshot as DatabaseSnapshot;
  }

  /**
   * Supprime un snapshot de Dexie
   * @param name Nom du snapshot à supprimer
   */
  static async deleteSnapshotFromStorage(name: string): Promise<void> {
    await (db as any).snapshots.where('name').equals(name).delete();
    logger.info('Snapshot supprimé', { name });
  }
}
