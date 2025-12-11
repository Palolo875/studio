
"use client";

import { Sun, Smile, Sunrise, Sunset, Moon, Zap, Coffee, BrainCircuit, Paintbrush } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';

type EnergyState = "energized" | "normal" | "slow" | "focused" | "creative" | null;

interface DailyGreetingProps {
  name: string;
  energyLevel: EnergyState;
  intention: string;
}

const energyInfo = {
    energized: { icon: Zap, color: "text-yellow-400", message: "Vous êtes en feu ! Voici vos défis :" },
    normal: { icon: Smile, color: "text-green-400", message: "Voici votre journée, claire et faisable :" },
    slow: { icon: Coffee, color: "text-amber-500", message: "On y va doucement. Voici 3 choses simples :" },
    focused: { icon: BrainCircuit, color: "text-blue-400", message: "Mode concentration activé. Voici vos défis :" },
    creative: { icon: Paintbrush, color: "text-purple-400", message: "L'inspiration est là ! Voici comment la canaliser :" },
};

const timeInfo = {
    morning: { icon: Sunrise, color: "text-yellow-400", message: "Prêt pour une nouvelle matinée productive ?" },
    afternoon: { icon: Sun, color: "text-orange-400", message: "Prêt pour un après-midi productif ?" },
    evening: { icon: Sunset, color: "text-pink-400", message: "Prêt pour une soirée productive ?" },
    night: { icon: Moon, color: "text-purple-400", message: "Prêt pour une nuit productive ?" },
}

export function DailyGreeting({ name, energyLevel, intention }: DailyGreetingProps) {
  const [timeOfDay, setTimeOfDay] = useState<keyof typeof timeInfo>("morning");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) setTimeOfDay("morning");
    else if (hour >= 12 && hour < 18) setTimeOfDay("afternoon");
    else if (hour >= 18 && hour < 21) setTimeOfDay("evening");
    else setTimeOfDay("night");
  }, []);

  const { greetingIcon, greetingColor, greetingMessage } = useMemo(() => {
      if (energyLevel && energyInfo[energyLevel]) {
          const { icon, color, message } = energyInfo[energyLevel];
          return { greetingIcon: icon, greetingColor: color, greetingMessage: message };
      }
      const { icon, color, message } = timeInfo[timeOfDay];
      return { greetingIcon: icon, greetingColor: color, greetingMessage: message };
  }, [energyLevel, timeOfDay]);

  const GreetingIcon = greetingIcon;

  return (
    <div className="relative rounded-3xl bg-gray-900 dark:bg-gray-900 text-white p-8 shadow-lg overflow-hidden border border-white/10">
        <div className="absolute inset-0 z-0 opacity-10">
             <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="p" width="100" height="100" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path id="a" data-color="outline" fill="none" stroke="#FFFFFF" strokeWidth="0.5" d="M0 0l100 100M100 0l-100 100"></path></pattern></defs><rect fill="url(#p)" width="100%" height="100%"></rect></svg>
        </div>
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold">Bonjour {name},</h1>
            <p className="text-gray-300 mt-1">{intention || greetingMessage}</p>
          </div>
          <motion.div
            key={energyLevel}
            initial={{scale: 0.5, opacity: 0}}
            animate={{ 
              scale: 1,
              opacity: 1,
              y: [0, -10, 0],
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              scale: { duration: 0.3 },
              y: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.3 },
              rotate: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.3 }
            }}
          >
            <GreetingIcon className={cn("h-10 w-10", greetingColor)} />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
