'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FocusDemo } from '@/components/focus/focus-demo';

export function FocusModeDoc() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Mode Focus Adaptatif</CardTitle>
          <CardDescription>
            Un environnement de travail sans distraction pour accomplir vos tâches
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="prose max-w-none">
            <h3>Fonctionnalités</h3>
            <ul>
              <li>Timer Pomodoro configurable (travail + pause)</li>
              <li>Espace de travail plein écran minimaliste</li>
              <li>Zone de notes rapides avec sauvegarde automatique</li>
              <li>Sons discrets à la fin de chaque cycle</li>
              <li>Tracking des sessions complétées</li>
            </ul>
            
            <h3>Configuration</h3>
            <p>
              Le Mode Focus Adaptatif peut être configuré dans les paramètres de l'application :
            </p>
            <ul>
              <li>Durée de travail (par défaut 25 minutes)</li>
              <li>Durée de pause (par défaut 5 minutes)</li>
              <li>Activation de la sauvegarde automatique des notes</li>
              <li>Activation des sons de notification</li>
            </ul>
            
            <h3>Démo</h3>
            <p>Voici un aperçu du Mode Focus Adaptatif :</p>
          </div>
        </CardContent>
      </Card>
      
      <FocusDemo />
    </div>
  );
}