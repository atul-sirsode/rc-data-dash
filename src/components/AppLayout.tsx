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
    <div className="flex min-h-screen w-full overflow-hidden">
      <AppSidebar />

      <div className="flex-1 flex flex-col min-h-screen min-w-0 bg-background">
        {/* Header */}
        <header className="sticky top-0 z-30 h-16 shrink-0 border-b border-border bg-card">
          <div className="flex items-center justify-between h-full px-4 md:px-6">
            {/* Left: Welcome */}
            <div className="flex items-center gap-2 min-w-0">
              {username && (
                <span className="text-sm text-muted-foreground truncate">
                  Welcome, <span className="font-semibold text-foreground">{username}</span>
                </span>
              )}
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 md:gap-3 shrink-0">
              <SessionTimer />

              {showNewUpload && onNewUpload && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onNewUpload}
                  className="gap-2 text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span className="hidden sm:inline">New Upload</span>
                </Button>
              )}

              <button className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                <Bell className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 pl-2 md:pl-3 border-l border-border">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                {username && (
                  <span className="text-sm font-medium text-foreground hidden sm:inline">
                    {username}
                  </span>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  className="gap-1.5 text-muted-foreground hover:text-foreground hover:bg-muted ml-1"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto min-w-0">
          <div className="w-full max-w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
