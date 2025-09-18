import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface GPSPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

interface UseGPSReturn {
  currentPosition: GPSPosition | null;
  gpsStatus: 'connected' | 'disconnected' | 'loading';
  accuracy: number;
  getCurrentPosition: () => Promise<GPSPosition | null>;
  calculateDistance: (pos1: GPSPosition, pos2: GPSPosition) => number;
}

export function useGPS(accuracyThreshold: number = 15): UseGPSReturn {
  const [currentPosition, setCurrentPosition] = useState<GPSPosition | null>(null);
  const [gpsStatus, setGpsStatus] = useState<'connected' | 'disconnected' | 'loading'>('loading');
  const [accuracy, setAccuracy] = useState(0);
  const { toast } = useToast();

  const getCurrentPosition = useCallback((): Promise<GPSPosition | null> => {
    return new Promise((resolve) => {
      if (!('geolocation' in navigator)) {
        setGpsStatus('disconnected');
        resolve(null);
        return;
      }

      setGpsStatus('loading');

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const gpsPos: GPSPosition = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: Date.now()
          };

          setCurrentPosition(gpsPos);
          setAccuracy(position.coords.accuracy);
          setGpsStatus(position.coords.accuracy <= accuracyThreshold ? 'connected' : 'disconnected');
          
          if (position.coords.accuracy > accuracyThreshold) {
            toast({
              title: "Précision GPS faible",
              description: `Précision: ${Math.round(position.coords.accuracy)}m. Saisie manuelle recommandée.`,
              variant: "destructive",
            });
          }

          resolve(gpsPos);
        },
        (error) => {
          console.error('GPS Error:', error);
          setGpsStatus('disconnected');
          
          let message = "GPS indisponible";
          if (error.code === error.PERMISSION_DENIED) {
            message = "Autorisation GPS refusée";
          } else if (error.code === error.TIMEOUT) {
            message = "Timeout GPS";
          }
          
          toast({
            title: message,
            description: "Vous pouvez saisir la distance manuellement",
            variant: "destructive",
          });
          
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 30000
        }
      );
    });
  }, [accuracyThreshold, toast]);

  // Haversine formula for calculating distance between two GPS points
  const calculateDistance = useCallback((pos1: GPSPosition, pos2: GPSPosition): number => {
    const R = 6371000; // Earth's radius in meters
    const φ1 = (pos1.latitude * Math.PI) / 180;
    const φ2 = (pos2.latitude * Math.PI) / 180;
    const Δφ = ((pos2.latitude - pos1.latitude) * Math.PI) / 180;
    const Δλ = ((pos2.longitude - pos1.longitude) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }, []);

  return {
    currentPosition,
    gpsStatus,
    accuracy,
    getCurrentPosition,
    calculateDistance
  };
}