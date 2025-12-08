'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle2, Lightbulb } from 'lucide-react';
import useWindowSize from 'react-use/lib/useWindowSize';
import Confetti from 'react-confetti';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Textarea } from '@/components/ui/textarea';

function EveningContent() {
  const searchParams = useSearchParams();
  const { width, height } = useWindowSize();
  const [showConfetti, setShowConfetti] = useState(true);

  const completedTasksParam = searchParams.get('completed');
  const totalTasksParam = searchParams.get('total');
  
  const completedTasks = useMemo(() => completedTasksParam
    ? decodeURIComponent(completedTasksParam).split(',').filter(t => t)
    : [], [completedTasksParam]);

  const totalTasks = useMemo(() => totalTasksParam ? parseInt(totalTasksParam, 10) : 0, [totalTasksParam]);

  const completionPercentage = useMemo(() => {
    if (totalTasks === 0) return 0;
    return (completedTasks.length / totalTasks) * 100;
  }, [completedTasks, totalTasks]);

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

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-background overflow-hidden p-4">
      {showConfetti && (
        <Confetti
          width={width}
          height={height}
          numberOfPieces={50}
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

          <div className="mt-12">
            <h3 className="text-lg font-medium text-muted-foreground mb-4">Focus Score du jour</h3>
            <div className="text-6xl font-bold text-primary">{Math.round(completionPercentage)}%</div>
            <p className="text-muted-foreground mt-2">{getFocusScoreMessage()}</p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="mt-12"
          >
            <Card className="bg-purple-100/50 dark:bg-purple-900/20 border-purple-200/50 p-6 rounded-2xl text-left">
              <h4 className="font-semibold text-foreground flex items-center gap-2 mb-2"><Lightbulb className="h-5 w-5 text-purple-400"/> Votre pattern aujourd'hui</h4>
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">Journée créative exceptionnelle.</span> Vous avez complété toutes vos tâches créatives. C'est le signe que vous étiez dans un état de flow idéal pour l'exploration d'idées.
              </p>
              <Button variant="link" size="sm" className="p-0 h-auto mt-2 text-purple-600 dark:text-purple-400">Voir tous mes patterns →</Button>
            </Card>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.5 }}
            className="mt-8"
          >
            <h4 className="text-lg font-medium text-muted-foreground">Une dernière pensée pour demain ?</h4>
            <p className="text-sm text-muted-foreground/80 mt-1 mb-4">Videz votre esprit avant de vous déconnecter.</p>
            <Textarea 
              placeholder="Notez tout ce qui vous passe par la tête… Demain je dois… , j’ai pensé à… , je me sens…"
              className="bg-muted/50 border-0"
              rows={3}
            />
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
