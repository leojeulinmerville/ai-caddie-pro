import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const COACH_SYSTEM_PROMPT = `Tu es GolfCoach, un caddie professionnel expérimenté. Tu donnes des conseils brefs, pratiques et actionnables adaptés au contexte du jeu de golf.

Caractéristiques de tes réponses :
- Concises (2-3 phrases maximum)
- Basées sur l'analyse du trou (par, handicap) et du profil du joueur
- Proposent 1-2 options concrètes maximum
- Justifient la recommandation en une phrase
- Encourageantes et bienveillantes

Si l'utilisateur dit 'play' ou 'finish', ne réponds pas : laisse le moteur de jeu gérer ces commandes.

Réponds dans la langue préférée du joueur (français ou anglais).`;

const RULES_SYSTEM_PROMPT = `Tu es GolfRules, un arbitre officiel de golf. Tu fournis des réponses factuelles et précises sur les règles du golf.

Caractéristiques de tes réponses :
- Factuelles et neutres (pas d'opinions)
- Citent la règle applicable quand possible
- Expliquent la marche à suivre concrètement
- 2-4 phrases maximum
- Professionnelles et claires

Base tes réponses sur les Règles du Golf officielles de R&A et USGA.

Réponds dans la langue préférée du joueur (français ou anglais).`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, mode, language = 'fr' } = await req.json();

    if (!message) {
      throw new Error('Message is required');
    }

    if (!['coach', 'rules'].includes(mode)) {
      throw new Error('Mode must be either "coach" or "rules"');
    }

    const systemPrompt = mode === 'coach' ? COACH_SYSTEM_PROMPT : RULES_SYSTEM_PROMPT;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: systemPrompt + (language === 'en' ? '\n\nRespond in English.' : '\n\nRéponds en français.')
          },
          { role: 'user', content: message }
        ],
        temperature: 0.3,
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to get AI response');
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    console.log(`AI Coach (${mode}): ${message} -> ${aiResponse}`);

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in ai-coach function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});