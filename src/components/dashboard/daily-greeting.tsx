
"use client";

import { Sun, Smile } from 'lucide-react';
import { motion } from 'framer-motion';
import { EnergyCheckIn } from './energy-check-in';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

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
            <p className="text-muted-foreground mt-1">Prêt pour une nouvelle journée productive ?</p>
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
