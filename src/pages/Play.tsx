import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Mic, MicOff, Undo, Flag, Clock, MapPin, MessageCircle, MoreVertical } from "lucide-react";
import { GameInterface } from "@/components/game/GameInterface";
import { Scorecard } from "@/components/game/Scorecard";
import { CoachChat } from "@/components/coach/CoachChat";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

interface PlayProps {
  user: User;
  playerProfile: PlayerData;
  roundId: string;
  onBack: () => void;
  onQuitGame: () => void;
}

const Play = ({ user, playerProfile, roundId, onBack, onQuitGame }: PlayProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [coachOpen, setCoachOpen] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<'connected' | 'disconnected' | 'loading'>('loading');
  const [currentHole, setCurrentHole] = useState(1);
  const [totalStrokes, setTotalStrokes] = useState(0);
  const [gameStartTime] = useState(new Date());
  const [elapsedTime, setElapsedTime] = useState('00:00');
  const { toast } = useToast();

  useEffect(() => {
    // Update elapsed time every minute
    const timer = setInterval(() => {
      const now = new Date();
      const diff = Math.floor((now.getTime() - gameStartTime.getTime()) / 1000 / 60);
      const hours = Math.floor(diff / 60);
      const minutes = diff % 60;
      
      if (hours > 0) {
        setElapsedTime(`${hours}:${minutes.toString().padStart(2, '0')}`);
      } else {
        setElapsedTime(`${minutes}:00`);
      }
    }, 60000);

    return () => clearInterval(timer);
  }, [gameStartTime]);

  useEffect(() => {
    // Check GPS status
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        () => setGpsStatus('connected'),
        () => setGpsStatus('disconnected'),
        { timeout: 5000 }
      );
    } else {
      setGpsStatus('disconnected');
    }
  }, []);

  const handleAddStroke = () => {
    setTotalStrokes(prev => prev + 1);
    toast({
      title: "+1 enregistré",
      description: "Coup ajouté au compteur",
    });
  };

  const handleUndo = () => {
    if (totalStrokes > 0) {
      setTotalStrokes(prev => prev - 1);
      toast({
        title: "Coup annulé",
        description: "Dernier coup supprimé",
      });
    }
  };

  const handleFinishHole = () => {
    if (currentHole < 18) {
      setCurrentHole(prev => prev + 1);
      toast({
        title: "Trou terminé",
        description: `Passage au trou ${currentHole + 1}`,
      });
    } else {
      // Finish round
      toast({
        title: "Partie terminée !",
        description: "Félicitations pour votre partie",
      });
      onQuitGame();
    }
  };

  const toggleMicrophone = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      toast({
        title: "Écoute activée",
        description: "Dites 'play', 'finish' ou 'undo'",
      });
    } else {
      toast({
        title: "Écoute désactivée",
        description: "Microphone arrêté",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border p-4">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
            
            <div>
              <h1 className="text-lg font-semibold text-accent">Parcours en cours</h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {elapsedTime}
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className={`w-4 h-4 ${gpsStatus === 'connected' ? 'text-success' : 'text-warning'}`} />
                  GPS {gpsStatus === 'connected' ? 'OK' : 'OFF'}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCoachOpen(true)}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Coach
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => {/* Open account */}}>
                  Mon compte
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {/* Open settings */}}>
                  Paramètres
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onQuitGame} className="text-destructive">
                  Quitter la partie
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-4">
        <Tabs defaultValue="game" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="game">Jeu</TabsTrigger>
            <TabsTrigger value="scorecard">Scorecard</TabsTrigger>
          </TabsList>

          <TabsContent value="game" className="space-y-6">
            {/* Game Status */}
            <Card className="golf-card">
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-accent mb-2">
                    Trou {currentHole}
                  </div>
                  <div className="text-6xl font-black text-primary mb-4">
                    {totalStrokes}
                  </div>
                  <div className="text-muted-foreground">
                    Coups sur ce trou
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Last Shot Info */}
            <Card className="golf-card">
              <CardHeader>
                <CardTitle className="text-lg">Dernier coup</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center text-muted-foreground">
                  Aucun coup enregistré sur ce trou
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="scorecard">
            <Card className="golf-card">
              <CardHeader>
                <CardTitle className="text-accent">Scorecard</CardTitle>
              </CardHeader>
              <CardContent>
                <Scorecard 
                  strokes={[]} 
                  currentHole={currentHole}
                  playerProfile={playerProfile}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Action Bar (Fixed Bottom) */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center gap-4">
            <Button
              size="lg"
              onClick={handleAddStroke}
              className="golf-gradient hover:golf-glow transition-golf min-w-[100px]"
            >
              +1
            </Button>

            <Button
              variant="ghost"
              size="lg"
              onClick={handleUndo}
              disabled={totalStrokes === 0}
              className="min-w-[100px]"
            >
              <Undo className="w-5 h-5 mr-2" />
              Undo
            </Button>

            <Button
              variant="secondary"
              size="lg"
              onClick={handleFinishHole}
              className="min-w-[100px]"
            >
              <Flag className="w-5 h-5 mr-2" />
              Finish
            </Button>

            <Button
              variant={isRecording ? "destructive" : "outline"}
              size="lg"
              onClick={toggleMicrophone}
              className="min-w-[100px]"
            >
              {isRecording ? (
                <>
                  <MicOff className="w-5 h-5 mr-2" />
                  Stop
                </>
              ) : (
                <>
                  <Mic className="w-5 h-5 mr-2" />
                  Mic
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Coach Dialog */}
      <Dialog open={coachOpen} onOpenChange={setCoachOpen}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-accent">Coach IA</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            <CoachChat 
              user={user}
              playerProfile={playerProfile}
              onBack={() => setCoachOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Bottom padding for action bar */}
      <div className="h-24"></div>
    </div>
  );
};

export default Play;