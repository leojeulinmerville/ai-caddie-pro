import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Target, Zap, MapPin } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

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
            <Button 
              size="lg" 
              variant="default"
              onClick={() => navigate('/signup')}
              className="golf-gradient hover:golf-glow transition-golf text-lg px-8 py-4"
            >
              Commencer maintenant
            </Button>
            
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => navigate('/signin')}
              className="text-lg px-8 py-4 transition-golf hover:bg-accent/10"
            >
              Se connecter
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
          <Button 
            size="lg" 
            variant="default"
            onClick={() => navigate('/signup')}
            className="golf-gradient hover:golf-glow transition-golf"
          >
            Créer mon compte gratuitement
          </Button>
        </div>
      </section>

      <Toaster />
    </div>
  );
};

export default Index;