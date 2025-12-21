import { useState } from 'react';
import { useGuardrailSystem } from '@/hooks/useGuardrailSystem';
import { DashboardHeader } from '@/components/DashboardHeader';
import { TrustScoreDisplay } from '@/components/TrustScoreDisplay';
import { LLMInteractionPanel } from '@/components/LLMInteractionPanel';
import { GuardrailsPanel } from '@/components/GuardrailsPanel';
import { RecoveryPanel } from '@/components/RecoveryPanel';
import { MetricsBar } from '@/components/MetricsBar';
import { TrustScoreChart, TrustScoreDataPoint } from '@/components/TrustScoreChart';
import { RiskMetricsPanel } from '@/components/RiskMetricsPanel';
import { RequestHistoryPanel, RequestHistoryEntry } from '@/components/RequestHistoryPanel';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import type { RiskMetrics } from '@/types/guardrail';

const Index = () => {
  const { state, simulateLLMRequest, initiateRecovery, resetSystem } = useGuardrailSystem();
  const [lastResponse, setLastResponse] = useState<string | null>(null);
  const [requestCount, setRequestCount] = useState(0);
  const [trustHistory, setTrustHistory] = useState<TrustScoreDataPoint[]>([]);
  const [currentRisks, setCurrentRisks] = useState<RiskMetrics | null>(null);
  const [requestHistory, setRequestHistory] = useState<RequestHistoryEntry[]>([]);
  const [lastPrompt, setLastPrompt] = useState<{ text: string; isMalicious: boolean } | null>(null);

  const handleSendRequest = async (prompt: string, isMalicious: boolean) => {
    setLastPrompt({ text: prompt, isMalicious });
    
    try {
      const result = await simulateLLMRequest(prompt, isMalicious);
      setLastResponse(result.response);
      setRequestCount(prev => prev + 1);
      setCurrentRisks(result.risks);

      // Add to trust history
      setTrustHistory(prev => [
        ...prev.slice(-19),
        {
          timestamp: new Date(),
          score: result.trustScore,
          label: `#${prev.length + 1}`,
        }
      ]);

      // Add to request history
      setRequestHistory(prev => [
        ...prev,
        {
          id: prev.length + 1,
          timestamp: new Date(),
          prompt,
          response: result.response,
          trustScore: result.trustScore,
          risks: result.risks,
          guardrailsTriggered: result.guardrailsTriggered,
          isMalicious,
        }
      ]);

      if (result.guardrailsTriggered.length > 0) {
        toast.error('Guardrail Triggered', {
          description: `${result.guardrailsTriggered.join(', ')} detected. Trust score dropped to ${result.trustScore}. Telemetry sent to Datadog.`,
        });
      } else {
        toast.success('Request Processed', {
          description: `Trust score: ${result.trustScore}. All safety checks passed.`,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while processing the request.';
      toast.error('Request Failed', {
        description: errorMessage,
      });
    }
  };

  const handleReset = async () => {
    await resetSystem();
    setLastResponse(null);
    setRequestCount(0);
    setTrustHistory([]);
    setCurrentRisks(null);
    setRequestHistory([]);
    setLastPrompt(null);
    toast.info('System Reset', {
      description: 'All metrics and guardrails have been reset to default state.',
    });
  };

  const handleRecovery = () => {
    initiateRecovery();
    toast.info('Recovery Initiated', {
      description: 'Applying remediation measures to restore trust score. Event sent to Datadog.',
    });
  };

  return (
    <div className="min-h-screen bg-background bg-grid-pattern bg-grid">
      {/* Gradient overlay */}
      <div className="fixed inset-0 bg-gradient-to-br from-primary/5 via-transparent to-trust-healthy/5 pointer-events-none" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <DashboardHeader onReset={handleReset} />

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - Trust Score, Risk Metrics & Interaction */}
          <div className="lg:col-span-5 space-y-6">
            <TrustScoreDisplay
              score={state.trustScore}
              state={state.trustState}
              isProcessing={state.isProcessing}
            />
            <RiskMetricsPanel 
              risks={currentRisks} 
              isProcessing={state.isProcessing}
            />
            <LLMInteractionPanel
              onSendRequest={handleSendRequest}
              isProcessing={state.isProcessing}
              lastResponse={lastResponse}
            />
          </div>

          {/* Right Column - Guardrails, Recovery & History */}
          <div className="lg:col-span-7 space-y-6">
            <MetricsBar requestCount={requestCount} />
            <TrustScoreChart data={trustHistory} currentScore={state.trustScore} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <GuardrailsPanel guardrails={state.guardrails} />
              <RecoveryPanel
                status={state.recoveryStatus}
                actions={state.recoveryActions}
                onInitiateRecovery={handleRecovery}
                currentScore={state.trustScore}
              />
            </div>
            <RequestHistoryPanel history={requestHistory} />
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            LLM Guardrail AI • Powered by Gemini + Datadog • Real-time Trust Monitoring
          </p>
        </footer>
      </div>

      <Toaster 
        position="bottom-right" 
        theme="dark"
        toastOptions={{
          style: {
            background: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            color: 'hsl(var(--foreground))',
          },
        }}
      />
    </div>
  );
};

export default Index;
