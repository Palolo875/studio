// Contrôleur d'adaptation et de gouvernance - Phase 6
import { 
  Parameters, 
  ParameterDelta, 
  AdaptationHistory,
  clampParameters,
  ADAPTATION_CONSTRAINTS
} from './adaptationMemory';

// Fonction pour inverser les deltas de paramètres (pour rollback)
export function invertDelta(delta: ParameterDelta[]): ParameterDelta[] {
  return delta.map(d => ({
    parameterName: d.parameterName,
    oldValue: d.newValue,
    newValue: d.oldValue
  }));
}

// Permet rollback
export async function rollbackAdaptation(adaptationId: string) {
  // Dans une implémentation réelle, cela récupérerait l'adaptation depuis la base de données
  // const adaptation = await db.adaptations.get(adaptationId);
  
  // Pour l'exemple, nous simulons une adaptation
  const adaptation: AdaptationHistory = {
    id: adaptationId,
    timestamp: Date.now(),
    parameterChanges: [{
      parameterName: "maxTasks",
      oldValue: 3,
      newValue: 5
    }],
    qualityBefore: 0.6,
    qualityAfter: 0.7,
    userConsent: "ACCEPTED"
  };
  
  const rollback = invertDelta(adaptation.parameterChanges);
  await applyParameters(rollback);
  console.log("ADAPTATION_ROLLEDBACK", { adaptationId });
}

// Fonction pour appliquer les paramètres
export async function applyParameters(delta: ParameterDelta[]) {
  // Implémentation dépendante de la structure du système
  // Mettre à jour les paramètres du système avec les deltas fournis
  console.log("Application des paramètres", delta);
}

// Fonction pour afficher une proposition d'adaptation
export function showAdaptationProposal(adjustment: any) {
  // Dans une implémentation réelle, cela afficherait une modale
  console.log(`Proposition d'adaptation :`, adjustment);
  return {
    title: "Proposition d'adaptation",
    body: `Le système suggère d'augmenter maxTasks à ${adjustment.maxTasks}`,
    actions: [
      { label: "Accepter", value: "ACCEPT" },
      { label: "Refuser", value: "REJECT" },
      { label: "Reporter", value: "POSTPONE" }
    ]
  };
}

// Fonction pour afficher un bouton de rollback
export function showButton(label: string) {
  // Dans une implémentation réelle, cela afficherait un bouton dans l'UI
  console.log(label);
}

// Fonction pour afficher un message
export function showMessage(message: string) {
  // Dans une implémentation réelle, cela afficherait un message à l'utilisateur
  console.log(message);
}

// Fonction pour afficher un toast
export function showToast(message: string) {
  // Dans une implémentation réelle, cela afficherait un toast
  console.log(message);
}

// Fonction pour exporter une archive chiffrée
export async function exportEncryptedArchive(signals: any) {
  // Dans une implémentation réelle, cela exporterait les signaux vers un stockage sécurisé
  console.log("Exportation des signaux d'adaptation", signals);
}

// Pruning hebdomadaire
export function setupAdaptationPruning() {
  setInterval(async () => {
    const now = Date.now();
    const maxAge = ADAPTATION_CONSTRAINTS.ADAPTATION_MEMORY.maxAge;
    
    // Dans une implémentation réelle, cela récupérerait les anciens signaux depuis la base de données
    // const oldSignals = db.adaptationSignals.where("timestamp").below(now - maxAge);
    
    // Pour l'exemple, nous simulons des anciens signaux
    const oldSignals = [];
    
    if (oldSignals.length > 0) {
      await exportEncryptedArchive(oldSignals);
      // await oldSignals.delete();
      console.log(`Suppression de ${oldSignals.length} anciens signaux d'adaptation`);
    }
  }, 7 * 24 * 60 * 60 * 1000); // Toutes les semaines
}

// Mode conservateur
export function enterConservativeMode() {
  return {
    maxTasks: ADAPTATION_CONSTRAINTS.maxTasks.min,
    strictness: 0.5,
    coachEnabled: false,
    mode: "STRICT",
    reason: "Brain quality < 0.5 — Mode sécurisé activé"
  };
}

// Détecter la dérive progressive
export class DriftMonitor {
  private history: Parameters[] = [];
  
  track(params: Parameters) {
    this.history.push({ ...params, timestamp: Date.now() });
    // Keep last 90 days
    if (this.history.length > 90) {
      this.history.shift();
    }
  }
  
  detectDrift() {
    if (this.history.length < 7) return null;
    
    // Compare last week vs 3 weeks ago
    const recent = this.history.slice(-7);
    const baseline = this.history.slice(-21, -14); // 3 weeks ago
    
    // Détecter la dérive pour plusieurs paramètres
    const parametersToCheck = ['strictness', 'maxTasks'];
    
    for (const param of parametersToCheck) {
      const recentValues = recent.map(p => (p as any)[param]);
      const baselineValues = baseline.map(p => (p as any)[param]);
      
      const recentAvg = this.mean(recentValues);
      const baselineAvg = this.mean(baselineValues);
      
      const drift = Math.abs(recentAvg - baselineAvg);
      
      // Seuil de dérive différent selon le paramètre
      const threshold = param === 'strictness' ? 0.2 : 1;
      
      if (drift > threshold) {
        return {
          parameter: param,
          drift: drift,
          direction: recentAvg > baselineAvg ? "UP" : "DOWN",
          recommendation: "Consider reset"
        };
      }
    }
    
    return null;
  }
  
  // Détecter la dérive progressive (tendance sur plusieurs périodes)
  detectProgressiveDrift() {
    if (this.history.length < 28) return null; // Besoin de 4 semaines de données
    
    // Analyser la tendance sur 4 semaines
    const weeklyAverages = [];
    for (let i = 0; i < 4; i++) {
      const weekData = this.history.slice(-(i + 1) * 7, -i * 7 || undefined);
      const avg = this.mean(weekData.map(p => p.strictness));
      weeklyAverages.push(avg);
    }
    
    // Calculer la tendance
    let trend = 0;
    for (let i = 1; i < weeklyAverages.length; i++) {
      trend += weeklyAverages[i] - weeklyAverages[i - 1];
    }
    
    // Si la tendance est significative sur plusieurs semaines
    if (Math.abs(trend) > 0.3) {
      return {
        parameter: "strictness",
        drift: Math.abs(trend),
        direction: trend > 0 ? "UP" : "DOWN",
        recommendation: "Progressive drift detected over 4 weeks"
      };
    }
    
    return null;
  }
  
  // Fonction utilitaire pour calculer la moyenne
  private mean(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }
}