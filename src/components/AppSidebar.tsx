import { Home, Car, CreditCard, ChevronLeft, ChevronRight, Users, ShieldCheck, Upload, FileBarChart, Wallet } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/contexts/AuthContext';
import { getUserAccess } from '@/lib/admin-settings';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNavigate } from 'react-router-dom';
import { useSubscriptionExpired } from '@/hooks/use-subscription-status';
import { useToast } from '@/hooks/use-toast';

const menuItems = [
  { id: 'home', label: 'Home', icon: Home, path: '/' },
  { id: 'rc-verification', label: 'RC Verification', icon: Car, path: '/rc-verification' },
  { id: 'fast-tag', label: 'Fast Tag', icon: CreditCard, path: '/fast-tag' },
  { id: 'fast-tag-upload', label: 'FastTag Upload', icon: Upload, path: '/fast-tag-upload' },
  { id: 'fast-tag-reports', label: 'FastTag Reports', icon: FileBarChart, path: '/fast-tag-reports' },
  { id: 'manage-subscription', label: 'Manage Subscription', icon: Wallet, path: '/manage-subscription' },
  { id: 'user-master', label: 'User Master', icon: Users, path: '/user-master' },
  { id: 'access-master', label: 'Access Master', icon: ShieldCheck, path: '/access-master' },
];

interface AppSidebarProps {
  onNavigate?: () => void;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

export const AppSidebar = React.memo(function AppSidebar({ onNavigate, collapsed = false, onCollapsedChange }: AppSidebarProps) {
  const { username } = useAuth();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const isCollapsed = isMobile ? false : collapsed;
  const subscriptionExpired = useSubscriptionExpired();
  const { toast } = useToast();

  const handleNavClick = (e: React.MouseEvent, itemId: string) => {
    if (subscriptionExpired && itemId !== 'home') {
      e.preventDefault();
      toast({
        title: 'Subscription Expired',
        description: 'Please subscribe to continue using this feature.',
        variant: 'destructive',
      });
      return;
    }
    onNavigate?.();
    if (!isMobile) {
      onCollapsedChange?.(true);
    }
  };

  const userAccess = username ? getUserAccess(username) : null;
  const allowedMenus = userAccess?.allowedMenus || ['home', 'rc-verification', 'fast-tag', 'fast-tag-upload', 'fast-tag-reports', 'user-master', 'access-master', 'settings'];

  const adminIds = ['user-master', 'access-master', 'manage-subscription'];
  const alwaysVisibleIds = ['home'];
  const mainMenus = menuItems.filter(item => !adminIds.includes(item.id) && (alwaysVisibleIds.includes(item.id) || allowedMenus.includes(item.id)));
  const adminMenus = menuItems.filter(item => adminIds.includes(item.id) && allowedMenus.includes(item.id));

  return (
    <aside
      className={cn(
        'h-screen flex flex-col transition-all duration-300 ease-in-out',
        'bg-sidebar-background text-sidebar-foreground',
        isMobile ? 'w-full' : (isCollapsed ? 'w-[72px]' : 'w-64'),
        !isMobile && 'sticky top-0'
      )}
    >
      {/* Logo */}
      <div className={cn(
        'flex items-center h-16 shrink-0 px-4 cursor-pointer',
        isCollapsed ? 'justify-center' : 'gap-3'
      )}
        onClick={() => navigate('/')}
      >
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <Car className="w-5 h-5 text-primary-foreground" />
        </div>
        {!isCollapsed && (
          <span className="text-base font-bold tracking-tight text-sidebar-foreground truncate">
            Transcologistics
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-1 px-3 py-4">
        <span className={cn(
          'text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2',
          isCollapsed ? 'sr-only' : 'px-3'
        )}>
          Menu
        </span>

        {mainMenus.map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            end={item.path === '/'}
            onClick={(e) => handleNavClick(e, item.id)}
            className={cn(
              'group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-150',
              subscriptionExpired && item.id !== 'home'
                ? 'text-muted-foreground/50 cursor-not-allowed'
                : 'text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent',
              isCollapsed && 'justify-center px-2'
            )}
            activeClassName="!bg-sidebar-accent !text-sidebar-foreground"
          >
            <item.icon className="w-5 h-5 shrink-0" />
            {!isCollapsed && <span>{item.label}</span>}
          </NavLink>
        ))}

        {adminMenus.length > 0 && (
          <>
            <span className={cn(
              'text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 mt-4',
              isCollapsed ? 'sr-only' : 'px-3'
            )}>
              Admin
            </span>
            {adminMenus.map((item) => (
              <NavLink
                key={item.id}
                to={item.path}
                onClick={(e) => handleNavClick(e, item.id)}
                className={cn(
                  'group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-150',
                  subscriptionExpired
                    ? 'text-muted-foreground/50 cursor-not-allowed'
                    : 'text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent',
                  isCollapsed && 'justify-center px-2'
                )}
                activeClassName="!bg-sidebar-accent !text-sidebar-foreground"
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {!isCollapsed && <span>{item.label}</span>}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* Bottom: Collapse */}
      <div className="mt-auto border-t border-sidebar-border">
        {!isMobile && (
          <button
            onClick={() => onCollapsedChange?.(!collapsed)}
            className={cn(
              'flex items-center w-full px-3 py-3 text-muted-foreground hover:text-sidebar-foreground transition-colors',
              isCollapsed ? 'justify-center' : 'justify-end pr-5'
            )}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}
      </div>
    </aside>
  );
}
