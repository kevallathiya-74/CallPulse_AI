import React, { useEffect, useRef, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';

const TrendTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="glass-card p-3 text-sm">
      <p className="text-text-muted">{label}</p>
      <p className="text-primary font-semibold">Avg Score: {payload[0].value}</p>
    </div>
  );
};

export default function QualityScoreTrend({ data = [] }) {
  const containerRef = useRef(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const resize = () => {
      const next = Math.max(0, Math.floor(el.clientWidth));
      setWidth(next);
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div className="w-full h-72 flex items-center justify-center text-text-muted text-sm">
        Quality score trend is not available yet.
      </div>
    );
  }

  const normalized = data.map((d) => ({
    date: d?.date ? new Date(d.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : '—',
    avg_score: Number(d?.avg_score ?? 0),
  }));

  return (
    <div ref={containerRef} className="w-full h-72">
      {width > 0 ? (
        <LineChart width={width} height={288} data={normalized} margin={{ top: 10, right: 24, left: 0, bottom: 10 }}>
          <defs>
            <linearGradient id="qualityTrendLine" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00D4FF" />
              <stop offset="100%" stopColor="#7B2FFF" />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="date" stroke="rgba(255,255,255,0)" tick={{ fill: 'rgba(232,244,253,0.5)', fontSize: 11 }} />
          <YAxis domain={[0, 100]} stroke="rgba(255,255,255,0)" tick={{ fill: 'rgba(232,244,253,0.5)', fontSize: 11 }} />
          <Tooltip content={<TrendTooltip />} />
          <Line
            type="monotone"
            dataKey="avg_score"
            stroke="url(#qualityTrendLine)"
            strokeWidth={2.5}
            dot={{ r: 3, fill: '#00D4FF', strokeWidth: 0 }}
            activeDot={{ r: 5, fill: '#00D4FF', stroke: 'rgba(0,212,255,0.25)', strokeWidth: 4 }}
          />
        </LineChart>
      ) : null}
    </div>
  );
}
