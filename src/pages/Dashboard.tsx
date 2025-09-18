import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Play, Calendar, Trophy, Clock, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  email: string;
  displayName: string;
}

interface Round {
  id: string;
  course_id: string;
  selection: string;
  tee_color: string;
  status: string; // Changed from 'active' | 'completed' to string
  total_strokes: number;
  started_at: string;
  ended_at?: string;
  courses?: {
    name: string;
    holes: number;
    pars: any; // Using any to handle Json type from Supabase
  };
}

interface DashboardProps {
  user: User;
  onStartNewGame: () => void;
  onResumeGame: (roundId: string) => void;
  onViewHistory: (roundId: string) => void;
}

const Dashboard = ({ user, onStartNewGame, onResumeGame, onViewHistory }: DashboardProps) => {
  const [activeRounds, setActiveRounds] = useState<Round[]>([]);
  const [completedRounds, setCompletedRounds] = useState<Round[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadRounds();
  }, [user.id]);

  const loadRounds = async () => {
    try {
      setLoading(true);
      
      // Load active rounds
      const { data: active, error: activeError } = await supabase
        .from('rounds')
        .select(`
          *,
          courses(name, holes, pars)
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('started_at', { ascending: false });

      if (activeError) throw activeError;

      // Load completed rounds (last 10)
      const { data: completed, error: completedError } = await supabase
        .from('rounds')
        .select(`
          *,
          courses(name, holes, pars)
        `)
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('ended_at', { ascending: false })
        .limit(10);

      if (completedError) throw completedError;

      setActiveRounds(active || []);
      setCompletedRounds(completed || []);
    } catch (error: any) {
      console.error('Error loading rounds:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger vos parties",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateVsPar = (totalStrokes: number, pars: any, selection: string) => {
    let expectedPar = 0;
    const parsArray = Array.isArray(pars) ? pars : JSON.parse(pars as string);
    
    if (selection === 'front') {
      expectedPar = parsArray.slice(0, 9).reduce((sum: number, par: number) => sum + par, 0);
    } else if (selection === 'back') {
      expectedPar = parsArray.slice(9, 18).reduce((sum: number, par: number) => sum + par, 0);
    } else {
      expectedPar = parsArray.reduce((sum: number, par: number) => sum + par, 0);
    }
    
    return totalStrokes - expectedPar;
  };

  const getCurrentHole = async (roundId: string) => {
    const { data: strokes } = await supabase
      .from('strokes')
      .select('hole_local_idx')
      .eq('round_id', roundId)
      .order('created_at', { ascending: false })
      .limit(1);

    return strokes?.[0]?.hole_local_idx ? strokes[0].hole_local_idx + 1 : 1;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement de vos parties...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-accent mb-2">
            Bonjour, {user.displayName}
          </h1>
          <p className="text-muted-foreground">
            Prêt pour votre prochaine partie ?
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card className="golf-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                <Play className="w-4 h-4 mr-2" />
                Parties en cours
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{activeRounds.length}</div>
            </CardContent>
          </Card>
          
          <Card className="golf-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                <Trophy className="w-4 h-4 mr-2" />
                Parties terminées
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">{completedRounds.length}</div>
            </CardContent>
          </Card>
          
          <Card className="golf-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                <Target className="w-4 h-4 mr-2" />
                Dernier score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-secondary">
                {completedRounds[0] ? completedRounds[0].total_strokes : '-'}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Rounds */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-accent">Parties en cours</h2>
            <Button 
              onClick={onStartNewGame}
              className="golf-gradient hover:golf-glow transition-golf"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle partie
            </Button>
          </div>
          
          {activeRounds.length === 0 ? (
            <Card className="golf-card">
              <CardContent className="py-8 text-center">
                <div className="text-muted-foreground mb-4">
                  <Play className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  Aucune partie en cours
                </div>
                <Button 
                  onClick={onStartNewGame}
                  variant="outline"
                >
                  Commencer une nouvelle partie
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeRounds.map((round) => (
                <Card key={round.id} className="golf-card hover:golf-shadow transition-golf group cursor-pointer"
                      onClick={() => onResumeGame(round.id)}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg text-accent">
                        {round.courses?.name || 'Parcours'}
                      </CardTitle>
                      <Badge variant="default" className="bg-primary text-primary-foreground">
                        En cours
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Sélection:</span>
                        <span className="capitalize">{round.selection}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Départ:</span>
                        <span className="capitalize">{round.tee_color}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Coups:</span>
                        <span className="font-semibold">{round.total_strokes}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Commencé:</span>
                        <span>{formatDate(round.started_at)}</span>
                      </div>
                    </div>
                    <Button 
                      className="w-full mt-4 group-hover:bg-primary/90"
                      onClick={(e) => {
                        e.stopPropagation();
                        onResumeGame(round.id);
                      }}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Reprendre
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Completed Rounds */}
        <div>
          <h2 className="text-xl font-semibold text-accent mb-4">Parties récentes</h2>
          
          {completedRounds.length === 0 ? (
            <Card className="golf-card">
              <CardContent className="py-8 text-center">
                <div className="text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  Aucune partie terminée
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {completedRounds.map((round) => {
                const vsPar = round.courses?.pars ? 
                  calculateVsPar(round.total_strokes, round.courses.pars, round.selection) : 0;
                
                return (
                  <Card key={round.id} className="golf-card hover:golf-shadow transition-golf group cursor-pointer"
                        onClick={() => onViewHistory(round.id)}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg text-accent">
                          {round.courses?.name || 'Parcours'}
                        </CardTitle>
                        <Badge 
                          variant={vsPar <= 0 ? "default" : "secondary"}
                          className={vsPar <= 0 ? "bg-success text-success-foreground" : ""}
                        >
                          {vsPar > 0 ? `+${vsPar}` : vsPar}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Score total:</span>
                          <span className="font-semibold text-lg">{round.total_strokes}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Sélection:</span>
                          <span className="capitalize">{round.selection}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Terminé:</span>
                          <span>{round.ended_at ? formatDate(round.ended_at) : '-'}</span>
                        </div>
                      </div>
                      <Button 
                        variant="outline"
                        className="w-full mt-4"
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewHistory(round.id);
                        }}
                      >
                        Voir détails
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;