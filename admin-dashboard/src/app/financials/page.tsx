'use client';

import React, { useState } from 'react';
import { 
  Wallet, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  Check, 
  X, 
  CreditCard, 
  DollarSign, 
  TrendingUp, 
  Loader2, 
  Activity, 
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  BarChart3
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, FinancialData, Transaction } from '@/lib/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function FinancialsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'QUEUE' | 'HISTORY'>('QUEUE');

  const { data, isLoading, error } = useQuery({
    queryKey: ['financials'],
    queryFn: api.getFinancials,
    refetchInterval: 30000,
  });

  const chartData = data?.dailyVolume || [];

  const { data: payoutHistory } = useQuery({
    queryKey: ['payout-history'],
    queryFn: api.getPayoutHistory,
    enabled: activeTab === 'HISTORY',
  });

  const payoutMutation = useMutation({
    mutationFn: ({ id, status }: { id: string, status: 'APPROVED' | 'REJECTED' }) => 
      api.payoutAction(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financials'] });
      queryClient.invalidateQueries({ queryKey: ['payout-history'] });
    }
  });

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-[#0A192F]" size={48} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center text-red-500">
          <AlertTriangle size={48} className="mx-auto mb-4" />
          <h2 className="text-xl font-bold">Failed to load financial data</h2>
          <p className="mt-2 text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  const pendingPayouts = data?.recentTransactions?.filter(tx => tx.type === 'WITHDRAWAL' && tx.status === 'PENDING') || [];

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">FINANCIAL ARCHITECTURE</h1>
          <p className="text-gray-500 mt-1 italic font-medium">Audit and governance of the GHS/CP closed-loop economy.</p>
        </div>
        <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-2xl border border-gray-100 shadow-sm text-xs font-bold text-gray-500">
           <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
           <span>LIVE LEDGER</span>
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <div className="md:col-span-2 bg-[#0A192F] text-white p-8 rounded-3xl shadow-2xl relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-blue-300 text-xs font-black uppercase tracking-[0.2em] mb-2">Total System Liquidity</p>
            <h2 className="text-5xl font-black text-[#FFD700]">GHS {Number(data?.totalSystemBalance || 0).toLocaleString()}</h2>
            <div className="flex items-center mt-6 space-x-4">
               <div className="flex items-center text-green-400 text-xs font-bold bg-green-400/10 px-3 py-1.5 rounded-full backdrop-blur-sm">
                  <TrendingUp size={14} className="mr-1.5" /> +12.5% vs last week
               </div>
               <div className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Calculated Real-time</div>
            </div>
          </div>
          <Wallet size={180} className="absolute -bottom-10 -right-10 text-white/5 rotate-12 group-hover:rotate-0 transition-transform duration-700" />
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
           <div className="flex justify-between items-start mb-4">
              <div className="bg-orange-100 p-3 rounded-2xl text-orange-600">
                 <Clock size={24} />
              </div>
              <span className="text-[10px] font-black text-orange-600 uppercase bg-orange-50 px-2.5 py-1.5 rounded-xl border border-orange-100">Awaiting</span>
           </div>
           <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Pending Payouts</p>
           <h2 className="text-2xl font-black text-gray-900 mt-1">GHS {Number(data?.pendingPayoutAmount || 0).toLocaleString()}</h2>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
           <div className="flex justify-between items-start mb-4">
              <div className="bg-blue-100 p-3 rounded-2xl text-blue-600">
                 <DollarSign size={24} />
              </div>
              <span className="text-[10px] font-black text-blue-600 uppercase bg-blue-50 px-2.5 py-1.5 rounded-xl border border-blue-100">Escrow</span>
           </div>
           <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Commute Points</p>
           <h2 className="text-2xl font-black text-gray-900 mt-1">14,250 CP</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-10">
           {/* Volume Chart */}
           <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.2em] flex items-center">
                   <BarChart3 size={16} className="mr-2 text-purple-600" /> Revenue Volume Flow (GHS)
                </h3>
                <div className="flex space-x-2">
                   <span className="flex items-center text-[10px] font-bold text-gray-400"><span className="w-2 h-2 rounded-full bg-[#0A192F] mr-1.5"></span> High Vol</span>
                   <span className="flex items-center text-[10px] font-bold text-gray-400"><span className="w-2 h-2 rounded-full bg-purple-500 mr-1.5"></span> Normal</span>
                </div>
              </div>
              <div className="h-64">
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                       <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} />
                       <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} />
                       <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}} />
                       <Bar dataKey="volume" radius={[8, 8, 0, 0]}>
                          {chartData.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={entry.volume > (Math.max(...chartData.map(d => d.volume)) * 0.7) ? '#0A192F' : '#9333ea'} />
                          ))}
                       </Bar>
                    </BarChart>
                 </ResponsiveContainer>
              </div>
           </div>

           {/* Payout Tabs */}
           <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden border-t-4 border-t-[#0A192F]">
              <div className="flex p-2 bg-gray-50/50">
                 <button 
                    onClick={() => setActiveTab('QUEUE')}
                    className={`flex-1 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${activeTab === 'QUEUE' ? 'bg-[#0A192F] text-[#FFD700] shadow-lg shadow-[#0A192F]/20' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                 >
                    Approval Queue ({pendingPayouts.length})
                 </button>
                 <button 
                    onClick={() => setActiveTab('HISTORY')}
                    className={`flex-1 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${activeTab === 'HISTORY' ? 'bg-[#0A192F] text-[#FFD700] shadow-lg shadow-[#0A192F]/20' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                 >
                    Payout History
                 </button>
              </div>

              <div className="divide-y max-h-[500px] overflow-y-auto">
                 {activeTab === 'QUEUE' ? (
                    pendingPayouts.map((tx) => (
                       <div key={tx.id} className="p-6 flex items-center justify-between hover:bg-gray-50/80 transition-colors border-l-4 border-l-transparent hover:border-l-orange-500">
                          <div className="flex items-center space-x-4">
                             <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center font-black text-lg">
                                {tx.user?.fullName?.[0]}
                             </div>
                             <div>
                                <p className="text-sm font-black text-gray-900">{tx.user?.fullName}</p>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">REF: {tx.id.slice(0,8)} • {new Date(tx.createdAt).toLocaleDateString()}</p>
                             </div>
                          </div>
                          <div className="flex items-center space-x-6">
                             <p className="text-lg font-black text-gray-900">GHS {Number(tx.amount).toLocaleString()}</p>
                             <div className="flex space-x-2">
                                <button 
                                   onClick={() => payoutMutation.mutate({ id: tx.id, status: 'APPROVED' })}
                                   disabled={payoutMutation.isPending}
                                   className="bg-green-600 text-white p-2.5 rounded-xl hover:bg-green-700 transition-all shadow-lg shadow-green-600/20 active:scale-95"
                                >
                                   <Check size={20} />
                                </button>
                                <button 
                                   onClick={() => payoutMutation.mutate({ id: tx.id, status: 'REJECTED' })}
                                   disabled={payoutMutation.isPending}
                                   className="bg-white text-red-600 p-2.5 rounded-xl hover:bg-red-50 transition-all border border-red-100 active:scale-95"
                                >
                                   <X size={20} />
                                </button>
                             </div>
                          </div>
                       </div>
                    ))
                 ) : (
                    payoutHistory?.map((tx) => (
                       <div key={tx.id} className="p-6 flex items-center justify-between hover:bg-gray-50/80 transition-colors border-l-4 border-l-transparent">
                          <div className="flex items-center space-x-4">
                             <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black ${tx.status === 'SUCCESSFUL' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                {tx.status === 'SUCCESSFUL' ? <CheckCircle2 size={22} /> : <XCircle size={22} />}
                             </div>
                             <div>
                                <p className="text-sm font-black text-gray-900">{tx.user?.fullName}</p>
                                <p className="text-[10px] text-gray-400 font-bold uppercase">{new Date(tx.createdAt).toLocaleDateString()} • {new Date(tx.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                             </div>
                          </div>
                          <div className="text-right">
                             <p className="text-sm font-black text-gray-900">GHS {Number(tx.amount).toLocaleString()}</p>
                             <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-md ${tx.status === 'SUCCESSFUL' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                {tx.status}
                             </span>
                          </div>
                       </div>
                    ))
                 )}
                 {activeTab === 'QUEUE' && pendingPayouts.length === 0 && (
                    <div className="p-16 text-center">
                       <div className="bg-gray-100 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4 text-gray-300">
                          <Clock size={32} />
                       </div>
                       <p className="text-gray-400 italic text-sm font-medium">The approval queue is currently empty.</p>
                       <p className="text-gray-300 text-[10px] font-black uppercase tracking-widest mt-1">Zero Pending Actions</p>
                    </div>
                 )}
              </div>
           </div>
        </div>

        {/* Real-time Ledger Sidebar */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-fit sticky top-8">
           <div className="p-6 border-b bg-gray-50/50">
              <h3 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.2em] flex items-center">
                 <Activity size={14} className="mr-2 text-blue-600" /> System-wide Ledger
              </h3>
           </div>
           <div className="divide-y overflow-y-auto max-h-[700px] ledger-scrollbar">
              {data?.recentTransactions?.map((tx) => (
                <div key={tx.id} className="p-4 hover:bg-gray-50 transition-colors">
                   <div className="flex justify-between items-start mb-1">
                      <span className="text-[9px] font-black text-gray-900 uppercase tracking-tighter truncate max-w-[120px]">
                         {tx.user?.fullName || 'System'}
                      </span>
                      <span className={`text-[10px] font-black ${tx.type === 'TOPUP' || tx.type === 'RIDE_PAYMENT' ? 'text-green-600' : 'text-red-600'}`}>
                         {tx.type === 'TOPUP' || tx.type === 'RIDE_PAYMENT' ? '+' : '-'} GHS {Number(tx.amount).toLocaleString()}
                      </span>
                   </div>
                   <div className="flex justify-between items-center">
                      <span className="text-[8px] text-gray-400 font-bold uppercase tracking-widest">{tx.type.replace('_', ' ')}</span>
                      <span className="text-[8px] text-gray-400 font-mono italic">{new Date(tx.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                   </div>
                </div>
              ))}
           </div>
           <div className="p-4 bg-gray-50 border-t">
              <button className="w-full py-3 bg-white border border-gray-200 rounded-2xl text-[10px] font-black text-gray-500 uppercase tracking-widest hover:bg-gray-100 transition-colors">
                 Download Ledger (.CSV)
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}

