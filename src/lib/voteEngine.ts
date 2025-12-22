// Vote Engine - Résolution de conflits par vote
// Implémentation du modal de vote avec consensus SPLIT/DELAYED/EXTERNAL

// Enum pour les modes de consensus
export enum ConsensusMode {
  USER_WINS,      // Override coûteux mais possible
  SYSTEM_WINS,    // Refus avec raison explicite
  SPLIT_DECISION, // Découper la tâche
  DELAYED_DECISION, // Reporter et revoter plus tard
  EXTERNAL_VOTE    // Tierce partie (ami, coach, etc.)
}

// Interface pour une tâche
export interface Task {
  id: string;
  title: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  effort: "LIGHT" | "MEDIUM" | "HEAVY";
  estimatedDuration: number; // en minutes
}

// Interface pour une raison de rejet
export interface RejectionReason {
  reason: string;
  code: string; // Code identifiant la raison
}

// Interface pour le résultat d'un vote
export interface VoteResult {
  consensus: ConsensusMode;
  explanation: string;
  cost?: number; // Coût si applicable
}

// Interface pour le gestionnaire de votes
export class VoteEngine {
  // Trouver un consensus entre l'utilisateur et le système
  findConsensus(userWants: Task, systemRefuses: RejectionReason): VoteResult {
    // Cas spécial : urgence et burnout
    if (userWants.priority === "URGENT" && systemRefuses.code === "BURNOUT") {
      return {
        consensus: ConsensusMode.SPLIT_DECISION,
        explanation: "Tâche urgente mais risque de burnout. Proposition : découper en micro-tâches."
      };
    }
    
    // Cas spécial : faible priorité et budget
    if ((userWants.priority === "LOW" || userWants.priority === "MEDIUM") && systemRefuses.code === "BUDGET") {
      return {
        consensus: ConsensusMode.DELAYED_DECISION,
        explanation: "Tâche de priorité faible avec budget limité. Proposition : reporter à demain."
      };
    }
    
    // Cas spécial : tâche lourde et énergie basse
    if (userWants.effort === "HEAVY" && systemRefuses.code === "LOW_ENERGY") {
      return {
        consensus: ConsensusMode.USER_WINS,
        explanation: "Vous forcez une tâche lourde alors que votre énergie est basse. Cela désactivera les protections pendant 24h.",
        cost: 0.5 // 50% du budget
      };
    }
    
    // Par défaut, le système protège
    return {
      consensus: ConsensusMode.SYSTEM_WINS,
      explanation: `Le système refuse cette tâche pour la raison suivante : ${systemRefuses.reason}`
    };
  }

  // Proposer des options de vote
  proposeVotingOptions(userWants: Task, systemRefuses: RejectionReason): string[] {
    const options = [
      "Accepter la décision du système",
      "Forcer la tâche (avec coût)"
    ];
    
    // Ajouter des options contextuelles
    if (userWants.priority === "URGENT" && systemRefuses.code === "BURNOUT") {
      options.push("Découper en micro-tâches");
    }
    
    if ((userWants.priority === "LOW" || userWants.priority === "MEDIUM") && systemRefuses.code === "BUDGET") {
      options.push("Reporter à demain");
      options.push("Demander l'avis d'un tiers");
    }
    
    return options;
  }

  // Exécuter le vote
  executeVote(userChoice: number, userWants: Task, systemRefuses: RejectionReason): VoteResult {
    const options = this.proposeVotingOptions(userWants, systemRefuses);
    
    if (userChoice < 0 || userChoice >= options.length) {
      throw new Error("Choix invalide");
    }
    
    // Pour cet exemple, nous simulons le choix de l'utilisateur
    // Dans une implémentation réelle, cela viendrait de l'UI
    switch (userChoice) {
      case 0: // Accepter la décision du système
        return {
          consensus: ConsensusMode.SYSTEM_WINS,
          explanation: `Vous avez accepté la décision du système : ${systemRefuses.reason}`
        };
        
      case 1: // Forcer la tâche
        return {
          consensus: ConsensusMode.USER_WINS,
          explanation: "Vous avez forcé la tâche. Les protections sont désactivées pendant 24h.",
          cost: 0.3 // 30% du budget
        };
        
      case 2: // Option contextuelle 1
        if (userWants.priority === "URGENT" && systemRefuses.code === "BURNOUT") {
          return {
            consensus: ConsensusMode.SPLIT_DECISION,
            explanation: "Tâche découpée en micro-tâches pour réduire la charge cognitive."
          };
        } else if ((userWants.priority === "LOW" || userWants.priority === "MEDIUM") && systemRefuses.code === "BUDGET") {
          return {
            consensus: ConsensusMode.DELAYED_DECISION,
            explanation: "Tâche reportée à demain. Nouveau vote prévu demain matin."
          };
        }
        break;
        
      case 3: // Option contextuelle 2
        if ((userWants.priority === "LOW" || userWants.priority === "MEDIUM") && systemRefuses.code === "BUDGET") {
          return {
            consensus: ConsensusMode.EXTERNAL_VOTE,
            explanation: "Avis d'un tiers demandé. En attente de réponse."
          };
        }
        break;
    }
    
    // Par défaut
    return {
      consensus: ConsensusMode.SYSTEM_WINS,
      explanation: `Le système maintient son refus : ${systemRefuses.reason}`
    };
  }

  // Générer un message de conflit
  generateConflictMessage(userWants: Task, systemRefuses: RejectionReason): string {
    return `CONFLIT DÉTECTÉ\n\n` +
           `Système : Refus (${systemRefuses.reason})\n` +
           `Vous : Forçage de "${userWants.title}"\n\n` +
           `Proposition :\n` +
           `- Reporter à demain (coût 0)\n` +
           `- Forcer maintenant (coût +30%)\n` +
           `- Demander avis externe (ami)\n\n` +
           `[Choisir une option]`;
  }
}