'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle2, Lightbulb, TrendingUp, Target } from 'lucide-react';
import { useWindowSize } from 'react-use';
import Confetti from 'react-confetti';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { calculateFocusScore, getFocusScoreMessage as getFocusScoreMessageInternal } from '@/lib/focus-score-calculator';
import { getLatestEveningEntry, upsertEveningEntry, upsertTasks } from '@/lib/database';
import { useToast } from '@/hooks/use-toast';
import { LanguageDetector } from '@/lib/nlp/LanguageDetector';
import { extractTasks } from '@/lib/nlp/TaskExtractor';
import { classifyTask } from '@/lib/nlp/RealTaskClassifier';
import { createFullTask } from '@/lib/nlp/TaskFactory';

function EveningContent() {
  const searchParams = useSearchParams();
  const { width, height } = useWindowSize();
  const { toast } = useToast();
  const [showConfetti, setShowConfetti] = useState(true);
  const [brainDump, setBrainDump] = useState('');
  const [lastSavedBrainDump, setLastSavedBrainDump] = useState('');
  const [actionsDetected, setActionsDetected] = useState(0);
  const [showActionBadge, setShowActionBadge] = useState(false);
  const [eveningEntryId, setEveningEntryId] = useState<string | null>(null);

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
  }, [completedTasks, totalTasks]);

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 2500);
    return () => clearTimeout(timer);
  }, []);

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

  const name = 'Junior';
  
  const getTitle = () => {
    if (focusScore >= 95) return `Une journée exceptionnelle, ${name}.`;
    if (focusScore >= 70) return `Mission accomplie, ${name}. Bravo !`;
    if (focusScore >= 40) return `Une journée solide et productive.`;
    return `Aujourd'hui, vous avez avancé. C'est l'essentiel.`;
  };

  const getFocusScoreMessage = () => {
    return getFocusScoreMessageInternal(focusScore);
  };

  const getDailyPattern = () => {
      if (completedTasks.length === 0) return { title: "Une journée pour recharger les batteries", description: "Parfois, la meilleure chose à faire est de ne rien faire. Le repos est aussi une forme de productivité.", explanation: "Le repos permet à votre esprit de consolider les informations et de retrouver de l'énergie pour les défis à venir. C'est un investissement, pas une perte de temps.", action: "Comment pouvez-vous intégrer un peu plus de calme dans votre journée de demain ?" };
      if (focusScore >= 95) return { title: "Un état de flow remarquable", description: "Vous avez été dans la zone aujourd'hui. Tout semblait fluide, concentré et efficace.", explanation: "Le 'flow' est cet état mental où l'on est complètement immergé dans une activité. C'est le Graal de la productivité créative.", action: "Quelles étaient les conditions qui vous ont permis d'atteindre cet état ? Essayez de les recréer." };
      if (focusScore > 80) return { title: "Une résilience impressionnante", description: "Même si la matinée a pu sembler difficile, vous avez su trouver les ressources pour finir en force.", explanation: "La résilience cognitive, c'est cette capacité à rebondir et à maintenir sa performance malgré les obstacles. C'est une compétence précieuse.", action: "Prenez un instant pour reconnaître cette force intérieure. Vous êtes plus endurant que vous ne le pensez." };
      if (focusScore > 60) return { title: "Le piège des tâches faciles", description: "Vous avez accompli beaucoup de choses, mais peut-être en évitant les sujets plus complexes.", explanation: "Il est naturel de préférer les 'quick wins'. Cela donne un sentiment d'accomplissement, mais peut masquer un évitement des tâches de fond qui ont plus d'impact.", action: "Demain, essayez de commencer par une seule tâche un peu plus difficile. Juste une." };
      const hasRepeatedTask = completedTasks.some(task => task.toLowerCase().includes("report") || task.toLowerCase().includes("plus tard"));
      if (hasRepeatedTask) return { title: "Le cycle de la procrastination", description: "Une tâche semble revenir encore et encore. C'est un signe qu'un obstacle vous bloque.", explanation: "La procrastination n'est pas de la paresse. C'est souvent le symptôme d'une tâche mal définie, trop intimidante, ou d'un manque de clarté sur la prochaine étape.", action: "Prenez 2 minutes pour découper cette tâche en une seule micro-action de moins de 5 minutes." };
      return { title: "La force tranquille de la constance", description: "Vous avez avancé pas à pas, de manière régulière et soutenue. C'est la clé du succès sur le long terme.", explanation: "L'intensité est impressionnante, mais la constance est invincible. Votre approche méthodique est un marathon, pas un sprint.", action: "Maintenez ce rythme demain. La régularité est votre plus grande alliée." };
  };

  const pattern = getDailyPattern();

  const FocusScoreGauge = () => {
    const radius = 60; // smaller radius
    const circumference = 2 * Math.PI * radius;
    const progress = (focusScore / 100) * circumference;
    return (
      <div className="flex flex-col items-center justify-center p-6">
        <h3 className="text-md font-medium text-muted-foreground mb-4 flex items-center justify-center gap-2">
            <Target className="h-4 w-4" />
            Focus Score
        </h3>
        <div className="relative w-36 h-36 mx-auto">
            <svg className="w-full h-full" viewBox="0 0 140 140">
                <circle cx="70" cy="70" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
                <motion.circle cx="70" cy="70" r={radius} fill="none" stroke="hsl(var(--primary))" strokeWidth="10" strokeLinecap="round" transform="rotate(-90 70 70)" initial={{ strokeDasharray: `0 ${circumference}` }} animate={{ strokeDasharray: `${progress} ${circumference}` }} transition={{ duration: 1.5, ease: "easeOut" }} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold text-foreground">{focusScore}%</span>
            </div>
        </div>
        <p className="text-muted-foreground text-sm mt-4 text-center">{getFocusScoreMessage()}</p>
      </div>
    );
  };

  useEffect(() => {
    if (!brainDump || brainDump === lastSavedBrainDump) return;
    const timer = setTimeout(() => {
      const detected = brainDump
        .split(/[.!?]+/)
        .filter(s => s.toLowerCase().includes('demain') || s.toLowerCase().includes('je dois') || s.toLowerCase().includes('il faut')).length;

      const now = new Date();
      const id = eveningEntryId ?? `evening_${now.getTime()}`;
      void upsertEveningEntry({
        id,
        timestamp: now.getTime(),
        brainDump,
        actionsDetected: detected,
        transformedToTasks: false,
      });

      setEveningEntryId(id);
      setLastSavedBrainDump(brainDump);
      setActionsDetected(detected);
      if (detected > 0) setShowActionBadge(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, [brainDump, lastSavedBrainDump, eveningEntryId]);

  useEffect(() => {
    if (!showActionBadge) return;
    const timer = setTimeout(() => setShowActionBadge(false), 5000);
    return () => clearTimeout(timer);
  }, [showActionBadge]);

  const handleSave = async () => {
    const text = brainDump.trim();
    if (!text) return;

    const detected = text
      .split(/[.!?]+/)
      .filter(s => s.toLowerCase().includes('demain') || s.toLowerCase().includes('je dois') || s.toLowerCase().includes('il faut')).length;

    const now = new Date();
    const id = eveningEntryId ?? `evening_${now.getTime()}`;
    await upsertEveningEntry({
      id,
      timestamp: now.getTime(),
      brainDump: text,
      actionsDetected: detected,
      transformedToTasks: false,
    });

    setEveningEntryId(id);
    setLastSavedBrainDump(text);
    setActionsDetected(detected);
    setShowActionBadge(detected > 0);

    toast({
      title: 'Sauvegardé',
      description: 'Journal du soir sauvegardé localement.',
    });
  };

  const handleTransformToTasks = async () => {
    const text = brainDump.trim();
    if (!text) return;

    try {
      const lang = LanguageDetector.detect(text, 'fr').lang;
      const rawTasks = extractTasks(text, lang);
      const classified = await Promise.all(
        rawTasks.map(async (task) => ({ raw: task, classification: await classifyTask(task) }))
      );
      const fullTasks = classified.map(({ raw, classification }) => createFullTask(raw, classification));
      await upsertTasks(fullTasks);

      const now = new Date();
      const id = eveningEntryId ?? `evening_${now.getTime()}`;
      await upsertEveningEntry({
        id,
        timestamp: now.getTime(),
        brainDump: text,
        actionsDetected,
        transformedToTasks: true,
      });
      setEveningEntryId(id);

      toast({
        title: 'Transformé en tâches',
        description: `${fullTasks.length} tâche(s) ajoutée(s) à la base locale.`,
      });
    } catch (e) {
      toast({
        title: 'Erreur',
        description: e instanceof Error ? e.message : 'Transformation échouée',
        variant: 'destructive',
      });
    }
  };

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
        <motion.h1 variants={itemVariants} className="text-4xl md:text-6xl font-extralight tracking-tight text-foreground">{getTitle()}</motion.h1>

        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {completedTasks.length > 0 ? (
            <div className="lg:col-span-2 text-left space-y-4">
              <h2 className="text-xl font-medium text-muted-foreground">Ce que vous avez accompli :</h2>
              <ul className="space-y-3">
                {completedTasks.map((task, index) => (
                  <motion.li key={index} custom={index} variants={itemVariants} className="flex items-center gap-3 bg-card/50 p-3 rounded-lg backdrop-blur-sm">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-foreground font-medium text-sm">{task}</span>
                  </motion.li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="mt-8 text-muted-foreground lg:col-span-2">Le repos est aussi une victoire. Demain est un nouveau jour.</p>
          )}
          <FocusScoreGauge />
        </motion.div>

        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-purple-100/10 dark:bg-purple-900/10 border border-purple-200/20 p-6 rounded-2xl text-left">
            <h4 className="font-semibold text-foreground flex items-center gap-2 mb-4"><Lightbulb className="h-5 w-5 text-purple-400" />Insight du jour</h4>
            <div className="space-y-4">
              <div>
                <h5 className="font-semibold text-foreground">{pattern.title}</h5>
                <p className="text-sm text-muted-foreground mt-1">{pattern.description}</p>
              </div>
              <div className="flex items-start gap-3 text-sm"><TrendingUp className="h-4 w-4 text-purple-400 mt-1 flex-shrink-0" /><span className="text-muted-foreground">{pattern.explanation}</span></div>
              <div className="flex items-start gap-3 text-sm"><Target className="h-4 w-4 text-purple-400 mt-1 flex-shrink-0" /><span className="text-muted-foreground">{pattern.action}</span></div>
            </div>
            <Button variant="link" size="sm" className="p-0 h-auto mt-4 text-purple-600 dark:text-purple-400">Explorer mes tendances</Button>
          </div>

          <div className="bg-card/20 backdrop-blur-lg border border-white/10 shadow-xl rounded-2xl p-6 text-left">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-foreground">Vider son esprit</h4>
              {showActionBadge && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">{actionsDetected} action{actionsDetected > 1 ? 's' : ''} détectée{actionsDetected > 1 ? 's' : ''}</span>}
            </div>
            <p className="text-sm text-muted-foreground/80 mt-1 mb-4">Libérez votre esprit des pensées restantes avant de conclure la journée.</p>
            <Textarea value={brainDump} onChange={(e) => setBrainDump(e.target.value)} placeholder="Qu'est-ce qui occupe encore votre esprit ? Notez-le ici pour y penser demain." className="bg-muted/50 border-0" rows={4} />
            <div className="flex gap-2 mt-3">
              <Button variant="outline" size="sm" onClick={() => void handleSave()}>Sauvegarder et classer</Button>
              {showActionBadge && <Button variant="default" size="sm" onClick={() => void handleTransformToTasks()}>Transformer en tâches</Button>}
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="pt-8">
            <p className="text-muted-foreground mb-6">L'esprit est maintenant clair. La soirée peut commencer.</p>
            <Button size="lg" className="rounded-full h-14 px-10 text-lg" onClick={() => { setShowConfetti(true); setTimeout(() => { window.location.href = '/dashboard'; }, 3000); }}>Terminer la journée</Button>
            <p className="text-muted-foreground mt-4">À demain, {name}.</p>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default function EveningPage() {
    return (
        <Suspense fallback={<div>Chargement...</div>}>
            <EveningContent />
        </Suspense>
    )
}
