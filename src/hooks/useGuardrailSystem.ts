import { useState, useCallback } from 'react';
import type { SystemState, TrustState, Guardrail, RecoveryAction, RiskMetrics } from '@/types/guardrail';
import * as llmService from '@/services/llmService';

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

    try {
      const result = await llmService.sendLLMRequest(prompt, isMalicious);
      
      const newTrustState = getTrustState(result.trustScore);

      // Update guardrails based on response
      const updatedGuardrails = initialGuardrails.map(g => {
        const isTriggered = result.guardrailsTriggered.includes(g.id);
        return {
          ...g,
          status: isTriggered ? 'active' as const : 'inactive' as const,
          severity: isTriggered ? newTrustState : 'healthy' as TrustState,
          triggeredAt: isTriggered ? new Date() : null,
        };
      });

      // Create recovery action if guardrails triggered
      const newRecoveryActions: RecoveryAction[] = [];
      if (result.guardrailsTriggered.length > 0) {
        newRecoveryActions.push({
          id: `recovery-${Date.now()}`,
          action: `Investigating ${result.guardrailsTriggered.join(', ')} guardrail triggers`,
          status: 'investigating',
          timestamp: new Date(),
          trustScoreBefore: state.trustScore,
          trustScoreAfter: null,
        });
      }

      setState(prev => ({
        trustScore: result.trustScore,
        trustState: newTrustState,
        guardrails: updatedGuardrails,
        recoveryStatus: result.guardrailsTriggered.length > 0 ? 'investigating' : 'none',
        recoveryActions: [...prev.recoveryActions, ...newRecoveryActions].slice(-5),
        isProcessing: false,
      }));

      return {
        response: result.response,
        trustScore: result.trustScore,
        risks: result.risks,
        guardrailsTriggered: result.guardrailsTriggered,
      };
    } catch (error) {
      setState(prev => ({ ...prev, isProcessing: false }));
      throw error;
    }
  }, [state.trustScore, state.recoveryActions]);

  const initiateRecovery = useCallback(async () => {
    if (state.recoveryStatus === 'none' || state.recoveryStatus === 'resolved') return;

    setState(prev => ({ ...prev, recoveryStatus: 'mitigating' }));

    try {
      const result = await llmService.initiateRecovery();

      setState(prev => ({
        ...prev,
        trustScore: result.trustScore,
        trustState: getTrustState(result.trustScore),
        recoveryStatus: 'resolved',
        guardrails: prev.guardrails.map(g => ({
          ...g,
          status: 'inactive' as const,
          severity: 'healthy' as TrustState,
          triggeredAt: null,
        })),
        recoveryActions: prev.recoveryActions.map((a, i) => 
          i === prev.recoveryActions.length - 1 
            ? { ...a, status: 'resolved' as const, trustScoreAfter: result.trustScore }
            : a
        ),
      }));

      // Reset to normal after showing resolved state
      setTimeout(() => {
        setState(prev => ({ ...prev, recoveryStatus: 'none' }));
      }, 3000);
    } catch (error) {
      console.error('Recovery failed:', error);
      setState(prev => ({ ...prev, recoveryStatus: 'investigating' }));
    }
  }, [state.recoveryStatus]);

  const resetSystem = useCallback(async () => {
    try {
      await llmService.resetSystem();
      
      setState({
        trustScore: 94,
        trustState: 'healthy',
        guardrails: initialGuardrails,
        recoveryStatus: 'none',
        recoveryActions: [],
        isProcessing: false,
      });
    } catch (error) {
      console.error('Reset failed:', error);
      // Reset locally even if server fails
      setState({
        trustScore: 94,
        trustState: 'healthy',
        guardrails: initialGuardrails,
        recoveryStatus: 'none',
        recoveryActions: [],
        isProcessing: false,
      });
    }
  }, []);

  return {
    state,
    simulateLLMRequest,
    initiateRecovery,
    resetSystem,
  };
};
