import type { Guardrail, TrustState } from '@/types/guardrail';
import { Shield, Brain, Lock, DollarSign, Clock, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface GuardrailsPanelProps {
  guardrails: Guardrail[];
}

const guardrailIcons = {
  hallucination: Brain,
  security: Lock,
  cost: DollarSign,
};

const severityStyles: Record<TrustState, { dot: string; bg: string; text: string }> = {
  healthy: {
    dot: 'bg-trust-healthy',
    bg: 'bg-trust-healthy/10',
    text: 'text-trust-healthy',
  },
  degraded: {
    dot: 'bg-trust-degraded',
    bg: 'bg-trust-degraded/10',
    text: 'text-trust-degraded',
  },
  critical: {
    dot: 'bg-trust-critical',
    bg: 'bg-trust-critical/10',
    text: 'text-trust-critical',
  },
};

export const GuardrailsPanel = ({ guardrails }: GuardrailsPanelProps) => {
  const activeGuardrails = guardrails.filter(g => g.status === 'active');

  return (
    <div className="glass-panel p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-medium text-muted-foreground">Active Guardrails</h2>
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          <span className="text-sm font-mono text-primary">
            {activeGuardrails.length} / {guardrails.length}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {guardrails.map((guardrail, index) => {
          const Icon = guardrailIcons[guardrail.type];
          const styles = severityStyles[guardrail.severity];
          const isActive = guardrail.status === 'active';

          return (
            <div
              key={guardrail.id}
              className={`p-4 rounded-lg border transition-all duration-300 ${
                isActive 
                  ? `${styles.bg} border-current ${styles.text}` 
                  : 'bg-secondary/30 border-border/30 text-muted-foreground'
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${isActive ? styles.bg : 'bg-secondary/50'}`}>
                  <Icon className={`w-4 h-4 ${isActive ? styles.text : 'text-muted-foreground'}`} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`font-medium ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {guardrail.name}
                    </span>
                    <div className={`w-2 h-2 rounded-full ${isActive ? `${styles.dot} animate-pulse-glow` : 'bg-muted-foreground/30'}`} />
                  </div>
                  
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {guardrail.description}
                  </p>

                  {isActive && guardrail.triggeredAt && (
                    <div className="flex items-center gap-4 mt-2 pt-2 border-t border-current/10">
                      <div className="flex items-center gap-1.5 text-xs">
                        <Clock className="w-3 h-3" />
                        <span>
                          Triggered {formatDistanceToNow(guardrail.triggeredAt, { addSuffix: true })}
                        </span>
                      </div>
                      <button className="flex items-center gap-1 text-xs hover:underline">
                        <span>View in Datadog</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>

                <div className={`px-2 py-1 rounded text-xs font-mono ${
                  isActive ? `${styles.bg} ${styles.text}` : 'bg-secondary/50 text-muted-foreground'
                }`}>
                  {isActive ? 'ACTIVE' : 'IDLE'}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {activeGuardrails.length === 0 && (
        <div className="mt-4 p-4 rounded-lg bg-trust-healthy/5 border border-trust-healthy/20 text-center">
          <p className="text-sm text-trust-healthy">
            All guardrails operating normally
          </p>
        </div>
      )}
    </div>
  );
};
