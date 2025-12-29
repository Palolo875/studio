
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { deleteSetting, getSetting } from '@/lib/database';

export default function OnboardingSummaryPage() {
  const [name, setName] = useState('Junior');
  const [rhythm, setRhythm] = useState('Chouette');
  const [hours, setHours] = useState('9');
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [storedName, storedRhythm, storedHours] = await Promise.all([
        getSetting<string>('onboarding.name'),
        getSetting<string>('onboarding.rhythm'),
        getSetting<string>('onboarding.hours'),
      ]);

      if (cancelled) return;

      if (storedName) setName(storedName);
      if (storedRhythm) setRhythm(storedRhythm);
      if (storedHours) setHours(storedHours);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleNext = () => {
    void deleteSetting('onboarding.name');
    void deleteSetting('onboarding.rhythm');
    void deleteSetting('onboarding.hours');
    router.push('/dashboard');
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="text-center max-w-xl"
    >
      <div className="p-8 bg-card/50 rounded-3xl">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
          Parfait, {name}.
        </h1>
        <p className="mt-6 text-xl text-muted-foreground leading-relaxed">
          Tu es un(e) <span className="text-primary font-semibold">{rhythm}</span> qui travaille environ <span className="text-primary font-semibold">{hours} heures</span> par jour.
        </p>
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="mt-12"
      >
        <Button size="lg" className="h-14 px-8 rounded-full text-lg" onClick={handleNext}>
          Allons-y, je suis prêt(e)
        </Button>
      </motion.div>
    </motion.div>
  );
}
