import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { GameInterface } from "@/components/game/GameInterface";
import { PlayerProfile } from "@/components/player/PlayerProfile";
import { CoachChat } from "@/components/coach/CoachChat";
import { Trophy, Target, Zap, MapPin } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Toaster } from "@/components/ui/toaster";

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

const Index = () => {
  const { user: authUser, loading } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [playerProfile, setPlayerProfile] = useState<PlayerData | null>(null);
  const [currentView, setCurrentView] = useState<"home" | "game" | "profile" | "coach">("home");
  const [authDialogOpen, setAuthDialogOpen] = useState(false);

  useEffect(() => {
    if (authUser) {
      setUser({
        id: authUser.id,
        email: authUser.email!,
        displayName: authUser.user_metadata?.display_name || authUser.email!.split("@")[0]
      });
    } else {
      setUser(null);
      setPlayerProfile(null);
      setCurrentView("home");
    }
  }, [authUser]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  const handleLogin = (userData: User) => {
    setUser(userData);
    setAuthDialogOpen(false);
  };

  const handleProfileComplete = (profileData: PlayerData) => {
    setPlayerProfile(profileData);
    setCurrentView("game");
  };

  const features = [
    {
      icon: Target,
      title: "Compteur de Score Intelligent",
      description: "Suivi précis de vos coups avec GPS et reconnaissance vocale"
    },
    {
      icon: Zap,
      title: "Coach IA en Direct",
      description: "Conseils stratégiques personnalisés basés sur votre jeu"
    },
    {
      icon: Trophy,
      title: "Copilot Règles",
      description: "Assistant arbitre pour toutes vos questions de règlement"
    },
    {
      icon: MapPin,
      title: "GPS Précis",
      description: "Distances exactes et analyse de chaque coup"
    }
  ];

  // Home view
  if (currentView === "home") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 px-4">
          <div className="absolute inset-0 bg-gradient-subtle opacity-60" />
          <div className="relative max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm font-medium">
              IA • GPS • Vocal
            </Badge>
            
            <h1 className="text-4xl md:text-6xl font-black text-balance mb-6 tracking-tight">
              <span className="golf-gradient bg-clip-text text-transparent">
                HighSwing.ai
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 text-balance max-w-2xl mx-auto">
              Votre caddie IA personnel pour améliorer votre golf avec des conseils en temps réel
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <Button 
                  size="lg" 
                  variant="default"
                  onClick={() => setCurrentView(playerProfile ? "game" : "profile")}
                  className="golf-gradient hover:golf-glow transition-golf text-lg px-8 py-4"
                >
                  {playerProfile ? "Continuer à jouer" : "Configurer mon profil"}
                </Button>
              ) : (
                <Button 
                  size="lg" 
                  variant="default"
                  onClick={() => setAuthDialogOpen(true)}
                  className="golf-gradient hover:golf-glow transition-golf text-lg px-8 py-4"
                >
                  Commencer maintenant
                </Button>
              )}
              
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => setCurrentView("coach")}
                className="text-lg px-8 py-4 transition-golf hover:bg-accent/10"
              >
                Découvrir l'IA
              </Button>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Révolutionnez votre golf
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Une suite complète d'outils alimentés par l'IA pour analyser et améliorer chaque aspect de votre jeu
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <Card key={index} className="golf-card hover:golf-shadow transition-golf group">
                  <CardHeader className="pb-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-golf">
                      <feature.icon className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 px-4 bg-muted/50">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Prêt à améliorer votre handicap ?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Rejoignez les golfeurs qui utilisent l'IA pour progresser plus vite
            </p>
            {!user && (
              <Button 
                size="lg" 
                variant="default"
                onClick={() => setAuthDialogOpen(true)}
                className="golf-gradient hover:golf-glow transition-golf"
              >
                Créer mon compte gratuitement
              </Button>
            )}
          </div>
        </section>

        {/* Auth Dialog */}
        <AuthDialog 
          open={authDialogOpen} 
          onOpenChange={setAuthDialogOpen}
          onSuccess={handleLogin}
        />
        <Toaster />
      </div>
    );
  }

  // Profile setup view
  if (currentView === "profile" && user && !playerProfile) {
    return (
      <>
        <PlayerProfile 
          onComplete={handleProfileComplete}
          onBack={() => setCurrentView("home")}
          userId={user.id}
        />
        <Toaster />
      </>
    );
  }

  // Game interface view
  if (currentView === "game" && user && playerProfile) {
    return (
      <>
        <GameInterface 
          user={user}
          playerProfile={playerProfile}
          onBack={() => setCurrentView("home")}
          onOpenCoach={() => setCurrentView("coach")}
        />
        <Toaster />
      </>
    );
  }

  // Coach chat view
  if (currentView === "coach") {
    return (
      <>
        <CoachChat 
          user={user}
          playerProfile={playerProfile}
          onBack={() => setCurrentView(user && playerProfile ? "game" : "home")}
        />
        <Toaster />
      </>
    );
  }

  return (
    <>
      <div>Home view content here...</div>
      <Toaster />
    </>
  );
};

export default Index;