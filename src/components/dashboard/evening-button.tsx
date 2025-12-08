'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { Moon } from 'lucide-react';

export function EveningButton() {
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const checkTime = () => {
      const currentHour = new Date().getHours();
      if (currentHour >= 18) {
        setShowButton(true);
      } else {
        setShowButton(false);
      }
    };

    checkTime();
    const interval = setInterval(checkTime, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  if (!showButton) {
    return null;
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild>
        <Link href="/dashboard/evening">
          <Moon />
          Terminer ma journée
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
