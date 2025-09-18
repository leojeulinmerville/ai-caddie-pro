import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Settings, Play, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  email: string;
  displayName: string;
}

interface Course {
  id: string;
  name: string;
  holes: number;
  pars: any; // Using any to handle Json type from Supabase
  handicaps: any; // Using any to handle Json type from Supabase
  default_tee: string;
}

interface SetupProps {
  user: User;
  onBack: () => void;
  onStartGame: (setupData: {
    courseId: string;
    selection: 'front' | 'back' | 'full';
    teeColor: string;
  }) => void;
}

const Setup = ({ user, onBack, onStartGame }: SetupProps) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selection, setSelection] = useState<'front' | 'back' | 'full'>('full');
  const [teeColor, setTeeColor] = useState<string>('Jaune');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editedPars, setEditedPars] = useState<number[]>([]);
  const [editedHandicaps, setEditedHandicaps] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      setCourses(data || []);
      if (data && data.length > 0) {
        // Ensure pars and handicaps are arrays
        const courseData = {
          ...data[0],
          pars: Array.isArray(data[0].pars) ? data[0].pars : JSON.parse(data[0].pars as string),
          handicaps: Array.isArray(data[0].handicaps) ? data[0].handicaps : JSON.parse(data[0].handicaps as string)
        };
        setSelectedCourse(courseData);
        setTeeColor(courseData.default_tee || 'Jaune');
      }
    } catch (error: any) {
      console.error('Error loading courses:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les parcours",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCourseChange = (courseId: string) => {
    const courseData = courses.find(c => c.id === courseId);
    if (courseData) {
      // Ensure pars and handicaps are arrays
      const course = {
        ...courseData,
        pars: Array.isArray(courseData.pars) ? courseData.pars : JSON.parse(courseData.pars as string),
        handicaps: Array.isArray(courseData.handicaps) ? courseData.handicaps : JSON.parse(courseData.handicaps as string)
      };
      setSelectedCourse(course);
      setTeeColor(course.default_tee || 'Jaune');
    }
  };

  const openEditDialog = () => {
    if (selectedCourse) {
      const pars = Array.isArray(selectedCourse.pars) ? selectedCourse.pars : JSON.parse(selectedCourse.pars as string);
      const handicaps = Array.isArray(selectedCourse.handicaps) ? selectedCourse.handicaps : JSON.parse(selectedCourse.handicaps as string);
      setEditedPars([...pars]);
      setEditedHandicaps([...handicaps]);
      setEditDialogOpen(true);
    }
  };

  const saveEditedCourse = async () => {
    if (!selectedCourse) return;

    try {
      const { error } = await supabase
        .from('courses')
        .update({
          pars: editedPars,
          handicaps: editedHandicaps
        })
        .eq('id', selectedCourse.id);

      if (error) throw error;

      // Update local state
      const updatedCourses = courses.map(course => 
        course.id === selectedCourse.id 
          ? { ...course, pars: editedPars, handicaps: editedHandicaps }
          : course
      );
      setCourses(updatedCourses);
      setSelectedCourse({ ...selectedCourse, pars: editedPars, handicaps: editedHandicaps });
      
      setEditDialogOpen(false);
      toast({
        title: "Succès",
        description: "Parcours mis à jour",
      });
    } catch (error: any) {
      console.error('Error updating course:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le parcours",
        variant: "destructive",
      });
    }
  };

  const handleStart = () => {
    if (!selectedCourse) {
      toast({
        title: "Sélection requise",
        description: "Veuillez sélectionner un parcours",
        variant: "destructive",
      });
      return;
    }

    onStartGame({
      courseId: selectedCourse.id,
      selection,
      teeColor
    });
  };

  const getSelectionHoles = () => {
    if (!selectedCourse) return [];
    
    const pars = Array.isArray(selectedCourse.pars) ? selectedCourse.pars : JSON.parse(selectedCourse.pars as string);
    if (selection === 'front') return pars.slice(0, 9);
    if (selection === 'back') return pars.slice(9, 18);
    return pars;
  };

  const getTotalPar = () => {
    return getSelectionHoles().reduce((sum, par) => sum + par, 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement des parcours...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="mr-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-accent">Configuration de la partie</h1>
            <p className="text-muted-foreground">Choisissez votre parcours et vos préférences</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Course Selection */}
          <Card className="golf-card">
            <CardHeader>
              <CardTitle className="flex items-center text-accent">
                <MapPin className="w-5 h-5 mr-2" />
                Parcours
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="course">Sélectionner un parcours</Label>
                <Select value={selectedCourse?.id || ""} onValueChange={handleCourseChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un parcours" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.name} ({course.holes} trous)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="selection">Sélection de trous</Label>
                <Select value={selection} onValueChange={(value: 'front' | 'back' | 'full') => setSelection(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="front">Front 9 (trous 1-9)</SelectItem>
                    <SelectItem value="back">Back 9 (trous 10-18)</SelectItem>
                    <SelectItem value="full">18 trous complets</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="tee">Départ</Label>
                <Select value={teeColor} onValueChange={setTeeColor}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Rouge">Rouge</SelectItem>
                    <SelectItem value="Jaune">Jaune</SelectItem>
                    <SelectItem value="Blanc">Blanc</SelectItem>
                    <SelectItem value="Bleu">Bleu</SelectItem>
                    <SelectItem value="Noir">Noir</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedCourse && (
                <div className="pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={openEditDialog}
                    className="w-full"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Éditer le parcours
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Preview */}
          <Card className="golf-card">
            <CardHeader>
              <CardTitle className="text-accent">Aperçu de la partie</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedCourse ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Parcours:</span>
                    <span className="font-semibold">{selectedCourse.name}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Sélection:</span>
                    <Badge variant="secondary" className="capitalize">
                      {selection === 'front' ? 'Front 9' : selection === 'back' ? 'Back 9' : '18 trous'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Départ:</span>
                    <Badge variant="outline" className="capitalize">
                      {teeColor}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Nombre de trous:</span>
                    <span className="font-semibold">{getSelectionHoles().length}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Par total:</span>
                    <span className="font-semibold text-primary">{getTotalPar()}</span>
                  </div>

                  <div className="pt-4 border-t">
                    <Button
                      onClick={handleStart}
                      className="w-full golf-gradient hover:golf-glow transition-golf"
                      size="lg"
                    >
                      <Play className="w-5 h-5 mr-2" />
                      Commencer la partie
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Sélectionnez un parcours pour voir l'aperçu
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Edit Course Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Éditer le parcours - {selectedCourse?.name}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Par par trou</h3>
                <div className="grid grid-cols-9 gap-2">
                  {editedPars.map((par, index) => (
                    <div key={index} className="text-center">
                      <Label className="text-xs text-muted-foreground">T{index + 1}</Label>
                      <Input
                        type="number"
                        min="3"
                        max="6"
                        value={par}
                        onChange={(e) => {
                          const newPars = [...editedPars];
                          newPars[index] = parseInt(e.target.value) || 3;
                          setEditedPars(newPars);
                        }}
                        className="text-center h-8"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Handicap par trou</h3>
                <div className="grid grid-cols-9 gap-2">
                  {editedHandicaps.map((handicap, index) => (
                    <div key={index} className="text-center">
                      <Label className="text-xs text-muted-foreground">T{index + 1}</Label>
                      <Input
                        type="number"
                        min="1"
                        max="18"
                        value={handicap}
                        onChange={(e) => {
                          const newHandicaps = [...editedHandicaps];
                          newHandicaps[index] = parseInt(e.target.value) || 1;
                          setEditedHandicaps(newHandicaps);
                        }}
                        className="text-center h-8"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={saveEditedCourse} className="golf-gradient">
                  Sauvegarder
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Setup;