/**
 * Database Snapshot Manager - Implémentation des snapshots pour Dexie
 * Fournit les fonctionnalités createSnapshot() et restoreSnapshot() manquantes
 */

import { db } from './database/index';

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
      console.log('[Snapshot] Création du snapshot de la base de données...');
      
      // Récupérer toutes les données de toutes les tables
      const [
        tasks,
        sessions,
        overrides,
        sleepData,
        taskHistory,
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
        db.brainDecisions.toArray(),
        db.decisionExplanations.toArray(),
        db.adaptationSignals.toArray(),
        db.adaptationHistory.toArray(),
      ]);

      const snapshot: DatabaseSnapshot = {
        version: (db as any).verno ?? 0,
        timestamp: new Date(),
        data: {
          tasks,
          sessions,
          overrides,
          sleepData,
          taskHistory,
          brainDecisions,
          decisionExplanations,
          adaptationSignals,
          adaptationHistory,
        },
        metadata: {
          totalRecords: tasks.length +
            sessions.length +
            overrides.length +
            sleepData.length +
            taskHistory.length +
            brainDecisions.length +
            decisionExplanations.length +
            adaptationSignals.length +
            adaptationHistory.length,
          estimatedSize: this.estimateSize({
            tasks,
            sessions,
            overrides,
            sleepData,
            taskHistory,
            brainDecisions,
            decisionExplanations,
            adaptationSignals,
            adaptationHistory,
          }),
          checksum: this.calculateChecksum({
            tasks,
            sessions,
            overrides,
            sleepData,
            taskHistory,
            brainDecisions,
            decisionExplanations,
            adaptationSignals,
            adaptationHistory,
          })
        }
      };

      console.log(`[Snapshot] Snapshot créé avec ${snapshot.metadata.totalRecords} enregistrements`);
      return snapshot;
    } catch (error) {
      console.error('[Snapshot] Erreur lors de la création du snapshot:', error);
      throw error;
    }
  }

  /**
   * Restaure la base de données à partir d'un snapshot
   * @param snapshot Snapshot à restaurer
   */
  static async restoreSnapshot(snapshot: DatabaseSnapshot): Promise<void> {
    try {
      console.log('[Snapshot] Restauration de la base de données...');

      // Transaction atomique: soit tout est restauré, soit rien.
      await (db as any).transaction(
        'rw',
        db.tasks,
        db.sessions,
        db.overrides,
        db.sleepData,
        db.taskHistory,
        db.brainDecisions,
        db.decisionExplanations,
        db.adaptationSignals,
        db.adaptationHistory,
        async () => {
          await Promise.all([
            db.tasks.clear(),
            db.sessions.clear(),
            db.overrides.clear(),
            db.sleepData.clear(),
            db.taskHistory.clear(),
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
            db.brainDecisions.bulkAdd(snapshot.data.brainDecisions),
            db.decisionExplanations.bulkAdd(snapshot.data.decisionExplanations),
            db.adaptationSignals.bulkAdd(snapshot.data.adaptationSignals),
            db.adaptationHistory.bulkAdd(snapshot.data.adaptationHistory),
          ]);
        }
      );

      console.log(`[Snapshot] Restauration terminée avec ${snapshot.metadata.totalRecords} enregistrements`);
    } catch (error) {
      console.error('[Snapshot] Erreur lors de la restauration du snapshot:', error);
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
      if (!snapshot.version || !snapshot.timestamp || !snapshot.data) {
        throw new Error('Format de snapshot invalide');
      }

      return snapshot;
    } catch (error) {
      console.error('[Snapshot] Erreur lors de l\'import du snapshot:', error);
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
  private static calculateChecksum(data: any): string {
    const jsonString = JSON.stringify(data);
    let hash = 0;
    
    for (let i = 0; i < jsonString.length; i++) {
      const char = jsonString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(16);
  }

  /**
   * Liste tous les snapshots stockés dans localStorage
   * @returns Tableau des snapshots disponibles
   */
  static listStoredSnapshots(): string[] {
    const snapshots: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('db_snapshot_')) {
        snapshots.push(key);
      }
    }
    
    return snapshots;
  }

  /**
   * Sauvegarde un snapshot dans localStorage
   * @param snapshot Snapshot à sauvegarder
   * @param name Nom optionnel pour le snapshot
   */
  static saveSnapshotToStorage(snapshot: DatabaseSnapshot, name?: string): void {
    const key = name ? `db_snapshot_${name}` : `db_snapshot_${snapshot.timestamp.getTime()}`;
    const jsonString = this.exportSnapshot(snapshot);
    
    try {
      localStorage.setItem(key, jsonString);
      console.log(`[Snapshot] Snapshot sauvegardé avec la clé: ${key}`);
    } catch (error) {
      console.error('[Snapshot] Erreur lors de la sauvegarde du snapshot:', error);
      throw error;
    }
  }

  /**
   * Charge un snapshot depuis localStorage
   * @param key Clé du snapshot
   * @returns Snapshot chargé
   */
  static loadSnapshotFromStorage(key: string): DatabaseSnapshot {
    try {
      const jsonString = localStorage.getItem(key);
      if (!jsonString) {
        throw new Error(`Snapshot non trouvé: ${key}`);
      }
      
      return this.importSnapshot(jsonString);
    } catch (error) {
      console.error('[Snapshot] Erreur lors du chargement du snapshot:', error);
      throw error;
    }
  }

  /**
   * Supprime un snapshot du localStorage
   * @param key Clé du snapshot à supprimer
   */
  static deleteSnapshotFromStorage(key: string): void {
    try {
      localStorage.removeItem(key);
      console.log(`[Snapshot] Snapshot supprimé: ${key}`);
    } catch (error) {
      console.error('[Snapshot] Erreur lors de la suppression du snapshot:', error);
      throw error;
    }
  }
}
