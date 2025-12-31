/**
 * Récupération de corruption de base de données - Phase 5
 * Implémente la stratégie de récupération en cas de corruption d'IndexedDB
 */

import Dexie, { type Table } from 'dexie';
import { createLogger } from '@/lib/logger';
import { DatabaseSnapshotManager, type DatabaseSnapshot } from '@/lib/databaseSnapshot';

const logger = createLogger('DBRecovery');

class RecoveryAbortError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RecoveryAbortError';
  }
}

interface BackupRow {
  id?: number;
  timestamp: number;
  name: string;
  snapshot: DatabaseSnapshot;
}

class KairuFlowBackupDatabase extends Dexie {
  backups!: Table<BackupRow, number>;

  constructor() {
    super('KairuFlowBackupDB');
    this.version(1).stores({
      backups: '++id, timestamp, name',
    });
  }
}

const backupDb = new KairuFlowBackupDatabase();

async function getLatestBackupSnapshot(): Promise<DatabaseSnapshot | null> {
  try {
    const row = await backupDb.backups.orderBy('timestamp').reverse().first();
    return row?.snapshot ?? null;
  } catch (error) {
    logger.error('Impossible de lire le backup DB', error as Error);
    return null;
  }
}

async function pruneBackups(keep: number): Promise<void> {
  try {
    const rows = await backupDb.backups.orderBy('timestamp').reverse().toArray();
    const toDelete = rows.slice(keep);
    if (toDelete.length === 0) return;
    await backupDb.backups.bulkDelete(
      toDelete
        .map((r: BackupRow) => r.id)
        .filter((id: number | undefined): id is number => typeof id === 'number')
    );
  } catch (error) {
    logger.error('Impossible de pruner les backups', error as Error);
  }
}

export async function createLocalBackupSnapshot(reason: string = 'periodic'): Promise<void> {
  try {
    const snapshot = await DatabaseSnapshotManager.createSnapshot();
    const ts = Date.now();
    const name = `backup_${reason}_${ts}`;
    await backupDb.backups.add({ timestamp: ts, name, snapshot });
    await pruneBackups(5);
    logger.info('Backup local créé', { name });
  } catch (error) {
    logger.error('Échec création backup local', error as Error);
  }
}

/**
 * Tente d'ouvrir la base de données avec récupération en cas de corruption
 * @param db Instance de la base de données
 * @returns Instance de la base de données ouverte
 */
export async function openDbWithCorruptionRecovery(db: any): Promise<any> {
  try {
    logger.info("Tentative d'ouverture de la base de données");
    const openedDb = await db.open();
    logger.info('Base de données ouverte avec succès');
    return openedDb;
  } catch (error: any) {
    logger.error("Erreur lors de l'ouverture de la base de données", error as Error);
    
    // Vérifier si c'est une erreur de corruption
    if (error.name === "UnknownError" || 
        (error.message && (error.message.includes("corrupted") || error.message.includes("corrupt")))) {
      logger.warn('Corruption de la base de données détectée');
      return await handleDbCorruption(db);
    }
    
    // Autres erreurs - les propager
    throw error;
  }
}

/**
 * Gère la corruption de la base de données
 * @param db Instance de la base de données
 * @returns Instance de la base de données restaurée ou nouvelle instance
 */
async function handleDbCorruption(db: any): Promise<any> {
  logger.warn('Démarrage du processus de récupération de corruption');
  
  // Étape 1 : Tenter de restaurer à partir d'un backup
  try {
    const restoredDb = await attemptBackupRestoration(db);
    if (restoredDb) {
      logger.info("Base de données restaurée à partir d'un backup");
      return restoredDb;
    }
  } catch (restoreError) {
    // Si un backup existe mais est invalide (ex: checksum mismatch), on ABORT.
    // Ne pas supprimer la DB automatiquement: risque de perte irréversible.
    if (restoreError instanceof RecoveryAbortError) {
      logger.error('Récupération automatique annulée', restoreError);
      throw restoreError;
    }

    logger.error("Échec de la restauration à partir d'un backup", restoreError as Error);
    throw new RecoveryAbortError(
      'Backup présent mais restauration impossible (intégrité invalide). Réinitialisation automatique annulée.'
    );
  }
  
  // Étape 2 : Réinitialiser complètement la base de données (dernier recours)
  // IMPORTANT: uniquement si aucun backup n'était disponible.
  logger.warn('Réinitialisation complète de la base de données (dernier recours)');
  try {
    await db.delete();
    logger.warn('Ancienne base de données supprimée');
    
    // Recréer la base de données
    const newDb = await db.open();
    logger.warn('Nouvelle base de données créée');
    
    // Afficher un message à l'utilisateur
    logger.warn('Base corrompue réinitialisée: données précédentes perdues');
    
    return newDb;
  } catch (resetError) {
    logger.error('Échec de la réinitialisation de la base de données', resetError as Error);
    throw new Error("Impossible de récupérer la base de données corrompue");
  }
}

/**
 * Tente de restaurer la base de données à partir d'un backup
 * @param db Instance de la base de données
 * @returns Instance de la base de données restaurée ou null si échec
 */
async function attemptBackupRestoration(db: any): Promise<any | null> {
  logger.info('Recherche de backups disponibles');
  
  // Dans une implémentation réelle, vous auriez plusieurs stratégies :
  // 1. Backup cloud (si l'utilisateur est connecté)
  // 2. Backup local (dans un autre stockage)
  // 3. Backup automatique (synchronisé avec les modifications)
  
  try {
    const snapshot = await retrieveBackup();
    if (!snapshot) {
      logger.info('Aucun backup disponible');
      return null;
    }

    await db.close();
    await db.delete();
    logger.warn('Base corrompue supprimée');

    const restoredDb = await db.open();
    await importBackup(snapshot);
    logger.info('Backup importé avec succès');
    
    // Afficher un message à l'utilisateur
    logger.info("La base de données a été restaurée à partir d'une sauvegarde");
    
    return restoredDb;
  } catch (error) {
    logger.error('Échec de la restauration du backup', error as Error);
    throw new RecoveryAbortError(
      error instanceof Error ? error.message : 'Échec inconnu lors de la restauration du backup'
    );
  }
}

/**
 * Vérifie si un backup est disponible
 * @returns True si un backup est disponible, false sinon
 */
async function checkForBackup(): Promise<boolean> {
  logger.debug('Vérification des backups');
  const snapshot = await getLatestBackupSnapshot();
  return snapshot !== null;
}

/**
 * Récupère le dernier backup disponible
 * @returns Données du backup
 */
async function retrieveBackup(): Promise<DatabaseSnapshot | null> {
  logger.debug('Récupération du backup');
  const hasBackup = await checkForBackup();
  if (!hasBackup) return null;
  return await getLatestBackupSnapshot();
}

/**
 * Importe un backup dans la base de données
 * @param backup Données du backup à importer
 */
async function importBackup(backup: DatabaseSnapshot): Promise<void> {
  logger.debug('Importation du backup');
  await DatabaseSnapshotManager.restoreSnapshot(backup);
}

/**
 * Effectue une vérification périodique de la santé de la base de données
 * @param db Instance de la base de données
 */
export async function performPeriodicHealthCheck(db: any): Promise<void> {
  try {
    // Vérifier si la base de données est accessible
    const testQuery = await db.tasks.limit(1).toArray();
    logger.debug('Vérification de santé réussie');
  } catch (error) {
    logger.error('Problème de santé de la base de données détecté', error as Error);
    
    // Tenter de rouvrir la base de données
    try {
      await db.close();
      await openDbWithCorruptionRecovery(db);
      logger.info('Base de données réouverte avec succès');
    } catch (reopenError) {
      logger.error('Impossible de rouvrir la base de données', reopenError as Error);
    }
  }
}
