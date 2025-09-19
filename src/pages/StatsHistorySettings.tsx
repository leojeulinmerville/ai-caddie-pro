import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/hooks/useI18n';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, BarChart3, Calendar, Settings, Filter } from 'lucide-react';
interface ClubStats {
  club: string;
  count: number;
  average: number;
  min: number;
  max: number;
  recent20: boolean;
}
interface Round {
  id: string;
  started_at: string;
  ended_at?: string;
  total_strokes: number;
  selection: string;
  status: string;
}
export default function StatsHistorySettings() {
  const {
    user
  } = useAuth();
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const {
    language,
    changeLanguage
  } = useI18n();
  const [activeTab, setActiveTab] = useState('stats');
  const [clubStats, setClubStats] = useState<ClubStats[]>([]);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [filter, setFilter] = useState<'7d' | '30d' | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [units, setUnits] = useState<'m' | 'yd'>('m');
  useEffect(() => {
    loadData();
  }, [user, filter]);
  const loadData = async () => {
    if (!user) return;
    try {
      // Load rounds
      let roundsQuery = supabase.from('rounds').select('*').eq('user_id', user.id).eq('status', 'completed').order('ended_at', {
        ascending: false
      });

      // Apply date filter
      if (filter === '7d') {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        roundsQuery = roundsQuery.gte('ended_at', sevenDaysAgo.toISOString());
      } else if (filter === '30d') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        roundsQuery = roundsQuery.gte('ended_at', thirtyDaysAgo.toISOString());
      }
      const {
        data: roundsData,
        error: roundsError
      } = await roundsQuery;
      if (roundsError) throw roundsError;
      setRounds(roundsData || []);

      // Load club statistics
      const roundIds = roundsData?.map(r => r.id) || [];
      if (roundIds.length > 0) {
        const {
          data: strokesData,
          error: strokesError
        } = await supabase.from('strokes').select('club, distance').in('round_id', roundIds).not('club', 'is', null).not('distance', 'is', null);
        if (strokesError) throw strokesError;

        // Process club statistics
        const clubMap = new Map<string, {
          distances: number[];
          count: number;
        }>();
        strokesData?.forEach(stroke => {
          if (!stroke.club || !stroke.distance) return;
          if (!clubMap.has(stroke.club)) {
            clubMap.set(stroke.club, {
              distances: [],
              count: 0
            });
          }
          const clubData = clubMap.get(stroke.club)!;
          clubData.distances.push(stroke.distance);
          clubData.count++;
        });
        const stats: ClubStats[] = Array.from(clubMap.entries()).map(([club, data]) => {
          const distances = data.distances;
          const average = distances.reduce((sum, d) => sum + d, 0) / distances.length;
          const min = Math.min(...distances);
          const max = Math.max(...distances);
          return {
            club,
            count: data.count,
            average: Math.round(average),
            min,
            max,
            recent20: data.count >= 20
          };
        }).sort((a, b) => b.average - a.average);
        setClubStats(stats);
      } else {
        setClubStats([]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const formatDistance = (distance: number) => {
    if (units === 'yd') {
      return `${Math.round(distance * 1.09361)} yd`;
    }
    return `${distance} m`;
  };
  return <div className="p-6 bg-hs-beige min-h-screen">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="text-hs-ink hover:text-hs-green-900">
            <ArrowLeft className="w-4 h-4 mr-2 text-lime-600" />
            Retour
          </Button>
          <h1 className="text-3xl font-bold text-hs-green-900">Stats & Paramètres</h1>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 bg-white">
            <TabsTrigger value="stats" className="data-[state=active]:bg-hs-green-100 data-[state=active]:text-white">
              <BarChart3 className="w-4 h-4 mr-2" />
              Stats
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-hs-green-100 data-[state=active]:text-white">
              <Calendar className="w-4 h-4 mr-2" />
              Historique
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-hs-green-100 data-[state=active]:text-white">
              <Settings className="w-4 h-4 mr-2" />
              Paramètres
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stats" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-hs-green-900">Mes Clubs</h2>
              <Select value={filter} onValueChange={(value: '7d' | '30d' | 'all') => setFilter(value)}>
                <SelectTrigger className="w-40">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">7 derniers jours</SelectItem>
                  <SelectItem value="30d">30 derniers jours</SelectItem>
                  <SelectItem value="all">Toutes les données</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {loading ? <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-hs-green-100 mx-auto mb-4"></div>
                <p className="text-hs-ink">Chargement des statistiques...</p>
              </div> : clubStats.length === 0 ? <Card className="bg-white border-hs-sand/20">
                <CardContent className="py-8 text-center">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4 text-hs-sand opacity-50" />
                  <p className="text-hs-sand">Aucune donnée disponible</p>
                  <p className="text-sm text-hs-sand mt-2">
                    Jouez quelques parties pour voir vos statistiques
                  </p>
                </CardContent>
              </Card> : <div className="grid gap-4">
                {clubStats.map(stat => <Card key={stat.club} className="bg-white border-hs-sand/20">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-hs-green-900">{stat.club}</h3>
                          {stat.recent20 && <Badge className="bg-hs-green-100 text-white text-xs">
                              Derniers 20
                            </Badge>}
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold text-hs-green-900">
                            {formatDistance(stat.average)}
                          </div>
                          <div className="text-xs text-hs-sand">
                            {stat.count} coups
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-hs-ink">
                        <span>Min: {formatDistance(stat.min)}</span>
                        <span className="mx-2">•</span>
                        <span>Max: {formatDistance(stat.max)}</span>
                      </div>
                    </CardContent>
                  </Card>)}
              </div>}
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <h2 className="text-xl font-semibold text-hs-green-900">Historique des parties</h2>
            
            {rounds.length === 0 ? <Card className="bg-white border-hs-sand/20">
                <CardContent className="py-8 text-center">
                  <Calendar className="w-12 h-12 mx-auto mb-4 text-hs-sand opacity-50" />
                  <p className="text-hs-sand">Aucune partie terminée</p>
                </CardContent>
              </Card> : <div className="grid gap-4">
                {rounds.map(round => <Card key={round.id} className="bg-white border-hs-sand/20">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-hs-green-900">Mon Golf</h3>
                          <p className="text-sm text-hs-ink capitalize">
                            {round.selection} • {round.total_strokes} coups
                          </p>
                          <p className="text-xs text-hs-sand">
                            Terminée le {round.ended_at ? new Date(round.ended_at).toLocaleDateString('fr-FR') : '-'}
                          </p>
                        </div>
                        <Button variant="outline" size="sm" className="border-hs-green-100 text-hs-green-100 hover:bg-hs-green-100 hover:text-white">
                          Voir détails
                        </Button>
                      </div>
                    </CardContent>
                  </Card>)}
              </div>}
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <h2 className="text-xl font-semibold text-hs-green-900">Paramètres</h2>
            
            <Card className="bg-white border-hs-sand/20">
              <CardHeader>
                <CardTitle className="text-hs-green-900">Préférences</CardTitle>
                <CardDescription>Personnalisez votre expérience</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-hs-green-900 mb-2 block">
                    Langue
                  </label>
                  <Select value={language} onValueChange={changeLanguage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-hs-green-900 mb-2 block">
                    Unités de distance
                  </label>
                  <Select value={units} onValueChange={(value: 'm' | 'yd') => setUnits(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="m">Mètres</SelectItem>
                      <SelectItem value="yd">Yards</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-hs-green-900 mb-2 block">
                    Seuil de précision GPS
                  </label>
                  <Select defaultValue="15">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 mètres</SelectItem>
                      <SelectItem value="15">15 mètres</SelectItem>
                      <SelectItem value="20">20 mètres</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>;
}