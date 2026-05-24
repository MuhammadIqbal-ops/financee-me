import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, ArrowUpDown, FileText, Wallet, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { QuickActionSheet } from '@/components/QuickActionSheet';

const tabs = [
  { to: '/dashboard', label: 'Beranda', icon: LayoutDashboard },
  { to: '/transactions', label: 'Transaksi', icon: ArrowUpDown },
  { to: '/reports', label: 'Laporan', icon: FileText },
  { to: '/wallets', label: 'Dompet', icon: Wallet },
];

export function MobileBottomNav() {
  const { pathname } = useLocation();

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/95 backdrop-blur-xl safe-bottom"
      aria-label="Navigasi utama"
    >
      <ul className="grid grid-cols-5 items-center h-16">
        {tabs.slice(0, 2).map((t) => (
          <NavItem key={t.to} {...t} active={pathname === t.to} />
        ))}
        <li className="flex items-center justify-center -mt-6">
          <QuickActionSheet
            trigger={
              <button
                aria-label="Aksi cepat"
                className="h-14 w-14 rounded-full gradient-primary text-primary-foreground shadow-glow flex items-center justify-center active:scale-95 transition-transform"
              >
                <Plus className="h-6 w-6" />
              </button>
            }
          />
        </li>
        {tabs.slice(2).map((t) => (
          <NavItem key={t.to} {...t} active={pathname === t.to} />
        ))}
      </ul>
    </nav>
  );
}

function NavItem({
  to,
  label,
  icon: Icon,
  active,
}: {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  active: boolean;
}) {
  return (
    <li>
      <NavLink
        to={to}
        className={cn(
          'flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium transition-colors',
          active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
        )}
      >
        <Icon className={cn('h-5 w-5 transition-transform', active && 'scale-110')} />
        <span>{label}</span>
      </NavLink>
    </li>
  );
}
