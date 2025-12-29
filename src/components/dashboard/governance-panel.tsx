// Composant pour le panneau de gouvernance de la Phase 7
// Affiche les informations de gouvernance et permet l'interaction avec les mécanismes de la Phase 7

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  User,
  Cpu,
  Lock,
  Unlock,
  Vote
} from 'lucide-react';
import {
  GovernanceMetrics
} from '@/lib/governanceDashboard';
import {
  SovereigntyMode
} from '@/lib/phase7Implementation';
import { phase7Manager } from '@/lib/phase7Main';

// Types pour les props
interface GovernancePanelProps {
  onModeChange?: (mode: SovereigntyMode) => void;
  onConflictResolve?: (conflictId: string, choice: number) => void;
}

// Composant principal du panneau de gouvernance
export function GovernancePanel({
  onModeChange,
  onConflictResolve
}: GovernancePanelProps) {

  // États locaux
  const [metrics, setMetrics] = useState<GovernanceMetrics | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState<boolean>(false);
  // Note: Dans une implémentation complète, ces états viendraient du gestionnaire de Phase 7
  const [protectiveModeActive, setProtectiveModeActive] = useState<boolean>(false);
  const [unresolvedConflicts, setUnresolvedConflicts] = useState<number>(0);

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      await phase7Manager.checkBurnoutAndProtect();
    } catch {
      setError('Impossible de rafraîchir la gouvernance.');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    const dashboard = phase7Manager.getGovernanceDashboard();

    // S'abonner aux mises à jour (Pattern Observer)
    const unsubscribe = dashboard.subscribe((newMetrics) => {
      setMetrics(newMetrics);
      setIsLoading(false);
    });

    // Lancer une première vérification immédiate
    phase7Manager.checkBurnoutAndProtect().catch(() => {
      setError('Impossible de charger la gouvernance.');
      setIsLoading(false);
    });

    // Vérifier périodiquement (toutes les minutes)
    const interval = setInterval(() => {
      phase7Manager.checkBurnoutAndProtect().catch(() => {
        setError('Impossible de mettre à jour la gouvernance.');
      });
    }, 60000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const handleModeChange = (newMode: SovereigntyMode) => {
    const success = phase7Manager.updateSovereigntyMode(newMode);

    if (success && onModeChange) {
      onModeChange(newMode);
    }
  };

  const handleRequestExitProtectiveMode = () => {
    const protectiveManager = phase7Manager.getProtectiveModeManager();
    const success = protectiveManager.requestExit();

    if (success) {
      setProtectiveModeActive(protectiveManager.isActive());
    }
  };

  const handleResolveConflict = (conflictId: string, choice: number) => {
    const conflictResolver = phase7Manager.getConflictResolver();
    const result = conflictResolver.resolveInternally(conflictId, choice);

    if (result && onConflictResolve) {
      onConflictResolve(conflictId, choice);
    }

    // Mettre à jour le compteur de conflits non résolus
    setUnresolvedConflicts(prev => Math.max(0, prev - 1));
  };

  // Obtenir la couleur du score d'intégrité
  const getIntegrityColor = (score: number) => {
    if (score < 0.4) return "text-red-500";
    if (score < 0.6) return "text-yellow-500";
    return "text-green-500";
  };

  // Obtenir le texte d'évaluation
  const getIntegrityAssessment = (score: number) => {
    if (score < 0.3) return "Système trop autoritaire";
    if (score < 0.4) return "Majoritairement autoritaire";
    if (score < 0.6) return "Bon équilibre";
    if (score < 0.7) return "Majoritairement autonome";
    return "Trop autonome";
  };

  // Obtenir l'icône du mode
  const getModeIcon = (mode: SovereigntyMode) => {
    switch (mode) {
      case SovereigntyMode.MANUAL:
        return <User className="h-4 w-4" />;
      case SovereigntyMode.ASSISTED:
        return <Shield className="h-4 w-4" />;
      case SovereigntyMode.GUIDED:
        return <Cpu className="h-4 w-4" />;
      case SovereigntyMode.PROTECTIVE:
        return <Lock className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  // Obtenir le nom du mode
  const getModeName = (mode: SovereigntyMode) => {
    switch (mode) {
      case SovereigntyMode.MANUAL:
        return "Manuel";
      case SovereigntyMode.ASSISTED:
        return "Assisté";
      case SovereigntyMode.GUIDED:
        return "Guidé";
      case SovereigntyMode.PROTECTIVE:
        return "Protectif";
      default:
        return "Inconnu";
    }
  };

  // Rendu du contenu principal
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Panneau de Gouvernance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>Chargement des métriques de gouvernance...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-500" />
            Erreur
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Panneau de Gouvernance
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={isLoading}
              title="Rafraîchir les métriques"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? "Moins" : "Plus"}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Score d'intégrité autonomie */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Intégrité Autonomie</span>
            <Badge
              variant="outline"
              className={getIntegrityColor(metrics?.autonomyIntegrityScore || 0)}
            >
              {(metrics?.autonomyIntegrityScore || 0).toFixed(1)}
            </Badge>
          </div>
          <Progress
            value={(metrics?.autonomyIntegrityScore || 0) * 100}
            className="h-2"
          />
          <p className="text-xs text-muted-foreground">
            {getIntegrityAssessment(metrics?.autonomyIntegrityScore || 0)}
          </p>
        </div>

        {/* Mode actuel */}
        <div className="space-y-2">
          <span className="text-sm font-medium">Mode de Souveraineté</span>
          <div className="flex items-center gap-2">
            {getModeIcon(metrics?.currentMode || SovereigntyMode.GUIDED)}
            <span>{getModeName(metrics?.currentMode || SovereigntyMode.GUIDED)}</span>
            {metrics?.currentMode === SovereigntyMode.PROTECTIVE && (
              <Badge variant="destructive" className="ml-auto">
                Actif
              </Badge>
            )}
          </div>

          {/* Actions spécifiques au mode */}
          {metrics?.currentMode === SovereigntyMode.PROTECTIVE && (
            <div className="pt-2 space-y-2">
              <p className="text-xs text-muted-foreground">
                Mode protectif actif. Certaines restrictions sont appliquées.
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={handleRequestExitProtectiveMode}
                className="w-full"
              >
                <Unlock className="h-4 w-4 mr-2" />
                Demander à sortir
              </Button>
            </div>
          )}
        </div>

        {/* Risque de burnout */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Risque de Burnout</span>
            <Badge
              variant={
                (metrics?.burnoutRisk || 0) > 0.7 ? "destructive" :
                  (metrics?.burnoutRisk || 0) > 0.5 ? "warning" : "default"
              }
            >
              {((metrics?.burnoutRisk || 0) * 100).toFixed(0)}%
            </Badge>
          </div>
          <Progress
            value={(metrics?.burnoutRisk || 0) * 100}
            className="h-2"
            indicatorClassName={
              (metrics?.burnoutRisk || 0) > 0.7 ? "bg-red-500" :
                (metrics?.burnoutRisk || 0) > 0.5 ? "bg-yellow-500" : "bg-green-500"
            }
          />
        </div>

        {/* Taux d'overrides */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Taux d'Overrides</span>
            <Badge
              variant={
                (metrics?.overrideRate || 0) > 0.8 ? "destructive" :
                  (metrics?.overrideRate || 0) > 0.5 ? "warning" : "default"
              }
            >
              {((metrics?.overrideRate || 0) * 100).toFixed(0)}%
            </Badge>
          </div>
          <Progress
            value={(metrics?.overrideRate || 0) * 100}
            className="h-2"
            indicatorClassName={
              (metrics?.overrideRate || 0) > 0.8 ? "bg-red-500" :
                (metrics?.overrideRate || 0) > 0.5 ? "bg-yellow-500" : "bg-green-500"
            }
          />
        </div>

        {/* Détails supplémentaires */}
        {showDetails && metrics && (
          <div className="space-y-4 pt-4 border-t">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Décisions Utilisateur</p>
                <p className="text-lg font-semibold">{metrics.userDecisions}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Décisions Système</p>
                <p className="text-lg font-semibold">{metrics.systemDecisions}</p>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Dernier changement de mode</p>
              <p className="text-sm">
                {new Date(metrics.lastModeChange).toLocaleString()}
              </p>
            </div>

            {unresolvedConflicts > 0 && (
              <div className="flex items-center gap-2 p-3 rounded-md bg-yellow-50 dark:bg-yellow-900/20">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <span className="text-sm">
                  {unresolvedConflicts} conflit(s) en attente de résolution
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  className="ml-auto"
                  onClick={() => null}
                >
                  <Vote className="h-4 w-4 mr-1" />
                  Résoudre
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Actions principales */}
        <div className="flex flex-wrap gap-2 pt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleModeChange(SovereigntyMode.MANUAL)}
            disabled={metrics?.currentMode === SovereigntyMode.PROTECTIVE}
          >
            <User className="h-4 w-4 mr-1" />
            Manuel
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleModeChange(SovereigntyMode.ASSISTED)}
            disabled={metrics?.currentMode === SovereigntyMode.PROTECTIVE}
          >
            <Shield className="h-4 w-4 mr-1" />
            Assisté
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleModeChange(SovereigntyMode.GUIDED)}
            disabled={metrics?.currentMode === SovereigntyMode.PROTECTIVE}
          >
            <Cpu className="h-4 w-4 mr-1" />
            Guidé
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}