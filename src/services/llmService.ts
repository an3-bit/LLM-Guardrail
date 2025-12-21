import { supabase } from '@/integrations/supabase/client';
import type { RiskMetrics, RecoveryStatus, Guardrail, TrustState } from '@/types/guardrail';

export interface LLMRequestResult {
  response: string;
  trustScore: number;
  risks: RiskMetrics;
  guardrailsTriggered: string[];
  latencyMs?: number;
  blocked?: boolean;
  error?: string;
}

export interface GuardrailsState {
  guardrails: Guardrail[];
  trustScore: number;
  trustState: TrustState;
}

export interface RecoveryState {
  status: RecoveryStatus;
  trustScore: number;
  guardrails?: Guardrail[];
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export const sendLLMRequest = async (
  prompt: string, 
  isMalicious: boolean = false
): Promise<LLMRequestResult> => {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/llm-gateway`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ 
        prompt, 
        type: isMalicious ? 'malicious' : 'normal' 
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please wait before sending more requests.');
      }
      if (response.status === 402) {
        throw new Error('AI credits exhausted. Please add credits to continue.');
      }
      throw new Error(`Request failed with status ${response.status}`);
    }

    const data = await response.json();
    
    // Update guardrails state if any were triggered
    if (data.guardrailsTriggered?.length > 0) {
      await updateGuardrails(data.guardrailsTriggered, data.trustScore, data.risks);
    }
    
    return data;
  } catch (error) {
    console.error('Error in LLM request:', error);
    throw error;
  }
};

export const getGuardrailsState = async (): Promise<GuardrailsState> => {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/guardrails/current`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch guardrails state: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching guardrails state:', error);
    throw error;
  }
};

export const getRecoveryStatus = async (): Promise<RecoveryState> => {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/guardrails/recovery`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch recovery status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching recovery status:', error);
    throw error;
  }
};

export const updateGuardrails = async (
  guardrailsTriggered: string[],
  trustScore: number,
  risks: RiskMetrics
): Promise<void> => {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/guardrails/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ guardrailsTriggered, trustScore, risks }),
    });

    if (!response.ok) {
      throw new Error(`Failed to update guardrails: ${response.status}`);
    }
  } catch (error) {
    console.error('Error updating guardrails:', error);
    throw error;
  }
};

export const initiateRecovery = async (): Promise<RecoveryState> => {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/guardrails/recover`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to initiate recovery: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error initiating recovery:', error);
    throw error;
  }
};

export const resetSystem = async (): Promise<void> => {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/guardrails/reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to reset system: ${response.status}`);
    }
  } catch (error) {
    console.error('Error resetting system:', error);
    throw error;
  }
};
