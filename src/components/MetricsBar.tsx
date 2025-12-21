import { Activity, Clock, Cpu, Zap } from 'lucide-react';

interface MetricsBarProps {
  requestCount: number;
}

export const MetricsBar = ({ requestCount }: MetricsBarProps) => {
  return (
    <div className="glass-panel p-4 animate-fade-in">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Activity className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Requests</p>
            <p className="text-lg font-mono font-medium text-foreground">{requestCount}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-trust-healthy/10">
            <Zap className="w-4 h-4 text-trust-healthy" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Avg Latency</p>
            <p className="text-lg font-mono font-medium text-foreground">142ms</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-trust-degraded/10">
            <Clock className="w-4 h-4 text-trust-degraded" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Uptime</p>
            <p className="text-lg font-mono font-medium text-foreground">99.9%</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-secondary">
            <Cpu className="w-4 h-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Model</p>
            <p className="text-lg font-mono font-medium text-foreground">Gemini</p>
          </div>
        </div>
      </div>
    </div>
  );
};
