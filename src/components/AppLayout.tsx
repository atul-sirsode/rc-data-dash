import { ReactNode } from 'react';
import { LogOut, RefreshCw, Bell } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { SessionTimer } from '@/components/SessionTimer';
import { AppSidebar } from '@/components/AppSidebar';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface AppLayoutProps {
  children: ReactNode;
  showNewUpload?: boolean;
  onNewUpload?: () => void;
}

export function AppLayout({ children, showNewUpload, onNewUpload }: AppLayoutProps) {
  const { logout, username } = useAuth();

  const initials = username
    ? username.slice(0, 2).toUpperCase()
    : 'U';

  return (
    <div className="flex min-h-screen w-full">
      <AppSidebar />

      <div className="flex-1 flex flex-col min-h-screen bg-[hsl(222,47%,7%)]">
        {/* Header */}
        <header className="sticky top-0 z-30 h-16 shrink-0 border-b border-[hsl(222,47%,15%)] bg-[hsl(222,47%,9%)]">
          <div className="flex items-center justify-between h-full px-6">
            {/* Left: Welcome */}
            <div className="flex items-center gap-2">
              {username && (
                <span className="text-sm text-[hsl(215,20%,65%)]">
                  Welcome, <span className="font-semibold text-white">{username}</span>
                </span>
              )}
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3">
              <SessionTimer />

              {showNewUpload && onNewUpload && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onNewUpload}
                  className="gap-2 text-[hsl(215,20%,65%)] hover:text-white hover:bg-[hsl(222,47%,15%)]"
                >
                  <RefreshCw className="w-4 h-4" />
                  New Upload
                </Button>
              )}

              <button className="p-2 rounded-md text-[hsl(215,20%,55%)] hover:text-white hover:bg-[hsl(222,47%,15%)] transition-colors">
                <Bell className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 pl-3 border-l border-[hsl(222,47%,18%)]">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-[hsl(217,91%,60%)] text-white text-xs font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                {username && (
                  <span className="text-sm font-medium text-white hidden sm:inline">
                    {username}
                  </span>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  className="gap-1.5 text-[hsl(215,20%,65%)] hover:text-white hover:bg-[hsl(222,47%,15%)] ml-1"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
