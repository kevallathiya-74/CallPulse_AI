import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  const row = payload[0]?.payload || {};
  const sentimentLabel = typeof row.segmentLabel === 'string' ? row.segmentLabel.trim() : '';
  const scoreValue = Number.isFinite(Number(payload[0].value))
    ? (Math.round(Number(payload[0].value) * 10) / 10).toFixed(1)
    : '0.0';

  const sentimentTone = /positive/i.test(sentimentLabel)
    ? 'text-success'
    : /negative/i.test(sentimentLabel)
      ? 'text-error'
      : 'text-warning';

  return (
    <div className="glass-card min-w-[170px] p-3 text-sm border border-border-default/60 shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
      <p className="text-text-muted text-xs uppercase tracking-wide">Segment #{label}</p>
      {sentimentLabel ? (
        <p className={`font-semibold mt-1 ${sentimentTone}`}>{sentimentLabel}</p>
      ) : null}
      <p className="text-primary font-semibold mt-1">Score: {scoreValue}</p>
    </div>
  );
};

export default function SentimentTimeline({ data = [], recoveryTime = null }) {
  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div className="w-full h-72 flex items-center justify-center text-text-muted text-sm">
        Sentiment timeline is not available yet.
      </div>
    );
  }

  const tickInterval = Math.max(0, Math.ceil(data.length / 8) - 1);
  const showDots = data.length <= 60;

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
        <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00D4FF" />
              <stop offset="100%" stopColor="#FF6B35" />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="x"
            stroke="rgba(232,244,253,0.3)"
            tick={{ fill: 'rgba(232,244,253,0.5)', fontSize: 11 }}
            interval={tickInterval}
            minTickGap={24}
            tickFormatter={(value) => String(value)}
            label={{ value: 'Call Timeline Segments', position: 'insideBottom', offset: -5, fill: 'rgba(232,244,253,0.4)', fontSize: 12 }}
          />
          <YAxis
            stroke="rgba(255,255,255,0)"
            tick={{ fill: 'rgba(232,244,253,0.5)', fontSize: 11 }}
            domain={[0, 100]}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(0,212,255,0.3)', strokeWidth: 1 }} />
          {recoveryTime && (
            <ReferenceLine
              x={recoveryTime}
              stroke="#00E676"
              strokeDasharray="4 2"
              label={{ value: 'Recovery', fill: '#00E676', fontSize: 11, position: 'insideTopRight' }}
            />
          )}
          <Line
            type="linear"
            dataKey="score"
            stroke="url(#lineGradient)"
            strokeWidth={2.5}
            dot={showDots ? { r: 2, fill: '#00D4FF', strokeWidth: 0 } : false}
            activeDot={{ r: 5, fill: '#00D4FF', stroke: 'rgba(0,212,255,0.3)', strokeWidth: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
