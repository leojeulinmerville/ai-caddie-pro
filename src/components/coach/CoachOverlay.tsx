import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Send, MessageCircle, BookOpen, Mic } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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

interface CoachOverlayProps {
  user: User;
  playerProfile: PlayerData;
  currentHole: number;
  totalStrokes: number;
  lastStrokes?: Array<{ distance: number; club: string }>;
  onClose: () => void;
}

export function CoachOverlay({ 
  user, 
  playerProfile, 
  currentHole, 
  totalStrokes, 
  lastStrokes = [], 
  onClose 
}: CoachOverlayProps) {
  const [activeTab, setActiveTab] = useState("coach");
  const [coachMessages, setCoachMessages] = useState<Message[]>([
    {
      id: "1",
      type: "ai",
      content: `Bonjour ${playerProfile.firstName} ! Trou ${currentHole}, vous avez joué ${totalStrokes} coups. Comment puis-je vous aider ?`,
      timestamp: new Date()
    }
  ]);
  const [rulesMessages, setRulesMessages] = useState<Message[]>([
    {
      id: "1", 
      type: "ai",
      content: "Bonjour ! Posez-moi vos questions sur les règles du golf.",
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
      // Prepare context for coach
      const context = activeTab === "coach" ? {
        hole: currentHole,
        strokes: totalStrokes,
        handicap: playerProfile.handicap,
        lastShots: lastStrokes.slice(-3)
      } : null;

      const { data, error } = await supabase.functions.invoke('ai-coach', {
        body: {
          message,
          mode: activeTab,
          language: playerProfile?.language || 'fr',
          context
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
    ? ["Quel club ?", "Stratégie vent", "Sortie bunker", "Putting"]
    : ["Balle dans l'eau", "Procédure drop", "Obstruction"];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end z-50">
      <div className="w-full bg-background border-t rounded-t-xl animate-slide-in-up" style={{height: "70vh"}}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <MessageCircle className="w-5 h-5 text-hs-green-100" />
            <h2 className="text-lg font-semibold">Coach IA</h2>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="hover:bg-accent/10"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
          <TabsList className="grid w-full grid-cols-2 mx-4 mt-4">
            <TabsTrigger value="coach" className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Coach
            </TabsTrigger>
            <TabsTrigger value="rules" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Règles
            </TabsTrigger>
          </TabsList>

          <TabsContent value="coach" className="flex-1 flex flex-col mt-0">
            <div className="p-4 text-center text-sm text-muted-foreground border-b">
              Trou {currentHole} • {totalStrokes} coups • HCP {playerProfile.handicap}
            </div>
            
            <ScrollArea className="flex-1 p-4">
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
                          ? "bg-hs-green-100 text-white"
                          : "bg-hs-beige text-hs-ink"
                      }`}>
                        <div className="text-sm whitespace-pre-wrap">
                          {message.content}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-hs-beige rounded-lg p-3 flex items-center gap-2">
                      <div className="w-2 h-2 bg-hs-green-100 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                      <div className="w-2 h-2 bg-hs-green-100 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                      <div className="w-2 h-2 bg-hs-green-100 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="rules" className="flex-1 flex flex-col mt-0">
            <ScrollArea className="flex-1 p-4">
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
                          ? "bg-hs-green-100 text-white"
                          : "bg-hs-beige text-hs-ink"
                      }`}>
                        <div className="text-sm whitespace-pre-wrap">
                          {message.content}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-hs-beige rounded-lg p-3 flex items-center gap-2">
                      <div className="w-2 h-2 bg-hs-green-100 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                      <div className="w-2 h-2 bg-hs-green-100 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                      <div className="w-2 h-2 bg-hs-green-100 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Quick Suggestions */}
          {currentMessages.length <= 1 && (
            <div className="p-4 border-t">
              <p className="text-xs text-muted-foreground mb-2">Suggestions :</p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => sendMessage(suggestion)}
                    className="text-xs h-7 px-3"
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
                    ? "Demandez conseil..."
                    : "Question sur les règles..."
                }
                disabled={isLoading}
                className="flex-1"
              />
              
              <Button 
                onClick={handleVoiceRecording}
                type="button"
                size="sm" 
                variant={isRecording ? "destructive" : "outline"}
                className="px-3"
                disabled={isProcessing}
              >
                <Mic className={`w-4 h-4 ${isRecording ? 'animate-pulse' : ''}`} />
              </Button>
              <Button 
                type="submit" 
                size="sm" 
                className="bg-hs-green-100 hover:bg-hs-green-200 text-white px-3"
                disabled={isLoading}
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </Tabs>
      </div>
    </div>
  );
}