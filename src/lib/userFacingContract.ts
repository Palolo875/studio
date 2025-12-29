// User Facing Contract - Contrat visible par l'utilisateur
// Implémentation du contrat d'autorité présenté à l'utilisateur

import { createLogger } from '@/lib/logger';

const logger = createLogger('UserFacingContract');

// Interface pour le contrat visible par l'utilisateur
export interface UserFacingContract {
  // Version lisible pour l'utilisateur
  summary: {
    yourRights: string[];
    systemRights: string[];
    sharedPrinciples: string[];
  };
  
  // Suivi de l'acceptation
  accepted: boolean;
  acceptedAt?: number;
  version: string;  // Pour évolutions futures
}

// Contrat V1
export const CONTRACT_V1: UserFacingContract = {
  summary: {
    yourRights: [
      "Tu peux forcer n'importe quelle décision",
      "Tu peux désactiver complètement le système",
      "Tu peux réinitialiser toutes les adaptations",
      "Tes données t'appartiennent"
    ],
    systemRights: [
      "Je peux refuser des tâches si tu es en surcharge",
      "Je peux geler les adaptations si elles dérivent",
      "Je peux activer un mode sécurisé si je détecte du burnout"
    ],
    sharedPrinciples: [
      "Transparence totale : tu sais toujours pourquoi j'agis",
      "Réversibilité garantie : toute adaptation peut être annulée",
      "Ton consentement est requis pour les changements majeurs"
    ]
  },
  accepted: false,
  version: "1.0"
};

// Classe pour gérer le contrat utilisateur
export class UserContractManager {
  private contract: UserFacingContract;
  
  constructor() {
    this.contract = CONTRACT_V1;
  }
  
  // Obtenir le contrat
  getContract(): UserFacingContract {
    return { ...this.contract };
  }
  
  // Accepter le contrat
  acceptContract(): void {
    this.contract.accepted = true;
    this.contract.acceptedAt = Date.now();
    logger.info('User contract accepted');
  }
  
  // Vérifier si le contrat a été accepté
  isContractAccepted(): boolean {
    return this.contract.accepted;
  }
  
  // Obtenir la version du contrat
  getContractVersion(): string {
    return this.contract.version;
  }
  
  // Mettre à jour le contrat
  updateContract(newContract: UserFacingContract): void {
    this.contract = { ...newContract };
  }
}

// Fonction pour afficher l'onboarding du contrat
export function showContractOnboarding(): void {
  logger.info('Showing contract onboarding modal');
  logger.info('=====================================');
  logger.info('Fonctionnement de KairuFlow');
  logger.info('');
  
  logger.info('Ce que tu contrôles:');
  CONTRACT_V1.summary.yourRights.forEach((right, index) => {
    logger.info(`${index + 1}. ${right}`);
  });
  
  logger.info('');
  logger.info('Ce que le système peut faire:');
  CONTRACT_V1.summary.systemRights.forEach((right, index) => {
    logger.info(`${index + 1}. ${right}`);
  });
  
  logger.info('');
  logger.info('Principes partagés:');
  CONTRACT_V1.summary.sharedPrinciples.forEach((principle, index) => {
    logger.info(`${index + 1}. ${principle}`);
  });
  
  logger.info('');
  logger.info("[Bouton] J'ai compris et j'accepte");
  
  // Dans une implémentation réelle, cela afficherait un modal dans l'UI
}