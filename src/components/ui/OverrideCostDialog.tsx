// Override Cost Dialog - Boîte de dialogue pour afficher le coût des overrides
// Implémentation du composant UI pour afficher le coût des overrides

import React, { useState } from 'react';
import { Task } from '@/lib/types';
import { computeOverrideCost, type UserContext } from '@/lib/costEngine';
import { formatCost, getConsequenceDescription } from '@/lib/costEngine';

// Props pour le composant
interface OverrideCostDialogProps {
  task: Task;
  context: UserContext;
  onConfirm: (cost: ReturnType<typeof computeOverrideCost>) => void;
  onCancel: () => void;
}

// Composant de boîte de dialogue pour le coût des overrides
export const OverrideCostDialog: React.FC<OverrideCostDialogProps> = ({
  task,
  context,
  onConfirm,
  onCancel
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [cost, setCost] = useState<ReturnType<typeof computeOverrideCost> | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Calculer le coût lors du montage du composant
  React.useEffect(() => {
    const calculateCost = async () => {
      try {
        setIsLoading(true);
        const calculatedCost = computeOverrideCost(task, context);
        setCost(calculatedCost);
      } catch (err) {
        setError('Erreur lors du calcul du coût');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    calculateCost();
  }, [task, context]);

  // Gérer la confirmation
  const handleConfirm = () => {
    if (cost) {
      onConfirm(cost);
    }
  };

  // Afficher l'état de chargement
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-96">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
          <p className="text-center mt-2">Calcul du coût...</p>
        </div>
      </div>
    );
  }

  // Afficher l'erreur
  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-96">
          <h3 className="text-lg font-medium text-red-600">Erreur</h3>
          <p className="mt-2">{error}</p>
          <div className="mt-4 flex justify-end">
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Afficher le coût
  if (cost) {
    const consequences = getConsequenceDescription(cost);
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-96 max-h-screen overflow-y-auto">
          <h2 className="text-xl font-bold mb-4">Forcer "{task.name}" ?</h2>
          
          <div className="mb-4">
            <p className="text-lg">
              Coût : <span className="font-bold">{formatCost(cost)}</span> du budget demain
            </p>
          </div>
          
          {consequences.length > 0 && (
            <div className="mb-4 p-3 bg-yellow-50 rounded-md">
              <h3 className="font-medium text-yellow-800">Conséquences :</h3>
              <ul className="list-disc list-inside mt-1">
                {consequences.map((consequence, index) => (
                  <li key={index} className="text-yellow-700">{consequence}</li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="flex justify-between">
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              Annuler
            </button>
            <button
              onClick={handleConfirm}
              className={`px-4 py-2 rounded-md ${
                cost.consequences.warningLevel === 'HIGH' 
                  ? 'bg-red-500 hover:bg-red-600 text-white' 
                  : cost.consequences.warningLevel === 'MEDIUM'
                  ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              Forcer ({(cost.consequences.budgetReduction * 100).toFixed(0)} pts)
            </button>
          </div>
        </div>
      </div>
    );
  }

  // État par défaut (ne devrait pas arriver)
  return null;
};

// Bouton pour déclencher la boîte de dialogue
interface OverrideButtonProps {
  task: Task;
  context: UserContext;
  onOverride: (cost: ReturnType<typeof computeOverrideCost>) => void;
}

export const OverrideButton: React.FC<OverrideButtonProps> = ({
  task,
  context,
  onOverride
}) => {
  const [showDialog, setShowDialog] = useState(false);

  const handleOverrideClick = async () => {
    setShowDialog(true);
  };

  const handleConfirm = (cost: ReturnType<typeof computeOverrideCost>) => {
    setShowDialog(false);
    onOverride(cost);
  };

  const handleCancel = () => {
    setShowDialog(false);
  };

  return (
    <>
      <button
        onClick={handleOverrideClick}
        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
      >
        Forcer
      </button>
      
      {showDialog && (
        <OverrideCostDialog
          task={task}
          context={context}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </>
  );
};