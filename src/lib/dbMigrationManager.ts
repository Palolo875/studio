import { validateDataIntegrity } from './dataIntegrityValidator';
import { DatabaseSnapshotManager } from './databaseSnapshot';
import { createLogger } from '@/lib/logger';

const logger = createLogger('DBMigration');
/**
 * Gestionnaire de migrations de base de données - Phase 5
 * Implémente les migrations avec rollback atomique et validation
 */

// Types pour les migrations
export interface Migration {
  version: number;
  name: string;
  up: (db: any) => Promise<void>;
  down?: (db: any) => Promise<void>;
}

export interface MigrationResult {
  success: boolean;
  error?: string;
  backupCreated: boolean;
}

/**
 * Crée un backup chiffré de la base de données
 * @returns Backup chiffré
 */
export async function exportEncryptedBackup(): Promise<string> {
  logger.info('Création d’un backup chiffré');
  const snapshot = await DatabaseSnapshotManager.createSnapshot();
  const snapshotString = DatabaseSnapshotManager.exportSnapshot(snapshot);
  return snapshotString;
}

/**
 * Importe un backup chiffré dans la base de données
 * @param backup Backup chiffré à importer
 */
export async function importEncryptedBackup(backup: string): Promise<void> {
  logger.info('Restauration du backup', { prefix: backup.substring(0, 30) });
  const snapshot = DatabaseSnapshotManager.importSnapshot(backup);
  await DatabaseSnapshotManager.restoreSnapshot(snapshot);
}

/**
 * Calcule le hash d'une chaîne de caractères
 * @param data Données à hasher
 * @returns Hash FNV-1a
 */
export function hash(data: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < data.length; i++) {
    h ^= data.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return `fnv1a32_${(h >>> 0).toString(16).padStart(8, '0')}`;
}

/**
 * Applique une migration avec rollback atomique (Phase 5.3)
 */
export async function migrateWithRollback(db: any, migration: Migration): Promise<MigrationResult> {
  logger.info('Préparation migration', { version: migration.version, name: migration.name });

  // 1. Snapshot complet (Pre-migration)
  const snapshot = await DatabaseSnapshotManager.createSnapshot();
  const snapshotString = DatabaseSnapshotManager.exportSnapshot(snapshot);
  const hashVal = hash(snapshotString);
  logger.info('Snapshot pre-migration created', { hash: hashVal, size: snapshotString.length });

  try {
    // 2. Application migration
    await migration.up(db);

    // 3. Validation Intégrité SOTA (Phase 5.4.1)
    const integrity = await validateDataIntegrity(db);
    if (!integrity.valid) {
      throw new Error(`Incohérence détectée post-migration: ${integrity.errors[0].message}`);
    }

    return { success: true, backupCreated: true };
  } catch (error) {
    logger.error(`Échec V${migration.version}. Rollback immédiat.`, error as Error);

    // 5. Rollback Atomique
    await DatabaseSnapshotManager.restoreSnapshot(snapshot);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
      backupCreated: true
    };
  }
}

/**
 * Liste des migrations disponibles
 */
export const MIGRATIONS: Migration[] = [];

/**
 * Applique toutes les migrations en attente
 * @param db Instance de la base de données
 */
export async function applyPendingMigrations(db: any): Promise<void> {
  logger.info('Vérification des migrations en attente');

  // Dexie applique les migrations automatiquement via version().upgrade() lors du db.open().
  // Cette fonction force l'ouverture (donc l'application des upgrades) et valide ensuite l'intégrité.
  await db.open();
  const currentVersion = db.verno || 0;
  logger.info('Version actuelle', { version: currentVersion });

  const integrity = await validateDataIntegrity(db);
  if (!integrity.valid) {
    throw new Error(`Incohérence détectée post-migration: ${integrity.errors[0]?.message ?? 'unknown'}`);
  }
}