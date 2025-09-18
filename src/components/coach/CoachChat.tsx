import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronLeft, Send, MessageCircle, BookOpen, Mic } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useVoiceRecording } from "@/hooks/useVoiceRecording";

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
  type: "user" | "ai";
  content: string;
  timestamp: Date;
}

interface CoachChatProps {
  user: User | null;
  playerProfile: PlayerData | null;
  onBack: () => void;
}

export function CoachChat({ user, playerProfile, onBack }: CoachChatProps) {
  const [activeTab, setActiveTab] = useState("coach");
  const [coachMessages, setCoachMessages] = useState<Message[]>([
    {
      id: "1",
      type: "ai",
      content: "Bonjour ! Je suis votre coach IA personnel. Comment puis-je vous aider à améliorer votre jeu aujourd'hui ?",
      timestamp: new Date()
    }
  ]);
  const [rulesMessages, setRulesMessages] = useState<Message[]>([
    {
      id: "1", 
      type: "ai",
      content: "Bonjour ! Je suis votre assistant pour toutes les questions de règlement du golf. Posez-moi vos questions !",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { isRecording, isProcessing, startRecording, stopRecording } = useVoiceRecording();

  const sendMessage = async (message: string) => {
    if (!message.trim() || isLoading) return;

    const currentMessages = activeTab === "coach" ? coachMessages : rulesMessages;
    const setMessages = activeTab === "coach" ? setCoachMessages : setRulesMessages;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: message,
      timestamp: new Date()
    };

    setMessages([...currentMessages, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-coach', {
        body: {
          message,
          mode: activeTab,
          language: playerProfile?.language || 'fr'
        }
      });

      if (error) throw error;

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: data.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error: any) {
      console.error('Error getting AI response:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'obtenir une réponse du coach IA",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceRecording = async () => {
    if (isRecording) {
      const result = await stopRecording();
      if (result?.text) {
        await sendMessage(result.text);
      }
    } else {
      await startRecording();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const currentMessages = activeTab === "coach" ? coachMessages : rulesMessages;
  const suggestions = activeTab === "coach" 
    ? ["Quel club pour un par 3 de 150m ?", "Comment améliorer mon putting ?", "Stratégie par vent fort"]
    : ["Balle dans l'eau, que faire ?", "Procédure balle perdue", "Comment dropper correctement ?"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b">
        <div className="flex items-center gap-4 p-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onBack}
            className="hover:bg-accent/10"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          
          <div className="flex-1">
            <h1 className="text-xl font-bold">Coach IA HighSwing</h1>
            {user && (
              <p className="text-sm text-muted-foreground">
                Assistant personnel de {user.displayName}
              </p>
            )}
          </div>

          <Badge variant="secondary" className="hidden sm:flex">
            IA Active
          </Badge>
        </div>
      </header>

      <div className="p-4 max-w-4xl mx-auto space-y-6">
        {/* Mode Selector */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="coach" className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Coach Stratégique
            </TabsTrigger>
            <TabsTrigger value="rules" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Copilot Règles
            </TabsTrigger>
          </TabsList>

          <TabsContent value="coach">
            <Card className="golf-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  Coach Stratégique IA
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Conseils personnalisés sur la stratégie, les clubs, et la technique
                </p>
              </CardHeader>
            </Card>
          </TabsContent>

          <TabsContent value="rules">
            <Card className="golf-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
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

        {/* Chat Messages */}
        <Card className="golf-card">
          <CardContent className="p-0">
            <ScrollArea className="h-[400px] p-4">
              <div className="space-y-4">
                {currentMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${
                      message.type === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div className={`max-w-[80%] ${
                      message.type === "user" ? "order-2" : "order-1"
                    }`}>
                      <div className={`rounded-lg p-3 ${
                        message.type === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}>
                        <div className="text-sm whitespace-pre-wrap">
                          {message.content}
                        </div>
                        <div className="text-xs opacity-70 mt-1">
                          {message.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg p-3 flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Quick Suggestions */}
            {currentMessages.length === 1 && (
              <div className="p-4 border-t">
                <p className="text-sm text-muted-foreground mb-3">Suggestions :</p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((suggestion, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => sendMessage(suggestion)}
                      className="text-xs"
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Form */}
            <div className="p-4 border-t">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={
                    activeTab === "coach" 
                      ? "Demandez conseil à votre coach..."
                      : "Posez votre question sur les règles..."
                  }
                  disabled={isLoading}
                  className="flex-1 transition-golf"
                />
                
                <div className="flex gap-2">
                  <Button 
                    onClick={handleVoiceRecording}
                    type="button"
                    size="sm" 
                    variant={isRecording ? "destructive" : "outline"}
                    className="transition-golf px-3"
                    disabled={isProcessing}
                  >
                    <Mic className={`w-4 h-4 ${isRecording ? 'animate-pulse' : ''}`} />
                  </Button>
                  <Button 
                    type="submit" 
                    size="sm" 
                    className="golf-gradient hover:golf-glow transition-golf px-3"
                    disabled={isLoading}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}