import React, { Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { PageLoader } from "@/components/PageLoader";

// Lazy-loaded routes
const Home = React.lazy(() => import('./pages/Home'));
const Index = React.lazy(() => import('./pages/Index'));
const Login = React.lazy(() => import('./pages/Login'));
const FastTag = React.lazy(() => import('./pages/FastTag'));
const FastTagHistory = React.lazy(() => import('./pages/FastTagHistory'));
const FastTagUpload = React.lazy(() => import('./pages/FastTagUpload'));
const FastTagReports = React.lazy(() => import('./pages/FastTagReports'));
const ManageSubscription = React.lazy(() => import('./pages/ManageSubscription'));
const Settings = React.lazy(() => import('./pages/Settings'));
const UserMaster = React.lazy(() => import('./pages/UserMaster'));
const AccessMaster = React.lazy(() => import('./pages/AccessMaster'));
const NotFound = React.lazy(() => import('./pages/NotFound'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
      <Route path="/rc-verification" element={<ProtectedRoute><Index /></ProtectedRoute>} />
      <Route path="/fast-tag" element={<ProtectedRoute><FastTag /></ProtectedRoute>} />
      <Route path="/fast-tag/history" element={<ProtectedRoute><FastTagHistory /></ProtectedRoute>} />
      <Route path="/fast-tag-upload" element={<ProtectedRoute><FastTagUpload /></ProtectedRoute>} />
      <Route path="/fast-tag-reports" element={<ProtectedRoute><FastTagReports /></ProtectedRoute>} />
      <Route path="/manage-subscription" element={<ProtectedRoute><ManageSubscription /></ProtectedRoute>} />
      <Route path="/user-master" element={<ProtectedRoute><UserMaster /></ProtectedRoute>} />
      <Route path="/access-master" element={<ProtectedRoute><AccessMaster /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <BrowserRouter>
          <AuthProvider>
            <Toaster />
            <Sonner />
            <Suspense fallback={<PageLoader />}>
              <AppRoutes />
            </Suspense>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
