import { useState, useCallback } from 'react';
import type { SystemState, TrustState, Guardrail, RecoveryAction, RiskMetrics } from '@/types/guardrail';

const initialGuardrails: Guardrail[] = [
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

const getTrustState = (score: number): TrustState => {
  if (score >= 80) return 'healthy';
  if (score >= 60) return 'degraded';
  return 'critical';
};

const calculateTrustScore = (risks: RiskMetrics): number => {
  const score = 100 - (0.4 * risks.hallucination + 0.35 * risks.security + 0.25 * risks.cost);
  return Math.max(0, Math.min(100, Math.round(score)));
};

export const useGuardrailSystem = () => {
  const [state, setState] = useState<SystemState>({
    trustScore: 94,
    trustState: 'healthy',
    guardrails: initialGuardrails,
    recoveryStatus: 'none',
    recoveryActions: [],
    isProcessing: false,
  });

  const simulateLLMRequest = useCallback(async (prompt: string, isMalicious: boolean) => {
    setState(prev => ({ ...prev, isProcessing: true }));

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    let risks: RiskMetrics;
    let response: string;
    const triggeredGuardrails: string[] = [];

    if (isMalicious) {
      // Simulate malicious prompt detection
      const attackType = Math.random();
      
      if (attackType < 0.4) {
        // Prompt injection detected
        risks = {
          hallucination: 25 + Math.random() * 20,
          security: 70 + Math.random() * 25,
          cost: 15 + Math.random() * 10,
        };
        triggeredGuardrails.push('security');
        response = '[BLOCKED] Prompt injection attempt detected. Request has been logged and flagged.';
      } else if (attackType < 0.7) {
        // Hallucination risk
        risks = {
          hallucination: 65 + Math.random() * 30,
          security: 10 + Math.random() * 15,
          cost: 30 + Math.random() * 20,
        };
        triggeredGuardrails.push('hallucination');
        response = 'Response flagged for high hallucination risk. Confidence levels below acceptable threshold.';
      } else {
        // Cost spike
        risks = {
          hallucination: 20 + Math.random() * 15,
          security: 15 + Math.random() * 10,
          cost: 75 + Math.random() * 20,
        };
        triggeredGuardrails.push('cost');
        response = 'Token usage spike detected. Request processing with reduced context window.';
      }
    } else {
      // Normal prompt - low risk
      risks = {
        hallucination: 5 + Math.random() * 15,
        security: 2 + Math.random() * 8,
        cost: 10 + Math.random() * 15,
      };
      response = `I've processed your request: "${prompt.slice(0, 50)}${prompt.length > 50 ? '...' : ''}" successfully. All safety checks passed.`;
    }

    const newTrustScore = calculateTrustScore(risks);
    const newTrustState = getTrustState(newTrustScore);

    // Update guardrails
    const updatedGuardrails = initialGuardrails.map(g => {
      const isTriggered = triggeredGuardrails.includes(g.id);
      return {
        ...g,
        status: isTriggered ? 'active' as const : 'inactive' as const,
        severity: isTriggered ? newTrustState : 'healthy' as TrustState,
        triggeredAt: isTriggered ? new Date() : null,
      };
    });

    // Create recovery action if guardrails triggered
    const newRecoveryActions: RecoveryAction[] = [];
    if (triggeredGuardrails.length > 0) {
      newRecoveryActions.push({
        id: `recovery-${Date.now()}`,
        action: `Investigating ${triggeredGuardrails.join(', ')} guardrail triggers`,
        status: 'investigating',
        timestamp: new Date(),
        trustScoreBefore: state.trustScore,
        trustScoreAfter: null,
      });
    }

    setState({
      trustScore: newTrustScore,
      trustState: newTrustState,
      guardrails: updatedGuardrails,
      recoveryStatus: triggeredGuardrails.length > 0 ? 'investigating' : 'none',
      recoveryActions: [...state.recoveryActions, ...newRecoveryActions].slice(-5),
      isProcessing: false,
    });

    return { response, trustScore: newTrustScore, risks, guardrailsTriggered: triggeredGuardrails };
  }, [state.trustScore, state.recoveryActions]);

  const initiateRecovery = useCallback(async () => {
    if (state.recoveryStatus === 'none' || state.recoveryStatus === 'resolved') return;

    setState(prev => ({ ...prev, recoveryStatus: 'mitigating' }));

    // Simulate mitigation
    await new Promise(resolve => setTimeout(resolve, 2000));

    const recoveredScore = Math.min(100, state.trustScore + 25 + Math.random() * 15);

    setState(prev => ({
      ...prev,
      trustScore: Math.round(recoveredScore),
      trustState: getTrustState(recoveredScore),
      recoveryStatus: 'resolved',
      guardrails: prev.guardrails.map(g => ({
        ...g,
        status: 'inactive' as const,
        severity: 'healthy' as TrustState,
        triggeredAt: null,
      })),
      recoveryActions: prev.recoveryActions.map((a, i) => 
        i === prev.recoveryActions.length - 1 
          ? { ...a, status: 'resolved' as const, trustScoreAfter: Math.round(recoveredScore) }
          : a
      ),
    }));

    // Reset to normal after showing resolved state
    setTimeout(() => {
      setState(prev => ({ ...prev, recoveryStatus: 'none' }));
    }, 3000);
  }, [state.recoveryStatus, state.trustScore]);

  const resetSystem = useCallback(() => {
    setState({
      trustScore: 94,
      trustState: 'healthy',
      guardrails: initialGuardrails,
      recoveryStatus: 'none',
      recoveryActions: [],
      isProcessing: false,
    });
  }, []);

  return {
    state,
    simulateLLMRequest,
    initiateRecovery,
    resetSystem,
  };
};
