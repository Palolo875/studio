'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { ArrowRight, Sunrise, Sun, Moon, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const rhythms = [
  {
    name: 'L’Alouette',
    description: 'Plein d’énergie le matin',
    icon: Sunrise,
    color: 'text-orange-400'
  },
  {
    name: 'Le Colibri',
    description: 'Énergie stable toute la journée',
    icon: Sun,
    color: 'text-yellow-400'
  },
  {
    name: 'Le Hibou',
    description: 'Plus productif le soir',
    icon: Moon,
    color: 'text-purple-400'
  }
];

export default function EnergyQuizPage() {
  const [selectedRythm, setSelectedRythm] = useState<string | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="w-full max-w-4xl"
    >
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground text-center">
        Quel est votre rythme énergétique ?
      </h1>
      <p className="mt-4 text-lg text-muted-foreground text-center">
        Cela nous aidera à vous suggérer les bonnes tâches au bon moment.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
        {rhythms.map((rhythm) => (
          <motion.div
            key={rhythm.name}
            whileHover={{ y: -5 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedRythm(rhythm.name)}
          >
            <Card className={cn(
              "p-8 rounded-3xl h-full flex flex-col items-center text-center cursor-pointer transition-all border-2",
              selectedRythm === rhythm.name
                ? 'border-primary bg-primary/10 shadow-xl'
                : 'border-border hover:border-primary/50'
            )}>
              <rhythm.icon className={cn("h-12 w-12 mb-4", rhythm.color)} />
              <h3 className="text-xl font-bold">{rhythm.name}</h3>
              <p className="text-muted-foreground mt-2 flex-1">{rhythm.description}</p>
              {selectedRythm === rhythm.name && (
                 <CheckCircle2 className="h-6 w-6 text-primary mt-4" />
              )}
            </Card>
          </motion.div>
        ))}
      </div>
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="mt-16 flex justify-center"
      >
        <Link href="/dashboard">
          <Button size="lg" className="h-14 px-8 rounded-full text-lg" disabled={!selectedRythm}>
            Commencer
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </Link>
      </motion.div>
    </motion.div>
  );
}

    