'use client';

import React, { useMemo, Suspense } from 'react';
import Link from 'next/link';
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
import { usePathname } from 'next/navigation';
import {UserNav} from '@/components/user-nav';
import {SidebarTrigger} from '@/components/ui/sidebar';
import {ScrollArea} from '@/components/ui/scroll-area';
import { SidebarCloseButton } from '@/components/ui/sidebar-close-button';
import { DatabaseBootstrapper } from '@/components/database-bootstrapper';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const menuItems = useMemo(() => [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/bibliotheque', label: 'Bibliothèque', icon: BookCopy },
    { href: '/dashboard/capture', label: 'Capture', icon: Feather },
    { href: '/dashboard/stats', label: 'Statistiques', icon: BarChart },
    { href: '/dashboard/audit', label: 'Audit', icon: ClipboardList },
    { href: '/dashboard/settings', label: 'Settings', icon: Settings },
  ], []);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen overflow-hidden">
        <DatabaseBootstrapper />
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
                    <SidebarMenuButton asChild isActive={pathname === item.href}>
                      <Link href={item.href} prefetch>
                        <Icon />
                        {item.label}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>
        <SidebarInset className="flex flex-col h-screen overflow-hidden">
          <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
            <SidebarTrigger className="md:hidden" />
            <div className="flex-1" />
            <UserNav />
          </header>
          <main className="flex-1 overflow-hidden relative">
            <ScrollArea className="h-full">
              <div className="p-4 md:p-6 lg:p-8">
                <Suspense fallback={<div className="flex items-center justify-center h-full">Chargement...</div>}>
                  {children}
                </Suspense>
              </div>
            </ScrollArea>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
