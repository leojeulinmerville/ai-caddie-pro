import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Flag, Edit3, MapPin, Clock } from "lucide-react";
import { useState, useEffect } from "react";

interface Stroke {
  id: string;
  distance?: number;
  club?: string;
  timestamp: Date;
  lat?: number;
  lon?: number;
}

interface PlayerData {
  firstName: string;
  lastName: string;
  handicap: number;
  preferredUnits: "m" | "yd";
  language: "fr" | "en";
}

interface ScorecardProps {
  strokes: Record<number, Stroke[]>;
  currentHole: number;
  playerProfile: PlayerData;
}

export function Scorecard({ strokes, currentHole, playerProfile }: ScorecardProps) {
  const [editingHole, setEditingHole] = useState<number | null>(null);
  
  // Standard course data (par 72)
  const coursePars = [4, 4, 3, 4, 5, 4, 3, 4, 4, 4, 4, 3, 5, 4, 4, 3, 4, 5];
  const courseHcp = [10, 8, 16, 2, 4, 12, 18, 6, 14, 1, 7, 17, 3, 9, 11, 15, 5, 13];

  const getHoleScore = (hole: number) => strokes[hole]?.length || 0;
  
  const getFrontNineTotal = () => 
    Array.from({length: 9}, (_, i) => getHoleScore(i + 1)).reduce((a, b) => a + b, 0);
  
  const getBackNineTotal = () => 
    Array.from({length: 9}, (_, i) => getHoleScore(i + 10)).reduce((a, b) => a + b, 0);
  
  const getTotalScore = () => getFrontNineTotal() + getBackNineTotal();
  const getTotalPar = () => coursePars.reduce((a, b) => a + b, 0);

  const getScoreColor = (score: number, par: number) => {
    const diff = score - par;
    if (diff <= -2) return "text-blue-600 font-bold"; // Aigle ou mieux
    if (diff === -1) return "text-green-600 font-bold"; // Birdie
    if (diff === 0) return "text-foreground font-semibold"; // Par
    if (diff === 1) return "text-yellow-600 font-semibold"; // Bogey
    if (diff === 2) return "text-orange-600 font-semibold"; // Double bogey
    return "text-red-600 font-bold"; // Triple bogey ou plus
  };

  const renderHoleRow = (holes: number[], label: string, isBack?: boolean) => (
    <TableRow>
      <TableCell className="font-semibold">{label}</TableCell>
      {holes.map(hole => {
        const score = getHoleScore(hole);
        const par = coursePars[hole - 1];
        const hcp = courseHcp[hole - 1];
        const isPlayed = score > 0;
        const isCurrent = hole === currentHole;
        
        return (
          <TableCell key={hole} className="text-center p-1">
            <div className={`min-h-[40px] flex items-center justify-center rounded-md ${
              isCurrent ? 'bg-primary/10 border-2 border-primary' : 
              isPlayed ? 'bg-muted/50' : 'bg-background'
            }`}>
              {editingHole === hole ? (
                <Input 
                  type="number"
                  min="1"
                  max="15"
                  defaultValue={score || ""}
                  className="w-12 h-8 text-center p-0 border-0"
                  onBlur={() => setEditingHole(null)}
                  onKeyDown={(e) => e.key === 'Enter' && setEditingHole(null)}
                />
              ) : (
                <div className="text-center">
                  <div className={`text-lg ${isPlayed ? getScoreColor(score, par) : 'text-muted-foreground'}`}>
                    {isPlayed ? score : '-'}
                  </div>
                  {isCurrent && (
                    <Flag className="w-3 h-3 text-primary mx-auto mt-1" />
                  )}
                </div>
              )}
            </div>
          </TableCell>
        );
      })}
      <TableCell className="text-center font-semibold">
        {isBack ? getBackNineTotal() || '-' : getFrontNineTotal() || '-'}
      </TableCell>
    </TableRow>
  );

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="golf-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{getTotalScore()}</div>
            <div className="text-sm text-muted-foreground">Total Coups</div>
          </CardContent>
        </Card>
        
        <Card className="golf-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">
              {getTotalScore() > 0 ? (getTotalScore() - getTotalPar() > 0 ? '+' : '') + (getTotalScore() - getTotalPar()) : '-'}
            </div>
            <div className="text-sm text-muted-foreground">vs Par</div>
          </CardContent>
        </Card>
        
        <Card className="golf-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{currentHole - 1}</div>
            <div className="text-sm text-muted-foreground">Trous Joués</div>
          </CardContent>
        </Card>
        
        <Card className="golf-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">
              {getTotalScore() > 0 ? (getTotalScore() / Math.max(1, currentHole - 1)).toFixed(1) : '-'}
            </div>
            <div className="text-sm text-muted-foreground">Moy./Trou</div>
          </CardContent>
        </Card>
      </div>

      {/* Scorecard Table */}
      <Card className="golf-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flag className="w-5 h-5" />
            Carte de Score
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table className="text-xs">
            <TableHeader>
              <TableRow>
                <TableHead className="w-20"></TableHead>
                {Array.from({length: 9}, (_, i) => (
                  <TableHead key={i + 1} className="text-center w-12 p-1">
                    {i + 1}
                  </TableHead>
                ))}
                <TableHead className="text-center w-16 font-bold">OUT</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="bg-muted/30">
                <TableCell className="font-medium text-xs">PAR</TableCell>
                {coursePars.slice(0, 9).map((par, i) => (
                  <TableCell key={i} className="text-center font-semibold">{par}</TableCell>
                ))}
                <TableCell className="text-center font-bold">
                  {coursePars.slice(0, 9).reduce((a, b) => a + b, 0)}
                </TableCell>
              </TableRow>
              
              <TableRow className="bg-muted/20">
                <TableCell className="font-medium text-xs">HCP</TableCell>
                {courseHcp.slice(0, 9).map((hcp, i) => (
                  <TableCell key={i} className="text-center text-xs">{hcp}</TableCell>
                ))}
                <TableCell className="text-center">-</TableCell>
              </TableRow>
              
              {renderHoleRow(Array.from({length: 9}, (_, i) => i + 1), "SCORE")}
            </TableBody>
          </Table>

          {/* Back Nine */}
          <Table className="text-xs mt-6">
            <TableHeader>
              <TableRow>
                <TableHead className="w-20"></TableHead>
                {Array.from({length: 9}, (_, i) => (
                  <TableHead key={i + 10} className="text-center w-12 p-1">
                    {i + 10}
                  </TableHead>
                ))}
                <TableHead className="text-center w-16 font-bold">IN</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="bg-muted/30">
                <TableCell className="font-medium text-xs">PAR</TableCell>
                {coursePars.slice(9).map((par, i) => (
                  <TableCell key={i + 9} className="text-center font-semibold">{par}</TableCell>
                ))}
                <TableCell className="text-center font-bold">
                  {coursePars.slice(9).reduce((a, b) => a + b, 0)}
                </TableCell>
              </TableRow>
              
              <TableRow className="bg-muted/20">
                <TableCell className="font-medium text-xs">HCP</TableCell>
                {courseHcp.slice(9).map((hcp, i) => (
                  <TableCell key={i + 9} className="text-center text-xs">{hcp}</TableCell>
                ))}
                <TableCell className="text-center">-</TableCell>
              </TableRow>
              
              {renderHoleRow(Array.from({length: 9}, (_, i) => i + 10), "SCORE", true)}
            </TableBody>
          </Table>

          {/* Totals */}
          <div className="mt-6 grid grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
            <div className="text-center">
              <div className="text-lg font-bold">{getFrontNineTotal()}</div>
              <div className="text-xs text-muted-foreground">Aller (OUT)</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold">{getBackNineTotal()}</div>
              <div className="text-xs text-muted-foreground">Retour (IN)</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-primary">{getTotalScore()}</div>
              <div className="text-xs text-muted-foreground">TOTAL</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stroke Details for Current Hole */}
      {strokes[currentHole] && strokes[currentHole].length > 0 && (
        <Card className="golf-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Détail Trou {currentHole}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {strokes[currentHole].map((stroke, index) => (
                <div key={stroke.id} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">Coup {index + 1}</Badge>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {stroke.timestamp.toLocaleTimeString('fr-FR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {stroke.distance && (
                      <span className="text-sm font-medium">
                        {stroke.distance}{playerProfile.preferredUnits}
                      </span>
                    )}
                    {stroke.club && (
                      <Badge variant="secondary">{stroke.club}</Badge>
                    )}
                    <Button size="icon" variant="ghost" className="w-6 h-6">
                      <Edit3 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}