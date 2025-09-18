import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ArrowLeft, 
  Send, 
  Mic, 
  Bot, 
  User, 
  Target, 
  BookOpen,
  Loader2,
  Zap
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface User {
  id: string;
  email: string;
  displayName: string;
}

interface PlayerData {
  firstName: string;
  lastName: string;
  handicap: number;
  preferredUnits: "m" | "yd";
  language: "fr" | "en";
}

interface Message {
  id: string;
  type: 'user' | 'coach' | 'rules';
  content: string;
  timestamp: Date;
}

interface CoachChatProps {
  user: User | null;
  playerProfile: PlayerData | null;
  onBack: () => void;
}

export function CoachChat({ user, playerProfile, onBack }: CoachChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("coach");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Welcome message
    if (messages.length === 0) {
      const welcomeMessage: Message = {
        id: 'welcome',
        type: 'coach',
        content: playerProfile 
          ? `Bonjour ${playerProfile.firstName} ! Je suis votre coach IA personnel. Avec votre handicap de ${playerProfile.handicap}, je peux vous donner des conseils adaptés à votre niveau. Que puis-je faire pour vous aider aujourd'hui ?`
          : "Bonjour ! Je suis votre coach IA personnel. Posez-moi vos questions sur la stratégie, le choix des clubs, ou les techniques de golf !",
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, [playerProfile, messages.length]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: `user_${Date.now()}`,
      type: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      // Simulate AI response
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
      
      const aiResponse = generateAIResponse(input, activeTab, playerProfile);
      
      const aiMessage: Message = {
        id: `ai_${Date.now()}`,
        type: activeTab as 'coach' | 'rules',
        content: aiResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de contacter le coach IA. Réessayez plus tard.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateAIResponse = (question: string, mode: string, profile: PlayerData | null): string => {
    const lowerQuestion = question.toLowerCase();
    
    if (mode === 'coach') {
      // Coach responses
      if (lowerQuestion.includes('club') || lowerQuestion.includes('fer') || lowerQuestion.includes('driver') || lowerQuestion.includes('wedge')) {
        return `Excellente question sur le choix de club ! ${profile ? `Avec votre handicap de ${profile.handicap}, ` : ''}Pour bien choisir votre club, considérez :

🎯 **Distance au drapeau** : Mesurez précisément la distance restante
🌬️ **Conditions** : Vent, pente, lie de balle
📏 **Votre distance moyenne** : Prenez un club avec lequel vous êtes à l'aise

${profile && profile.handicap > 15 ? 'Conseil : Privilégiez la régularité plutôt que la distance. Prenez souvent un club de plus pour assurer le coup.' : profile && profile.handicap < 10 ? 'Avec votre niveau, vous pouvez être plus agressif dans vos choix de clubs selon les conditions.' : ''}

Quelle est la situation exacte de votre coup ?`;
      }
      
      if (lowerQuestion.includes('putting') || lowerQuestion.includes('putt') || lowerQuestion.includes('green')) {
        return `Le putting est crucial ! Voici mes conseils :

🏌️ **Technique** :
- Gardez la tête stable et les yeux au-dessus de la balle
- Mouvement pendulaire des épaules
- Accélération constante à l'impact

📏 **Lecture du green** :
- Observez la pente générale
- Cherchez la cassure principale
- Attention au grain de l'herbe

${profile && profile.handicap > 20 ? '💡 Focus : Travaillez d\'abord la distance plutôt que la précision. Visez le centre du trou sur 3m et moins.' : ''}

Sur quel aspect du putting voulez-vous des conseils spécifiques ?`;
      }
      
      if (lowerQuestion.includes('drive') || lowerQuestion.includes('départ') || lowerQuestion.includes('tee')) {
        return `Le drive, coup le plus spectaculaire ! 🚀

⚡ **Setup** :
- Balle alignée avec le talon du pied gauche
- Tee à la bonne hauteur (moitié de balle au-dessus du club)
- Stance légèrement plus large que les épaules

🎯 **Stratégie** :
${profile && profile.handicap > 15 ? '- Privilégiez la précision : visez le centre du fairway\n- Swing à 80% pour plus de contrôle' : '- Analysez le dogleg et les obstacles\n- Adaptez votre agressivité au trou'}

💪 **Technique** :
- Rotation complète des hanches
- Transfert de poids gauche à l'impact
- Finish équilibré

Quel est votre principal défi au drive ?`;
      }

      // Default coach response
      return `Merci pour votre question ! En tant que votre coach IA, je peux vous aider sur tous les aspects de votre jeu. 

🎯 **Mes spécialités** :
- Stratégie de jeu et gestion de parcours
- Choix des clubs selon les conditions  
- Technique et conseils d'entraînement
- Analyse de vos coups et amélioration

${profile ? `Avec votre handicap de ${profile.handicap}, nous pouvons travailler ensemble pour progresser efficacement.` : ''}

Posez-moi une question plus spécifique sur votre jeu !`;
    } else {
      // Rules copilot responses
      if (lowerQuestion.includes('eau') || lowerQuestion.includes('hazard') || lowerQuestion.includes('obstacle')) {
        return `**Règle des obstacles d'eau** 🌊

**Options disponibles** :
1️⃣ **Rejouer depuis le point d'origine** (+1 coup de pénalité)
2️⃣ **Drop dans la zone de drop** (si disponible, +1 coup)
3️⃣ **Ligne de jeu** : Drop derrière l'obstacle sur la ligne balle-drapeau (+1 coup)

**Procédure de drop** :
- Lâcher la balle à hauteur d'épaule
- Dans la zone réglementaire (pas plus près du trou)
- Si la balle roule hors zone, re-dropper une fois puis placer

📖 **Référence** : Règle 17 - Zones de pénalité

Situation exacte de votre balle ?`;
      }
      
      if (lowerQuestion.includes('balle perdue') || lowerQuestion.includes('perdue') || lowerQuestion.includes('hors limite') || lowerQuestion.includes('ob')) {
        return `**Balle perdue ou hors limites** ⛔

**Procédure** :
1️⃣ **Retour au point de jeu** (+1 coup de pénalité)
2️⃣ **Nouvelle règle locale possible** : Drop à 2 longueurs de club du point d'entrée (+2 coups de pénalité)

**Recherche autorisée** : 3 minutes maximum

**Points importants** :
- Les piquets blancs = hors limites
- Les piquets rouges/jaunes = zones de pénalité
- Balle "provisoire" recommandée si doute

📖 **Référence** : Règles 18 et 19

Votre balle était dans quelle situation ?`;
      }
      
      if (lowerQuestion.includes('drop') || lowerQuestion.includes('dropper')) {
        return `**Procédure de drop réglementaire** 📏

**Comment dropper** :
- ✅ Debout, bras tendu
- ✅ Hauteur d'épaule
- ✅ Lâcher (ne pas lancer)

**Zone de drop** :
- Pas plus près du trou
- Dans la zone définie par la règle
- Surface équivalente (rough→rough, fairway→fairway si possible)

**Si la balle roule** :
- 1er drop hors zone : re-dropper
- 2ème drop hors zone : placer à l'endroit où elle a touché

📖 **Référence** : Règle 14.3

Dans quelle situation devez-vous dropper ?`;
      }

      // Default rules response
      return `Je suis votre copilote règles officiel ! 📚

**Je peux vous aider avec** :
- Situations de jeu complexes
- Procédures de drop et pénalités  
- Règles d'étiquette et de sécurité
- Interprétation des règles locales

**Méthode** : Je cite toujours la règle officielle avec la procédure exacte à suivre.

Décrivez-moi la situation exacte que vous rencontrez sur le parcours !`;
    }
  };

  const quickSuggestions = activeTab === 'coach' ? [
    "Quel club pour un par 3 de 150m ?",
    "Comment améliorer mon putting ?",
    "Stratégie pour les par 5 ?",
    "Conseils pour jouer par vent fort"
  ] : [
    "Balle dans l'eau, que faire ?",
    "Procédure pour balle perdue",
    "Comment dropper correctement ?",
    "Règles sur les bunkers"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b border-border">
        <div className="flex items-center gap-4 p-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onBack}
            className="hover:bg-accent/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          <div className="flex-1">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Bot className="w-6 h-6 text-primary" />
              Coach IA HighSwing
            </h1>
            {user && (
              <p className="text-sm text-muted-foreground">
                Assistant personnel de {user.displayName}
              </p>
            )}
          </div>

          <Badge variant="secondary" className="hidden sm:flex items-center gap-1">
            <Zap className="w-3 h-3" />
            IA Active
          </Badge>
        </div>
      </header>

      <div className="p-4 max-w-4xl mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="coach" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Coach Stratégique
            </TabsTrigger>
            <TabsTrigger value="rules" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Copilot Règles
            </TabsTrigger>
          </TabsList>

          <TabsContent value="coach" className="space-y-4">
            <Card className="golf-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Target className="w-5 h-5" />
                  Coach Stratégique IA
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Conseils personnalisés sur la stratégie, les clubs, et la technique
                </p>
              </CardHeader>
            </Card>
          </TabsContent>

          <TabsContent value="rules" className="space-y-4">
            <Card className="golf-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BookOpen className="w-5 h-5" />
                  Copilot Règles Officielles
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Arbitre IA pour toutes vos questions sur les règles du golf
                </p>
              </CardHeader>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Chat Area */}
        <Card className="golf-card">
          <CardContent className="p-0">
            <ScrollArea className="h-[400px] p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${
                      message.type === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div className={`flex gap-3 max-w-[80%] ${
                      message.type === 'user' ? 'flex-row-reverse' : 'flex-row'
                    }`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        message.type === 'user' 
                          ? 'bg-primary text-primary-foreground' 
                          : message.type === 'coach'
                          ? 'bg-accent text-accent-foreground'
                          : 'bg-secondary text-secondary-foreground'
                      }`}>
                        {message.type === 'user' ? (
                          <User className="w-4 h-4" />
                        ) : message.type === 'coach' ? (
                          <Target className="w-4 h-4" />
                        ) : (
                          <BookOpen className="w-4 h-4" />
                        )}
                      </div>
                      
                      <div className={`rounded-lg p-3 ${
                        message.type === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}>
                        <div className="whitespace-pre-wrap text-sm">
                          {message.content}
                        </div>
                        <div className="text-xs opacity-70 mt-1">
                          {message.timestamp.toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {loading && (
                  <div className="flex gap-3 justify-start">
                    <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="bg-muted rounded-lg p-3 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">
                        {activeTab === 'coach' ? 'Coach réfléchit...' : 'Vérification des règles...'}
                      </span>
                    </div>
                  </div>
                )}
                
                <div ref={scrollRef} />
              </div>
            </ScrollArea>

            {/* Quick Suggestions */}
            {messages.length === 1 && (
              <div className="p-4 border-t border-border">
                <p className="text-sm text-muted-foreground mb-3">Suggestions :</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {quickSuggestions.map((suggestion, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="text-left justify-start text-xs h-auto py-2 px-3"
                      onClick={() => setInput(suggestion)}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className="p-4 border-t border-border">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    activeTab === 'coach' 
                      ? "Demandez conseil à votre coach..."
                      : "Posez votre question sur les règles..."
                  }
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  disabled={loading}
                  className="transition-golf"
                />
                
                <Button
                  size="icon"
                  variant="outline"
                  disabled={loading}
                >
                  <Mic className="w-4 h-4" />
                </Button>
                
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || loading}
                  className="golf-gradient"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}