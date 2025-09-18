import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TranscriptionResult {
  text: string;
  action: string;
  confidence?: number;
}

interface UseVoiceRecordingReturn {
  isRecording: boolean;
  isProcessing: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<TranscriptionResult | null>;
}

export function useVoiceRecording(): UseVoiceRecordingReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });

      streamRef.current = stream;
      chunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(1000); // Collect data every second
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      
      toast({
        title: "enregistrement démarré",
        description: "Parlez maintenant...",
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'accéder au microphone",
        variant: "destructive",
      });
    }
  }, [toast]);

  const stopRecording = useCallback((): Promise<TranscriptionResult | null> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current || !isRecording) {
        resolve(null);
        return;
      }

      setIsProcessing(true);
      setIsRecording(false);

      mediaRecorderRef.current.onstop = async () => {
        try {
          const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm;codecs=opus' });
          
          // Convert to base64 for API transmission
          const reader = new FileReader();
          reader.onloadend = async () => {
            try {
              const base64Audio = (reader.result as string).split(',')[1];

              const { data, error } = await supabase.functions.invoke('voice-to-text', {
                body: { audio: base64Audio }
              });

              if (error) throw error;

              const result: TranscriptionResult = {
                text: data.text || '',
                action: data.action || 'message',
                confidence: data.confidence
              };

              toast({
                title: "Transcription terminée",
                description: result.text ? `"${result.text}"` : "Aucun texte détecté",
              });

              resolve(result);
            } catch (error) {
              console.error('Error processing voice:', error);
              toast({
                title: "Erreur",
                description: "Impossible de traiter l'enregistrement vocal",
                variant: "destructive",
              });
              resolve(null);
            } finally {
              setIsProcessing(false);
            }
          };

          reader.readAsDataURL(audioBlob);
        } catch (error) {
          console.error('Error stopping recording:', error);
          toast({
            title: "Erreur",
            description: "Impossible de finaliser l'enregistrement",
            variant: "destructive",
          });
          setIsProcessing(false);
          resolve(null);
        }
      };

      mediaRecorderRef.current.stop();
      
      // Stop all tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      // Clean up
      chunksRef.current = [];
      mediaRecorderRef.current = null;
    });
  }, [isRecording, toast]);

  return {
    isRecording,
    isProcessing,
    startRecording,
    stopRecording,
  };
}