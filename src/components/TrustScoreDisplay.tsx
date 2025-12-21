import { useEffect, useState, useRef } from 'react';
import type { TrustState } from '@/types/guardrail';
import { Shield, ShieldAlert, ShieldCheck, ShieldX } from 'lucide-react';

interface TrustScoreDisplayProps {
  score: number;
  state: TrustState;
  isProcessing: boolean;
}

const stateConfig = {
  healthy: {
    label: 'HEALTHY',
    icon: ShieldCheck,
    glowClass: 'glow-healthy',
    gradientClass: 'trust-gradient-healthy',
    ringColor: 'ring-trust-healthy',
    textColor: 'text-trust-healthy',
  },
  degraded: {
    label: 'DEGRADED',
    icon: ShieldAlert,
    glowClass: 'glow-degraded',
    gradientClass: 'trust-gradient-degraded',
    ringColor: 'ring-trust-degraded',
    textColor: 'text-trust-degraded',
  },
  critical: {
    label: 'CRITICAL',
    icon: ShieldX,
    glowClass: 'glow-critical',
    gradientClass: 'trust-gradient-critical',
    ringColor: 'ring-trust-critical',
    textColor: 'text-trust-critical',
  },
};

export const TrustScoreDisplay = ({ score, state, isProcessing }: TrustScoreDisplayProps) => {
  const [displayScore, setDisplayScore] = useState(score);
  const [isAnimating, setIsAnimating] = useState(false);
  const prevScore = useRef(score);
  const config = stateConfig[state];
  const Icon = config.icon;

  useEffect(() => {
    if (prevScore.current !== score) {
      setIsAnimating(true);
      const startScore = prevScore.current;
      const diff = score - startScore;
      const duration = 800;
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // Ease out cubic
        const currentScore = Math.round(startScore + diff * eased);
        
        setDisplayScore(currentScore);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setIsAnimating(false);
          prevScore.current = score;
        }
      };
      
      requestAnimationFrame(animate);
    }
  }, [score]);

  return (
    <div className="glass-panel p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-medium text-muted-foreground">LLM Trust Score</h2>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50 ${config.textColor}`}>
          <Icon className="w-4 h-4" />
          <span className="text-sm font-mono font-medium">{config.label}</span>
        </div>
      </div>

      <div className="flex flex-col items-center">
        {/* Score Ring */}
        <div className={`relative w-48 h-48 ${isAnimating || isProcessing ? 'animate-score-pulse' : ''}`}>
          {/* Background ring */}
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="hsl(var(--secondary))"
              strokeWidth="8"
            />
            {/* Progress ring */}
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke={`hsl(var(--trust-${state}))`}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${displayScore * 2.64} 264`}
              className="transition-all duration-300"
              style={{
                filter: `drop-shadow(0 0 8px hsl(var(--trust-${state}) / 0.5))`,
              }}
            />
          </svg>

          {/* Score number */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span 
              className={`text-6xl font-mono font-bold ${config.textColor} transition-colors duration-300`}
              style={{
                textShadow: `0 0 30px hsl(var(--trust-${state}) / 0.5)`,
              }}
            >
              {displayScore}
            </span>
            <span className="text-sm text-muted-foreground font-medium mt-1">/ 100</span>
          </div>

          {/* Glow effect */}
          <div 
            className={`absolute inset-0 rounded-full ${config.glowClass} opacity-30 blur-xl transition-opacity duration-500`}
            style={{ background: `radial-gradient(circle, hsl(var(--trust-${state}) / 0.3), transparent 70%)` }}
          />
        </div>

        {/* Status indicator */}
        <div className="mt-6 flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${config.gradientClass} ${isProcessing || state !== 'healthy' ? 'animate-pulse-glow' : ''}`} />
          <span className="text-sm text-muted-foreground">
            {isProcessing ? 'Processing request...' : 'System operational'}
          </span>
        </div>
      </div>

      {/* Risk breakdown mini */}
      <div className="mt-8 pt-6 border-t border-border/50">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Hallucination</p>
            <p className="font-mono text-sm font-medium text-foreground">Low</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Security</p>
            <p className="font-mono text-sm font-medium text-foreground">Low</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Cost</p>
            <p className="font-mono text-sm font-medium text-foreground">Normal</p>
          </div>
        </div>
      </div>
    </div>
  );
};
