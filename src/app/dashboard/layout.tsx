'use client';

import React from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
} from '@/components/ui/sidebar';
import {Logo} from '@/components/logo';
import {LayoutDashboard, Settings, BookCopy, BarChart, Feather, ClipboardList} from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import {UserNav} from '@/components/user-nav';
import {SidebarTrigger} from '@/components/ui/sidebar';
import {ScrollArea} from '@/components/ui/scroll-area';
import { SidebarCloseButton } from '@/components/ui/sidebar-close-button';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const menuItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/bibliotheque', label: 'Bibliothèque', icon: BookCopy },
    { href: '/dashboard/capture', label: 'Capture', icon: Feather },
    { href: '/dashboard/stats', label: 'Statistiques', icon: BarChart },
    { href: '/dashboard/audit', label: 'Audit', icon: ClipboardList },
    { href: '/dashboard/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center justify-between w-full">
              <div className='flex items-center gap-2'>
                <Logo />
                <span className="text-lg font-semibold">KairuFlow</span>
              </div>
              <SidebarCloseButton />
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {menuItems.map(item => {
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton 
                      onClick={() => router.push(item.href)}
                      isActive={pathname === item.href}
                    >
                      <Icon />
                      {item.label}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
          <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
            <SidebarTrigger className="md:hidden" />
            <div className="flex-1" />
            <UserNav />
          </header>
          <main className="flex-1 p-4 md:p-6 lg:p-8">
            <ScrollArea className="h-full">
              <div className="pr-4">{children}</div>
            </ScrollArea>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
