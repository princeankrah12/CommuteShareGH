'use client';

import React, { useState } from 'react';
import { 
  Wallet, 
  ArrowRightLeft, 
  CheckCircle, 
  XCircle, 
  CreditCard,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  Clock,
  Smartphone
} from 'lucide-react';

interface PayoutRequest {
  id: string;
  driverName: string;
  momoNumber: string;
  network: 'MTN' | 'Telecel';
  pointsToCashOut: number;
  ghsValue: number;
  requestDate: string;
}

const initialPayouts: PayoutRequest[] = [
  {
    id: 'p1',
    driverName: 'Emanuel Tetteh',
    momoNumber: '024 123 4567',
    network: 'MTN',
    pointsToCashOut: 500,
    ghsValue: 500.00,
    requestDate: '2026-02-27 08:30'
  },
  {
    id: 'p2',
    driverName: 'Sena Agbenu',
    momoNumber: '020 987 6543',
    network: 'Telecel',
    pointsToCashOut: 350,
    ghsValue: 350.00,
    requestDate: '2026-02-27 09:15'
  },
  {
    id: 'p3',
    driverName: 'Kojo Antwi',
    momoNumber: '024 444 5555',
    network: 'MTN',
    pointsToCashOut: 250,
    ghsValue: 250.00,
    requestDate: '2026-02-27 11:00'
  },
  {
    id: 'p4',
    driverName: 'Araba Quansah',
    momoNumber: '054 888 9999',
    network: 'MTN',
    pointsToCashOut: 150,
    ghsValue: 150.00,
    requestDate: '2026-02-27 12:45'
  }
];

export default function FinancePage() {
  const [pendingPayouts, setPendingPayouts] = useState<PayoutRequest[]>(initialPayouts);

  const handleProcess = (id: string) => {
    setPendingPayouts(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div className="p-8 bg-slate-900 min-h-screen text-slate-200">
      {/* Header */}
      <div className="flex justify-between items-end mb-10">
        <div>
          <div className="flex items-center space-x-2 text-[#FFD700] mb-2">
            <Wallet size={20} />
            <span className="text-xs font-black uppercase tracking-[0.2em]">Fiscal Governance</span>
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight">Treasury & Payouts</h1>
          <p className="text-slate-400 mt-2 max-w-2xl">
            Monitor platform revenue and process driver Mobile Money disbursements. 
            Ensure liquidity ratios remain within operational safety margins.
          </p>
        </div>
        <div className="flex items-center space-x-2 bg-slate-800 px-4 py-2 rounded-xl border border-slate-700 text-xs font-bold text-slate-400">
           <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse mr-1" />
           <span>PAYMENT GATEWAY ONLINE</span>
        </div>
      </div>

      {/* Financial KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-[#1a2333] p-6 rounded-2xl border border-slate-800 shadow-lg">
           <div className="flex justify-between items-start mb-4">
              <div className="bg-green-500/10 p-3 rounded-xl text-green-500">
                 <TrendingUp size={24} />
              </div>
              <span className="text-[10px] font-black text-green-500 bg-green-500/5 px-2 py-1 rounded-md border border-green-500/20">MONTHLY</span>
           </div>
           <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Total MoMo Top-Ups</p>
           <h2 className="text-3xl font-black text-green-400 mt-2">GHS 24,500.00</h2>
           <div className="mt-4 flex items-center text-[10px] text-slate-400">
              <ArrowUpRight size={12} className="mr-1 text-green-500" />
              <span className="text-green-500 font-bold">+12.5%</span> 
              <span className="ml-1">from last month</span>
           </div>
        </div>

        <div className="bg-[#1a2333] p-6 rounded-2xl border border-slate-800 shadow-lg">
           <div className="flex justify-between items-start mb-4">
              <div className="bg-blue-500/10 p-3 rounded-xl text-blue-400">
                 <ArrowRightLeft size={24} />
              </div>
              <span className="text-[10px] font-black text-blue-400 bg-blue-500/5 px-2 py-1 rounded-md border border-blue-400/20">LIABILITY</span>
           </div>
           <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Points in Circulation</p>
           <h2 className="text-3xl font-black text-white mt-2">18,240 CP</h2>
           <p className="mt-4 text-[10px] text-slate-400 flex items-center">
              <CreditCard size={12} className="mr-1" />
              Platform points-to-GHS coverage: 100%
           </p>
        </div>

        <div className="bg-[#1a2333] p-6 rounded-2xl border border-slate-800 shadow-lg border-l-4 border-l-[#FFD700]">
           <div className="flex justify-between items-start mb-4">
              <div className="bg-[#FFD700]/10 p-3 rounded-xl text-[#FFD700]">
                 <AlertTriangle size={24} />
              </div>
              <span className="text-[10px] font-black text-[#FFD700] bg-[#FFD700]/5 px-2 py-1 rounded-md border border-[#FFD700]/20">ACTION REQ</span>
           </div>
           <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Pending Payouts</p>
           <h2 className="text-3xl font-black text-[#FFD700] mt-2">GHS 1,250.00</h2>
           <div className="mt-4 flex items-center text-[10px] text-yellow-500 font-bold">
              <Clock size={12} className="mr-1" />
              {pendingPayouts.length} Driver requests awaiting processing
           </div>
        </div>
      </div>

      {/* Payout Queue Table */}
      <div className="bg-slate-800 rounded-3xl border border-slate-700 shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-700 bg-slate-800/50 flex justify-between items-center">
          <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">Disbursement Queue</h3>
          <button className="text-[10px] font-black text-[#FFD700] uppercase hover:underline">Batch Process All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-900/20">
                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Driver</th>
                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">MoMo Details</th>
                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Amount (CP → GHS)</th>
                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Requested Date</th>
                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {pendingPayouts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle size={32} />
                      </div>
                      <h3 className="text-xl font-bold text-white">Queue Cleared</h3>
                      <p className="text-slate-500 mt-1">All driver payouts have been disbursed successfully.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                pendingPayouts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-700/30 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-[#FFD700] font-black border border-slate-700">
                          {p.driverName.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{p.driverName}</p>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">DRIVER ID: {p.id.toUpperCase()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="space-y-1">
                        <div className="flex items-center text-xs text-slate-300 font-mono">
                          <Smartphone size={14} className="mr-2 text-slate-500" />
                          {p.momoNumber}
                        </div>
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase ${
                          p.network === 'MTN' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-red-500/10 text-red-500'
                        }`}>
                          {p.network}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="space-y-1">
                        <p className="text-sm font-black text-white">{p.pointsToCashOut} CP</p>
                        <p className="text-xs text-green-400 font-bold">GHS {p.ghsValue.toFixed(2)}</p>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-xs text-slate-400 font-medium">
                      {p.requestDate}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => handleProcess(p.id)}
                          className="flex items-center space-x-1 px-4 py-2 rounded-xl border border-green-500/30 text-green-500 hover:bg-green-500 hover:text-white transition-all text-xs font-bold"
                        >
                          <CheckCircle size={14} />
                          <span>Approve & Disburse</span>
                        </button>
                        <button 
                          onClick={() => handleProcess(p.id)}
                          className="flex items-center space-x-1 px-3 py-2 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white transition-all text-xs font-bold"
                        >
                          <XCircle size={14} />
                          <span>Reject</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
