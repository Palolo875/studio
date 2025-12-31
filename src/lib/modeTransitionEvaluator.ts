// Mode Transition Evaluator - Évaluateur de transitions de mode
// Implémentation de l'évaluateur de transitions pour détecter l'inactivité de 7 jours

import { SovereigntyManager, SovereigntyMode } from './modeEngine';
import { createLogger } from '@/lib/logger';

const logger = createLogger('ModeTransitionEvaluator');

// Interface pour l'évaluateur de transitions
export class ModeTransitionEvaluator {
  private sovereigntyManager: SovereigntyManager;
  
  constructor(sovereigntyManager: SovereigntyManager) {
    this.sovereigntyManager = sovereigntyManager;
  }
  
  // Évaluer les transitions de mode
  async evaluateModeTransition(userId: string) {
    try {
      // Récupérer la dernière activité de l'utilisateur
      // Dans une implémentation réelle, cela viendrait de la base de données
      // const lastActivity = await db.userActions
      //   .where('userId').equals(userId)
      //   .orderBy('timestamp')
      //   .last();
      
      // Pour la simulation, nous utilisons la dernière activité du gestionnaire
      const lastActivityTimestamp = this.sovereigntyManager['lastActivityTimestamp'];
      const daysSince = (Date.now() - lastActivityTimestamp) / (24 * 60 * 60 * 1000);
      
      // Si l'utilisateur n'a pas eu d'activité pendant plus de 7 jours
      if (daysSince > 7) {
        // Suggérer une transition de MANUAL vers ASSISTED
        if (this.sovereigntyManager.currentMode === SovereigntyMode.MANUAL) {
          await this.sovereigntyManager.suggestTransition(
            SovereigntyMode.MANUAL, 
            SovereigntyMode.ASSISTED, 
            "No activity 7+ days"
          );
        }
      }
      
      logger.info('Mode transition evaluation completed', { userId });
    } catch (error) {
      logger.error('Error evaluating mode transition', error as Error);
    }
  }
  
  // Enregistrer une activité utilisateur
  registerUserActivity(userId: string, timestamp: number = Date.now()) {
    // Dans une implémentation réelle, cela enregistrerait l'activité dans la base de données
    // await db.userActions.add({
    //   userId,
    //   timestamp,
    //   action: 'activity'
    // });
    
    // Mettre à jour le gestionnaire de souveraineté
    this.sovereigntyManager.registerUserActivity(timestamp);
    
    logger.info('User activity registered', { userId, timestamp });
  }
}