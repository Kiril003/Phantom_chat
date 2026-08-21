import React from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { BarChart3, TrendingUp, Sparkles } from 'lucide-react';
import { ChartData } from '../types';

interface ChartEmbedProps {
  data: ChartData;
}

export const ChartEmbed: React.FC<ChartEmbedProps> = ({ data }) => {
  return (
    <div className="space-y-3 pt-1 select-none">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 pb-1 border-b border-[#E8DFD1]">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-[#FCE7D8] text-[#E87A42] rounded-lg">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-xs sm:text-sm text-[#1F2521] leading-tight">
              {data.title}
            </h4>
            <span className="text-[10px] text-[#717E75] uppercase tracking-wider font-semibold">
              Інтерактивна візуалізація
            </span>
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="w-full h-52 pt-2 bg-white rounded-xl border border-[#DFD6C5] p-2">
        <ResponsiveContainer width="100%" height="100%">
          {data.type === 'line' ? (
            <LineChart data={data.data || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0EBE1" />
              <XAxis dataKey="name" tick={{ fill: '#77847A', fontSize: 10 }} stroke="#DFD6C5" />
              <YAxis tick={{ fill: '#77847A', fontSize: 10 }} stroke="#DFD6C5" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FAF8F3',
                  borderRadius: '12px',
                  border: '1px solid #DFD6C5',
                  fontSize: '11px',
                  color: '#1F2521',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
              {(data.keys || []).map((k) => (
                <Line
                  key={k.key}
                  type="monotone"
                  dataKey={k.key}
                  name={k.label}
                  stroke={k.color || '#E87A42'}
                  strokeWidth={2.5}
                  dot={{ fill: k.color || '#E87A42', r: 4 }}
                />
              ))}
            </LineChart>
          ) : (
            <BarChart data={data.data || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0EBE1" />
              <XAxis dataKey="name" tick={{ fill: '#77847A', fontSize: 10 }} stroke="#DFD6C5" />
              <YAxis tick={{ fill: '#77847A', fontSize: 10 }} stroke="#DFD6C5" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FAF8F3',
                  borderRadius: '12px',
                  border: '1px solid #DFD6C5',
                  fontSize: '11px',
                  color: '#1F2521',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
              {(data.keys || []).map((k) => (
                <Bar
                  key={k.key}
                  dataKey={k.key}
                  name={k.label}
                  fill={k.color || '#E87A42'}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Takeaway note if provided */}
      {data.takeaway && (
        <div className="p-2 bg-[#FCE7D8]/60 border border-[#F6CBB0] rounded-xl flex items-start gap-2 text-xs text-[#8A461A]">
          <TrendingUp className="w-3.5 h-3.5 text-[#E87A42] shrink-0 mt-0.5" />
          <span>{data.takeaway}</span>
        </div>
      )}
    </div>
  );
};
