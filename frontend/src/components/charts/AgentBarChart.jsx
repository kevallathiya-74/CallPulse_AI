import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card p-3 text-sm">
      <p className="text-text-muted">{label}</p>
      <p className="text-primary font-semibold">Score: {payload[0].value} / 100</p>
    </div>
  );
};

export default function AgentBarChart({ data = [] }) {
  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
        <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 8 }} barCategoryGap="48%">
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fill: 'rgba(232,244,253,0.5)', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            stroke="rgba(255,255,255,0)"
          />
          <YAxis
            tick={{ fill: 'rgba(232,244,253,0.5)', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            stroke="rgba(255,255,255,0)"
            domain={[0, 100]}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
          <Bar dataKey="score" radius={[8, 8, 0, 0]} maxBarSize={56} minPointSize={4}>
            {data.map((entry, index) => {
              const t = index / Math.max(data.length - 1, 1);
              return <Cell key={index} fill={`rgba(0,212,255,${0.4 + t * 0.5})`} />;
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
