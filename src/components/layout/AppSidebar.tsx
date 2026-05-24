import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Wallet,
  LayoutDashboard,
  ArrowUpDown,
  Tags,
  FileText,
  Target,
  User,
  LogOut,
  ChevronUp,
  RefreshCw,
  CreditCard,
  Sparkles,
  ClipboardList,
} from 'lucide-react';

const menuItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Transaksi', url: '/transactions', icon: ArrowUpDown },
  { title: 'Transaksi Berulang', url: '/recurring', icon: RefreshCw },
  { title: 'Dompet', url: '/wallets', icon: Wallet },
  { title: 'Hutang & Piutang', url: '/debts', icon: CreditCard },
  { title: 'Kategori & Anggaran', url: '/categories', icon: Tags },
  { title: 'Laporan', url: '/reports', icon: FileText },
  { title: 'Target Keuangan', url: '/goals', icon: Target },
  { title: 'Asisten AI', url: '/ai-advisor', icon: Sparkles },
  { title: 'Log Aktivitas', url: '/activity-logs', icon: ClipboardList },
  { title: 'Profil', url: '/profile', icon: User },
];

export function AppSidebar() {
  const location = useLocation();
  const { user, signOut } = useAuth();

  const getInitials = (email: string | undefined) => {
    if (!email) return 'U';
    return email.charAt(0).toUpperCase();
  };

  return (
    <Sidebar className="border-r-0">
      <SidebarHeader className="border-b border-sidebar-border p-4 gradient-sidebar">
        <Link to="/dashboard" className="flex items-center gap-3">
          <div className="flex items-center justify-center w-11 h-11 rounded-2xl gradient-primary shadow-glow">
            <Wallet className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <h1 className="font-display font-extrabold text-lg text-sidebar-foreground tracking-tight truncate">DompetPintar</h1>
            <p className="text-[11px] text-sidebar-foreground/60 uppercase tracking-wider">Keuangan Cerdas</p>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="gradient-sidebar">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1 px-2">
              {menuItems.map((item) => {
                const active = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      className="rounded-xl data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground data-[active=true]:shadow-glow"
                    >
                      <Link to={item.url} className="group transition-all duration-200">
                        <item.icon className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
                        <span className="font-medium">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="h-12">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-sm">
                      {getInitials(user?.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-sidebar-foreground truncate">
                      {user?.email}
                    </p>
                  </div>
                  <ChevronUp className="w-4 h-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                className="w-[--radix-popper-anchor-width]"
              >
                <DropdownMenuItem asChild>
                  <Link to="/profile">
                    <User className="mr-2 h-4 w-4" />
                    Profil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Keluar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
