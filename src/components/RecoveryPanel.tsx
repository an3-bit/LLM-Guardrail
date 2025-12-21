import type { RecoveryStatus, RecoveryAction } from '@/types/guardrail';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { RefreshCw, CheckCircle2, AlertCircle, Loader2, ArrowUp, Play } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface RecoveryPanelProps {
  status: RecoveryStatus;
  actions: RecoveryAction[];
  onInitiateRecovery: () => void;
  currentScore: number;
}

const statusConfig = {
  none: {
    label: 'No Active Incidents',
    icon: CheckCircle2,
    color: 'text-trust-healthy',
    bg: 'bg-trust-healthy/10',
    progress: 100,
  },
  investigating: {
    label: 'Investigating',
    icon: AlertCircle,
    color: 'text-trust-degraded',
    bg: 'bg-trust-degraded/10',
    progress: 25,
  },
  mitigating: {
    label: 'Mitigating',
    icon: Loader2,
    color: 'text-primary',
    bg: 'bg-primary/10',
    progress: 65,
  },
  resolved: {
    label: 'Resolved',
    icon: CheckCircle2,
    color: 'text-trust-healthy',
    bg: 'bg-trust-healthy/10',
    progress: 100,
  },
};

export const RecoveryPanel = ({ 
  status, 
  actions, 
  onInitiateRecovery,
  currentScore 
}: RecoveryPanelProps) => {
  const config = statusConfig[status];
  const Icon = config.icon;
  const latestAction = actions[actions.length - 1];

  const canRecover = status === 'investigating';

  return (
    <div className="glass-panel p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-medium text-muted-foreground">Recovery Status</h2>
        <RefreshCw className="w-4 h-4 text-muted-foreground" />
      </div>

      {/* Current Status */}
      <div className={`p-4 rounded-lg ${config.bg} mb-6`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${config.bg}`}>
            <Icon className={`w-5 h-5 ${config.color} ${status === 'mitigating' ? 'animate-spin' : ''}`} />
          </div>
          <div className="flex-1">
            <p className={`font-medium ${config.color}`}>{config.label}</p>
            {latestAction && status !== 'none' && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {latestAction.action}
              </p>
            )}
          </div>
        </div>

        {status !== 'none' && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span>Progress</span>
              <span>{config.progress}%</span>
            </div>
            <Progress 
              value={config.progress} 
              className="h-2 bg-secondary"
            />
          </div>
        )}
      </div>

      {/* Recovery Action Button */}
      {canRecover && (
        <Button
          onClick={onInitiateRecovery}
          className="w-full mb-6 bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Play className="w-4 h-4 mr-2" />
          Initiate Recovery
        </Button>
      )}

      {/* Trust Score Comparison */}
      {latestAction && latestAction.trustScoreAfter !== null && (
        <div className="p-4 rounded-lg bg-secondary/30 border border-border/30 mb-6 animate-slide-up">
          <p className="text-xs text-muted-foreground mb-3">Trust Score Recovery</p>
          <div className="flex items-center justify-center gap-4">
            <div className="text-center">
              <p className="text-2xl font-mono font-bold text-trust-critical">
                {latestAction.trustScoreBefore}
              </p>
              <p className="text-xs text-muted-foreground">Before</p>
            </div>
            <ArrowUp className="w-5 h-5 text-trust-healthy animate-bounce" />
            <div className="text-center">
              <p className="text-2xl font-mono font-bold text-trust-healthy">
                {latestAction.trustScoreAfter}
              </p>
              <p className="text-xs text-muted-foreground">After</p>
            </div>
          </div>
        </div>
      )}

      {/* Recent Actions */}
      {actions.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Recent Actions</h3>
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {actions.slice().reverse().map((action) => (
              <div 
                key={action.id}
                className="p-3 rounded-lg bg-secondary/20 border border-border/20 text-sm"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-mono px-2 py-0.5 rounded ${
                    action.status === 'resolved' 
                      ? 'bg-trust-healthy/20 text-trust-healthy' 
                      : action.status === 'mitigating'
                        ? 'bg-primary/20 text-primary'
                        : 'bg-trust-degraded/20 text-trust-degraded'
                  }`}>
                    {action.status.toUpperCase()}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(action.timestamp, { addSuffix: true })}
                  </span>
                </div>
                <p className="text-muted-foreground text-xs">{action.action}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {actions.length === 0 && (
        <div className="text-center py-8">
          <CheckCircle2 className="w-12 h-12 mx-auto text-trust-healthy/30 mb-3" />
          <p className="text-sm text-muted-foreground">No recovery actions needed</p>
        </div>
      )}
    </div>
  );
};
