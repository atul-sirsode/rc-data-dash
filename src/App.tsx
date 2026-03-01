import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import FastTag from "./pages/FastTag";
import FastTagHistory from "./pages/FastTagHistory";
import FastTagUpload from "./pages/FastTagUpload";
import FastTagReports from "./pages/FastTagReports";
import Settings from "./pages/Settings";
import UserMaster from "./pages/UserMaster";
import AccessMaster from "./pages/AccessMaster";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

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
      <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
      <Route path="/fast-tag" element={<ProtectedRoute><FastTag /></ProtectedRoute>} />
      <Route path="/fast-tag/history" element={<ProtectedRoute><FastTagHistory /></ProtectedRoute>} />
      <Route path="/fast-tag-upload" element={<ProtectedRoute><FastTagUpload /></ProtectedRoute>} />
      <Route path="/fast-tag-reports" element={<ProtectedRoute><FastTagReports /></ProtectedRoute>} />
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
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
