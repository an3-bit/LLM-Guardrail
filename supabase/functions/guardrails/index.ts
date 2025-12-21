import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// In-memory store for guardrail state (for demo purposes)
// In production, this would be stored in a database
interface GuardrailState {
  id: string;
  name: string;
  type: 'hallucination' | 'security' | 'cost';
  status: 'active' | 'inactive';
  severity: 'healthy' | 'degraded' | 'critical';
  triggeredAt: string | null;
  description: string;
}

let guardrailStates: GuardrailState[] = [
  {
    id: 'hallucination',
    name: 'Hallucination Risk',
    type: 'hallucination',
    status: 'inactive',
    severity: 'healthy',
    triggeredAt: null,
    description: 'Detects model responses with high entropy deviation from baseline',
  },
  {
    id: 'security',
    name: 'Prompt Injection',
    type: 'security',
    status: 'inactive',
    severity: 'healthy',
    triggeredAt: null,
    description: 'Identifies malicious prompt patterns and injection attempts',
  },
  {
    id: 'cost',
    name: 'Cost Spike',
    type: 'cost',
    status: 'inactive',
    severity: 'healthy',
    triggeredAt: null,
    description: 'Monitors token usage exceeding 2x baseline threshold',
  },
];

let currentTrustScore = 94;
let recoveryStatus: 'none' | 'investigating' | 'mitigating' | 'resolved' = 'none';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname.split('/').pop();

  try {
    // GET /guardrails/current - Get current guardrail states
    if (req.method === 'GET' && path === 'current') {
      console.log('Fetching current guardrail states');
      
      return new Response(
        JSON.stringify({
          guardrails: guardrailStates,
          trustScore: currentTrustScore,
          trustState: currentTrustScore >= 80 ? 'healthy' : currentTrustScore >= 60 ? 'degraded' : 'critical',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // GET /guardrails/recovery - Get recovery status
    if (req.method === 'GET' && path === 'recovery') {
      console.log('Fetching recovery status');
      
      return new Response(
        JSON.stringify({
          status: recoveryStatus,
          trustScore: currentTrustScore,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST /guardrails/update - Update guardrail states
    if (req.method === 'POST' && path === 'update') {
      const { guardrailsTriggered, trustScore, risks } = await req.json();
      
      console.log(`Updating guardrails. Trust score: ${trustScore}, Triggered: ${guardrailsTriggered.join(', ')}`);
      
      currentTrustScore = trustScore;
      
      // Update guardrail states
      guardrailStates = guardrailStates.map(g => {
        const isTriggered = guardrailsTriggered.includes(g.id);
        const severity = isTriggered 
          ? (trustScore >= 60 ? 'degraded' : 'critical')
          : 'healthy';
          
        return {
          ...g,
          status: isTriggered ? 'active' : 'inactive',
          severity: severity as 'healthy' | 'degraded' | 'critical',
          triggeredAt: isTriggered ? new Date().toISOString() : null,
        };
      });
      
      // Set recovery status if guardrails triggered
      if (guardrailsTriggered.length > 0) {
        recoveryStatus = 'investigating';
      }
      
      return new Response(
        JSON.stringify({
          success: true,
          guardrails: guardrailStates,
          trustScore: currentTrustScore,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST /guardrails/recover - Initiate recovery
    if (req.method === 'POST' && path === 'recover') {
      console.log('Initiating recovery process');
      
      recoveryStatus = 'mitigating';
      
      // Simulate recovery with improved trust score
      const recoveredScore = Math.min(100, currentTrustScore + 25 + Math.random() * 15);
      currentTrustScore = Math.round(recoveredScore);
      
      // Reset guardrails
      guardrailStates = guardrailStates.map(g => ({
        ...g,
        status: 'inactive' as const,
        severity: 'healthy' as const,
        triggeredAt: null,
      }));
      
      recoveryStatus = 'resolved';
      
      // Send recovery event to Datadog
      const DATADOG_API_KEY = Deno.env.get('DATADOG_API_KEY');
      if (DATADOG_API_KEY) {
        try {
          await fetch('https://api.datadoghq.com/api/v1/events', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'DD-API-KEY': DATADOG_API_KEY,
            },
            body: JSON.stringify({
              title: 'LLM Guardrail Recovery Completed',
              text: `Trust score recovered to ${currentTrustScore}. All guardrails reset to healthy state.`,
              alert_type: 'success',
              tags: ['service:llm-guardrail', 'env:production', 'action:recovery'],
            }),
          });
          console.log('Datadog recovery event sent');
        } catch (error) {
          console.error('Error sending Datadog recovery event:', error);
        }
      }
      
      return new Response(
        JSON.stringify({
          success: true,
          status: recoveryStatus,
          trustScore: currentTrustScore,
          guardrails: guardrailStates,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST /guardrails/reset - Reset all states
    if (req.method === 'POST' && path === 'reset') {
      console.log('Resetting guardrail system');
      
      currentTrustScore = 94;
      recoveryStatus = 'none';
      
      guardrailStates = [
        {
          id: 'hallucination',
          name: 'Hallucination Risk',
          type: 'hallucination',
          status: 'inactive',
          severity: 'healthy',
          triggeredAt: null,
          description: 'Detects model responses with high entropy deviation from baseline',
        },
        {
          id: 'security',
          name: 'Prompt Injection',
          type: 'security',
          status: 'inactive',
          severity: 'healthy',
          triggeredAt: null,
          description: 'Identifies malicious prompt patterns and injection attempts',
        },
        {
          id: 'cost',
          name: 'Cost Spike',
          type: 'cost',
          status: 'inactive',
          severity: 'healthy',
          triggeredAt: null,
          description: 'Monitors token usage exceeding 2x baseline threshold',
        },
      ];
      
      return new Response(
        JSON.stringify({
          success: true,
          trustScore: currentTrustScore,
          guardrails: guardrailStates,
          recoveryStatus,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in guardrails function:', error);
    
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
