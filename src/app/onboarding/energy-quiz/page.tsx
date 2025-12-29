
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { ArrowRight, Sunrise, Sun, Moon, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { setSetting } from '@/lib/database';

const rhythms = [
  {
    name: 'L’Alouette',
    description: 'Je suis en forme dès le matin.',
    icon: Sunrise,
    color: 'text-orange-400'
  },
  {
    name: 'Le Colibri',
    description: 'Je suis plutôt régulier toute la journée.',
    icon: Sun,
    color: 'text-yellow-400'
  },
  {
    name: 'La Chouette',
    description: 'Je suis plus performant l’après-midi et le soir.',
    icon: Moon,
    color: 'text-purple-400'
  }
];

export default function EnergyQuizPage() {
  const [selectedRythm, setSelectedRythm] = useState<string | null>(null);
  const router = useRouter();

  const handleNext = () => {
    if (selectedRythm) {
      void setSetting('onboarding.rhythm', selectedRythm);
    }
    router.push('/onboarding/schedule');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="w-full max-w-4xl"
    >
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground text-center">
        À quelle heure tu es généralement au top de ton énergie ?
      </h1>

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
        <Button size="lg" className="h-14 px-8 rounded-full text-lg" disabled={!selectedRythm} onClick={handleNext}>
          Continuer
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </motion.div>
    </motion.div>
  );
}
