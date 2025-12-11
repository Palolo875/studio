'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle2, Lightbulb, TrendingUp, Target } from 'lucide-react';
import { useWindowSize } from 'react-use';
import Confetti from 'react-confetti';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { calculateFocusScore, getFocusScoreMessage as getFocusScoreMessageInternal } from '@/lib/focus-score-calculator';

function EveningContent() {
  const searchParams = useSearchParams();
  const { width, height } = useWindowSize();
  const [showConfetti, setShowConfetti] = useState(true);
  const [brainDump, setBrainDump] = useState('');
  const [lastSavedBrainDump, setLastSavedBrainDump] = useState('');
  const [actionsDetected, setActionsDetected] = useState(0);
  const [showActionBadge, setShowActionBadge] = useState(false);

  const completedTasksParam = searchParams.get('completed');
  const totalTasksParam = searchParams.get('total');
  
  const completedTasks = useMemo(() => completedTasksParam
    ? decodeURIComponent(completedTasksParam).split(',').filter(t => t)
    : [], [completedTasksParam]);

  const totalTasks = useMemo(() => totalTasksParam ? parseInt(totalTasksParam, 10) : 0, [totalTasksParam]);

  const focusScore = useMemo(() => {
    return calculateFocusScore(
      completedTasks.map(task => ({ name: task } as any)), 
      totalTasks, 
      null
    );
  }, [completedTasks.length, totalTasks]);

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  const name = 'Junior';
  
  const getTitle = () => {
    if (focusScore >= 100) return `Bravo, ${name}. Mission accomplie.`;
    if (focusScore >= 60) return `Bravo, ${name}. Une journée solide.`;
    return `Vous avez avancé, c'est l'essentiel.`;
  };

  const getFocusScoreMessage = () => {
    return getFocusScoreMessageInternal(focusScore);
  };

  const getDailyPattern = () => {
    if (completedTasks.length === 0) return { title: "Journée de repos", description: "Vous avez choisi de recharger vos batteries.", explanation: "Prendre des pauses est essentiel pour une productivité durable.", action: "Planifiez des moments de détente demain." };
    if (focusScore >= 100) return { title: "Flow créatif exceptionnel", description: "Toutes les tâches créatives ont été complétées, un signe de flow idéal.", explanation: "Le flow créatif se produit lorsque les défis correspondent à nos compétences.", action: "Identifiez et recréez les conditions de votre créativité." };
    if (focusScore > 80) return { title: "Résilience cognitive remarquable", description: "Malgré une fatigue matinale, vous avez maintenu un excellent niveau de performance.", explanation: "La résilience cognitive est la capacité à maintenir ses capacités après un stress.", action: "Utilisez cette réussite comme motivation." };
    if (focusScore > 60) return { title: "Évitement des tâches administratives", description: "Les tâches administratives ont été systématiquement reportées.", explanation: "Reconnaître ce pattern est la première étape pour le gérer.", action: "Planifiez une tâche administrative facile pour demain." };
    const hasRepeatedTask = completedTasks.some(task => task.toLowerCase().includes("report") || task.toLowerCase().includes("plus tard"));
    if (hasRepeatedTask) return { title: "Blocage récurrent détecté", description: "Une tâche semble être reportée. Cela pourrait indiquer un obstacle.", explanation: "La procrastination peut signaler un manque de clarté ou de ressources.", action: "Découpez cette tâche en étapes plus petites." };
    return { title: "Progression constante", description: "Vous avez maintenu un rythme soutenu.", explanation: "La constance bat souvent l'intensité sporadique.", action: "Continuez sur cette lancée demain." };
  };

  const pattern = getDailyPattern();

  const FocusScoreGauge = () => {
    const radius = 90;
    const circumference = 2 * Math.PI * radius;
    const progress = (focusScore / 100) * circumference;
    return (
      <Card className="bg-card/80 backdrop-blur-lg border-white/20 shadow-2xl rounded-3xl p-8 flex flex-col items-center justify-center aspect-square">
        <h3 className="text-lg font-medium text-muted-foreground mb-6 flex items-center justify-center gap-2">
            <Target className="h-5 w-5" />
            Focus Score
        </h3>
        <div className="relative w-48 h-48 mx-auto">
            <svg className="w-full h-full" viewBox="0 0 200 200">
                <circle cx="100" cy="100" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="12" />
                <motion.circle cx="100" cy="100" r={radius} fill="none" stroke="hsl(var(--primary))" strokeWidth="12" strokeLinecap="round" transform="rotate(-90 100 100)" initial={{ strokeDasharray: 0 }} animate={{ strokeDasharray: `${progress} ${circumference}` }} transition={{ duration: 1.5, ease: "easeOut" }} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-bold text-foreground">{focusScore}%</span>
            </div>
        </div>
        <p className="text-muted-foreground mt-6 text-center">{getFocusScoreMessage()}</p>
      </Card>
    );
  };

  useEffect(() => {
    if (!brainDump || brainDump === lastSavedBrainDump) return;
    const timer = setTimeout(() => {
      console.log("Brain dump auto-saved:", brainDump);
      setLastSavedBrainDump(brainDump);
      const detected = brainDump.split(/[.!?]+/).filter(s => s.toLowerCase().includes('demain') || s.toLowerCase().includes('je dois') || s.toLowerCase().includes('il faut')).length;
      setActionsDetected(detected);
      if (detected > 0) setShowActionBadge(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, [brainDump, lastSavedBrainDump]);

  useEffect(() => {
    if (!showActionBadge) return;
    const timer = setTimeout(() => setShowActionBadge(false), 5000);
    return () => clearTimeout(timer);
  }, [showActionBadge]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.3 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
  };

  return (
    <div className="relative flex flex-col items-center justify-start min-h-screen bg-background overflow-x-hidden p-4 sm:p-8">
      {showConfetti && <Confetti width={width} height={height} numberOfPieces={150} gravity={0.05} colors={['hsl(var(--accent))', 'hsl(var(--primary))', 'hsl(var(--secondary))']} recycle={false} />}
      <div className="absolute inset-0 z-0"><div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[200%] h-[100%] bg-gradient-to-t from-accent/30 via-primary/20 to-secondary/30 rounded-t-full blur-3xl animate-pulse"></div></div>

      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="relative z-10 w-full max-w-5xl text-center space-y-12">
        <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl font-extralight tracking-tight text-foreground">{getTitle()}</motion.h1>

        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {completedTasks.length > 0 ? (
            <div className="text-left space-y-6">
              <h2 className="text-2xl font-medium text-muted-foreground">Aujourd'hui, vous avez accompli :</h2>
              <ul className="space-y-4">
                {completedTasks.map((task, index) => (
                  <motion.li key={index} custom={index} variants={itemVariants} className="flex items-center gap-4 bg-card/80 p-4 rounded-xl backdrop-blur-sm">
                    <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0" />
                    <span className="text-foreground font-medium">{task}</span>
                  </motion.li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="mt-8 text-muted-foreground">Demain est un nouveau jour. Reposez-vous.</p>
          )}
          <FocusScoreGauge />
        </motion.div>

        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="bg-purple-100/50 dark:bg-purple-900/20 border-purple-200/50 p-6 rounded-2xl text-left">
            <h4 className="font-semibold text-foreground flex items-center gap-2 mb-4"><Lightbulb className="h-5 w-5 text-purple-400" />Votre pattern aujourd'hui</h4>
            <div className="space-y-4">
              <div>
                <h5 className="font-semibold text-foreground">{pattern.title}</h5>
                <p className="text-sm text-muted-foreground mt-1">{pattern.description}</p>
              </div>
              <div className="flex items-start gap-3 text-sm"><TrendingUp className="h-4 w-4 text-purple-400 mt-1 flex-shrink-0" /><span className="text-muted-foreground">{pattern.explanation}</span></div>
              <div className="flex items-start gap-3 text-sm"><Target className="h-4 w-4 text-purple-400 mt-1 flex-shrink-0" /><span className="text-muted-foreground">{pattern.action}</span></div>
            </div>
            <Button variant="link" size="sm" className="p-0 h-auto mt-4 text-purple-600 dark:text-purple-400">Voir tous mes patterns →</Button>
          </Card>

          <Card className="bg-card/80 backdrop-blur-lg border-white/20 shadow-xl rounded-2xl p-6 text-left">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-foreground">Une dernière pensée pour demain ?</h4>
              {showActionBadge && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">{actionsDetected} action{actionsDetected > 1 ? 's' : ''} détectée{actionsDetected > 1 ? 's' : ''}</span>}
            </div>
            <p className="text-sm text-muted-foreground/80 mt-1 mb-4">Videz votre esprit avant de vous déconnecter.</p>
            <Textarea value={brainDump} onChange={(e) => setBrainDump(e.target.value)} placeholder="Notez tout ce qui vous passe par la tête…" className="bg-muted/50 border-0" rows={4} />
            <div className="flex gap-2 mt-3">
              <Button variant="outline" size="sm" onClick={() => { if (brainDump.trim() && brainDump !== lastSavedBrainDump) { console.log("Brain dump saved:", brainDump); setLastSavedBrainDump(brainDump); } }}>Sauvegarder</Button>
              {showActionBadge && <Button variant="default" size="sm" onClick={() => alert(`${actionsDetected} action(s) détectée(s).`)}>Trier les actions</Button>}
            </div>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants} className="pt-8">
            <p className="text-muted-foreground mb-6">L'esprit libre, la soirée vous appartient.</p>
            <Button size="lg" className="rounded-full h-14 px-10 text-lg" onClick={() => { setShowConfetti(true); setTimeout(() => { window.location.href = '/dashboard'; }, 3000); }}>Fermer la journée</Button>
            <p className="text-muted-foreground mt-4">À demain, {name}</p>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default function EveningPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <EveningContent />
        </Suspense>
    )
}
