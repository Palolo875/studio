'use client';

import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { ArrowRight, Calendar, Target, Zap, Clock } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const goals = [
  {
    icon: Target,
    title: 'Mieux m’organiser',
    description: 'Avoir une vision claire de mes tâches et priorités.',
    color: 'text-blue-500',
  },
  {
    icon: Clock,
    title: 'Moins procrastiner',
    description: 'Passer à l’action plus facilement et rester concentré.',
    color: 'text-red-500',
  },
  {
    icon: Zap,
    title: 'Trouver mon rythme',
    description: 'Travailler avec mon énergie, pas contre elle.',
    color: 'text-yellow-500',
  },
  {
    icon: Calendar,
    title: 'Autre chose',
    description: 'Définir un objectif personnalisé.',
    color: 'text-gray-500',
  },
];

const GoalCard = ({
  icon: Icon,
  title,
  description,
  color,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
}) => (
  <Link href="/dashboard" className="block">
    <motion.div
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      className="h-full"
    >
      <Card className="flex flex-col items-start justify-between p-6 rounded-2xl h-full hover:border-primary/50 transition-colors">
        <div>
          <div
            className={cn(
              'p-2 bg-muted rounded-full w-fit mb-4',
            )}
          >
            <Icon className={cn('h-6 w-6', color)} />
          </div>
          <h3 className="font-bold text-lg">{title}</h3>
          <p className="text-muted-foreground mt-1">{description}</p>
        </div>
        <div className="flex justify-end w-full mt-4">
          <ArrowRight className="h-5 w-5 text-muted-foreground" />
        </div>
      </Card>
    </motion.div>
  </Link>
);

export default function ProfileSetupPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="text-center w-full max-w-4xl"
    >
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
        Quel est votre plus grand objectif ?
      </h1>
      <p className="mt-4 text-lg text-muted-foreground">
        Votre réponse nous aidera à personnaliser votre expérience KairuFlow.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12 text-left">
        {goals.map((goal, index) => (
          <GoalCard key={index} {...goal} />
        ))}
      </div>
    </motion.div>
  );
}
