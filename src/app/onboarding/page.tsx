'use client';

import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function OnboardingWelcomePage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="text-center max-w-xl"
    >
      <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
        Bienvenue sur KairuFlow
      </h1>
      <p className="mt-6 text-lg text-muted-foreground">
        L'assistant qui transforme votre manière de travailler. Nous allons vous
        aider à trouver votre rythme, à vous concentrer sur ce qui compte vraiment
        et à terminer chaque journée avec un sentiment d'accomplissement.
      </p>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="mt-12"
      >
        <Link href="/dashboard">
          <Button size="lg" className="h-14 px-8 rounded-full text-lg">
            Commencer l'aventure
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </Link>
      </motion.div>
    </motion.div>
  );
}
