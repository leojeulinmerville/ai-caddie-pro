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
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t, language, setLanguage, units, setUnits } = useI18n();
  const [activeTab, setActiveTab] = useState('stats');
  const [clubStats, setClubStats] = useState<ClubStats[]>([]);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [filter, setFilter] = useState<'7d' | '30d' | 'all'>('all');
  const [loading, setLoading] = useState(true);

  // Mock data for demonstration
  const clubStats = [
    { club: 'Driver', average: 245, count: 12, last20: true },
    { club: 'Fer 7', average: 150, count: 18, last20: true },
    { club: 'Fer 9', average: 125, count: 15, last20: false },
    { club: 'Wedge', average: 80, count: 22, last20: true },
    { club: 'Putter', average: 2.1, count: 45, last20: true },
  ];

  const recentRounds = [
    { id: '1', date: '2024-01-15', course: 'Golf Club Paris', total: 87, vsPar: '+15', selection: 'full' },
    { id: '2', date: '2024-01-12', course: 'Golf de Morfontaine', total: 42, vsPar: '+6', selection: 'front' },
    { id: '3', date: '2024-01-08', course: 'Golf Club Paris', total: 91, vsPar: '+19', selection: 'full' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border p-4">
        <div className="flex items-center gap-4 max-w-6xl mx-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          
          <div>
            <h1 className="text-lg font-semibold text-accent">Statistiques & Paramètres</h1>
            <p className="text-sm text-muted-foreground">
              Analysez votre progression et gérez vos préférences
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-4">
        <Tabs defaultValue="stats" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="stats">
              <BarChart3 className="w-4 h-4 mr-2" />
              Stats
            </TabsTrigger>
            <TabsTrigger value="history">
              <History className="w-4 h-4 mr-2" />
              Historique
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="w-4 h-4 mr-2" />
              Paramètres
            </TabsTrigger>
          </TabsList>

          {/* Stats Tab */}
          <TabsContent value="stats" className="space-y-6">
            {/* Filter */}
            <Card className="golf-card">
              <CardHeader>
                <CardTitle className="text-accent flex items-center">
                  <Target className="w-5 h-5 mr-2" />
                  Filtre des statistiques
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={statsFilter} onValueChange={(value: '7d' | '30d' | 'all') => setStatsFilter(value)}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">7 derniers jours</SelectItem>
                    <SelectItem value="30d">30 derniers jours</SelectItem>
                    <SelectItem value="all">Toutes les parties</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Club Statistics */}
            <Card className="golf-card">
              <CardHeader>
                <CardTitle className="text-accent">Mes Clubs</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Distances moyennes et performances par club
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {clubStats.map((club, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className="font-semibold text-accent">{club.club}</div>
                        {club.last20 && (
                          <Badge variant="secondary" className="text-xs">
                            Derniers 20
                          </Badge>
                        )}
                      </div>
                      
                      <div className="text-right">
                        <div className="font-bold text-primary">
                          {club.club === 'Putter' ? `${club.average} coups` : `${club.average}${units}`}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {club.count} coups
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Performance Overview */}
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="golf-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                    <Trophy className="w-4 h-4 mr-2" />
                    Meilleur Score
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-success">82</div>
                  <p className="text-xs text-muted-foreground">+10 par rapport au par</p>
                </CardContent>
              </Card>
              
              <Card className="golf-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Handicap Actuel
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">{playerProfile.handicap}</div>
                  <p className="text-xs text-muted-foreground">Stable ce mois</p>
                </CardContent>
              </Card>
              
              <Card className="golf-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Parties Jouées
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-accent">12</div>
                  <p className="text-xs text-muted-foreground">Ce mois-ci</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-6">
            <Card className="golf-card">
              <CardHeader>
                <CardTitle className="text-accent flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Historique des parties
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentRounds.map((round) => (
                    <div key={round.id} className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer">
                      <div>
                        <div className="font-semibold text-accent">{round.course}</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(round.date).toLocaleDateString('fr-FR', { 
                            day: 'numeric', 
                            month: 'long', 
                            year: 'numeric' 
                          })}
                        </div>
                        <Badge variant="outline" className="mt-1 capitalize">
                          {round.selection === 'full' ? '18 trous' : round.selection === 'front' ? 'Front 9' : 'Back 9'}
                        </Badge>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">{round.total}</div>
                        <Badge 
                          variant={round.vsPar.startsWith('+') ? "secondary" : "default"}
                          className={!round.vsPar.startsWith('+') ? "bg-success text-success-foreground" : ""}
                        >
                          {round.vsPar}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            {/* Language & Units */}
            <Card className="golf-card">
              <CardHeader>
                <CardTitle className="text-accent">Préférences</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Personnalisez votre expérience HighSwing.ai
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="language">Langue</Label>
                    <Select value={language} onValueChange={(value: 'fr' | 'en') => setLanguage(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fr">Français</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="units">Unités</Label>
                    <Select value={units} onValueChange={(value: 'm' | 'yd') => setUnits(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="m">Mètres (m)</SelectItem>
                        <SelectItem value="yd">Yards (yd)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* GPS Settings */}
            <Card className="golf-card">
              <CardHeader>
                <CardTitle className="text-accent">Paramètres GPS</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Configuration de la précision GPS
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="gps-threshold">Seuil de précision GPS (mètres)</Label>
                  <Select value={gpsThreshold} onValueChange={setGpsThreshold}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 mètres (très précis)</SelectItem>
                      <SelectItem value="10">10 mètres (précis)</SelectItem>
                      <SelectItem value="15">15 mètres (standard)</SelectItem>
                      <SelectItem value="20">20 mètres (tolérant)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Les points GPS avec une précision supérieure à ce seuil seront ignorés
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Account Info */}
            <Card className="golf-card">
              <CardHeader>
                <CardTitle className="text-accent">Informations du compte</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Email</Label>
                    <div className="font-medium">{user.email}</div>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Nom d'affichage</Label>
                    <div className="font-medium">{user.displayName}</div>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Handicap</Label>
                    <div className="font-medium">{playerProfile.handicap}</div>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Nom complet</Label>
                    <div className="font-medium">{playerProfile.firstName} {playerProfile.lastName}</div>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <Button variant="outline">
                    Modifier le profil
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Save Settings */}
            <div className="flex justify-end">
              <Button className="golf-gradient hover:golf-glow transition-golf">
                Sauvegarder les paramètres
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default StatsHistorySettings;