import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Setup from "./pages/Setup";
import Play from "./pages/Play";
import StatsHistorySettings from "./pages/StatsHistorySettings";
import { PlayerProfile } from "@/components/player/PlayerProfile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

interface User {
  id: string;
  email: string;
  displayName: string;
}

interface PlayerData {
  firstName: string;
  lastName: string;
  handicap: number;
  preferredUnits: "m" | "yd";
  language: "fr" | "en";
}

const App = () => {
  const { user: authUser, loading } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [playerProfile, setPlayerProfile] = useState<PlayerData | null>(null);

  useEffect(() => {
    if (authUser) {
      setUser({
        id: authUser.id,
        email: authUser.email!,
        displayName: authUser.user_metadata?.display_name || authUser.email!.split("@")[0]
      });
      // TODO: Load player profile from database
    } else {
      setUser(null);
      setPlayerProfile(null);
    }
  }, [authUser]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={!user ? <Landing onLogin={setUser} /> : <Navigate to="/dashboard" />} />
            
            {/* Protected Routes */}
            {user && (
              <>
                <Route path="/dashboard" element={
                  <Dashboard 
                    user={user}
                    onStartNewGame={() => window.location.href = '/setup'}
                    onResumeGame={(roundId) => window.location.href = `/play/${roundId}`}
                    onViewHistory={(roundId) => window.location.href = '/stats'}
                  />
                } />
                
                <Route path="/setup" element={
                  <Setup 
                    user={user}
                    onBack={() => window.location.href = '/dashboard'}
                    onStartGame={(setupData) => {
                      // TODO: Create round and redirect to play
                      console.log('Starting game with:', setupData);
                    }}
                  />
                } />
                
                <Route path="/play/:roundId" element={
                  playerProfile ? (
                    <Play 
                      user={user}
                      playerProfile={playerProfile}
                      roundId="temp"
                      onBack={() => window.location.href = '/dashboard'}
                      onQuitGame={() => window.location.href = '/dashboard'}
                    />
                  ) : (
                    <PlayerProfile 
                      onComplete={setPlayerProfile}
                      onBack={() => window.location.href = '/dashboard'}
                      userId={user.id}
                    />
                  )
                } />
                
                <Route path="/stats" element={
                  playerProfile ? (
                    <StatsHistorySettings 
                      user={user}
                      playerProfile={playerProfile}
                      onBack={() => window.location.href = '/dashboard'}
                    />
                  ) : (
                    <Navigate to="/dashboard" />
                  )
                } />
              </>
            )}
            
            {/* Fallback */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
