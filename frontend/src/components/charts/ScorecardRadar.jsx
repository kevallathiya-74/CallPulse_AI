import React from 'react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Legend, Tooltip,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload) return null;
  return (
    <div className="glass-card p-3 text-sm min-w-[160px]">
      <p className="text-text-primary font-semibold mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex justify-between gap-4">
          <span style={{ color: p.stroke }}>{p.name}</span>
          <span className="text-text-primary font-medium">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function ScorecardRadar({ data = [] }) {
  const chartData = Array.isArray(data) ? data.filter((item) => Number.isFinite(item?.agent)) : [];

  if (chartData.length === 0) {
    return (
      <div className="w-full h-80 flex items-center justify-center text-text-muted text-sm">
        Dimension scorecard is not available yet.
      </div>
    );
  }

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
        <RadarChart data={chartData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
          <PolarGrid stroke="rgba(255,255,255,0.07)" />
          <PolarAngleAxis
            dataKey="dimension"
            tick={{ fill: 'rgba(232,244,253,0.6)', fontSize: 11, fontFamily: 'Outfit, sans-serif' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Radar
            name="This Agent"
            dataKey="agent"
            stroke="#00D4FF"
            fill="#00D4FF"
            fillOpacity={0.12}
            strokeWidth={2}
          />
          <Legend
            wrapperStyle={{ color: '#E8F4FD', fontSize: 12, fontFamily: 'Outfit, sans-serif' }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
