"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ExpandableSectionProps {
  title: string;
  strategy: string;
  techniques: string[];
  linkText?: string;
  linkUrl?: string;
  children?: React.ReactNode;
}

export function ExpandableSection({
  title,
  strategy,
  techniques,
  linkText = "Voir plus",
  linkUrl = "#",
  children,
}: ExpandableSectionProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="border rounded-lg overflow-hidden">
      <Button
        variant="ghost"
        className="w-full flex justify-between items-center p-4 h-auto text-left"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="font-medium">{title}</span>
        <ChevronDown
          className={cn(
            "h-5 w-5 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </Button>
      
      {isOpen && (
        <div className="p-4 pt-0 border-t bg-muted/50">
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-sm mb-2">Stratégie</h4>
              <p className="text-sm text-muted-foreground">{strategy}</p>
            </div>
            
            <div>
              <h4 className="font-semibold text-sm mb-2">Techniques</h4>
              <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
                {techniques.map((technique, index) => (
                  <li key={index}>{technique}</li>
                ))}
              </ul>
            </div>
            
            {linkUrl && (
              <a 
                href={linkUrl} 
                className="text-xs text-primary/80 hover:underline inline-block"
                onClick={(e) => e.stopPropagation()}
              >
                {linkText}
              </a>
            )}
            
            {children}
          </div>
        </div>
      )}
    </div>
  );
}