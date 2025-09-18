import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Play, Calendar, Trophy } from 'lucide-react';

interface Round {
  id: string;
  course_id: string;
  status: string;
  started_at: string;
  ended_at?: string;
  total_strokes: number;
  selection: string;
  tee_color: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeRounds, setActiveRounds] = useState<Round[]>([]);
  const [completedRounds, setCompletedRounds] = useState<Round[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadRounds();
    }
  }, [user]);

  const loadRounds = async () => {
    if (!user) return;

    try {
      const { data: rounds, error } = await supabase
        .from('rounds')
        .select('*')
        .eq('user_id', user.id)
        .order('started_at', { ascending: false });

      if (error) throw error;

      const active = rounds?.filter(r => r.status === 'active') || [];
      const completed = rounds?.filter(r => r.status === 'completed') || [];

      setActiveRounds(active);
      setCompletedRounds(completed.slice(0, 5)); // Show last 5 completed rounds
    } catch (error) {
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

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-hs-green-100 mx-auto mb-4"></div>
          <p className="text-hs-ink">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-hs-beige min-h-screen">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-hs-green-900">Dashboard</h1>
            <p className="text-hs-ink">Bienvenue, {user?.email}</p>
          </div>
          <Button 
            className="bg-hs-green-100 hover:bg-hs-green-200 text-white"
            onClick={() => navigate('/setup')}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle partie
          </Button>
        </div>

        {/* Active Rounds Section */}
        <div>
          <h2 className="text-xl font-semibold text-hs-green-900 mb-4">Parties en cours</h2>
          {activeRounds.length === 0 ? (
            <Card className="bg-white border-hs-sand/20">
              <CardContent className="p-8 text-center">
                <div className="text-hs-sand mb-4">
                  <Play className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  Aucune partie en cours
                </div>
                <Button 
                  className="bg-hs-green-100 hover:bg-hs-green-200 text-white"
                  onClick={() => navigate('/setup')}
                >
                  Commencer une nouvelle partie
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeRounds.map((round) => (
                <Card key={round.id} className="bg-white border-hs-sand/20">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-hs-green-900">Mon Golf</h3>
                        <p className="text-sm text-hs-ink">Trou en cours • {round.total_strokes} coups</p>
                        <p className="text-xs text-hs-sand capitalize">{round.selection} • {round.tee_color}</p>
                      </div>
                      <Button 
                        size="sm"
                        className="bg-hs-green-100 hover:bg-hs-green-200 text-white"
                        onClick={() => navigate(`/play/${round.id}`)}
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Reprendre
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Completed Rounds Section */}
        <div>
          <h2 className="text-xl font-semibold text-hs-green-900 mb-4">Parties achevées</h2>
          {completedRounds.length === 0 ? (
            <Card className="bg-white border-hs-sand/20">
              <CardContent className="p-8 text-center">
                <div className="text-hs-sand">
                  <Trophy className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  Aucune partie terminée
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {completedRounds.map((round) => (
                <Card key={round.id} className="bg-white border-hs-sand/20">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-hs-green-900">Mon Golf</h3>
                        <p className="text-sm text-hs-ink">{round.total_strokes} coups • Terminée</p>
                        <p className="text-xs text-hs-sand">
                          {new Date(round.started_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <Button 
                        size="sm"
                        variant="outline"
                        className="border-hs-green-100 text-hs-green-100 hover:bg-hs-green-100 hover:text-white"
                        onClick={() => navigate('/stats')}
                      >
                        <Calendar className="w-4 h-4 mr-1" />
                        Voir détails
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}