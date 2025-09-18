import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { X, Send, Mic, MicOff, Bot, BookOpen, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/hooks/useI18n';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
  mode: 'coach' | 'rules';
}

interface CoachOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  roundId?: string;
  onVoiceMessage?: (text: string) => void;
  isRecording?: boolean;
  onToggleVoiceRecording?: () => void;
  currentHole?: number;
  totalStrokes?: number;
  playerProfile?: {
    handicap: number;
    firstName: string;
  };
}

export function CoachOverlay({ 
  isOpen, 
  onClose, 
  roundId,
  onVoiceMessage,
  isRecording = false,
  onToggleVoiceRecording,
  currentHole = 1,
  totalStrokes = 0,
  playerProfile = { handicap: 18, firstName: 'Joueur' }
}: CoachOverlayProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'coach' | 'rules'>('coach');
  const { t, language } = useI18n();
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when overlay opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Load existing messages when roundId changes
  useEffect(() => {
    if (roundId) {
      loadMessages();
    }
  }, [roundId]);

  const loadMessages = async () => {
    if (!roundId) return;

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('round_id', roundId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const loadedMessages: Message[] = data.map((msg: any) => [
        {
          id: `${msg.id}-user`,
          text: msg.message,
          isBot: false,
          timestamp: new Date(msg.created_at),
          mode: msg.mode
        },
        {
          id: `${msg.id}-bot`,
          text: msg.response,
          isBot: true,
          timestamp: new Date(msg.created_at),
          mode: msg.mode
        }
      ]).flat();

      setMessages(loadedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async (messageText: string, mode: 'coach' | 'rules' = activeTab) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      text: messageText.trim(),
      isBot: false,
      timestamp: new Date(),
      mode
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-coach', {
        body: {
          message: messageText.trim(),
          roundId: roundId,
          mode: mode,
          language: language
        }
      });

      if (error) throw error;

      const botMessage: Message = {
        id: `bot-${Date.now()}`,
        text: data.response,
        isBot: true,
        timestamp: new Date(),
        mode
      };

      setMessages(prev => [...prev, botMessage]);

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: t('common.error'),
        description: error.message || 'Erreur lors de l\'envoi du message',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const currentMessages = messages.filter(msg => msg.mode === activeTab);
  const suggestions = activeTab === "coach" 
    ? ["Quel club ?", "Stratégie vent", "Sortie bunker", "Putting"]
    : ["Balle dans l'eau", "Procédure drop", "Obstruction"];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 flex items-end justify-end p-4 z-50 pointer-events-none">
      <div className="w-96 max-w-[90vw] h-[650px] max-h-[90vh] bg-background border rounded-xl shadow-2xl animate-slide-in-up pointer-events-auto flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b flex-shrink-0">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-hs-green-100" />
            <h2 className="text-base font-semibold">Coach IA</h2>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="hover:bg-accent/10 h-8 w-8"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(value: string) => setActiveTab(value as 'coach' | 'rules')} className="flex flex-col flex-1 min-h-0">
          <TabsList className="grid w-full grid-cols-2 mx-3 mt-3 h-9">
            <TabsTrigger value="coach" className="flex items-center gap-1 text-xs">
              <MessageCircle className="w-3 h-3" />
              Coach
            </TabsTrigger>
            <TabsTrigger value="rules" className="flex items-center gap-1 text-xs">
              <BookOpen className="w-3 h-3" />
              Règles
            </TabsTrigger>
          </TabsList>

          <TabsContent value="coach" className="flex-1 flex flex-col mt-0 min-h-0 overflow-hidden">
            <div className="px-3 py-2 text-center text-xs text-muted-foreground border-b flex-shrink-0">
              Trou {currentHole} • {totalStrokes} coups • HCP {playerProfile.handicap}
            </div>
            
            <ScrollArea className="flex-1 p-3 overflow-auto">
              <div className="space-y-3 min-h-full">
                {currentMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-2 ${
                      message.isBot ? "justify-start" : "justify-end"
                    }`}
                  >
                    <div className={`max-w-[80%] ${
                      message.isBot ? "order-1" : "order-2"
                    }`}>
                      <div className={`rounded-lg p-2 ${
                        message.isBot
                          ? "bg-hs-beige text-hs-ink"
                          : "bg-hs-beige text-hs-ink border border-hs-green-100"
                      }`}>
                        <div className="text-xs whitespace-pre-wrap">
                          {message.text}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-hs-beige rounded-lg p-2 flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-hs-green-100 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                      <div className="w-1.5 h-1.5 bg-hs-green-100 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                      <div className="w-1.5 h-1.5 bg-hs-green-100 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="rules" className="flex-1 flex flex-col mt-0 min-h-0 overflow-hidden">
            <ScrollArea className="flex-1 p-3 overflow-auto" ref={scrollAreaRef}>
              <div className="space-y-3 min-h-full">
                {currentMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-2 ${
                      message.isBot ? "justify-start" : "justify-end"
                    }`}
                  >
                    <div className={`max-w-[80%] ${
                      message.isBot ? "order-1" : "order-2"
                    }`}>
                      <div className={`rounded-lg p-2 ${
                        message.isBot
                          ? "bg-hs-beige text-hs-ink"
                          : "bg-hs-beige text-hs-ink border border-hs-green-100"
                      }`}>
                        <div className="text-xs whitespace-pre-wrap">
                          {message.text}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-hs-beige rounded-lg p-2 flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-hs-green-100 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                      <div className="w-1.5 h-1.5 bg-hs-green-100 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                      <div className="w-1.5 h-1.5 bg-hs-green-100 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Quick Suggestions */}
          {currentMessages.length === 0 && (
            <div className="p-3 border-t flex-shrink-0">
              <p className="text-xs text-muted-foreground mb-2">Suggestions :</p>
              <div className="flex flex-wrap gap-1">
                {suggestions.map((suggestion, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => sendMessage(suggestion)}
                    className="text-xs h-6 px-2"
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Input Form */}
          <div className="p-3 border-t flex-shrink-0">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  activeTab === "coach" 
                    ? "Demandez conseil..."
                    : "Question sur les règles..."
                }
                disabled={isLoading}
                className="flex-1 h-8 text-xs"
              />
              
              {onToggleVoiceRecording && (
                <Button 
                  onClick={onToggleVoiceRecording}
                  type="button"
                  size="sm" 
                  variant={isRecording ? "destructive" : "outline"}
                  className="px-2 h-8 w-8"
                  disabled={isLoading}
                >
                  <Mic className={`w-3 h-3 ${isRecording ? 'animate-pulse' : ''}`} />
                </Button>
              )}
              <Button 
                type="submit" 
                size="sm" 
                className="bg-hs-green-100 hover:bg-hs-green-200 text-white px-2 h-8 w-8"
                disabled={isLoading}
              >
                <Send className="w-3 h-3" />
              </Button>
            </form>
          </div>
        </Tabs>
      </div>
    </div>
  );
}