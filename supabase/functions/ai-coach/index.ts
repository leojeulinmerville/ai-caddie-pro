import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { message, roundId, mode = 'coach', language = 'fr' } = await req.json()
    
    if (!message) {
      throw new Error('Message is required')
    }

    console.log(`AI ${mode} request:`, { message, roundId, language })

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get context if roundId is provided
    let context = '';
    if (roundId) {
      // Get round info
      const { data: round } = await supabase
        .from('rounds')
        .select('*')
        .eq('id', roundId)
        .single()

      // Get recent strokes
      const { data: strokes } = await supabase
        .from('strokes')
        .select('*')
        .eq('round_id', roundId)
        .order('created_at', { ascending: false })
        .limit(3)

      // Get player profile
      const { data: profile } = await supabase
        .from('player_profiles')
        .select('*')
        .eq('user_id', round?.user_id)
        .single()

      // Get course info
      const { data: course } = await supabase
        .from('courses')
        .select('*')
        .eq('id', round?.course_id)
        .single()

      // Build context
      if (round && profile) {
        context = `
Contexte de la partie:
- Joueur: ${profile.first_name} ${profile.last_name}
- Index: ${profile.index_handicap}
- Parcours: ${course?.name || 'Mon Golf'}
- Sélection: ${round.selection}
- Trou actuel: Déterminé par les derniers coups
- Total coups: ${round.total_strokes}

Derniers coups:
${strokes?.map(s => `- Trou ${s.hole_local_idx + 1}: ${s.distance || 'N/A'}m avec ${s.club || 'club non spécifié'}`).join('\n') || 'Aucun coup enregistré'}
        `.trim()
      }
    }

    // Define system prompts
    const systemPrompts = {
      coach: language === 'fr' 
        ? `Tu es GolfCoach, un caddie professionnel expert. Tu donnes des conseils pratiques, concis et actionnables pour améliorer le jeu de golf.

Tes réponses doivent être:
- Brèves (2-4 phrases maximum)
- Spécifiques et pratiques
- Adaptées au niveau du joueur (utilise l'index handicap)
- Basées sur le contexte du trou et des derniers coups
- En français

Tu peux conseiller:
- Le choix de club selon la distance et les conditions
- La stratégie de jeu (placement, gestion des risques)
- La technique pour des situations spécifiques
- La gestion mentale et émotionnelle

Ne donne jamais de conseils médicaux ou dangereux.`
        : `You are GolfCoach, a professional caddie expert. You give practical, concise, and actionable advice to improve golf play.

Your responses should be:
- Brief (2-4 sentences maximum)
- Specific and practical
- Adapted to the player's level (use handicap index)
- Based on hole context and recent shots
- In English

You can advise on:
- Club selection based on distance and conditions
- Game strategy (placement, risk management)
- Technique for specific situations
- Mental and emotional management

Never give medical or dangerous advice.`,

      rules: language === 'fr'
        ? `Tu es GolfRules, un arbitre de golf officiel. Tu fournis des réponses factuelles et précises sur les règles du golf.

Tes réponses doivent être:
- Factuelles et neutres
- Basées sur les Règles officielles du golf
- Incluant la référence de règle quand possible
- Courtes et claires (2-4 phrases)
- En français

Tu indiques:
- La règle applicable
- La procédure à suivre
- Les pénalités éventuelles
- Les options disponibles

Ne donne pas d'opinions, seulement des faits réglementaires.`
        : `You are GolfRules, an official golf referee. You provide factual and accurate answers about golf rules.

Your responses should be:
- Factual and neutral
- Based on official Rules of Golf
- Include rule reference when possible
- Short and clear (2-4 sentences)
- In English

You indicate:
- The applicable rule
- The procedure to follow
- Any penalties
- Available options

Don't give opinions, only regulatory facts.`
    }

    // Prepare messages for OpenAI
    const messages = [
      {
        role: 'system',
        content: systemPrompts[mode as keyof typeof systemPrompts]
      }
    ]

    // Add context if available
    if (context) {
      messages.push({
        role: 'system',
        content: context
      })
    }

    // Add user message
    messages.push({
      role: 'user',
      content: message
    })

    console.log('Sending to OpenAI...')

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        max_tokens: 300,
        temperature: 0.3,
        top_p: 0.9,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenAI API error:', errorText)
      throw new Error(`OpenAI API error: ${errorText}`)
    }

    const data = await response.json()
    const aiResponse = data.choices[0].message.content

    console.log('AI response:', aiResponse)

    // Save conversation to database if roundId provided
    if (roundId) {
      const { error: insertError } = await supabase
        .from('chat_messages')
        .insert({
          round_id: roundId,
          message: message,
          response: aiResponse,
          mode: mode
        })

      if (insertError) {
        console.error('Error saving chat message:', insertError)
      }
    }

    return new Response(
      JSON.stringify({ 
        response: aiResponse,
        mode: mode,
        language: language
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('AI Coach error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})