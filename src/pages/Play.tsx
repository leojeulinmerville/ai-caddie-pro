import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useGameLogic } from '@/hooks/useGameLogic';
import { useI18n } from '@/hooks/useI18n';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GameInterface } from '@/components/game/GameInterface';
import { Scorecard } from '@/components/game/Scorecard';
import { CoachOverlay } from '@/components/coach/CoachOverlay';
import { ArrowLeft, Menu, Clock, Headphones, Satellite } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Round {
  id: string;
  course_id: string;
  selection: string;
  tee_color: string;
  status: string;
  started_at: string;
  total_strokes: number;
}

export default function Play() {
  const { roundId } = useParams<{ roundId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useI18n();
  const [round, setRound] = useState<Round | null>(null);
  const [loading, setLoading] = useState(true);
  const [coachOpen, setCoachOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('game');
  const [elapsedTime, setElapsedTime] = useState('00:00');

  const gameLogic = useGameLogic({ 
    roundId: roundId || '',
    accuracyThreshold: 15 
  });

  useEffect(() => {
    if (roundId) {
      loadRound();
    }
  }, [roundId]);

  // Timer effect
  useEffect(() => {
    if (!round) return;

    const startTime = new Date(round.started_at).getTime();
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const diff = now - startTime;
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setElapsedTime(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [round]);

  const loadRound = async () => {
    if (!roundId || !user) return;

    try {
      const { data: round, error } = await supabase
        .from('rounds')
        .select('*')
        .eq('id', roundId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (!round) {
        toast({
          title: "Partie introuvable",
          description: "Cette partie n'existe pas ou ne vous appartient pas",
          variant: "destructive",
        });
        navigate('/dashboard');
        return;
      }

      if (round.status !== 'active') {
        toast({
          title: "Partie terminée",
          description: "Cette partie est déjà terminée",
        });
        navigate('/dashboard');
        return;
      }

      setRound(round);
    } catch (error) {
      console.error('Error loading round:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger la partie",
        variant: "destructive",
      });
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleQuitGame = async () => {
    if (!round) return;

    try {
      const { error } = await supabase
        .from('rounds')
        .update({ 
          status: 'completed',
          ended_at: new Date().toISOString()
        })
        .eq('id', round.id);

      if (error) throw error;

      toast({
        title: "Partie sauvegardée",
        description: "Votre partie a été sauvegardée",
      });

      navigate('/dashboard');
    } catch (error) {
      console.error('Error quitting game:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder la partie",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-hs-green-100 mx-auto mb-4"></div>
          <p className="text-hs-ink">Chargement de la partie...</p>
        </div>
      </div>
    );
  }

  if (!round) {
    return (
      <div className="p-6 text-center">
        <p className="text-hs-ink mb-4">Partie introuvable</p>
        <Button onClick={() => navigate('/dashboard')}>
          Retour au dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-hs-beige min-h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-hs-sand/20 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="text-hs-ink hover:text-hs-green-900"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="font-semibold text-hs-green-900">Mon Golf</h1>
              <div className="flex items-center gap-4 text-sm text-hs-ink">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {elapsedTime}
                </div>
                <div className="flex items-center gap-1">
                  {gameLogic.gpsStatus === 'connected' ? (
                    <Satellite className="w-4 h-4 text-hs-green-100" />
                  ) : (
                    <Satellite className="w-4 h-4 text-hs-sand" />
                  )}
                  GPS
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCoachOpen(true)}
              className="text-hs-green-100 hover:bg-hs-green-100/10"
            >
              <Headphones className="w-4 h-4 mr-1" />
              Coach
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Menu className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                  Mon compte
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/stats')}>
                  Paramètres
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleQuitGame} className="text-red-600">
                  Quitter la partie
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-2 bg-white border-b border-hs-sand/20">
            <TabsTrigger value="game" className="data-[state=active]:bg-hs-green-100 data-[state=active]:text-white">
              Jeu
            </TabsTrigger>
            <TabsTrigger value="scorecard" className="data-[state=active]:bg-hs-green-100 data-[state=active]:text-white">
              Scorecard
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="game" className="flex-1 mt-0">
            <GameInterface
              currentHole={gameLogic.currentHole}
              totalStrokes={gameLogic.totalStrokes}
              strokes={gameLogic.strokes}
              isRecording={gameLogic.isRecording}
              gpsStatus={gameLogic.gpsStatus}
              onAddStroke={gameLogic.addStroke}
              onUndoStroke={gameLogic.undoStroke}
              onFinishHole={gameLogic.finishHole}
              onToggleVoiceRecording={gameLogic.toggleVoiceRecording}
              onSetStrokeClub={gameLogic.setStrokeClub}
              onSetStrokeDistance={gameLogic.setStrokeDistance}
            />
          </TabsContent>
          
          <TabsContent value="scorecard" className="flex-1 mt-0">
            <div className="p-6">
              <div className="text-center text-hs-ink">
                Scorecard sera disponible prochainement
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Coach Overlay */}
      <div>
        {/* Coach will be implemented next */}
      </div>
    </div>
  );
}