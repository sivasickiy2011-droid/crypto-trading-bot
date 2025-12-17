import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import SetPassword from "./pages/SetPassword";
import TopPairs from "./pages/TopPairs";
import DevConsole from "./pages/DevConsole";
import TestTrade from "./pages/TestTrade";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [username, setUsername] = useState<string>('');
  const [needsPasswordReset, setNeedsPasswordReset] = useState(false);
  const [resetUserId, setResetUserId] = useState<number | null>(null);
  const [resetUsername, setResetUsername] = useState<string>('');

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const storedUserId = localStorage.getItem('user_id');
    const storedUsername = localStorage.getItem('username');
    
    if (token && storedUserId && storedUsername) {
      setIsAuthenticated(true);
      setUserId(parseInt(storedUserId));
      setUsername(storedUsername);
    }
  }, []);

  const handleLoginSuccess = (uid: number, uname: string, token: string) => {
    setIsAuthenticated(true);
    setUserId(uid);
    setUsername(uname);
    setNeedsPasswordReset(false);
  };

  const handlePasswordResetRequired = (uid: number, uname: string) => {
    setNeedsPasswordReset(true);
    setResetUserId(uid);
    setResetUsername(uname);
  };

  const handlePasswordSet = (token: string) => {
    setIsAuthenticated(true);
    setUserId(resetUserId);
    setUsername(resetUsername);
    setNeedsPasswordReset(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('username');
    setIsAuthenticated(false);
    setUserId(null);
    setUsername('');
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route 
              path="/login" 
              element={
                needsPasswordReset ? (
                  <Navigate to="/set-password" replace />
                ) : isAuthenticated ? (
                  <Navigate to="/" replace />
                ) : (
                  <Login 
                    onLoginSuccess={handleLoginSuccess}
                    onPasswordResetRequired={handlePasswordResetRequired}
                  />
                )
              } 
            />
            <Route 
              path="/set-password" 
              element={
                needsPasswordReset && resetUserId ? (
                  <SetPassword 
                    userId={resetUserId}
                    username={resetUsername}
                    onPasswordSet={handlePasswordSet}
                  />
                ) : (
                  <Navigate to="/login" replace />
                )
              } 
            />
            <Route 
              path="/" 
              element={
                isAuthenticated && userId ? (
                  <Index userId={userId} username={username} onLogout={handleLogout} />
                ) : (
                  <Navigate to="/login" replace />
                )
              } 
            />
            <Route 
              path="/top-pairs" 
              element={<Navigate to="/" replace />}
            />
            <Route 
              path="/dev-console" 
              element={
                isAuthenticated && userId ? (
                  <DevConsole userId={userId} />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route 
              path="/test-trade" 
              element={<TestTrade />}
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;