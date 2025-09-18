import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Mic, MicOff, Plus, Undo, Flag } from 'lucide-react';

interface Stroke {
  id: string;
  hole_local_idx: number;
  distance?: number;
  club?: string;
  created_at: string;
}

interface GameInterfaceProps {
  currentHole: number;
  totalStrokes: number;
  strokes: Stroke[];
  isRecording: boolean;
  gpsStatus: 'connected' | 'disconnected' | 'loading';
  onAddStroke: () => Promise<void>;
  onUndoStroke: () => Promise<void>;
  onFinishHole: () => Promise<void>;
  onToggleVoiceRecording: () => Promise<void>;
  onSetStrokeClub: (strokeId: string, club: string) => Promise<void>;
  onSetStrokeDistance: (strokeId: string, distance: number) => Promise<void>;
}

export function GameInterface({
  currentHole,
  totalStrokes,
  strokes,
  isRecording,
  onAddStroke,
  onUndoStroke,
  onFinishHole,
  onToggleVoiceRecording,
}: GameInterfaceProps) {
  const currentHoleStrokes = strokes.filter(s => s.hole_local_idx === currentHole);

  return (
    <div className="p-6 space-y-6">
      {/* Hole & Stroke Counter */}
      <Card className="bg-white border-hs-sand/20">
        <CardContent className="pt-6">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-hs-green-900 mb-2">
              Trou {currentHole}
            </h2>
            <p className="text-2xl text-hs-ink">
              {currentHoleStrokes.length} coups sur ce trou
            </p>
            <p className="text-sm text-hs-sand mt-1">
              Total: {totalStrokes} coups
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <Button
          onClick={onAddStroke}
          className="bg-hs-green-100 hover:bg-hs-green-200 text-white py-6 text-lg"
        >
          <Plus className="w-5 h-5 mr-2" />
          +1
        </Button>
        <Button
          onClick={onUndoStroke}
          variant="outline"
          className="border-hs-sand text-hs-ink hover:bg-hs-sand/10 py-6 text-lg"
          disabled={currentHoleStrokes.length === 0}
        >
          <Undo className="w-5 h-5 mr-2" />
          Undo
        </Button>
      </div>

      <Button
        onClick={onFinishHole}
        variant="secondary"
        className="w-full bg-hs-green-200 hover:bg-hs-green-900 text-white py-6 text-lg"
        disabled={currentHoleStrokes.length === 0}
      >
        <Flag className="w-5 h-5 mr-2" />
        Terminer le trou
      </Button>

      {/* Voice Recording */}
      <Card className="bg-white border-hs-sand/20">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-hs-green-900">Commandes vocales</span>
              {isRecording && (
                <p className="text-xs text-hs-sand mt-1">
                  Dites "play", "finish" ou "undo"...
                </p>
              )}
            </div>
            <Button
              onClick={onToggleVoiceRecording}
              variant={isRecording ? "destructive" : "outline"}
              size="sm"
              className={`${isRecording ? 'animate-pulse bg-red-500 hover:bg-red-600' : 'border-hs-green-100 text-hs-green-100 hover:bg-hs-green-100 hover:text-white'}`}
            >
              {isRecording ? (
                <>
                  <MicOff className="w-4 h-4 mr-2" />
                  Arrêter
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4 mr-2" />
                  Écouter
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}