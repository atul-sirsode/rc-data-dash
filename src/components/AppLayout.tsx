import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { LogOut, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { SessionTimer } from '@/components/SessionTimer';
import { AppSidebar } from '@/components/AppSidebar';
import { Button } from '@/components/ui/button';

interface AppLayoutProps {
  children: ReactNode;
  showNewUpload?: boolean;
  onNewUpload?: () => void;
}

export function AppLayout({ children, showNewUpload, onNewUpload }: AppLayoutProps) {
  const { logout, username } = useAuth();

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />

      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="gradient-header border-b border-border/10 sticky top-0 z-30">
          <div className="px-6 py-4">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between"
            >
              <div>
                {username && (
                  <span className="text-sm text-primary-foreground/80">
                    Welcome, <span className="font-semibold text-primary-foreground">{username}</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <SessionTimer />

                {showNewUpload && onNewUpload && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onNewUpload}
                    className="gap-2 bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/20"
                  >
                    <RefreshCw className="w-4 h-4" />
                    New Upload
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={logout}
                  className="gap-2 bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/20"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </Button>
              </div>
            </motion.div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
