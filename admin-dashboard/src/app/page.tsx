'use client';

import React from 'react';
import { 
  Users, 
  ShieldCheck, 
  TrendingUp, 
  Activity, 
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const chartData = [
  { name: 'Mon', revenue: 4200 },
  { name: 'Tue', revenue: 3800 },
  { name: 'Wed', revenue: 5100 },
  { name: 'Thu', revenue: 4800 },
  { name: 'Fri', revenue: 6200 },
  { name: 'Sat', revenue: 7500 },
  { name: 'Sun', revenue: 6800 },
];

export default function DashboardPage() {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: api.getStats,
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0f172a]">
        <Loader2 className="animate-spin text-[#FFD700]" size={48} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 bg-[#0f172a] min-h-screen flex items-center justify-center">
        <div className="text-center text-red-400">
          <AlertTriangle size={48} className="mx-auto mb-4" />
          <h2 className="text-xl font-bold">Data Synchronization Error</h2>
          <p className="mt-2 text-sm opacity-70">{(error as any).message}</p>
        </div>
      </div>
    );
  }

  const kpis = [
    { 
      label: 'Active Users', 
      value: stats?.totalUsers.toLocaleString() || '1,240', 
      change: '+12.5%', 
      isPositive: true, 
      icon: Users 
    },
    { 
      label: 'Active Pods', 
      value: '84', 
      change: '+5.2%', 
      isPositive: true, 
      icon: Activity 
    },
    { 
      label: 'Pending KYC', 
      value: stats?.pendingVerifications.toString() || '18', 
      change: '-3', 
      isPositive: true, 
      icon: ShieldCheck,
      isWarning: (stats?.pendingVerifications || 0) > 10
    },
    { 
      label: "Today's Revenue", 
      value: `GH₵ ${stats?.totalRevenue.toLocaleString() || '4,250'}`, 
      change: '+18.2%', 
      isPositive: true, 
      icon: TrendingUp 
    },
  ];

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Welcome back, Admin.</h1>
        <p className="text-slate-400 mt-2">Here is what's happening with CommuteShare GH today.</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-[#1a2333] p-6 rounded-2xl border border-slate-800 hover:border-[#FFD700]/30 transition-all group">
            <div className="flex justify-between items-start">
              <div className="p-3 bg-slate-800 rounded-xl group-hover:bg-[#FFD700]/10 transition-colors">
                <kpi.icon size={24} className="text-[#FFD700]" />
              </div>
              <div className={`flex items-center space-x-1 text-xs font-bold ${
                kpi.isWarning ? 'text-yellow-500' : kpi.isPositive ? 'text-green-500' : 'text-red-500'
              }`}>
                <span>{kpi.change}</span>
                {kpi.isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              </div>
            </div>
            <div className="mt-4">
              <p className="text-slate-400 text-sm font-medium">{kpi.label}</p>
              <p className="text-2xl font-bold text-white mt-1">{kpi.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="bg-[#1a2333] p-8 rounded-2xl border border-slate-800">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl font-bold text-white">Weekly Revenue</h3>
            <p className="text-sm text-slate-400">Platform earnings across all active routes</p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-slate-400">
            <div className="w-3 h-3 bg-[#FFD700] rounded-full"></div>
            <span>Revenue (GHS)</span>
          </div>
        </div>
        
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FFD700" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#FFD700" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2d3748" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{fontSize: 12, fill: '#718096'}} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{fontSize: 12, fill: '#718096'}} 
              />
              <Tooltip 
                contentStyle={{backgroundColor: '#1a2333', border: '1px solid #2d3748', borderRadius: '12px', color: '#fff'}}
                itemStyle={{color: '#FFD700'}}
              />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="#FFD700" 
                fillOpacity={1} 
                fill="url(#colorRev)" 
                strokeWidth={3}
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
