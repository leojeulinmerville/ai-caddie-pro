import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, User, Target, Globe, Ruler } from "lucide-react";

interface PlayerData {
  firstName: string;
  lastName: string;
  handicap: number;
  preferredUnits: "m" | "yd";
  language: "fr" | "en";
}

interface PlayerProfileProps {
  onComplete: (data: PlayerData) => void;
  onBack: () => void;
}

export function PlayerProfile({ onComplete, onBack }: PlayerProfileProps) {
  const [formData, setFormData] = useState<PlayerData>({
    firstName: "",
    lastName: "",
    handicap: 18,
    preferredUnits: "m",
    language: "fr"
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete(formData);
  };

  const handleInputChange = (field: keyof PlayerData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onBack}
            className="hover:bg-accent/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Configuration du profil</h1>
            <p className="text-muted-foreground">
              Personnalisez votre expérience HighSwing.ai
            </p>
          </div>
        </div>

        <Card className="golf-card">
          <CardHeader className="text-center pb-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Mon Profil Golfeur</CardTitle>
            <CardDescription>
              Ces informations nous aident à personnaliser vos conseils
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <User className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold">Informations personnelles</h3>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Prénom</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                      placeholder="John"
                      required
                      className="transition-golf"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Nom</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
                      placeholder="Doe"
                      required
                      className="transition-golf"
                    />
                  </div>
                </div>
              </div>

              {/* Golf Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold">Informations golf</h3>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="handicap">Index de handicap</Label>
                  <div className="flex items-center gap-4">
                    <Input
                      id="handicap"
                      type="number"
                      min="0"
                      max="54"
                      step="0.1"
                      value={formData.handicap}
                      onChange={(e) => handleInputChange("handicap", parseFloat(e.target.value))}
                      className="w-32 transition-golf"
                    />
                    <div className="flex-1">
                      <Badge variant="secondary" className="text-xs">
                        {formData.handicap <= 5 ? "Expert" : 
                         formData.handicap <= 15 ? "Intermédiaire" : 
                         formData.handicap <= 25 ? "Débutant" : "Novice"}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Votre index officiel (0-54). Si vous n'en avez pas, estimez votre niveau.
                  </p>
                </div>
              </div>

              {/* Preferences */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <Globe className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold">Préférences</h3>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="language">Langue</Label>
                    <Select
                      value={formData.language}
                      onValueChange={(value: "fr" | "en") => handleInputChange("language", value)}
                    >
                      <SelectTrigger className="transition-golf">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fr">🇫🇷 Français</SelectItem>
                        <SelectItem value="en">🇬🇧 English</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="units">Unités de distance</Label>
                    <Select
                      value={formData.preferredUnits}
                      onValueChange={(value: "m" | "yd") => handleInputChange("preferredUnits", value)}
                    >
                      <SelectTrigger className="transition-golf">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="m">
                          <div className="flex items-center gap-2">
                            <Ruler className="w-4 h-4" />
                            Mètres (m)
                          </div>
                        </SelectItem>
                        <SelectItem value="yd">
                          <div className="flex items-center gap-2">
                            <Ruler className="w-4 h-4" />
                            Yards (yd)
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full golf-gradient hover:golf-glow transition-golf text-lg py-6"
              >
                Sauvegarder et commencer à jouer
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}