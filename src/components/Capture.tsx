/**
 * Composant de capture NLP SOTA
 * Permet aux utilisateurs de créer des tâches par langage naturel avec approche state-of-the-art
 */
'use client';

import { useState } from 'react';
import { useNLP } from '@/hooks/useNLP';

export function Capture() {
  const [text, setText] = useState('');
  const { processText, isProcessing, error } = useNLP();
  
  const handleSubmit = async () => {
    const result = await processText(text);
    if (result.success) {
      setText(''); // Reset
      // Afficher un message de succès avec des détails
      const avgConfidence = result.tasks.reduce((acc, task) => acc + ((task as any).confidence || 0), 0) / result.tasks.length;
      const energyTypes = result.tasks.map(t => (t as any).energy).filter(Boolean).join(', ');
      alert(`${result.tasks.length} tâches créées !
Confiance moyenne: ${(avgConfidence * 100).toFixed(1)}%
Types d'énergie: ${energyTypes || 'non spécifiés'}

Les tâches ont été stockées dans votre base de données et sont prêtes à être utilisées dans votre playlist quotidienne.`);
    } else {
      alert('Tâches créées avec le mode fallback.');
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Capture Inteligente SOTA</h2>
        <p className="text-gray-600 mb-6">
          Décrivez vos tâches en langage naturel, KairuFlow les transforme automatiquement en tâches structurées avec intelligence mmBERT et les stocke dans votre base.
        </p>
        
        <div className="mb-6">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Parlez à KairuFlow... 'Appeler Marc demain, écrire rapport Q4'"
            className="w-full h-32 p-4 border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            rows={4}
          />
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg">
            {error}
          </div>
        )}
        
        <button
          onClick={handleSubmit}
          disabled={isProcessing || !text.trim()}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 px-6 rounded-xl font-medium disabled:opacity-50 hover:from-blue-600 hover:to-purple-600 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
        >
          {isProcessing ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              🤖 Pipeline NLP en cours...
            </div>
          ) : (
            '✨ Créer mes tâches (Pipeline complet)'
          )}
        </button>
        
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">Détection</h3>
            <p className="text-sm text-blue-600">Langue SOTA</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="font-semibold text-purple-800 mb-2">Extraction</h3>
            <p className="text-sm text-purple-600">Structurelle</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-2">Classification</h3>
            <p className="text-sm text-green-600">mmBERT</p>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <h3 className="font-semibold text-orange-800 mb-2">Stockage</h3>
            <p className="text-sm text-orange-600">Dexie optimisé</p>
          </div>
        </div>
        
        <div className="mt-6 text-sm text-gray-500">
          <p>Exemples :</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>"Appeler Marc demain 15h urgent"</li>
            <li>"Écrire rapport Q4 2h lundi"</li>
            <li>"Préparer présentation équipe"</li>
          </ul>
        </div>
      </div>
    </div>
  );
}