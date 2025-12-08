'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import useWindowSize from 'react-use/lib/useWindowSize';
import Confetti from 'react-confetti';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

function EveningContent() {
  const searchParams = useSearchParams();
  const { width, height } = useWindowSize();
  const [showConfetti, setShowConfetti] = useState(true);

  const completedTasksParam = searchParams.get('completed');
  const completedTasks = completedTasksParam
    ? decodeURIComponent(completedTasksParam).split(',')
    : [];

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  const name = 'Junior';
  const completionPercentage = completedTasks.length > 0 ? 100 : 50;

  const getTitle = () => {
    if (completionPercentage >= 80) {
      return `Bravo, ${name}. Mission accomplie.`;
    }
    if (completionPercentage >= 60) {
      return `Bravo, ${name}. Une journée solide.`;
    }
    return `Vous avez avancé, c'est l'essentiel.`;
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

          {completedTasks.length > 0 && (
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
          )}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
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
