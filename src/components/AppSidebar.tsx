import { Car, CreditCard, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/contexts/AuthContext';
import { getUserAccess } from '@/lib/admin-settings';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const menuItems = [
  { id: 'rc-verification', label: 'RC Verification', icon: Car, path: '/' },
  { id: 'fast-tag', label: 'Fast Tag', icon: CreditCard, path: '/fast-tag' },
  { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
];

export function AppSidebar() {
  const { username } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const userAccess = username ? getUserAccess(username) : null;
  const allowedMenus = userAccess?.allowedMenus || ['rc-verification', 'fast-tag'];

  const visibleMenus = menuItems.filter(item => allowedMenus.includes(item.id));

  return (
    <aside
      className={cn(
        'h-screen sticky top-0 flex flex-col bg-sidebar-background text-sidebar-foreground border-r border-sidebar-border transition-all duration-200',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo area */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
        <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center shrink-0">
          <Car className="w-4 h-4 text-sidebar-primary-foreground" />
        </div>
        {!collapsed && (
          <span className="text-sm font-bold text-sidebar-foreground truncate">
            Verify Dashboard
          </span>
        )}
      </div>

      {/* Menu */}
      <nav className="flex-1 py-4 px-2 space-y-1">
        {visibleMenus.map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            end={item.path === '/'}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
              'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent'
            )}
            activeClassName="bg-sidebar-accent text-sidebar-foreground font-medium"
          >
            <item.icon className="w-5 h-5 shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center p-3 border-t border-sidebar-border text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </aside>
  );
}
