import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { X, Send, Mic, MicOff, Bot, BookOpen } from 'lucide-react';
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
}

export function CoachOverlay({ 
  isOpen, 
  onClose, 
  roundId,
  onVoiceMessage,
  isRecording = false,
  onToggleVoiceRecording
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