import { Outlet, useLocation, matchPath } from 'react-router-dom';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { Separator } from '@/components/ui/separator';
import { ThemeToggle } from '@/components/ThemeToggle';
import { NotificationBell } from '@/components/NotificationBell';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { MobileBottomNav } from './MobileBottomNav';

const TITLES: Record<string, string> = {
  '/dashboard': 'Beranda',
  '/transactions': 'Transaksi',
  '/categories': 'Kategori',
  '/reports': 'Laporan',
  '/goals': 'Target',
  '/profile': 'Profil',
  '/recurring': 'Berulang',
  '/wallets': 'Dompet',
  '/debts': 'Hutang & Piutang',
  '/ai-advisor': 'Asisten AI',
  '/activity-logs': 'Log Aktivitas',
};

export default function AppLayout() {
  usePushNotifications();
  const location = useLocation();
  const title =
    Object.entries(TITLES).find(([p]) => matchPath(p, location.pathname))?.[1] ?? 'DompetPintar';

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 backdrop-blur-xl px-3 sm:px-4 lg:px-6 safe-top">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4 hidden sm:block" />
          <h2 className="font-display text-base font-semibold truncate flex-1 md:hidden">{title}</h2>
          <div className="hidden md:block flex-1" />
          <NotificationBell />
          <ThemeToggle />
        </header>
        <main className="flex-1 overflow-auto bg-muted/30">
          <div
            className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 page-transition pb-mobile-nav md:pb-8 max-w-7xl"
            key={location.pathname}
          >
            <Outlet />
          </div>
        </main>
        <MobileBottomNav />
      </SidebarInset>
    </SidebarProvider>
  );
}
