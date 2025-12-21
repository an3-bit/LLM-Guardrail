export type TrustState = 'healthy' | 'degraded' | 'critical';

export type GuardrailType = 'hallucination' | 'security' | 'cost';

export type RecoveryStatus = 'investigating' | 'mitigating' | 'resolved' | 'none';

export interface Guardrail {
  id: string;
  name: string;
  type: GuardrailType;
  status: 'active' | 'inactive';
  severity: TrustState;
  triggeredAt: Date | null;
  description: string;
}

export interface RiskMetrics {
  hallucination: number;
  security: number;
  cost: number;
}

export interface LLMResponse {
  response: string;
  trustScore: number;
  risks: RiskMetrics;
  guardrailsTriggered: string[];
}

export interface RecoveryAction {
  id: string;
  action: string;
  status: RecoveryStatus;
  timestamp: Date;
  trustScoreBefore: number;
  trustScoreAfter: number | null;
}

export interface SystemState {
  trustScore: number;
  trustState: TrustState;
  guardrails: Guardrail[];
  recoveryStatus: RecoveryStatus;
  recoveryActions: RecoveryAction[];
  isProcessing: boolean;
}
