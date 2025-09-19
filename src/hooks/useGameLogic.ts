import { useState, useCallback, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useGPS } from "./useGPS";
import { useVoiceRecording } from "./useVoiceRecording";

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

// Payload used when inserting a new stroke into the DB
interface NewStrokeInsert {
  round_id: string;
  hole_local_idx: number;
  distance?: number;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  club?: string;
}

interface FinalStats {
  totalStrokes: number;
  parTotal: number;
  holesPlayed: number;
  birdies: number;
  eagles: number;
  bogeys: number;
  doubleBogeys: number;
  tripleBogeyPlus: number;
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
  gpsStatus: "connected" | "disconnected" | "loading";
  addStroke: () => Promise<void>;
  undoStroke: () => Promise<void>;
  finishHole: () => Promise<void>;
  toggleVoiceRecording: () => Promise<void>;
  setStrokeClub: (strokeId: string, club: string) => Promise<void>;
  setStrokeDistance: (strokeId: string, distance: number) => Promise<void>;
}

export function useGameLogic({
  roundId,
  accuracyThreshold = 15,
}: UseGameLogicProps): UseGameLogicReturn {
  const [currentHole, setCurrentHole] = useState(1);
  const [totalStrokes, setTotalStrokes] = useState(0);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  interface Position {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: number;
  }

  const [lastPosition, setLastPosition] = useState<Position | null>(null);
  const { toast } = useToast();

  // Default course pars (memoized so the reference is stable for hook deps)
  const coursePars = useMemo(
    () => [4, 4, 3, 4, 5, 4, 3, 4, 4, 4, 4, 3, 5, 4, 4, 3, 4, 5],
    []
  );
  // (optional) default handicaps if needed elsewhere (also memoized)
  const courseHcp = useMemo(
    () => [10, 8, 16, 2, 4, 12, 18, 6, 14, 1, 7, 17, 3, 9, 11, 15, 5, 13],
    []
  );

  const { getCurrentPosition, gpsStatus, calculateDistance } =
    useGPS(accuracyThreshold);
  const { isRecording, startRecording, stopRecording } = useVoiceRecording();

  // Ajouter une fonction de chargement des états depuis Supabase
  const loadGameState = useCallback(async () => {
    try {
      // Charger les strokes existants pour cette partie
      const { data: existingStrokes, error: strokesError } = await supabase
        .from("strokes")
        .select("*")
        .eq("round_id", roundId)
        .order("created_at", { ascending: true });

      if (strokesError) throw strokesError;

      // Charger les informations de la partie
      const { data: roundData, error: roundError } = await supabase
        .from("rounds")
        .select("*")
        .eq("id", roundId)
        .single();

      if (roundError) throw roundError;

      // Calculer l'état actuel
      const strokesByHole = existingStrokes.reduce((acc, stroke) => {
        if (!acc[stroke.hole_local_idx]) acc[stroke.hole_local_idx] = [];
        acc[stroke.hole_local_idx].push(stroke);
        return acc;
      }, {});

      // Déterminer le trou actuel (essayer de passer au trou suivant si le dernier trou est complété)
      const holesPlayed = Object.keys(strokesByHole).map(Number);
      const currentHole = holesPlayed.length > 0 ? Math.max(...holesPlayed) : 1;
      const lastHoleStrokes = strokesByHole[currentHole];

      // Si le dernier trou a des coups, on suppose qu'il a été joué et on passe au suivant.
      // Sinon, rester sur le trou courant.
      const actualCurrentHole =
        lastHoleStrokes && lastHoleStrokes.length > 0
          ? Math.min(18, currentHole + 1)
          : currentHole;

      console.debug('loadGameState: holesPlayed=', holesPlayed, 'currentHole=', currentHole, 'actualCurrentHole=', actualCurrentHole);

      // Mettre à jour les états
      setStrokes(existingStrokes);
      setTotalStrokes(existingStrokes.length);
      setCurrentHole(actualCurrentHole);

      // Récupérer la dernière position GPS si disponible
      const lastStrokeWithGPS = existingStrokes
        .filter((s) => s.latitude && s.longitude)
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];

      if (lastStrokeWithGPS) {
        setLastPosition({
          latitude: lastStrokeWithGPS.latitude,
          longitude: lastStrokeWithGPS.longitude,
          accuracy: lastStrokeWithGPS.accuracy || 0,
          timestamp: new Date(lastStrokeWithGPS.created_at).getTime(),
        });
      }
    } catch (error) {
      console.error("Error loading game state:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger l'état de la partie",
        variant: "destructive",
      });
    }
  }, [roundId, toast]);

  // Ajouter un useEffect pour charger l'état au montage
  useEffect(() => {
    if (roundId) {
      loadGameState();
    }
  }, [roundId, loadGameState]);

  const addStroke = useCallback(async () => {
    try {
      const currentPosition = await getCurrentPosition();
      let distance: number | null = null;
      let strokeData: NewStrokeInsert = {
        round_id: roundId,
        hole_local_idx: currentHole,
      };

      // Calculate distance if GPS is available and accurate
      if (
        currentPosition &&
        lastPosition &&
        currentPosition.accuracy <= accuracyThreshold
      ) {
        distance = Math.round(calculateDistance(lastPosition, currentPosition));
        strokeData = {
          ...strokeData,
          distance,
          latitude: currentPosition.latitude,
          longitude: currentPosition.longitude,
          accuracy: currentPosition.accuracy,
        };
      } else if (currentPosition) {
        strokeData = {
          ...strokeData,
          latitude: currentPosition.latitude,
          longitude: currentPosition.longitude,
          accuracy: currentPosition.accuracy,
        };
      }

      const { data, error } = await supabase
        .from("strokes")
        .insert(strokeData)
        .select()
        .single();

      if (error) throw error;

      setStrokes((prev) => [...prev, data]);
      setTotalStrokes((prev) => prev + 1);

      if (currentPosition) {
        setLastPosition(currentPosition);
      }

      // Show distance if available
      const distanceText = distance ? ` (${distance}m)` : "";
      toast({
        title: "+1 enregistré",
        description: `Coup ajouté au trou ${currentHole}${distanceText}`,
      });
    } catch (error) {
      console.error("Error adding stroke:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter le coup",
        variant: "destructive",
      });
    }
  }, [
    roundId,
    currentHole,
    getCurrentPosition,
    lastPosition,
    calculateDistance,
    accuracyThreshold,
    toast,
  ]);

  const undoStroke = useCallback(async () => {
    try {
      const strokesOnCurrentHole = strokes.filter(
        (s) => s.hole_local_idx === currentHole
      );

      if (strokesOnCurrentHole.length === 0) {
        // Inter-hole undo: go back to previous hole if possible
        if (currentHole > 1) {
          const previousHole = currentHole - 1;
          const previousHoleStrokes = strokes.filter(
            (s) => s.hole_local_idx === previousHole
          );

          if (previousHoleStrokes.length > 0) {
            const lastStroke =
              previousHoleStrokes[previousHoleStrokes.length - 1];

            const { error } = await supabase
              .from("strokes")
              .delete()
              .eq("id", lastStroke.id);

            if (error) throw error;

            setStrokes((prev) => prev.filter((s) => s.id !== lastStroke.id));
            setCurrentHole(previousHole);
            setTotalStrokes((prev) => prev - 1);

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
        .from("strokes")
        .delete()
        .eq("id", lastStroke.id);

      if (error) throw error;

      setStrokes((prev) => prev.filter((s) => s.id !== lastStroke.id));
      setTotalStrokes((prev) => prev - 1);

      toast({
        title: "Coup annulé",
        description: "Dernier coup supprimé",
      });
    } catch (error) {
      console.error("Error undoing stroke:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'annuler le coup",
        variant: "destructive",
      });
    }
  }, [strokes, currentHole, toast]);

  const finishHole = useCallback(async () => {
    if (currentHole < 18) {
      setCurrentHole((prev) => prev + 1);
      toast({
        title: "Trou terminé",
        description: `Passage au trou ${currentHole + 1}`,
      });
    } else {
      // Terminer la partie et calculer les statistiques finales
      try {
        const totalStrokes = strokes.length;
        const finalStats = calculateFinalStats(strokes, coursePars);

        const { error } = await supabase
          .from("rounds")
          .update({
            status: "completed",
            ended_at: new Date().toISOString(),
            total_strokes: totalStrokes,
          })
          .eq("id", roundId);

        if (error) throw error;

        // Créer un enregistrement de statistiques (optionnel - nouvelle table)
        await saveGameStatistics(roundId, finalStats);

        toast({
          title: "🏌️ Partie terminée !",
          description: `Félicitations ! Score final: ${totalStrokes} coups`,
          duration: 5000,
        });

        // Rediriger vers les statistiques ou le dashboard
        // Ceci devrait être géré par le composant parent
      } catch (error) {
        console.error("Error finishing round:", error);
        toast({
          title: "Erreur",
          description: "Impossible de terminer la partie",
          variant: "destructive",
        });
      }
    }
  }, [currentHole, roundId, strokes, toast, coursePars]);

  // Fonction helper pour calculer les statistiques finales
  const calculateFinalStats = (strokes: Stroke[], pars: number[]) => {
    const strokesByHole = strokes.reduce((acc, stroke) => {
      if (!acc[stroke.hole_local_idx]) acc[stroke.hole_local_idx] = [];
      acc[stroke.hole_local_idx].push(stroke);
      return acc;
    }, {} as Record<number, Stroke[]>);

    const stats = {
      totalStrokes: strokes.length,
      parTotal: pars.reduce((a, b) => a + b, 0),
      holesPlayed: Object.keys(strokesByHole).length,
      birdies: 0,
      eagles: 0,
      bogeys: 0,
      doubleBogeys: 0,
      tripleBogeyPlus: 0,
    };

    // Calculer les statistiques par trou
    Object.keys(strokesByHole).forEach((holeStr) => {
      const hole = parseInt(holeStr);
      const holeStrokes = strokesByHole[hole].length;
      const holePar = pars[hole - 1];
      const diff = holeStrokes - holePar;

      if (diff <= -2) stats.eagles++;
      else if (diff === -1) stats.birdies++;
      else if (diff === 1) stats.bogeys++;
      else if (diff === 2) stats.doubleBogeys++;
      else if (diff >= 3) stats.tripleBogeyPlus++;
    });

    return stats;
  };

  // Fonction pour sauvegarder les statistiques (si tu veux créer une table stats)
  const saveGameStatistics = async (roundId: string, stats: FinalStats) => {
    // Optionnel: créer une table 'game_statistics' pour des stats détaillées
    // Sinon, les stats sont déjà dans la table rounds
  };

  const toggleVoiceRecording = useCallback(async () => {
    if (isRecording) {
      const result = await stopRecording();
      if (result?.action) {
        switch (result.action) {
          case "play":
            await addStroke();
            break;
          case "finish":
            await finishHole();
            break;
          case "undo":
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
  }, [
    isRecording,
    stopRecording,
    startRecording,
    addStroke,
    finishHole,
    undoStroke,
    toast,
  ]);

  const setStrokeClub = useCallback(
    async (strokeId: string, club: string) => {
      try {
        const { error } = await supabase
          .from("strokes")
          .update({ club })
          .eq("id", strokeId);

        if (error) throw error;

        setStrokes((prev) =>
          prev.map((s) => (s.id === strokeId ? { ...s, club } : s))
        );
      } catch (error) {
        console.error("Error updating club:", error);
        toast({
          title: "Erreur",
          description: "Impossible de mettre à jour le club",
          variant: "destructive",
        });
      }
    },
    [toast]
  );

  const setStrokeDistance = useCallback(
    async (strokeId: string, distance: number) => {
      try {
        const { error } = await supabase
          .from("strokes")
          .update({ distance })
          .eq("id", strokeId);

        if (error) throw error;

        setStrokes((prev) =>
          prev.map((s) => (s.id === strokeId ? { ...s, distance } : s))
        );
      } catch (error) {
        console.error("Error updating distance:", error);
        toast({
          title: "Erreur",
          description: "Impossible de mettre à jour la distance",
          variant: "destructive",
        });
      }
    },
    [toast]
  );

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
    setStrokeDistance,
  };
}
