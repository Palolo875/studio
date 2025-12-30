
'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Lightbulb, TrendingUp, Target } from 'lucide-react';
import { useWindowSize } from 'react-use';
import Confetti from 'react-confetti';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Textarea } from '@/components/ui/textarea';
import { calculateFocusScore, getFocusScoreMessage } from '@/lib/focus-score-calculator';
import { useToast } from '@/hooks/use-toast';
import { getLatestEveningEntry, upsertEveningEntry } from '@/lib/database';

interface EveningCelebrationProps {
  completedTasks: string[];
  totalTasks: number;
  name?: string;
  onCelebrationComplete?: () => void;
  userEnergyLevel?: "high" | "medium" | "low" | null;
}

export function EveningCelebration({ 
  completedTasks, 
  totalTasks, 
  name = 'Junior',
  onCelebrationComplete,
  userEnergyLevel = null
}: EveningCelebrationProps) {
  const { toast } = useToast();
  const { width, height } = useWindowSize();
  const [showConfetti, setShowConfetti] = useState(true);
  const [brainDump, setBrainDump] = useState('');
  const [lastSavedBrainDump, setLastSavedBrainDump] = useState('');
  const [actionsDetected, setActionsDetected] = useState(0);
  const [showActionBadge, setShowActionBadge] = useState(false);
  const [eveningEntryId, setEveningEntryId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const latest = await getLatestEveningEntry();
        if (cancelled) return;
        if (!latest) return;
        setEveningEntryId(latest.id);
        setBrainDump(latest.brainDump);
        setLastSavedBrainDump(latest.brainDump);
        setActionsDetected(latest.actionsDetected);
        setShowActionBadge(latest.actionsDetected > 0);
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Auto-save brain dump every 2 seconds
  useEffect(() => {
    if (!brainDump || brainDump === lastSavedBrainDump) return;
    
    const timer = setTimeout(() => {
      setLastSavedBrainDump(brainDump);
      
      // Simulate NLP analysis to detect actions
      const detectedActions = brainDump.split(/[.!?]+/).filter(sentence => 
        sentence.toLowerCase().includes('demain') || 
        sentence.toLowerCase().includes('je dois') ||
        sentence.toLowerCase().includes('il faut')
      ).length;
      
      setActionsDetected(detectedActions);
      if (detectedActions > 0) {
        setShowActionBadge(true);
      }

      const now = new Date();
      const id = eveningEntryId ?? `evening_${now.getTime()}`;
      void upsertEveningEntry({
        id,
        timestamp: now.getTime(),
        brainDump,
        actionsDetected: detectedActions,
        transformedToTasks: false,
      });
      setEveningEntryId(id);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [brainDump, lastSavedBrainDump, eveningEntryId]);

  // Hide action badge after 5 seconds of inactivity
  useEffect(() => {
    if (!showActionBadge) return;
    
    const timer = setTimeout(() => {
      setShowActionBadge(false);
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [showActionBadge]);

  // Calcul du Focus Score selon la nouvelle formule
    const focusScore = calculateFocusScore(
      completedTasks.map(task => ({ name: task } as any)), 
      totalTasks, 
      userEnergyLevel
    );

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  const handleManualSaveBrainDump = async () => {
    const text = brainDump.trim();
    if (!text) return;

    const detectedActions = text
      .split(/[.!?]+/)
      .filter(sentence =>
        sentence.toLowerCase().includes('demain') ||
        sentence.toLowerCase().includes('je dois') ||
        sentence.toLowerCase().includes('il faut')
      ).length;

    const now = new Date();
    const id = eveningEntryId ?? `evening_${now.getTime()}`;

    try {
      await upsertEveningEntry({
        id,
        timestamp: now.getTime(),
        brainDump: text,
        actionsDetected: detectedActions,
        transformedToTasks: false,
      });

      setEveningEntryId(id);
      setLastSavedBrainDump(text);
      setActionsDetected(detectedActions);
      if (detectedActions > 0) setShowActionBadge(true);

      toast({
        title: 'Sauvegardé',
        description: 'Pensée sauvegardée.',
      });
    } catch {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de sauvegarder la pensée.',
      });
    }
  };

  const getTitle = () => {
    if (focusScore >= 100) {
      return `Bravo, ${name}. Mission accomplie.`;
    }
    if (focusScore >= 60) {
      return `Bravo, ${name}. Une journée solide.`;
    }
    return `Vous avez avancé, c'est l'essentiel.`;
  };

  

  // Pattern analysis based on completed tasks
  const getDailyPattern = () => {
    if (completedTasks.length === 0) {
      return {
        title: "Journée de repos",
        description: "Vous avez choisi de recharger vos batteries. Parfois, c'est ce dont on a le plus besoin.",
        advice: "Écoutez toujours votre énergie. La productivité n'est pas une course.",
        explanation: "Prendre des pauses régulières est essentiel pour maintenir une productivité durable. Votre cerveau a besoin de temps pour récupérer et consolider les apprentissages.",
        action: "Planifiez quelques moments de détente dans votre journée de demain."
      };
    }
    
    // Exemple de détection de pattern plus sophistiquée
    // Dans une vraie application, cela serait basé sur des données réelles
    if (focusScore >= 100) {
      return {
        title: "Journée créative exceptionnelle",
        description: "Toutes les tâches créatives ont été complétées. C'est le signe que vous étiez dans un état de flow idéal pour l'exploration d'idées.",
        advice: "Continuez à cultiver ces moments de créativité intense.",
        explanation: "Le flow créatif est un état mental où une personne est entièrement immergée dans une activité. Cela se produit souvent lorsque les défis correspondent à nos compétences.",
        action: "Identifiez les conditions qui favorisent votre créativité et recréez-les demain."
      };
    }
    
    if (focusScore > 80) {
      return {
        title: "Résilience cognitive remarquable",
        description: "Malgré une fatigue matinale, vous avez maintenu un excellent niveau de performance. C'est un signe de résilience mentale.",
        advice: "Votre capacité à performer malgré les obstacles est impressionnante.",
        explanation: "La résilience cognitive est la capacité à maintenir ou retrouver ses capacités cognitives après un stress ou une fatigue. C'est un indicateur de robustesse mentale.",
        action: "Reconnaissez cette réussite et utilisez-la comme motivation pour demain."
      };
    }
    
    if (focusScore > 60) {
      return {
        title: "Évitement des tâches administratives",
        description: "Les tâches administratives ont été systématiquement reportées. Cela pourrait indiquer une préférence naturelle pour les activités créatives.",
        advice: "Trouvez un équilibre entre les tâches que vous aimez et celles que vous évitez.",
        explanation: "Nous avons tous tendance à éviter certaines tâches, surtout celles perçues comme ennuyeuses ou stressantes. Reconnaître ce pattern est la première étape pour le gérer.",
        action: "Planifiez une tâche administrative facile pour demain pour briser ce cycle."
      };
    }
    
    // Pattern pour détection de blocage récurrent
    // Simulation d'une logique qui détecterait qu'une même tâche a été reportée plusieurs fois
    const hasRepeatedTask = completedTasks.length > 0 && completedTasks.some(task => 
      task.toLowerCase().includes("report") || task.toLowerCase().includes("plus tard")
    );
    
    if (hasRepeatedTask) {
      return {
        title: "Blocage récurrent détecté",
        description: "Une tâche semble être reportée depuis plusieurs jours. Cela pourrait indiquer un obstacle sous-jacent.",
        advice: "Identifiez pourquoi cette tâche est difficile à commencer.",
        explanation: "Le procrastination chronique peut être le signe d'un manque de clarté, de ressources ou de compétences. Parfois, une tâche semble plus grande qu'elle ne l'est en réalité.",
        action: "Découpez cette tâche en étapes plus petites pour demain."
      };
    }
    
    return {
      title: "Progression constante",
      description: "Vous avez maintenu un rythme soutenu tout au long de la journée.",
      advice: "Cette approche équilibrée est souvent la clé d'une productivité durable.",
      explanation: "La constance bat souvent l'intensité sporadique. Votre approche méthodique montre une maturité dans la gestion de votre temps.",
      action: "Continuez sur cette lancée en maintenant votre routine demain."
    };
  };

  const pattern = getDailyPattern();

  // Focus Score gauge component
  const FocusScoreGauge = () => {
    const radius = 90;
    const circumference = 2 * Math.PI * radius;
    const progress = (focusScore / 100) * circumference;
    
    return (
      <div className="relative w-48 h-48 mx-auto">
        <svg className="w-full h-full" viewBox="0 0 200 200">
          {/* Background circle */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="12"
          />
          
          {/* Progress circle */}
          <motion.circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="12"
            strokeLinecap="round"
            transform="rotate(-90 100 100)"
            initial={{ strokeDasharray: `0 ${circumference}` }}
            animate={{ 
              strokeDasharray: `${progress} ${circumference}`
            }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
        </svg>
        
        {/* Center score */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold text-foreground">
            {focusScore}%
          </span>
          <span className="text-sm text-muted-foreground mt-1">Focus Score</span>
        </div>
      </div>
    );
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-background overflow-hidden p-4">
      {showConfetti && (
        <Confetti
          width={width}
          height={height}
          numberOfPieces={150}
          gravity={0.05}
          colors={['hsl(var(--accent))', 'hsl(var(--primary))', 'hsl(var(--secondary))']}
          recycle={false}
        />
      )}

      <div className="absolute inset-0 z-0">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[200%] h-[100%] bg-gradient-to-t from-accent/30 via-primary/20 to-secondary/30 rounded-t-full blur-3xl animate-pulse"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-3xl text-center"
      >
        <Card className="bg-card/80 backdrop-blur-lg border-white/20 shadow-2xl rounded-3xl p-8 md:p-12">
          <h1 className="text-4xl md:text-6xl font-extralight tracking-tight text-foreground">
            {getTitle()}
          </h1>

          {completedTasks.length > 0 ? (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                visible: {
                  transition: { staggerChildren: 0.1, delayChildren: 0.5 },
                },
              }}
              className="mt-12 text-left"
            >
              <h2 className="text-lg font-medium text-muted-foreground mb-6">
                Aujourd'hui, vous avez :
              </h2>
              <ul className="space-y-4">
                {completedTasks.map((task, index) => (
                  <motion.li
                    key={index}
                    variants={{
                      hidden: { opacity: 0, x: -20 },
                      visible: { opacity: 1, x: 0 },
                    }}
                    className="flex items-center gap-4 bg-muted/50 p-4 rounded-xl"
                  >
                    <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0" />
                    <span className="text-foreground font-medium">{task}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          ) : (
            <p className="mt-8 text-muted-foreground">Demain est un nouveau jour. Reposez-vous.</p>
          )}

          {/* Focus Score Section */}
          <div className="mt-12">
            <h3 className="text-lg font-medium text-muted-foreground mb-6 flex items-center justify-center gap-2">
              <Target className="h-5 w-5" />
              Focus Score du jour
            </h3>
            <FocusScoreGauge />
            <p className="text-muted-foreground mt-4">{getFocusScoreMessage(focusScore)}</p>
          </div>

          {/* Daily Pattern Analysis */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="mt-12"
          >
            <Card className="bg-purple-100/50 dark:bg-purple-900/20 border-purple-200/50 p-6 rounded-2xl text-left">
              <h4 className="font-semibold text-foreground flex items-center gap-2 mb-2">
                <Lightbulb className="h-5 w-5 text-purple-400" /> 
                Votre pattern aujourd'hui
              </h4>
              <div className="space-y-3">
                <div>
                  <h5 className="font-semibold text-foreground">{pattern.title}</h5>
                  <p className="text-sm text-muted-foreground mt-1">
                    {pattern.description}
                  </p>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <TrendingUp className="h-4 w-4 text-purple-400 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">{pattern.explanation}</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <Target className="h-4 w-4 text-purple-400 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">{pattern.action}</span>
                </div>
              </div>
              <Button 
                variant="link" 
                size="sm" 
                className="p-0 h-auto mt-3 text-purple-600 dark:text-purple-400"
              >
                Voir tous mes patterns →
              </Button>
            </Card>
          </motion.div>
          
          {/* Brain Dump / Vide-Cerveau */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.5 }}
            className="mt-8"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-medium text-muted-foreground">Une dernière pensée pour demain ?</h4>
              {showActionBadge && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {actionsDetected} action{actionsDetected > 1 ? 's' : ''} détectée{actionsDetected > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground/80 mt-1 mb-4">Videz votre esprit avant de vous déconnecter.</p>
            <Textarea 
              value={brainDump}
              onChange={(e) => setBrainDump(e.target.value)}
              placeholder="Notez tout ce qui vous passe par la tête… Demain je dois… , j’ai pensé à… , je me sens…"
              className="bg-muted/50 border-0"
              rows={4}
            />
            <div className="flex gap-2 mt-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  if (brainDump.trim() && brainDump !== lastSavedBrainDump) {
                    void handleManualSaveBrainDump();
                  }
                }}
              >
                Sauvegarder ma pensée
              </Button>
              {showActionBadge && (
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={() => {
                    // In a real app, this would open a modal to triage detected actions
                    toast({
                      title: 'Actions détectées',
                      description: `${actionsDetected} action(s) détectée(s).`,
                    });
                  }}
                >
                  Trier les actions
                </Button>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.5 }}
            className="mt-12"
          >
            <p className="text-muted-foreground mb-6">
              L'esprit libre, la soirée vous appartient.
            </p>
            <Button 
              size="lg" 
              className="rounded-full h-12 px-8"
              onClick={() => {
                // Show final confetti
                setShowConfetti(true);
                
                // Call the onComplete callback
                if (onCelebrationComplete) {
                  setTimeout(onCelebrationComplete, 3000);
                } else {
                  setTimeout(() => window.location.href = '/dashboard', 3000);
                }
              }}
            >
              Fermer la journée
            </Button>
            <p className="text-muted-foreground mt-4 text-sm">
              À demain, {name}
            </p>
          </motion.div>
        </Card>
      </motion.div>
    </div>
  );
}
