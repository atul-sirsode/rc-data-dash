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
  // Default: show all menus if user not in settings
  const allowedMenus = userAccess?.allowedMenus || ['rc-verification', 'fast-tag', 'settings'];

  const mainMenus = menuItems.filter(item => item.id !== 'settings' && allowedMenus.includes(item.id));
  const settingsMenu = menuItems.find(item => item.id === 'settings');
  const showSettings = allowedMenus.includes('settings');

  return (
    <aside
      className={cn(
        'h-screen sticky top-0 flex flex-col transition-all duration-300 ease-in-out',
        'bg-[hsl(222,47%,11%)] text-[hsl(210,40%,98%)]',
        collapsed ? 'w-[72px]' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className={cn(
        'flex items-center h-16 shrink-0 px-4',
        collapsed ? 'justify-center' : 'gap-3'
      )}>
        <div className="w-8 h-8 rounded-lg bg-[hsl(217,91%,60%)] flex items-center justify-center shrink-0">
          <Car className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <span className="text-base font-bold tracking-tight text-white truncate">
            Verify Dashboard
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-1 px-3 py-4">
        <span className={cn(
          'text-[11px] font-semibold uppercase tracking-wider text-[hsl(215,20%,55%)] mb-2',
          collapsed ? 'sr-only' : 'px-3'
        )}>
          Menu
        </span>

        {mainMenus.map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            end={item.path === '/'}
            className={cn(
              'group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-150',
              'text-[hsl(215,20%,65%)] hover:text-white hover:bg-[hsl(222,47%,15%)]',
              collapsed && 'justify-center px-2'
            )}
            activeClassName="!bg-[hsl(222,47%,15%)] !text-white"
          >
            <item.icon className="w-5 h-5 shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Bottom: Settings + Collapse */}
      <div className="mt-auto border-t border-[hsl(222,47%,18%)]">
        {showSettings && settingsMenu && (
          <div className="px-3 py-2">
            <NavLink
              to={settingsMenu.path}
              className={cn(
                'group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-150',
                'text-[hsl(215,20%,65%)] hover:text-white hover:bg-[hsl(222,47%,15%)]',
                collapsed && 'justify-center px-2'
              )}
              activeClassName="!bg-[hsl(222,47%,15%)] !text-white"
            >
              <Settings className="w-5 h-5 shrink-0" />
              {!collapsed && <span>Settings</span>}
            </NavLink>
          </div>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'flex items-center w-full px-3 py-3 text-[hsl(215,20%,55%)] hover:text-white transition-colors',
            collapsed ? 'justify-center' : 'justify-end pr-5'
          )}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
}
