import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DataPoint {
  time: string;
  value: number;
}

interface ChartProps {
  data: DataPoint[];
}

const MetabolicChart: React.FC<ChartProps> = ({ data }) => {
  return (
    <div style={{ width: '100%', height: 200 }}>
      <ResponsiveContainer>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#58a6ff" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#58a6ff" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#30363d" />
          <XAxis 
            dataKey="time" 
            hide 
          />
          <YAxis 
            domain={[60, 200]} 
            stroke="#8b949e" 
            fontSize={10} 
            tickFormatter={(val) => `${val}`}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '8px' }}
            itemStyle={{ color: '#58a6ff' }}
          />
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke="#58a6ff" 
            fillOpacity={1} 
            fill="url(#colorValue)" 
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MetabolicChart;
