import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Clock, MessageSquare, Shield, Brain, DollarSign, TrendingDown, TrendingUp } from 'lucide-react';
import type { RiskMetrics } from '@/types/guardrail';

export interface RequestHistoryEntry {
  id: number;
  timestamp: Date;
  prompt: string;
  response: string;
  trustScore: number;
  risks: RiskMetrics;
  guardrailsTriggered: string[];
  isMalicious: boolean;
}

interface RequestHistoryPanelProps {
  history: RequestHistoryEntry[];
}

const getTrustColor = (score: number): string => {
  if (score >= 80) return 'text-trust-healthy';
  if (score >= 60) return 'text-trust-degraded';
  return 'text-trust-critical';
};

const getTrustBadgeVariant = (score: number): 'default' | 'secondary' | 'destructive' => {
  if (score >= 80) return 'default';
  if (score >= 60) return 'secondary';
  return 'destructive';
};

const getRiskLevel = (value: number): string => {
  if (value < 30) return 'Low';
  if (value < 60) return 'Medium';
  return 'High';
};

const getRiskColor = (value: number): string => {
  if (value < 30) return 'text-trust-healthy';
  if (value < 60) return 'text-trust-degraded';
  return 'text-trust-critical';
};

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit',
    hour12: false 
  });
};

const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const RequestHistoryPanel = ({ history }: RequestHistoryPanelProps) => {
  const reversedHistory = [...history].reverse();

  return (
    <div className="glass-panel p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Request History</h2>
        </div>
        <Badge variant="outline" className="text-muted-foreground">
          {history.length} requests
        </Badge>
      </div>

      {history.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <MessageSquare className="w-12 h-12 mb-3 opacity-50" />
          <p className="text-sm">No requests yet</p>
          <p className="text-xs mt-1">Send a prompt to see the history</p>
        </div>
      ) : (
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {reversedHistory.map((entry, index) => (
              <div 
                key={entry.id}
                className="relative pl-6 pb-4 border-l-2 border-border last:pb-0 animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Timeline dot */}
                <div 
                  className={`absolute left-[-5px] top-0 w-2 h-2 rounded-full ${
                    entry.guardrailsTriggered.length > 0 
                      ? 'bg-trust-critical' 
                      : 'bg-trust-healthy'
                  }`}
                />

                {/* Entry card */}
                <div className="glass-panel p-4 ml-2 hover:bg-muted/30 transition-colors">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground font-mono">
                        {formatTime(entry.timestamp)}
                      </span>
                      {entry.isMalicious && (
                        <Badge variant="destructive" className="text-xs py-0">
                          Malicious
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {entry.trustScore > (reversedHistory[index + 1]?.trustScore || 100) ? (
                        <TrendingDown className="w-3 h-3 text-trust-critical" />
                      ) : (
                        <TrendingUp className="w-3 h-3 text-trust-healthy" />
                      )}
                      <Badge 
                        variant={getTrustBadgeVariant(entry.trustScore)}
                        className="text-xs"
                      >
                        Trust: {entry.trustScore}
                      </Badge>
                    </div>
                  </div>

                  {/* Prompt */}
                  <div className="mb-3">
                    <p className="text-xs text-muted-foreground mb-1">Prompt:</p>
                    <p className="text-sm text-foreground bg-muted/50 rounded px-2 py-1 font-mono">
                      {truncateText(entry.prompt, 100)}
                    </p>
                  </div>

                  {/* Response */}
                  <div className="mb-3">
                    <p className="text-xs text-muted-foreground mb-1">Response:</p>
                    <p className="text-sm text-foreground/80 bg-muted/30 rounded px-2 py-1">
                      {truncateText(entry.response, 150)}
                    </p>
                  </div>

                  {/* Risk metrics */}
                  <div className="flex flex-wrap gap-3 mb-3">
                    <div className="flex items-center gap-1">
                      <Brain className="w-3 h-3 text-muted-foreground" />
                      <span className={`text-xs ${getRiskColor(entry.risks.hallucination)}`}>
                        Hallucination: {getRiskLevel(entry.risks.hallucination)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Shield className="w-3 h-3 text-muted-foreground" />
                      <span className={`text-xs ${getRiskColor(entry.risks.security)}`}>
                        Security: {getRiskLevel(entry.risks.security)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3 text-muted-foreground" />
                      <span className={`text-xs ${getRiskColor(entry.risks.cost)}`}>
                        Cost: {getRiskLevel(entry.risks.cost)}
                      </span>
                    </div>
                  </div>

                  {/* Triggered guardrails */}
                  {entry.guardrailsTriggered.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {entry.guardrailsTriggered.map(guardrail => (
                        <Badge 
                          key={guardrail} 
                          variant="destructive" 
                          className="text-xs capitalize"
                        >
                          {guardrail} triggered
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};
