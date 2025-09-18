import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Mic, MicOff, Undo, Flag, Clock, MapPin, MessageCircle, MoreVertical } from "lucide-react";
import { Scorecard } from "@/components/game/Scorecard";
import { CoachOverlay } from "@/components/coach/CoachOverlay";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useGameLogic } from "@/hooks/useGameLogic";
import { useI18n } from "@/hooks/useI18n";
import { formatDistance } from "@/utils/units";

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
  const [coachOpen, setCoachOpen] = useState(false);
  const [gameStartTime] = useState(new Date());
  const [elapsedTime, setElapsedTime] = useState('00:00');
  const { t } = useI18n();
  
  const {
    currentHole,
    totalStrokes,
    strokes,
    isRecording,
    gpsStatus,
    addStroke,
    undoStroke,
    finishHole,
    toggleVoiceRecording
  } = useGameLogic({ roundId });

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

  // Get last stroke for display
  const currentHoleStrokes = strokes.filter(s => s.hole_local_idx === currentHole);
  const lastStroke = currentHoleStrokes[currentHoleStrokes.length - 1];
  
  // Get last 3 strokes for coach context
  const lastStrokes = strokes.slice(-3).map(s => ({
    distance: s.distance || 0,
    club: s.club || 'Unknown'
  }));

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
              <h1 className="text-lg font-semibold text-hs-green-900">Parcours en cours</h1>
              <div className="flex items-center gap-4 text-sm text-hs-sand">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {elapsedTime}
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className={`w-4 h-4 ${gpsStatus === 'connected' ? 'text-hs-green-100' : 'text-red-500'}`} />
                  {t('gps.' + gpsStatus)}
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
            <TabsTrigger value="game">{t('play.game')}</TabsTrigger>
            <TabsTrigger value="scorecard">{t('play.scorecard')}</TabsTrigger>
          </TabsList>

          <TabsContent value="game" className="space-y-6">
            {/* Game Status */}
            <Card className="border-hs-beige/50 bg-white/50">
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-hs-green-900 mb-2">
                    {t('play.hole')} {currentHole}
                  </div>
                  <div className="text-6xl font-black text-hs-green-100 mb-4">
                    {currentHoleStrokes.length}
                  </div>
                  <div className="text-hs-sand">
                    {t('play.strokes')}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Last Shot Info */}
            <Card className="border-hs-beige/50 bg-white/50">
              <CardHeader>
                <CardTitle className="text-lg text-hs-green-900">{t('play.lastShot')}</CardTitle>
              </CardHeader>
              <CardContent>
                {lastStroke ? (
                  <div className="text-center">
                    <div className="text-lg font-semibold text-hs-green-100 mb-1">
                      {lastStroke.distance ? formatDistance(lastStroke.distance, playerProfile.preferredUnits) : 'N/A'}
                    </div>
                    <div className="text-hs-sand">
                      {lastStroke.club || 'Club non défini'}
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-hs-sand">
                    {t('play.noShots')}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="scorecard">
            <Card className="border-hs-beige/50 bg-white/50">
              <CardHeader>
                <CardTitle className="text-hs-green-900">{t('play.scorecard')}</CardTitle>
              </CardHeader>
              <CardContent>
                <Scorecard 
                  strokes={{}} 
                  currentHole={currentHole}
                  playerProfile={playerProfile}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Action Bar (Fixed Bottom) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-hs-beige p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center gap-4">
            <Button
              size="lg"
              onClick={addStroke}
              className="bg-hs-green-100 hover:bg-hs-green-200 text-white min-w-[100px]"
            >
              {t('play.addStroke')}
            </Button>

            <Button
              variant="ghost"
              size="lg"
              onClick={undoStroke}
              disabled={strokes.length === 0}
              className="min-w-[100px] text-hs-green-900"
            >
              <Undo className="w-5 h-5 mr-2" />
              {t('play.undo')}
            </Button>

            <Button
              variant="secondary"
              size="lg"
              onClick={finishHole}
              className="min-w-[100px] bg-hs-sand hover:bg-hs-sand/80 text-hs-ink"
            >
              <Flag className="w-5 h-5 mr-2" />
              {t('play.finish')}
            </Button>

            <Button
              variant={isRecording ? "destructive" : "outline"}
              size="lg"
              onClick={toggleVoiceRecording}
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
                  {t('play.mic')}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Coach Overlay */}
      {coachOpen && (
        <CoachOverlay
          user={user}
          playerProfile={playerProfile}
          currentHole={currentHole}
          totalStrokes={currentHoleStrokes.length}
          lastStrokes={lastStrokes}
          onClose={() => setCoachOpen(false)}
        />
      )}

      {/* Bottom padding for action bar */}
      <div className="h-24"></div>
    </div>
  );
};

export default Play;