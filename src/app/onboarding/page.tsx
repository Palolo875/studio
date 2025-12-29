
'use client';

import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { setSetting } from '@/lib/database';

export default function OnboardingWelcomePage() {
  const [name, setName] = useState('');
  const router = useRouter();

  const handleNext = () => {
    void setSetting('onboarding.name', name);
    router.push('/onboarding/energy-quiz');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="text-center max-w-xl w-full"
    >
      <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
        Bienvenue sur KairuFlow.
      </h1>
      <p className="mt-6 text-lg text-muted-foreground">
        Votre nouvel allié pour une productivité sereine et alignée.
        <br />
        Commençons par faire connaissance.
      </p>

      <div className="mt-12 max-w-sm mx-auto">
        <label htmlFor="name" className="text-lg font-medium text-foreground block mb-4">
            Comment puis-je vous appeler ?
        </label>
        <Input
            id="name"
            type="text"
            placeholder="Votre prénom ou pseudo"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-14 text-center text-xl rounded-full"
            onKeyDown={(e) => e.key === 'Enter' && name && handleNext()}
        />
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="mt-12"
      >
        <Button size="lg" className="h-14 px-8 rounded-full text-lg" disabled={!name} onClick={handleNext}>
          Continuer
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </motion.div>
    </motion.div>
  );
}
