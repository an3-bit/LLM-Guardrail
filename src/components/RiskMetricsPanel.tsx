import { useEffect, useState } from 'react';
import { Brain, Lock, DollarSign, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import type { RiskMetrics } from '@/types/guardrail';

interface RiskMetricsPanelProps {
  risks: RiskMetrics | null;
  isProcessing: boolean;
}

interface RiskConfig {
  id: keyof RiskMetrics;
  name: string;
  icon: typeof Brain;
  description: string;
  getExplanation: (value: number) => string;
  getStatus: (value: number) => 'healthy' | 'degraded' | 'critical';
}

const riskConfigs: RiskConfig[] = [
  {
    id: 'hallucination',
    name: 'Hallucination Risk',
    icon: Brain,
    description: 'Entropy deviation from baseline responses',
    getExplanation: (value: number) => {
      if (value < 30) return 'Response confidence is high. Output aligns with expected patterns.';
      if (value < 50) return 'Moderate uncertainty detected. Some claims may need verification.';
      if (value < 70) return 'High entropy deviation. Response may contain fabricated information.';
      return 'Critical hallucination risk. Output unreliable and should not be trusted.';
    },
    getStatus: (value: number) => value < 30 ? 'healthy' : value < 50 ? 'degraded' : 'critical',
  },
  {
    id: 'security',
    name: 'Security Risk',
    icon: Lock,
    description: 'Prompt injection and attack pattern detection',
    getExplanation: (value: number) => {
      if (value < 20) return 'No malicious patterns detected. Input appears safe.';
      if (value < 50) return 'Suspicious patterns found. Enhanced monitoring active.';
      if (value < 70) return 'Potential injection attempt detected. Request flagged for review.';
      return 'High-confidence attack detected. Request blocked and logged.';
    },
    getStatus: (value: number) => value < 20 ? 'healthy' : value < 50 ? 'degraded' : 'critical',
  },
  {
    id: 'cost',
    name: 'Cost Risk',
    icon: DollarSign,
    description: 'Token usage relative to baseline threshold',
    getExplanation: (value: number) => {
      if (value < 30) return 'Token usage within normal range. No cost concerns.';
      if (value < 50) return 'Slightly elevated token consumption. Monitoring active.';
      if (value < 70) return 'Token usage exceeds 2x baseline. Cost controls engaged.';
      return 'Severe cost spike detected. Context window reduced to limit spend.';
    },
    getStatus: (value: number) => value < 30 ? 'healthy' : value < 60 ? 'degraded' : 'critical',
  },
];

const statusColors = {
  healthy: {
    bar: 'bg-trust-healthy',
    text: 'text-trust-healthy',
    bg: 'bg-trust-healthy/10',
    glow: 'shadow-[0_0_10px_hsl(142,76%,45%,0.3)]',
  },
  degraded: {
    bar: 'bg-trust-degraded',
    text: 'text-trust-degraded',
    bg: 'bg-trust-degraded/10',
    glow: 'shadow-[0_0_10px_hsl(38,92%,50%,0.3)]',
  },
  critical: {
    bar: 'bg-trust-critical',
    text: 'text-trust-critical',
    bg: 'bg-trust-critical/10',
    glow: 'shadow-[0_0_10px_hsl(0,72%,55%,0.3)]',
  },
};

const AnimatedProgress = ({ 
  value, 
  status,
  isAnimating 
}: { 
  value: number; 
  status: 'healthy' | 'degraded' | 'critical';
  isAnimating: boolean;
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const colors = statusColors[status];

  useEffect(() => {
    if (isAnimating) {
      setDisplayValue(0);
      const timer = setTimeout(() => setDisplayValue(value), 50);
      return () => clearTimeout(timer);
    } else {
      setDisplayValue(value);
    }
  }, [value, isAnimating]);

  return (
    <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
      <div
        className={`h-full transition-all duration-700 ease-out ${colors.bar} ${colors.glow}`}
        style={{ width: `${displayValue}%` }}
      />
    </div>
  );
};

export const RiskMetricsPanel = ({ risks, isProcessing }: RiskMetricsPanelProps) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [prevRisks, setPrevRisks] = useState<RiskMetrics | null>(null);

  useEffect(() => {
    if (risks && risks !== prevRisks) {
      setIsAnimating(true);
      setPrevRisks(risks);
      const timer = setTimeout(() => setIsAnimating(false), 800);
      return () => clearTimeout(timer);
    }
  }, [risks, prevRisks]);

  const displayRisks = risks || { hallucination: 0, security: 0, cost: 0 };

  return (
    <div className="glass-panel p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-medium text-muted-foreground">Risk Metrics</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Real-time threat analysis
          </p>
        </div>
        {isProcessing && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-medium">Analyzing...</span>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {riskConfigs.map((config, index) => {
          const value = Math.round(displayRisks[config.id]);
          const status = config.getStatus(value);
          const colors = statusColors[status];
          const Icon = config.icon;
          const StatusIcon = status === 'healthy' ? CheckCircle : status === 'degraded' ? Info : AlertTriangle;

          return (
            <div 
              key={config.id} 
              className={`p-4 rounded-lg border transition-all duration-300 ${colors.bg} border-current/20`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${colors.bg}`}>
                  <Icon className={`w-4 h-4 ${colors.text}`} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{config.name}</span>
                      <StatusIcon className={`w-3.5 h-3.5 ${colors.text}`} />
                    </div>
                    <span className={`text-lg font-mono font-bold ${colors.text}`}>
                      {value}%
                    </span>
                  </div>
                  
                  <AnimatedProgress 
                    value={value} 
                    status={status}
                    isAnimating={isAnimating}
                  />
                  
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                    {risks ? config.getExplanation(value) : config.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Overall Risk Summary */}
      {risks && (
        <div className="mt-6 pt-4 border-t border-border/50">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Weighted Impact</span>
            <div className="flex items-center gap-4 text-xs">
              <span className="text-muted-foreground">
                H: <span className="font-mono text-foreground">40%</span>
              </span>
              <span className="text-muted-foreground">
                S: <span className="font-mono text-foreground">35%</span>
              </span>
              <span className="text-muted-foreground">
                C: <span className="font-mono text-foreground">25%</span>
              </span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Trust Score = 100 - (0.4×H + 0.35×S + 0.25×C)
          </p>
        </div>
      )}

      {!risks && (
        <div className="mt-6 pt-4 border-t border-border/50 text-center">
          <p className="text-sm text-muted-foreground">
            Send a request to see risk analysis
          </p>
        </div>
      )}
    </div>
  );
};
