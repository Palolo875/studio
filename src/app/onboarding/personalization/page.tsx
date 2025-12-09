'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { ArrowRight, Check } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const colors = [
  { name: 'Abricot', value: 'bg-orange-400' },
  { name: 'Rose', value: 'bg-pink-400' },
  { name: 'Lavande', value: 'bg-purple-400' },
  { name: 'Menthe', value: 'bg-emerald-400' },
  { name: 'Pêche', value: 'bg-rose-300' },
  { name: 'Bleu', value: 'bg-blue-400' },
];

export default function PersonalizationPage() {
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(colors[2].value);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="w-full max-w-lg"
    >
      <div className="space-y-12">
        <div>
          <h2 className="text-2xl font-bold text-center">Quel est votre prénom ?</h2>
          <Input
            type="text"
            placeholder="Votre prénom"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-4 h-14 text-center text-lg rounded-full"
          />
        </div>

        <div>
          <h2 className="text-2xl font-bold text-center mb-6">Quelle est votre couleur ?</h2>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
            {colors.map((color) => (
              <motion.div
                key={color.name}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedColor(color.value)}
                className="flex flex-col items-center gap-2 cursor-pointer"
              >
                <div className={cn("h-16 w-16 rounded-full flex items-center justify-center transition-all", color.value, selectedColor === color.value ? 'ring-4 ring-offset-2 ring-offset-background ring-primary' : '')}>
                  {selectedColor === color.value && <Check className="h-8 w-8 text-white" />}
                </div>
                <span className="text-sm text-muted-foreground">{color.name}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="mt-16 flex justify-center"
      >
        <Link href="/onboarding/energy-quiz">
          <Button size="lg" className="h-14 px-8 rounded-full text-lg">
            Suivant
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </Link>
      </motion.div>
    </motion.div>
  );
}
