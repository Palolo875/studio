
"use client";

import { useState } from "react";
import { Zap, Smile, Coffee, BrainCircuit, Paintbrush } from "lucide-react";
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

export function EnergyCheckIn() {
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [showIntention, setShowIntention] = useState(false);

  const handleSelectState = (id: string) => {
    setSelectedState(id);
    setTimeout(() => setShowIntention(true), 300);
  };

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
              onClick={() => handleSelectState(state.id)}
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
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
