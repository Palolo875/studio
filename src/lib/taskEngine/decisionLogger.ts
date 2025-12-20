// Système de logging des décisions du cerveau - Phase 3.4
import { BrainDecision, BrainVersion } from './brainContracts';

/**
 * Base de données simulée pour le stockage des décisions
 * Dans une vraie implémentation, cela utiliserait une base de données persistante
 */
let decisionDatabase: BrainDecision[] = [];
let versionDatabase: BrainVersion[] = [];

/**
 * Loggue une décision du cerveau
 */
export function logBrainDecision(decision: BrainDecision): void {
  decisionDatabase.push(decision);
  console.log(`[BrainDecision] Décision logguée: ${decision.id}`);
}

/**
 * Récupère une décision par son ID
 */
export function getBrainDecision(decisionId: string): BrainDecision | undefined {
  return decisionDatabase.find(d => d.id === decisionId);
}

/**
 * Récupère toutes les décisions
 */
export function getAllBrainDecisions(): BrainDecision[] {
  return [...decisionDatabase];
}

/**
 * Rejoue une décision précédente
 */
export function replayDecision(decisionId: string): BrainDecision | null {
  const decision = getBrainDecision(decisionId);
  if (!decision) {
    console.warn(`[BrainDecision] Décision ${decisionId} non trouvée pour le replay`);
    return null;
  }
  
  // Dans une vraie implémentation, cela rechargerait le cerveau 
  // avec la version exacte utilisée à l'origine
  console.log(`[BrainDecision] Rejeu de la décision: ${decisionId}`);
  return decision;
}

/**
 * Enregistre une version du cerveau
 */
export function registerBrainVersion(version: BrainVersion): void {
  versionDatabase.push(version);
  console.log(`[BrainVersion] Version enregistrée: ${version.id}`);
}

/**
 * Récupère une version du cerveau par son ID
 */
export function getBrainVersion(versionId: string): BrainVersion | undefined {
  return versionDatabase.find(v => v.id === versionId);
}

/**
 * Génère un ID de version basé sur le hash des règles
 */
export function generateVersionId(rules: any): string {
  // Dans une vraie implémentation, cela utiliserait un vrai hash
  return `version_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Nettoie l'historique des décisions (pour éviter l'explosion mémoire)
 */
export function pruneDecisionHistory(maxAgeDays: number = 30): void {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays);
  
  const initialLength = decisionDatabase.length;
  decisionDatabase = decisionDatabase.filter(d => d.timestamp > cutoffDate);
  
  console.log(`[BrainDecision] Nettoyage effectué: ${initialLength - decisionDatabase.length} décisions supprimées`);
}

/**
 * Archive les décisions anciennes
 */
export function archiveOldDecisions(maxAgeDays: number = 7): void {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays);
  
  const oldDecisions = decisionDatabase.filter(d => d.timestamp <= cutoffDate);
  // Dans une vraie implémentation, cela les déplacerait dans un stockage d'archive
  console.log(`[BrainDecision] ${oldDecisions.length} décisions archivées`);
}