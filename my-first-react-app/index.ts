// Use Deno.serve for modern Supabase Edge Functions
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { prompt, mode = 'generate' } = await req.json()
    const openAiKey = Deno.env.get('OPENAI_API_KEY')

    let systemPrompt = '';
    if (mode === 'chat') {
      systemPrompt = 'You are a professional career coach and resume expert. Provide short, helpful, and encouraging advice. Respond ONLY with a valid JSON object: { "reply": "..." }';
    } else if (mode === 'improve') {
      systemPrompt = 'You are a professional resume writer. Improve the following resume summary to be more professional, impact-oriented, and tailored for ATS. Respond ONLY with a valid JSON object containing the improved text: { "improvedText": "..." }';
    } else {
      systemPrompt = 'You are a professional resume writer. Generate a complete resume object based on the user\'s prompt. Respond ONLY with a valid JSON object that follows this exact structure: { "firstName": "", "lastName": "", "email": "", ... }';
    }

    if (!openAiKey) {
      return new Response(JSON.stringify({ error: 'Missing OpenAI API Key' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o', // You can use gpt-3.5-turbo for lower costs
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        response_format: { type: "json_object" }
      }),
    })

    const data = await response.json()
    const resumeData = JSON.parse(data.choices[0].message.content)

    return new Response(JSON.stringify(resumeData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})