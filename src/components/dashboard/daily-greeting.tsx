
"use client";

import { Sun } from 'lucide-react';
import { motion } from 'framer-motion';
import { EnergyCheckIn } from './energy-check-in';

interface DailyGreetingProps {
  name: string;
}

export function DailyGreeting({ name }: DailyGreetingProps) {
  return (
    <div className="relative rounded-3xl bg-card p-8 shadow-sm overflow-hidden border">
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold">Bonjour {name},</h1>
            <p className="text-muted-foreground mt-1">comment vous sentez-vous ?</p>
          </div>
          <motion.div
            animate={{ 
              y: [0, -10, 0],
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Sun className="h-10 w-10 text-yellow-400" />
          </motion.div>
        </div>
        <EnergyCheckIn />
      </div>
    </div>
  );
}
