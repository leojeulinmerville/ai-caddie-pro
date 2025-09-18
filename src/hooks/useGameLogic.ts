import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useGPS } from './useGPS';
import { useVoiceRecording } from './useVoiceRecording';

interface Stroke {
  id: string;
  hole_local_idx: number;
  distance?: number;
  club?: string;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  created_at: string;
}

interface UseGameLogicProps {
  roundId: string;
  accuracyThreshold?: number;
}

interface UseGameLogicReturn {
  currentHole: number;
  totalStrokes: number;
  strokes: Stroke[];
  isRecording: boolean;
  gpsStatus: 'connected' | 'disconnected' | 'loading';
  addStroke: () => Promise<void>;
  undoStroke: () => Promise<void>;
  finishHole: () => Promise<void>;
  toggleVoiceRecording: () => Promise<void>;
  setStrokeClub: (strokeId: string, club: string) => Promise<void>;
  setStrokeDistance: (strokeId: string, distance: number) => Promise<void>;
}

export function useGameLogic({ roundId, accuracyThreshold = 15 }: UseGameLogicProps): UseGameLogicReturn {
  const [currentHole, setCurrentHole] = useState(1);
  const [totalStrokes, setTotalStrokes] = useState(0);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [lastPosition, setLastPosition] = useState<any>(null);
  const { toast } = useToast();
  
  const { getCurrentPosition, gpsStatus, calculateDistance } = useGPS(accuracyThreshold);
  const { isRecording, startRecording, stopRecording } = useVoiceRecording();

  const addStroke = useCallback(async () => {
    try {
      const currentPosition = await getCurrentPosition();
      let distance = null;
      let strokeData: any = {
        round_id: roundId,
        hole_local_idx: currentHole
      };

      // Calculate distance if GPS is available and accurate
      if (currentPosition && lastPosition && currentPosition.accuracy <= accuracyThreshold) {
        distance = Math.round(calculateDistance(lastPosition, currentPosition));
        strokeData = {
          ...strokeData,
          distance,
          latitude: currentPosition.latitude,
          longitude: currentPosition.longitude,
          accuracy: currentPosition.accuracy
        };
      } else if (currentPosition) {
        strokeData = {
          ...strokeData,
          latitude: currentPosition.latitude,
          longitude: currentPosition.longitude,
          accuracy: currentPosition.accuracy
        };
      }

      const { data, error } = await supabase
        .from('strokes')
        .insert(strokeData)
        .select()
        .single();

      if (error) throw error;

      setStrokes(prev => [...prev, data]);
      setTotalStrokes(prev => prev + 1);
      
      if (currentPosition) {
        setLastPosition(currentPosition);
      }

      // Show distance if available
      const distanceText = distance ? ` (${distance}m)` : '';
      toast({
        title: "+1 enregistré",
        description: `Coup ajouté au trou ${currentHole}${distanceText}`,
      });
    } catch (error) {
      console.error('Error adding stroke:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter le coup",
        variant: "destructive",
      });
    }
  }, [roundId, currentHole, getCurrentPosition, lastPosition, calculateDistance, accuracyThreshold, toast]);

  const undoStroke = useCallback(async () => {
    try {
      const strokesOnCurrentHole = strokes.filter(s => s.hole_local_idx === currentHole);
      
      if (strokesOnCurrentHole.length === 0) {
        // Inter-hole undo: go back to previous hole if possible
        if (currentHole > 1) {
          const previousHole = currentHole - 1;
          const previousHoleStrokes = strokes.filter(s => s.hole_local_idx === previousHole);
          
          if (previousHoleStrokes.length > 0) {
            const lastStroke = previousHoleStrokes[previousHoleStrokes.length - 1];
            
            const { error } = await supabase
              .from('strokes')
              .delete()
              .eq('id', lastStroke.id);

            if (error) throw error;

            setStrokes(prev => prev.filter(s => s.id !== lastStroke.id));
            setCurrentHole(previousHole);
            setTotalStrokes(prev => prev - 1);

            toast({
              title: "Coup annulé",
              description: `Retour au trou ${previousHole}`,
            });
          }
        }
        return;
      }

      // Normal undo: remove last stroke on current hole
      const lastStroke = strokesOnCurrentHole[strokesOnCurrentHole.length - 1];
      
      const { error } = await supabase
        .from('strokes')
        .delete()
        .eq('id', lastStroke.id);

      if (error) throw error;

      setStrokes(prev => prev.filter(s => s.id !== lastStroke.id));
      setTotalStrokes(prev => prev - 1);

      toast({
        title: "Coup annulé",
        description: "Dernier coup supprimé",
      });
    } catch (error) {
      console.error('Error undoing stroke:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'annuler le coup",
        variant: "destructive",
      });
    }
  }, [strokes, currentHole, toast]);

  const finishHole = useCallback(async () => {
    if (currentHole < 18) {
      setCurrentHole(prev => prev + 1);
      toast({
        title: "Trou terminé",
        description: `Passage au trou ${currentHole + 1}`,
      });
    } else {
      // Update round status to completed
      try {
        const { error } = await supabase
          .from('rounds')
          .update({ 
            status: 'completed',
            ended_at: new Date().toISOString()
          })
          .eq('id', roundId);

        if (error) throw error;

        toast({
          title: "Partie terminée !",
          description: "Félicitations pour votre partie",
        });
      } catch (error) {
        console.error('Error finishing round:', error);
        toast({
          title: "Erreur",
          description: "Impossible de terminer la partie",
          variant: "destructive",
        });
      }
    }
  }, [currentHole, roundId, toast]);

  const toggleVoiceRecording = useCallback(async () => {
    if (isRecording) {
      const result = await stopRecording();
      if (result?.action) {
        switch (result.action) {
          case 'play':
            await addStroke();
            break;
          case 'finish':
            await finishHole();
            break;
          case 'undo':
            await undoStroke();
            break;
          default:
            // Send to coach if no specific action
            toast({
              title: "Message reçu",
              description: `"${result.text}" - Ouvrez le coach pour une réponse`,
            });
        }
      }
    } else {
      await startRecording();
      toast({
        title: "Écoute activée",
        description: "Dites 'play', 'finish' ou 'undo'",
      });
    }
  }, [isRecording, stopRecording, startRecording, addStroke, finishHole, undoStroke, toast]);

  const setStrokeClub = useCallback(async (strokeId: string, club: string) => {
    try {
      const { error } = await supabase
        .from('strokes')
        .update({ club })
        .eq('id', strokeId);

      if (error) throw error;

      setStrokes(prev => prev.map(s => 
        s.id === strokeId ? { ...s, club } : s
      ));
    } catch (error) {
      console.error('Error updating club:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le club",
        variant: "destructive",
      });
    }
  }, [toast]);

  const setStrokeDistance = useCallback(async (strokeId: string, distance: number) => {
    try {
      const { error } = await supabase
        .from('strokes')
        .update({ distance })
        .eq('id', strokeId);

      if (error) throw error;

      setStrokes(prev => prev.map(s => 
        s.id === strokeId ? { ...s, distance } : s
      ));
    } catch (error) {
      console.error('Error updating distance:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la distance",
        variant: "destructive",
      });
    }
  }, [toast]);

  return {
    currentHole,
    totalStrokes,
    strokes,
    isRecording,
    gpsStatus,
    addStroke,
    undoStroke,
    finishHole,
    toggleVoiceRecording,
    setStrokeClub,
    setStrokeDistance
  };
}