/**
 * Validateur d'intégrité des données - Phase 5
 * Implémente les vérifications de cohérence des données pour détecter les corruptions logiques
 */

// Types pour les erreurs d'intégrité
export interface IntegrityError {
  type: 'ORPHAN_TASK' | 'DUPLICATE_DECISION' | 'INVALID_REFERENCE' | 'DATA_CORRUPTION';
  entityId?: string;
  relatedEntityId?: string;
  message: string;
}

export interface IntegrityReport {
  valid: boolean;
  errors: IntegrityError[];
}

/**
 * Valide l'intégrité des données dans la base
 * @param db Instance de la base de données
 * @returns Rapport d'intégrité
 */
export async function validateDataIntegrity(db: any): Promise<IntegrityReport> {
  const errors: IntegrityError[] = [];

  try {
    // Obtenir toutes les tâches et sessions
    const tasks = await db.tasks.toArray();
    const sessions = await db.sessions.toArray();
    const decisions = await db.brainDecisions.toArray();
    
    // Créer des ensembles d'IDs pour une recherche rapide
    const sessionIds = new Set(sessions.map((s: any) => s.id));
    const taskIds = new Set(tasks.map((t: any) => t.id));
    
    // Vérifier les tâches orphelines (référencent une session qui n'existe pas)
    for (const task of tasks) {
      if (task.sessionId && !sessionIds.has(task.sessionId)) {
        errors.push({
          type: 'ORPHAN_TASK',
          entityId: task.id,
          relatedEntityId: task.sessionId,
          message: `Task ${task.id} référence Session ${task.sessionId} inexistante`
        });
      }
    }
    
    // Vérifier les décisions en double pour une session
    const decisionCounts = new Map<string, number>();
    for (const decision of decisions) {
      const count = decisionCounts.get(decision.sessionId) || 0;
      decisionCounts.set(decision.sessionId, count + 1);
    }
    
    for (const [sessionId, count] of decisionCounts) {
      if (count > 1) {
        errors.push({
          type: 'DUPLICATE_DECISION',
          entityId: sessionId,
          message: `Session ${sessionId} a ${count} décisions`
        });
      }
    }
    
    // Vérifier les références invalides dans les overrides
    if (db.overrides) {
      const overrides = await db.overrides.toArray();
      for (const override of overrides) {
        if (override.taskId && !taskIds.has(override.taskId)) {
          errors.push({
            type: 'INVALID_REFERENCE',
            entityId: override.id,
            relatedEntityId: override.taskId,
            message: `Override ${override.id} référence Task ${override.taskId} inexistante`
          });
        }
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  } catch (error) {
    return {
      valid: false,
      errors: [{
        type: 'DATA_CORRUPTION',
        message: `Erreur lors de la validation: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      }]
    };
  }
}

/**
 * Répare les erreurs d'intégrité simples
 * @param db Instance de la base de données
 * @param report Rapport d'intégrité avec les erreurs à réparer
 */
export async function repairIntegrityErrors(db: any, report: IntegrityReport): Promise<void> {
  if (report.valid) return;
  
  for (const error of report.errors) {
    try {
      switch (error.type) {
        case 'ORPHAN_TASK':
          // Supprimer les tâches orphelines
          if (error.entityId) {
            await db.tasks.delete(error.entityId);
            console.log(`[DataIntegrity] Tâche orpheline ${error.entityId} supprimée`);
          }
          break;
          
        case 'DUPLICATE_DECISION':
          // Garder la première décision et supprimer les doublons
          if (error.entityId) {
            const decisions = await db.brainDecisions
              .where('sessionId')
              .equals(error.entityId)
              .sortBy('timestamp');
            
            // Supprimer toutes sauf la première
            for (let i = 1; i < decisions.length; i++) {
              await db.brainDecisions.delete(decisions[i].id);
              console.log(`[DataIntegrity] Décision dupliquée ${decisions[i].id} supprimée`);
            }
          }
          break;
          
        case 'INVALID_REFERENCE':
          // Supprimer les overrides avec des références invalides
          if (error.entityId) {
            await db.overrides.delete(error.entityId);
            console.log(`[DataIntegrity] Override invalide ${error.entityId} supprimé`);
          }
          break;
      }
    } catch (repairError) {
      console.error(`[DataIntegrity] Erreur lors de la réparation de ${error.type}:`, repairError);
    }
  }
}

/**
 * Effectue une vérification complète de l'intégrité au démarrage
 * @param db Instance de la base de données
 */
export async function performStartupIntegrityCheck(db: any): Promise<void> {
  console.log('[DataIntegrity] Démarrage de la vérification d'intégrité...');
  
  const report = await validateDataIntegrity(db);
  
  if (!report.valid) {
    console.warn(`[DataIntegrity] ${report.errors.length} erreurs d'intégrité détectées:`);
    report.errors.forEach(error => {
      console.warn(`  - ${error.message}`);
    });
    
    // Tenter de réparer les erreurs
    await repairIntegrityErrors(db, report);
    
    // Revérifier après réparation
    const newReport = await validateDataIntegrity(db);
    if (newReport.valid) {
      console.log('[DataIntegrity] Toutes les erreurs ont été réparées');
    } else {
      console.error(`[DataIntegrity] ${newReport.errors.length} erreurs persistent après réparation`);
    }
  } else {
    console.log('[DataIntegrity] Aucune erreur d'intégrité détectée');
  }
}