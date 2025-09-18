import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  Plus, 
  Minus, 
  Flag, 
  MapPin, 
  Mic, 
  MicOff, 
  Clock,
  MessageCircle,
  Target,
  TrendingUp
} from "lucide-react";
import { Scorecard } from "./Scorecard";
import { toast } from "@/hooks/use-toast";

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

interface Stroke {
  id: string;
  distance?: number;
  club?: string;
  timestamp: Date;
  lat?: number;
  lon?: number;
}

interface GameInterfaceProps {
  user: User;
  playerProfile: PlayerData;
  onBack: () => void;
  onOpenCoach: () => void;
}

export function GameInterface({ user, playerProfile, onBack, onOpenCoach }: GameInterfaceProps) {
  const [currentHole, setCurrentHole] = useState(1);
  const [strokes, setStrokes] = useState<Record<number, Stroke[]>>({});
  const [isRecording, setIsRecording] = useState(false);
  const [gameStartTime] = useState(new Date());
  const [gpsEnabled, setGpsEnabled] = useState(false);
  const [currentPosition, setCurrentPosition] = useState<{lat: number, lon: number} | null>(null);

  // Initialize GPS
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentPosition({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          });
          setGpsEnabled(true);
          toast({
            title: "GPS activé",
            description: "Les distances seront calculées automatiquement"
          });
        },
        () => {
          toast({
            title: "GPS non disponible",
            description: "Les distances devront être saisies manuellement",
            variant: "destructive"
          });
        }
      );
    }
  }, []);

  const getCurrentStrokes = () => strokes[currentHole]?.length || 0;
  const getTotalStrokes = () => Object.values(strokes).reduce((total, holeStrokes) => total + holeStrokes.length, 0);

  const addStroke = () => {
    const newStroke: Stroke = {
      id: `stroke_${Date.now()}`,
      timestamp: new Date(),
      ...(currentPosition && { lat: currentPosition.lat, lon: currentPosition.lon })
    };

    setStrokes(prev => ({
      ...prev,
      [currentHole]: [...(prev[currentHole] || []), newStroke]
    }));

    toast({
      title: "Coup ajouté",
      description: `Trou ${currentHole} - ${getCurrentStrokes() + 1} coups`
    });
  };

  const removeLastStroke = () => {
    if (getCurrentStrokes() === 0) return;
    
    setStrokes(prev => ({
      ...prev,
      [currentHole]: prev[currentHole].slice(0, -1)
    }));

    toast({
      title: "Coup supprimé",
      description: `Trou ${currentHole} - ${getCurrentStrokes() - 1} coups`
    });
  };

  const finishHole = () => {
    if (getCurrentStrokes() === 0) {
      toast({
        title: "Aucun coup enregistré",
        description: "Ajoutez au moins un coup avant de finir le trou",
        variant: "destructive"
      });
      return;
    }

    if (currentHole < 18) {
      setCurrentHole(prev => prev + 1);
      toast({
        title: "Trou terminé",
        description: `Direction trou ${currentHole + 1}`,
      });
    } else {
      toast({
        title: "Partie terminée !",
        description: `Total: ${getTotalStrokes()} coups`,
      });
    }
  };

  const toggleRecording = () => {
    setIsRecording(prev => !prev);
    if (!isRecording) {
      toast({
        title: "Enregistrement vocal activé",
        description: "Dites 'play' pour ajouter un coup, 'finish' pour finir le trou"
      });
    }
  };

  const formatElapsedTime = () => {
    const elapsed = Math.floor((Date.now() - gameStartTime.getTime()) / 1000);
    const hours = Math.floor(elapsed / 3600);
    const minutes = Math.floor((elapsed % 3600) / 60);
    return hours > 0 ? `${hours}h${minutes}m` : `${minutes}m`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b border-border">
        <div className="flex items-center justify-between p-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onBack}
            className="hover:bg-accent/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          <div className="text-center">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              {formatElapsedTime()}
            </div>
            <div className="font-semibold">
              {playerProfile.firstName} {playerProfile.lastName}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant={gpsEnabled ? "secondary" : "destructive"} className="text-xs">
              <MapPin className="w-3 h-3 mr-1" />
              GPS
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Game Interface */}
      <div className="p-4 space-y-6">
        <Tabs defaultValue="game" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="game">Jeu</TabsTrigger>
            <TabsTrigger value="scorecard">Scorecard</TabsTrigger>
            <TabsTrigger value="stats">Statistiques</TabsTrigger>
          </TabsList>

          <TabsContent value="game" className="space-y-6">
            {/* Score Display */}
            <Card className="golf-card text-center">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-center gap-4">
                  <Flag className="w-6 h-6 text-primary" />
                  <CardTitle className="hole-display">
                    Trou {currentHole} / 18
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="score-display text-primary">
                  {getCurrentStrokes()}
                </div>
                
                <div className="text-sm text-muted-foreground">
                  Total: {getTotalStrokes()} coups
                </div>

                {/* Action Buttons */}
                <div className="flex justify-center gap-4">
                  <Button
                    size="lg"
                    variant="score"
                    onClick={addStroke}
                    className="flex-1 max-w-32 h-16 text-xl"
                  >
                    <Plus className="w-6 h-6" />
                    +1
                  </Button>
                  
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={removeLastStroke}
                    disabled={getCurrentStrokes() === 0}
                    className="flex-1 max-w-32 h-16"
                  >
                    <Minus className="w-5 h-5" />
                    Annuler
                  </Button>
                </div>

                <Button
                  onClick={finishHole}
                  disabled={getCurrentStrokes() === 0}
                  className="w-full golf-gradient"
                >
                  <Flag className="w-4 h-4 mr-2" />
                  Finir le trou
                </Button>
              </CardContent>
            </Card>

            {/* Voice Control */}
            <Card className="golf-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mic className="w-5 h-5" />
                  Commande vocale
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={toggleRecording}
                  variant={isRecording ? "destructive" : "outline"}
                  className="w-full transition-golf"
                >
                  {isRecording ? (
                    <>
                      <MicOff className="w-4 h-4 mr-2" />
                      Arrêter l'enregistrement
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4 mr-2" />
                      Maintenir pour parler
                    </>
                  )}
                </Button>
                {isRecording && (
                  <div className="mt-3 text-center text-sm text-muted-foreground animate-pulse">
                    🎤 En écoute... Dites "play" ou "finish"
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Coach Access */}
            <Card className="golf-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  Coach IA
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Besoin de conseils pour ce trou ? Demandez à votre coach IA.
                </p>
                <Button onClick={onOpenCoach} variant="outline" className="w-full">
                  Ouvrir le coach
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="scorecard">
            <Scorecard 
              strokes={strokes}
              currentHole={currentHole}
              playerProfile={playerProfile}
            />
          </TabsContent>

          <TabsContent value="stats" className="space-y-4">
            <Card className="golf-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Statistiques de partie
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{getTotalStrokes()}</div>
                    <div className="text-sm text-muted-foreground">Coups total</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{currentHole - 1}</div>
                    <div className="text-sm text-muted-foreground">Trous joués</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {getTotalStrokes() > 0 ? (getTotalStrokes() / Math.max(1, currentHole - 1)).toFixed(1) : "0.0"}
                    </div>
                    <div className="text-sm text-muted-foreground">Moy. par trou</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{formatElapsedTime()}</div>
                    <div className="text-sm text-muted-foreground">Temps de jeu</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}