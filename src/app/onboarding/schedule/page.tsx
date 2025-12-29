
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { ArrowRight, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { setSetting } from '@/lib/database';

export default function SchedulePage() {
  const [startTime, setStartTime] = useState([9]);
  const [endTime, setEndTime] = useState([18]);
  const router = useRouter();

  const handleNext = () => {
    void setSetting('onboarding.hours', productiveHours.toString());
    router.push('/onboarding/summary');
  };

  const productiveHours = endTime[0] - startTime[0];

  const formatTime = (hour: number) => `${String(hour).padStart(2, '0')}:00`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="w-full max-w-lg"
    >
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground text-center">
        Quand commences-tu et finis-tu ta journée en général ?
      </h1>
      
      <Card className="mt-12 p-8 rounded-3xl space-y-10">
        <div>
          <div className="flex justify-between items-center mb-4">
            <Label className="text-lg font-medium">Début</Label>
            <span className="text-xl font-bold text-primary">{formatTime(startTime[0])}</span>
          </div>
          <Slider
            value={startTime}
            onValueChange={setStartTime}
            min={6}
            max={11}
            step={1}
          />
        </div>

        <div>
           <div className="flex justify-between items-center mb-4">
            <Label className="text-lg font-medium">Fin</Label>
            <span className="text-xl font-bold text-primary">{formatTime(endTime[0])}</span>
          </div>
          <Slider
            value={endTime}
            onValueChange={setEndTime}
            min={15}
            max={22}
            step={1}
          />
        </div>
      </Card>
      
      <div className="mt-8 text-center bg-muted/50 rounded-full p-3 max-w-sm mx-auto flex items-center justify-center gap-2">
        <Clock className="h-5 w-5 text-muted-foreground" />
        <p className="text-muted-foreground">
          Environ <span className="font-bold text-foreground">{productiveHours} heures</span> productives par jour
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="mt-12 flex justify-center"
      >
        <Button size="lg" className="h-14 px-8 rounded-full text-lg" onClick={handleNext}>
          Continuer
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </motion.div>
    </motion.div>
  );
}
