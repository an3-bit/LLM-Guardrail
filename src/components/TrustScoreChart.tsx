import { useMemo } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea
} from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface TrustScoreDataPoint {
  timestamp: Date;
  score: number;
  label: string;
}

interface TrustScoreChartProps {
  data: TrustScoreDataPoint[];
  currentScore: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const score = payload[0].value;
    const state = score >= 80 ? 'Healthy' : score >= 60 ? 'Degraded' : 'Critical';
    const stateColor = score >= 80 ? 'text-trust-healthy' : score >= 60 ? 'text-trust-degraded' : 'text-trust-critical';
    
    return (
      <div className="glass-panel p-3 border border-border/50">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <p className={`text-lg font-mono font-bold ${stateColor}`}>
          {score}
        </p>
        <p className={`text-xs ${stateColor}`}>{state}</p>
      </div>
    );
  }
  return null;
};

export const TrustScoreChart = ({ data, currentScore }: TrustScoreChartProps) => {
  const chartData = useMemo(() => {
    return data.map((point, index) => ({
      ...point,
      name: point.label || `#${index + 1}`,
      time: point.timestamp.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
      }),
    }));
  }, [data]);

  const trend = useMemo(() => {
    if (data.length < 2) return 'stable';
    const lastTwo = data.slice(-2);
    const diff = lastTwo[1].score - lastTwo[0].score;
    if (diff > 5) return 'up';
    if (diff < -5) return 'down';
    return 'stable';
  }, [data]);

  const averageScore = useMemo(() => {
    if (data.length === 0) return 0;
    return Math.round(data.reduce((sum, d) => sum + d.score, 0) / data.length);
  }, [data]);

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-trust-healthy' : trend === 'down' ? 'text-trust-critical' : 'text-muted-foreground';

  return (
    <div className="glass-panel p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-medium text-muted-foreground">Trust Score History</h2>
          <p className="text-xs text-muted-foreground mt-1">
            {data.length} request{data.length !== 1 ? 's' : ''} tracked
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Average</p>
            <p className="text-lg font-mono font-medium text-foreground">{averageScore}</p>
          </div>
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/50 ${trendColor}`}>
            <TrendIcon className="w-4 h-4" />
            <span className="text-sm font-medium capitalize">{trend}</span>
          </div>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="h-[200px] flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-secondary/50 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              Send a request to see trust score history
            </p>
          </div>
        </div>
      ) : (
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="trustGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(190, 95%, 55%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(190, 95%, 55%)" stopOpacity={0} />
                </linearGradient>
              </defs>

              {/* Zone backgrounds */}
              <ReferenceArea 
                y1={80} 
                y2={100} 
                fill="hsl(142, 76%, 45%)" 
                fillOpacity={0.08}
              />
              <ReferenceArea 
                y1={60} 
                y2={80} 
                fill="hsl(38, 92%, 50%)" 
                fillOpacity={0.08}
              />
              <ReferenceArea 
                y1={0} 
                y2={60} 
                fill="hsl(0, 72%, 55%)" 
                fillOpacity={0.08}
              />

              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="hsl(222, 47%, 18%)" 
                vertical={false}
              />
              
              <XAxis 
                dataKey="name" 
                tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 11 }}
                axisLine={{ stroke: 'hsl(222, 47%, 18%)' }}
                tickLine={{ stroke: 'hsl(222, 47%, 18%)' }}
              />
              
              <YAxis 
                domain={[0, 100]}
                ticks={[0, 20, 40, 60, 80, 100]}
                tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 11 }}
                axisLine={{ stroke: 'hsl(222, 47%, 18%)' }}
                tickLine={{ stroke: 'hsl(222, 47%, 18%)' }}
              />

              {/* Threshold lines */}
              <ReferenceLine 
                y={80} 
                stroke="hsl(142, 76%, 45%)" 
                strokeDasharray="4 4" 
                strokeOpacity={0.5}
              />
              <ReferenceLine 
                y={60} 
                stroke="hsl(38, 92%, 50%)" 
                strokeDasharray="4 4" 
                strokeOpacity={0.5}
              />

              <Tooltip content={<CustomTooltip />} />

              <Area
                type="monotone"
                dataKey="score"
                stroke="hsl(190, 95%, 55%)"
                strokeWidth={2}
                fill="url(#trustGradient)"
                dot={{
                  fill: 'hsl(190, 95%, 55%)',
                  stroke: 'hsl(222, 47%, 9%)',
                  strokeWidth: 2,
                  r: 4,
                }}
                activeDot={{
                  fill: 'hsl(190, 95%, 55%)',
                  stroke: 'hsl(190, 95%, 55%)',
                  strokeWidth: 2,
                  r: 6,
                  filter: 'drop-shadow(0 0 8px hsl(190, 95%, 55%))',
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-border/50">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-trust-healthy/30 border border-trust-healthy/50" />
          <span className="text-xs text-muted-foreground">Healthy (80-100)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-trust-degraded/30 border border-trust-degraded/50" />
          <span className="text-xs text-muted-foreground">Degraded (60-79)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-trust-critical/30 border border-trust-critical/50" />
          <span className="text-xs text-muted-foreground">Critical (0-59)</span>
        </div>
      </div>
    </div>
  );
};
