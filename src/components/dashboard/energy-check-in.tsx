
"use client";

import { useState } from "react";
import { Zap, Smile, Coffee, BrainCircuit, Paintbrush, ArrowRight, Sun, Moon, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";

const energyStates = [
  { id: "slow", label: "Explosé", icon: Coffee, color: "text-amber-700", bgColor: "bg-amber-100 dark:bg-amber-900/30" },
  { id: "normal", label: "Moyen", icon: Smile, color: "text-green-500", bgColor: "bg-green-100 dark:bg-green-900/30" },
  { id: "energized", label: "En forme", icon: Zap, color: "text-yellow-500", bgColor: "bg-yellow-100 dark:bg-yellow-900/30" },
  { id: "focused", label: "Très en forme", icon: BrainCircuit, color: "text-blue-500", bgColor: "bg-blue-100 dark:bg-blue-900/30" },
  { id: "creative", label: "Créatif", icon: Sparkles, color: "text-purple-500", bgColor: "bg-purple-100 dark:bg-purple-900/30" },
];

type EnergyStateId = "energized" | "normal" | "slow" | "focused" | "creative";

interface EnergyCheckInProps {
    onEnergyChange: (energy: EnergyStateId) => void;
    onIntentionChange: (intention: string) => void;
    onSleepHoursChange?: (hours: number | null) => void;
    onStabilityChange?: (stability: 'stable' | 'volatile') => void;
}

export function EnergyCheckIn({ onEnergyChange, onIntentionChange, onSleepHoursChange, onStabilityChange }: EnergyCheckInProps) {
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [showIntention, setShowIntention] = useState(false);
  const [stability, setStability] = useState<'stable' | 'volatile'>('stable');

  const handleSelectState = (id: EnergyStateId) => {
    setSelectedState(id);
    onEnergyChange(id);
    setTimeout(() => setShowIntention(true), 300);
  };

  const handleStabilityChange = (next: 'stable' | 'volatile') => {
    setStability(next);
    onStabilityChange?.(next);
  };
  
  const handleIntentionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onIntentionChange(e.target.value);
  }

  const handleSleepHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (!raw) {
      onSleepHoursChange?.(null);
      return;
    }
    const parsed = Number(raw);
    onSleepHoursChange?.(Number.isFinite(parsed) ? parsed : null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-center gap-3">
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
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground text-center block">
                Stabilité (optionnel)
              </label>
              <div className="flex justify-center gap-2">
                <Button
                  type="button"
                  variant={stability === 'stable' ? 'default' : 'outline'}
                  className="rounded-full"
                  onClick={() => handleStabilityChange('stable')}
                >
                  Stable
                </Button>
                <Button
                  type="button"
                  variant={stability === 'volatile' ? 'default' : 'outline'}
                  className="rounded-full"
                  onClick={() => handleStabilityChange('volatile')}
                >
                  Volatile
                </Button>
              </div>
            </div>

            <label htmlFor="intention" className="text-sm font-medium text-muted-foreground text-center block">
              Une intention pour aujourd’hui ? (Optionnel)
            </label>
            <div className="space-y-4">
              <Input
                id="intention"
                name="intention"
                placeholder="Ex: Terminer la présentation pour le client..."
                className="bg-background/50 rounded-xl h-12"
                onChange={handleIntentionChange}
              />

              <div className="space-y-2">
                <label htmlFor="sleepHours" className="text-sm font-medium text-muted-foreground text-center block">
                  Sommeil (heures) — optionnel
                </label>
                <Input
                  id="sleepHours"
                  name="sleepHours"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  max={24}
                  step={0.25}
                  placeholder="Ex: 7"
                  className="bg-background/50 rounded-xl h-12"
                  onChange={handleSleepHoursChange}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
