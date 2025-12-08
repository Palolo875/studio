
"use client";

import { useState } from "react";
import { Zap, Smile, Coffee, BrainCircuit, Paintbrush, ArrowUp, ArrowRight, ArrowDown, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { AnimatePresence, motion } from "framer-motion";

const energyStates = [
  { id: "energized", label: "Plein d'énergie", icon: Zap, color: "text-yellow-500", bgColor: "bg-yellow-100 dark:bg-yellow-900/30" },
  { id: "normal", label: "Normal", icon: Smile, color: "text-green-500", bgColor: "bg-green-100 dark:bg-green-900/30" },
  { id: "slow", label: "Un peu lent", icon: Coffee, color: "text-amber-700", bgColor: "bg-amber-100 dark:bg-amber-900/30" },
  { id: "focused", label: "Concentré", icon: BrainCircuit, color: "text-blue-500", bgColor: "bg-blue-100 dark:bg-blue-900/30" },
  { id: "creative", label: "Créatif", icon: Paintbrush, color: "text-purple-500", bgColor: "bg-purple-100 dark:bg-purple-900/30" },
];

const afternoonCheckin = [
    { id: "better", label: "Mieux", icon: ArrowUp, color: "text-green-500" },
    { id: "same", label: "Pareil", icon: ArrowRight, color: "text-gray-500" },
    { id: "tired", label: "Plus fatigué", icon: ArrowDown, color: "text-red-500" },
]

type EnergyStateId = "energized" | "normal" | "slow" | "focused" | "creative";

interface EnergyCheckInProps {
    onEnergyChange: (energy: EnergyStateId) => void;
    onIntentionChange: (intention: string) => void;
}

export function EnergyCheckIn({ onEnergyChange, onIntentionChange }: EnergyCheckInProps) {
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [showIntention, setShowIntention] = useState(false);
  const [showAfternoonCheckin, setShowAfternoonCheckin] = useState(false);
  const [showAfternoonSlumpInfo, setShowAfternoonSlumpInfo] = useState(false);

  const handleSelectState = (id: EnergyStateId) => {
    setSelectedState(id);
    onEnergyChange(id);
    setTimeout(() => setShowIntention(true), 300);
  };
  
  const handleIntentionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onIntentionChange(e.target.value);
    if(e.target.value.length > 2) {
      setTimeout(() => setShowAfternoonCheckin(true), 500);
    } else {
        setShowAfternoonCheckin(false);
        setShowAfternoonSlumpInfo(false);
    }
  }

  const handleAfternoonCheckin = (id: string) => {
    if (id === 'tired') {
        setShowAfternoonSlumpInfo(true);
    } else {
        setShowAfternoonSlumpInfo(false);
    }
  }


  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-center sm:justify-start gap-3">
        {energyStates.map((state) => (
          <motion.div
            key={state.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <button
              onClick={() => handleSelectState(state.id as EnergyStateId)}
              className={cn(
                "flex flex-col items-center justify-center gap-2 w-20 h-20 rounded-2xl border-2 transition-all duration-200",
                selectedState === state.id
                  ? `shadow-lg border-primary ${state.bgColor}`
                  : "bg-card hover:bg-accent border-transparent",
                  selectedState && selectedState !== state.id ? "opacity-50" : ""
              )}
            >
              <state.icon className={cn("w-6 h-6", selectedState === state.id ? state.color : "text-muted-foreground")} />
              <span className="text-xs font-medium text-center">{state.label}</span>
            </button>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {showIntention && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="space-y-2"
          >
            <label htmlFor="intention" className="text-sm font-medium text-muted-foreground">
              Une intention pour aujourd’hui ? (Optionnel)
            </label>
            <Input
              id="intention"
              name="intention"
              placeholder="Ex: Terminer la présentation pour le client..."
              className="bg-background/50 rounded-xl h-12"
              onChange={handleIntentionChange}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAfternoonCheckin && (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="space-y-4"
            >
                <div>
                    <label className="text-sm font-medium text-muted-foreground">👋 Comment ça va depuis ce matin ?</label>
                    <div className="flex justify-between gap-2 mt-2">
                        {afternoonCheckin.map((check) => (
                             <Button key={check.id} variant="outline" className="flex-1" onClick={() => handleAfternoonCheckin(check.id)}>
                                <check.icon className={cn("mr-2 h-4 w-4", check.color)} />
                                {check.label}
                            </Button>
                        ))}
                    </div>
                </div>

                <AnimatePresence>
                {showAfternoonSlumpInfo && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.4, ease: "easeInOut" }}
                        className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg text-blue-800 dark:text-blue-200"
                    >
                        <div className="flex items-start gap-2">
                            <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="font-semibold text-sm">Le "coup de pompe de l'après-midi" est normal !</p>
                                <p className="text-xs mt-1">C'est votre rythme circadien. Une petite marche, un verre d'eau ou une tâche moins exigeante peuvent aider.</p>
                            </div>
                        </div>
                    </motion.div>
                )}
                </AnimatePresence>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
