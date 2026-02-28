'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  Cell
} from 'recharts';
import { Loader2, Users } from 'lucide-react';

const COLORS = ['#0A192F', '#FFD700', '#9333ea', '#10b981', '#f59e0b'];

export default function AffinityStats() {
  const { data: stats = [], isLoading } = useQuery({
    queryKey: ['affinity-stats'],
    queryFn: api.getAffinityStats,
  });

  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <Loader2 className="animate-spin text-gray-400" size={32} />
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-gray-900 flex items-center">
          <Users size={18} className="mr-2 text-blue-600" />
          Professional Hub Growth
        </h3>
        <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded-full font-bold">TOP 5 HUBS</span>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={stats} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f3f4f6" />
            <XAxis type="number" hide />
            <YAxis 
              dataKey="name" 
              type="category" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fontWeight: 'bold', fill: '#4b5563' }}
              width={100}
            />
            <Tooltip 
              cursor={{ fill: '#f9fafb' }}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
            <Bar dataKey="users" name="Verified Members" fill="#0A192F" radius={[0, 4, 4, 0]} barSize={12} />
            <Bar dataKey="rideVolume" name="Monthly Rides" fill="#FFD700" radius={[0, 4, 4, 0]} barSize={12} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-50">
        <p className="text-[10px] text-gray-400 font-medium leading-relaxed">
          * Ride volume is an aggregate of both Contribution and Rotation modes within each corporate domain.
        </p>
      </div>
    </div>
  );
}
