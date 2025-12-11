'use client';

import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function OnboardingSummaryPage() {
  const name = "Junior";
  const rhythm = "Chouette";
  const hours = 9;

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
        <Link href="/dashboard">
          <Button size="lg" className="h-14 px-8 rounded-full text-lg">
            Allons-y, je suis prêt(e)
          </Button>
        </Link>
      </motion.div>
    </motion.div>
  );
}
