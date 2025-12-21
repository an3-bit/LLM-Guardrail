import { Button } from '@/components/ui/button';
import { Shield, RefreshCcw, Activity, ExternalLink } from 'lucide-react';

interface DashboardHeaderProps {
  onReset: () => void;
}

export const DashboardHeader = ({ onReset }: DashboardHeaderProps) => {
  return (
    <header className="glass-panel px-6 py-4 mb-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">
                LLM Guardrail AI
              </h1>
              <p className="text-sm text-muted-foreground">
                Trust & Risk Monitoring System
              </p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2 ml-8 px-3 py-1.5 rounded-full bg-secondary/50 border border-border/50">
            <Activity className="w-3.5 h-3.5 text-trust-healthy" />
            <span className="text-xs font-mono text-trust-healthy">LIVE</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onReset}
            className="border-border/50 hover:bg-secondary"
          >
            <RefreshCcw className="w-4 h-4 mr-2" />
            Reset Demo
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="border-border/50 hover:bg-secondary hidden sm:flex"
          >
            <span>Datadog</span>
            <ExternalLink className="w-3.5 h-3.5 ml-2" />
          </Button>
        </div>
      </div>
    </header>
  );
};
