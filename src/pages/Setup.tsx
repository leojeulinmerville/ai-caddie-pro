import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Settings, Play } from 'lucide-react';

interface Course {
  id: string;
  name: string;
  holes: number;
  pars: number[];
  handicaps: number[];
  default_tee: string;
}

export default function Setup() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [selection, setSelection] = useState<'front9' | 'back9' | 'full'>('full');
  const [teeColor, setTeeColor] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const { data: courses, error } = await supabase
        .from('courses')
        .select('*');

      if (error) throw error;

      const processedCourses = courses?.map(course => ({
        ...course,
        pars: Array.isArray(course.pars) ? course.pars : JSON.parse(course.pars as string),
        handicaps: Array.isArray(course.handicaps) ? course.handicaps : JSON.parse(course.handicaps as string)
      })) || [];

      setCourses(processedCourses);
      if (processedCourses.length > 0) {
        setSelectedCourse(processedCourses[0].id);
        setTeeColor(processedCourses[0].default_tee);
      }
    } catch (error) {
      console.error('Error loading courses:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les parcours",
        variant: "destructive",
      });
    }
  };

  const handleStartGame = async () => {
    if (!user || !selectedCourse) return;

    setLoading(true);
    try {
      const { data: round, error } = await supabase
        .from('rounds')
        .insert({
          user_id: user.id,
          course_id: selectedCourse,
          selection,
          tee_color: teeColor,
          status: 'active',
          started_at: new Date().toISOString(),
          total_strokes: 0
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Partie créée !",
        description: "Bonne partie !",
      });

      navigate(`/play/${round.id}`);
    } catch (error: any) {
      console.error('Error creating round:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer la partie",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedCourseData = courses.find(c => c.id === selectedCourse);

  return (
    <div className="p-6 bg-hs-beige min-h-screen">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard')}
            className="text-hs-ink hover:text-hs-green-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <h1 className="text-3xl font-bold text-hs-green-900">Nouvelle partie</h1>
        </div>

        <Card className="bg-white border-hs-sand/20">
          <CardHeader>
            <CardTitle className="text-hs-green-900">Configuration</CardTitle>
            <CardDescription>Choisissez votre parcours et vos préférences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Course Selection */}
            <div>
              <label className="text-sm font-medium text-hs-green-900 mb-2 block">
                Parcours
              </label>
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un parcours" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Selection Type */}
            <div>
              <label className="text-sm font-medium text-hs-green-900 mb-2 block">
                Sélection
              </label>
              <Select value={selection} onValueChange={(value: 'front9' | 'back9' | 'full') => setSelection(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="front9">Front 9 (trous 1-9)</SelectItem>
                  <SelectItem value="back9">Back 9 (trous 10-18)</SelectItem>
                  <SelectItem value="full">Parcours complet (18 trous)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tee Color */}
            <div>
              <label className="text-sm font-medium text-hs-green-900 mb-2 block">
                Repère de départ
              </label>
              <Select value={teeColor} onValueChange={setTeeColor}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir le repère" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Blanc">Blanc</SelectItem>
                  <SelectItem value="Jaune">Jaune</SelectItem>
                  <SelectItem value="Bleu">Bleu</SelectItem>
                  <SelectItem value="Rouge">Rouge</SelectItem>
                  <SelectItem value="Vert">Vert</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Course Details */}
            {selectedCourseData && (
              <Card className="bg-hs-beige/50 border-hs-sand/20">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base text-hs-green-900">
                      Détails du parcours
                    </CardTitle>
                    <Button variant="ghost" size="sm" className="text-hs-green-100">
                      <Settings className="w-4 h-4 mr-1" />
                      Éditer parcours
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-hs-sand">Trous:</span>
                      <span className="ml-2 font-medium text-hs-ink">{selectedCourseData.holes}</span>
                    </div>
                    <div>
                      <span className="text-hs-sand">Par total:</span>
                      <span className="ml-2 font-medium text-hs-ink">
                        {selectedCourseData.pars.reduce((sum, par) => sum + par, 0)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        <Button
          className="w-full bg-hs-green-100 hover:bg-hs-green-200 text-white py-3"
          onClick={handleStartGame}
          disabled={loading || !selectedCourse}
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Création...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              Démarrer la partie
            </>
          )}
        </Button>
      </div>
    </div>
  );
}