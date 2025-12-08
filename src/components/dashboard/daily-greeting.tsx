"use client";

import { Sun, Smile, Sunrise, Sunset, Moon } from 'lucide-react';
import { motion } from 'framer-motion';
import { EnergyCheckIn } from './energy-check-in';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from 'react';

interface DailyGreetingProps {
  name: string;
}

export function DailyGreeting({ name }: DailyGreetingProps) {
  const [greeting, setGreeting] = useState({ icon: Sun, color: "text-yellow-400", message: "Prêt pour une nouvelle journée productive ?" });

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) {
      setGreeting({ icon: Sunrise, color: "text-yellow-400", message: "Prêt pour une nouvelle matinée productive ?" });
    } else if (hour >= 12 && hour < 18) {
      setGreeting({ icon: Sun, color: "text-orange-400", message: "Prêt pour un après-midi productif ?" });
    } else if (hour >= 18 && hour < 21) {
      setGreeting({ icon: Sunset, color: "text-pink-400", message: "Prêt pour une soirée productive ?" });
    } else {
      setGreeting({ icon: Moon, color: "text-purple-400", message: "Prêt pour une nuit productive ?" });
    }
  }, []);

  const GreetingIcon = greeting.icon;

  return (
    <div className="relative rounded-3xl bg-card p-8 shadow-sm overflow-hidden border">
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold">Bonjour {name},</h1>
            <p className="text-muted-foreground mt-1">{greeting.message}</p>
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
            <GreetingIcon className={`h-10 w-10 ${greeting.color}`} />
          </motion.div>
        </div>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="rounded-full h-12 px-6 shadow-sm">
                <Smile className="mr-2 h-5 w-5 text-yellow-500" />
                Comment ça va ?
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" side="bottom" align="start">
            <EnergyCheckIn />
          </PopoverContent>
        </Popover>

      </div>
    </div>
  );
}
