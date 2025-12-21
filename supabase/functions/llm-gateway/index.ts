import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Prompt injection patterns
const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions/i,
  /you\s+are\s+now\s+/i,
  /forget\s+(all\s+)?your\s+(previous\s+)?instructions/i,
  /pretend\s+(to\s+be|you\s+are)/i,
  /act\s+as\s+if/i,
  /disregard\s+(all\s+)?previous/i,
  /override\s+(all\s+)?safety/i,
  /jailbreak/i,
  /DAN\s+mode/i,
  /system\s*prompt/i,
  /reveal\s+your\s+(instructions|prompt)/i,
];

// Calculate entropy deviation (simplified)
const calculateEntropy = (text: string): number => {
  const frequencies: Record<string, number> = {};
  for (const char of text.toLowerCase()) {
    frequencies[char] = (frequencies[char] || 0) + 1;
  }
  
  let entropy = 0;
  const length = text.length;
  for (const count of Object.values(frequencies)) {
    const probability = count / length;
    entropy -= probability * Math.log2(probability);
  }
  
  // Normalize to 0-100 scale
  const maxEntropy = Math.log2(Math.min(length, 26));
  return Math.min(100, (entropy / maxEntropy) * 100);
};

// Calculate security risk based on prompt patterns
const calculateSecurityRisk = (prompt: string): number => {
  let riskScore = 0;
  
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(prompt)) {
      riskScore += 25;
    }
  }
  
  // Check for excessive special characters
  const specialCharRatio = (prompt.match(/[{}[\]<>|\\`]/g) || []).length / prompt.length;
  if (specialCharRatio > 0.1) {
    riskScore += 15;
  }
  
  // Check for code-like content
  if (/```|<script|eval\(|exec\(/i.test(prompt)) {
    riskScore += 20;
  }
  
  return Math.min(100, riskScore);
};

// Calculate cost risk based on token estimation
const calculateCostRisk = (prompt: string, response: string): number => {
  // Rough token estimation (4 chars ≈ 1 token)
  const estimatedTokens = Math.ceil((prompt.length + response.length) / 4);
  const baselineTokens = 500;
  
  // Calculate cost ratio
  const costRatio = estimatedTokens / baselineTokens;
  
  if (costRatio > 4) return 100;
  if (costRatio > 2) return 60;
  if (costRatio > 1.5) return 40;
  return 10 + Math.random() * 15;
};

// Calculate hallucination risk based on response analysis
const calculateHallucinationRisk = (response: string): number => {
  let riskScore = 10 + Math.random() * 10;
  
  // Check for uncertainty markers
  const uncertaintyMarkers = [
    /i('m| am) not sure/i,
    /i think/i,
    /probably/i,
    /might be/i,
    /could be/i,
    /approximately/i,
    /around \d+/i,
  ];
  
  for (const marker of uncertaintyMarkers) {
    if (marker.test(response)) {
      riskScore += 5;
    }
  }
  
  // High entropy in response might indicate hallucination
  const entropy = calculateEntropy(response);
  if (entropy > 4) {
    riskScore += 10;
  }
  
  // Very long responses might have more hallucination risk
  if (response.length > 2000) {
    riskScore += 15;
  }
  
  return Math.min(100, riskScore);
};

// Calculate overall trust score
const calculateTrustScore = (risks: { hallucination: number; security: number; cost: number }): number => {
  const score = 100 - (0.4 * risks.hallucination + 0.35 * risks.security + 0.25 * risks.cost);
  return Math.max(0, Math.min(100, Math.round(score)));
};

// Send telemetry to Datadog
const sendDatadogTelemetry = async (metrics: {
  trustScore: number;
  risks: { hallucination: number; security: number; cost: number };
  guardrailsTriggered: string[];
  promptLength: number;
  responseLength: number;
  latencyMs: number;
}) => {
  const DATADOG_API_KEY = Deno.env.get('DATADOG_API_KEY');
  
  if (!DATADOG_API_KEY) {
    console.log('Datadog API key not configured, skipping telemetry');
    return;
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const tags = [
    'service:llm-guardrail',
    'env:production',
    ...metrics.guardrailsTriggered.map(g => `guardrail:${g}`),
  ];

  try {
    // Send metrics
    const metricsPayload = {
      series: [
        {
          metric: 'llm.trust_score',
          type: 0, // gauge
          points: [[timestamp, metrics.trustScore]],
          tags,
        },
        {
          metric: 'llm.risk.hallucination',
          type: 0,
          points: [[timestamp, metrics.risks.hallucination]],
          tags,
        },
        {
          metric: 'llm.risk.security',
          type: 0,
          points: [[timestamp, metrics.risks.security]],
          tags,
        },
        {
          metric: 'llm.risk.cost',
          type: 0,
          points: [[timestamp, metrics.risks.cost]],
          tags,
        },
        {
          metric: 'llm.latency_ms',
          type: 0,
          points: [[timestamp, metrics.latencyMs]],
          tags,
        },
        {
          metric: 'llm.tokens.prompt',
          type: 0,
          points: [[timestamp, Math.ceil(metrics.promptLength / 4)]],
          tags,
        },
        {
          metric: 'llm.tokens.response',
          type: 0,
          points: [[timestamp, Math.ceil(metrics.responseLength / 4)]],
          tags,
        },
      ],
    };

    await fetch('https://api.datadoghq.com/api/v1/series', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'DD-API-KEY': DATADOG_API_KEY,
      },
      body: JSON.stringify(metricsPayload),
    });

    console.log('Datadog metrics sent successfully');

    // Send event if guardrails triggered
    if (metrics.guardrailsTriggered.length > 0) {
      const eventPayload = {
        title: 'LLM Guardrail Triggered',
        text: `Guardrails triggered: ${metrics.guardrailsTriggered.join(', ')}. Trust score: ${metrics.trustScore}`,
        alert_type: metrics.trustScore < 60 ? 'error' : 'warning',
        tags,
      };

      await fetch('https://api.datadoghq.com/api/v1/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'DD-API-KEY': DATADOG_API_KEY,
        },
        body: JSON.stringify(eventPayload),
      });

      console.log('Datadog event sent for guardrail trigger');
    }

    // Send log
    const logPayload = [{
      ddsource: 'supabase-edge-function',
      ddtags: tags.join(','),
      hostname: 'llm-guardrail',
      message: JSON.stringify({
        trust_score: metrics.trustScore,
        risks: metrics.risks,
        guardrails_triggered: metrics.guardrailsTriggered,
        latency_ms: metrics.latencyMs,
      }),
      service: 'llm-guardrail',
      status: metrics.trustScore >= 60 ? 'info' : 'error',
    }];

    await fetch('https://http-intake.logs.datadoghq.com/api/v2/logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'DD-API-KEY': DATADOG_API_KEY,
      },
      body: JSON.stringify(logPayload),
    });

    console.log('Datadog log sent successfully');
  } catch (error) {
    console.error('Error sending Datadog telemetry:', error);
  }
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const { prompt, type = 'normal' } = await req.json();

    if (!prompt || typeof prompt !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${type} prompt: ${prompt.substring(0, 100)}...`);

    // Pre-flight security check
    const preflightSecurityRisk = calculateSecurityRisk(prompt);
    const guardrailsTriggered: string[] = [];

    // Block high-risk prompts before calling LLM
    if (preflightSecurityRisk > 70) {
      guardrailsTriggered.push('security');
      
      const risks = {
        hallucination: 25 + Math.random() * 15,
        security: preflightSecurityRisk,
        cost: 10,
      };
      
      const trustScore = calculateTrustScore(risks);
      const latencyMs = Date.now() - startTime;

      // Send telemetry asynchronously (fire and forget)
      sendDatadogTelemetry({
        trustScore,
        risks,
        guardrailsTriggered,
        promptLength: prompt.length,
        responseLength: 0,
        latencyMs,
      }).catch(err => console.error('Telemetry error:', err));

      return new Response(
        JSON.stringify({
          response: '[BLOCKED] Prompt injection attempt detected. Request has been logged and flagged for security review.',
          trustScore,
          risks,
          guardrailsTriggered,
          blocked: true,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Call Lovable AI Gateway (Gemini)
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful AI assistant. Provide clear, accurate, and safe responses. If you are unsure about something, acknowledge the uncertainty.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 1000,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const errorText = await aiResponse.text();
      console.error('AI gateway error:', aiResponse.status, errorText);
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const responseContent = aiData.choices?.[0]?.message?.content || 'No response generated.';

    // Calculate risk metrics
    const hallucinationRisk = calculateHallucinationRisk(responseContent);
    const securityRisk = preflightSecurityRisk;
    const costRisk = calculateCostRisk(prompt, responseContent);

    const risks = {
      hallucination: hallucinationRisk,
      security: securityRisk,
      cost: costRisk,
    };

    // Determine triggered guardrails
    if (hallucinationRisk > 50) {
      guardrailsTriggered.push('hallucination');
    }
    if (securityRisk > 50) {
      guardrailsTriggered.push('security');
    }
    if (costRisk > 60) {
      guardrailsTriggered.push('cost');
    }

    const trustScore = calculateTrustScore(risks);
    const latencyMs = Date.now() - startTime;

    console.log(`Request completed. Trust score: ${trustScore}, Guardrails: ${guardrailsTriggered.join(', ') || 'none'}`);

    // Send telemetry asynchronously (fire and forget)
    sendDatadogTelemetry({
      trustScore,
      risks,
      guardrailsTriggered,
      promptLength: prompt.length,
      responseLength: responseContent.length,
      latencyMs,
    }).catch(err => console.error('Telemetry error:', err));

    return new Response(
      JSON.stringify({
        response: responseContent,
        trustScore,
        risks,
        guardrailsTriggered,
        latencyMs,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in llm-gateway:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
