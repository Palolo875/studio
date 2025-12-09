'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle2, Lightbulb, TrendingUp, Target } from 'lucide-react';
import { useWindowSize } from 'react-use';
import Confetti from 'react-confetti';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Textarea } from '@/components/ui/textarea';

function EveningContent() {
  const searchParams = useSearchParams();
  const { width, height } = useWindowSize();
  const [showConfetti, setShowConfetti] = useState(true);
  const [brainDump, setBrainDump] = useState('');

  const completedTasksParam = searchParams.get('completed');
  const totalTasksParam = searchParams.get('total');
  
  const completedTasks = useMemo(() => completedTasksParam
    ? decodeURIComponent(completedTasksParam).split(',').filter(t => t)
    : [], [completedTasksParam]);

  const totalTasks = useMemo(() => totalTasksParam ? parseInt(totalTasksParam, 10) : 0, [totalTasksParam]);

  const completionPercentage = useMemo(() => {
    if (totalTasks === 0) return 0;
    return (completedTasks.length / totalTasks) * 100;
  }, [completedTasks.length, totalTasks]);

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  const name = 'Junior';
  
  const getTitle = () => {
    if (completionPercentage >= 80) {
      return `Bravo, ${name}. Mission accomplie.`;
    }
    if (completionPercentage >= 60) {
      return `Bravo, ${name}. Une journée solide.`;
    }
    return `Vous avez avancé, c'est l'essentiel.`;
  };

  const getFocusScoreMessage = () => {
    if (completionPercentage > 90) return "Journée exceptionnelle !";
    if (completionPercentage > 75) return "Solide performance.";
    if (completionPercentage > 60) return "Une bonne journée.";
    return "Vous avez avancé, c'est l'essentiel.";
  };

  // Pattern analysis based on completed tasks
  const getDailyPattern = () => {
    if (completedTasks.length === 0) {
      return {
        title: "Journée de repos",
        description: "Vous avez choisi de recharger vos batteries. Parfois, c'est ce dont on a le plus besoin.",
        advice: "Écoutez toujours votre énergie. La productivité n'est pas une course."
      };
    }
    
    if (completionPercentage > 80) {
      return {
        title: "Journée créative exceptionnelle",
        description: "Vous avez complété toutes vos tâches créatives. C'est le signe que vous étiez dans un état de flow idéal pour l'exploration d'idées.",
        advice: "Continuez à cultiver ces moments de créativité intense."
      };
    }
    
    if (completionPercentage > 60) {
      return {
        title: "Focus stratégique",
        description: "Votre journée a été marquée par une concentration efficace sur les tâches prioritaires.",
        advice: "Ce type de journée est idéal pour avancer sur les projets importants."
      };
    }
    
    return {
      title: "Progression constante",
      description: "Vous avez maintenu un rythme soutenu tout au long de la journée.",
      advice: "Cette approche équilibrée est souvent la clé d'une productivité durable."
    };
  };

  const pattern = getDailyPattern();

  // Focus Score gauge component
  const FocusScoreGauge = () => {
    const radius = 90;
    const circumference = 2 * Math.PI * radius;
    const progress = (completionPercentage / 100) * circumference;
    
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
            initial={{ strokeDasharray: 0 }}
            animate={{ 
              strokeDasharray: `${progress} ${circumference - progress}`,
            }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
        </svg>
        
        {/* Center score */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold text-foreground">
            {Math.round(completionPercentage)}%
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
          colors={['#FFC700', '#FF8F39', '#EC5A5A', '#D64E87', '#A650AB']}
          recycle={false}
        />
      )}

      <div className="absolute inset-0 z-0">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[200%] h-[100%] bg-gradient-to-t from-orange-200/50 via-pink-300/50 to-purple-400/50 rounded-t-full blur-3xl animate-pulse"></div>
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
            <p className="text-muted-foreground mt-4">{getFocusScoreMessage()}</p>
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
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp className="h-4 w-4 text-purple-400" />
                  <span className="text-muted-foreground">{pattern.advice}</span>
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
            <h4 className="text-lg font-medium text-muted-foreground">Une dernière pensée pour demain ?</h4>
            <p className="text-sm text-muted-foreground/80 mt-1 mb-4">Videz votre esprit avant de vous déconnecter.</p>
            <Textarea 
              value={brainDump}
              onChange={(e) => setBrainDump(e.target.value)}
              placeholder="Notez tout ce qui vous passe par la tête… Demain je dois… , j’ai pensé à… , je me sens…"
              className="bg-muted/50 border-0"
              rows={4}
            />
            <Button 
              variant="ghost" 
              size="sm" 
              className="mt-2"
              onClick={() => {
                if (brainDump.trim()) {
                  // In a real app, this would save to a database
                  console.log("Brain dump saved:", brainDump);
                  setBrainDump('');
                }
              }}
            >
              Sauvegarder ma pensée
            </Button>
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
            <Link href="/dashboard">
              <Button size="lg" className="rounded-full h-12 px-8">
                Retourner au tableau de bord
              </Button>
            </Link>
          </motion.div>
        </Card>
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