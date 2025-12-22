// OnboardingContract.tsx
// Composant UI pour l'onboarding du contrat avec checklist visuelle

import React, { useState } from 'react';

// Composant de section avec titre
interface SectionProps {
  title: string;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, children }) => (
  <div className="mb-6">
    <h3 className="text-lg font-semibold text-gray-800 mb-3">{title}</h3>
    <div className="space-y-2">{children}</div>
  </div>
);

// Composant d'item avec icône
interface ItemProps {
  children: React.ReactNode;
  icon?: string;
}

const Item: React.FC<ItemProps> = ({ children, icon = "✅" }) => (
  <div className="flex items-start">
    <span className="mr-2 mt-1">{icon}</span>
    <span className="text-gray-700">{children}</span>
  </div>
);

// Composant de case à cocher
interface CheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const Checkbox: React.FC<CheckboxProps> = ({ label, checked, onChange }) => (
  <div className="flex items-center mt-4">
    <input
      type="checkbox"
      id="contract-checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
    />
    <label htmlFor="contract-checkbox" className="ml-2 text-gray-700">
      {label}
    </label>
  </div>
);

// Composant de bouton
interface ButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({ children, onClick, disabled = false }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`w-full py-3 px-4 rounded-md font-medium text-white ${
      disabled 
        ? 'bg-gray-400 cursor-not-allowed' 
        : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
    }`}
  >
    {children}
  </button>
);

// Composant principal de l'onboarding du contrat
export const OnboardingContract: React.FC<{ onAccept: () => void }> = ({ onAccept }) => {
  const [accepted, setAccepted] = useState(false);

  const handleAccept = () => {
    if (accepted) {
      onAccept();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Comment fonctionne KairuFlow ?
          </h2>
          
          <Section title="🎮 Ce que TU contrôles">
            <Item>Forcer n'importe quelle décision (avec coût visible)</Item>
            <Item>Désactiver complètement le système</Item>
            <Item>Réinitialiser les adaptations</Item>
            <Item>Exporter/supprimer TES données</Item>
          </Section>
          
          <Section title="🤖 Ce que LE SYSTÈME peut faire">
            <Item icon="🛡️">Refuser des tâches si tu es en surcharge</Item>
            <Item icon="🛡️">Geler les adaptations si elles dérivent</Item>
            <Item icon="🛡️">Activer mode sécurisé en cas de burnout</Item>
          </Section>
          
          <Section title="🤝 Nos principes partagés">
            <Item icon="📖">Transparence totale : tu sais toujours pourquoi</Item>
            <Item icon="↩️">Réversibilité garantie : tout peut être annulé</Item>
            <Item icon="✋">Ton consentement est requis pour les changements majeurs</Item>
          </Section>
          
          <Checkbox 
            label="J'ai compris et j'accepte ces règles" 
            checked={accepted}
            onChange={setAccepted}
          />
          
          <div className="mt-6">
            <Button 
              disabled={!accepted} 
              onClick={handleAccept}
            >
              Commencer à utiliser KairuFlow
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingContract;