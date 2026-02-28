'use client';

import React, { useState } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  FileText, 
  ShieldCheck, 
  UserCheck, 
  Search,
  ExternalLink,
  MoreVertical,
  AlertTriangle,
  BadgeCheck
} from 'lucide-react';

interface Verification {
  id: string;
  name: string;
  role: 'Driver' | 'Rider';
  ghanaCardId: string;
  company: string;
  dateSubmitted: string;
  riskScore: 'Low' | 'Medium' | 'High';
  avatar: string;
}

const initialVerifications: Verification[] = [
  {
    id: '1',
    name: 'Kofi Mensah',
    role: 'Driver',
    ghanaCardId: 'GHA-712345678-9',
    company: 'Stanbic Bank',
    dateSubmitted: '2026-02-26 09:15',
    riskScore: 'Low',
    avatar: 'K'
  },
  {
    id: '2',
    name: 'Ama Serwaa',
    role: 'Rider',
    ghanaCardId: 'GHA-823456789-0',
    company: 'MTN Ghana',
    dateSubmitted: '2026-02-26 14:30',
    riskScore: 'Low',
    avatar: 'A'
  },
  {
    id: '3',
    name: 'Kwame Boateng',
    role: 'Driver',
    ghanaCardId: 'GHA-123456789-1',
    company: 'Ecobank Ghana',
    dateSubmitted: '2026-02-27 08:45',
    riskScore: 'Medium',
    avatar: 'K'
  },
  {
    id: '4',
    name: 'Esi Osei',
    role: 'Rider',
    ghanaCardId: 'GHA-934567890-2',
    company: 'Vodafone Ghana',
    dateSubmitted: '2026-02-27 10:20',
    riskScore: 'Low',
    avatar: 'E'
  }
];

export default function KYCPage() {
  const [verifications, setVerifications] = useState<Verification[]>(initialVerifications);

  const handleProcess = (id: string) => {
    setVerifications(prev => prev.filter(v => v.id !== id));
  };

  return (
    <div className="p-8 bg-slate-900 min-h-screen text-slate-200">
      {/* Header */}
      <div className="flex justify-between items-end mb-10">
        <div>
          <div className="flex items-center space-x-2 text-[#FFD700] mb-2">
            <ShieldCheck size={20} />
            <span className="text-xs font-black uppercase tracking-[0.2em]">Security Protocol</span>
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight">Trust & Verification Center</h1>
          <p className="text-slate-400 mt-2 max-w-2xl">
            Review pending Ghana Card and Work Email verifications to maintain platform integrity. 
            Maintain "Inbox Zero" for optimal system health.
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-right mr-4">
            <p className="text-[10px] text-slate-500 font-bold uppercase">Pending Review</p>
            <p className="text-2xl font-black text-[#FFD700]">{verifications.length}</p>
          </div>
          <div className="h-10 w-px bg-slate-800"></div>
          <button className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all border border-slate-700 flex items-center">
            <Search size={16} className="mr-2" /> Filter
          </button>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-slate-800 rounded-3xl border border-slate-700 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-800/50">
                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Applicant</th>
                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Identity & Corporate</th>
                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Risk Assessment</th>
                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Date Submitted</th>
                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {verifications.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle size={32} />
                      </div>
                      <h3 className="text-xl font-bold text-white">Inbox Zero Reached</h3>
                      <p className="text-slate-500 mt-1">All pending verifications have been processed.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                verifications.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-700/30 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 rounded-full bg-[#0A192F] flex items-center justify-center text-[#FFD700] font-bold border border-slate-700">
                          {v.avatar}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{v.name}</p>
                          <div className="flex items-center mt-1">
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                              v.role === 'Driver' 
                                ? 'bg-[#FFD700]/10 text-[#FFD700]' 
                                : 'bg-blue-500/10 text-blue-400'
                            }`}>
                              {v.role}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="space-y-1">
                        <div className="flex items-center text-xs text-slate-300 font-mono">
                          <FileText size={14} className="mr-2 text-slate-500" />
                          {v.ghanaCardId}
                        </div>
                        <div className="flex items-center text-xs text-slate-400">
                          <BadgeCheck size={14} className="mr-2 text-blue-400" />
                          {v.company}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${
                          v.riskScore === 'Low' ? 'bg-green-500' : 'bg-yellow-500'
                        }`}></div>
                        <span className={`text-xs font-bold ${
                          v.riskScore === 'Low' ? 'text-green-500' : 'text-yellow-500'
                        }`}>
                          {v.riskScore} Risk
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-xs text-slate-400 font-medium">
                      {v.dateSubmitted}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => handleProcess(v.id)}
                          className="flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-green-500/30 text-green-500 hover:bg-green-500 hover:text-white transition-all text-xs font-bold"
                        >
                          <CheckCircle size={14} />
                          <span>Approve</span>
                        </button>
                        <button 
                          onClick={() => handleProcess(v.id)}
                          className="flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white transition-all text-xs font-bold"
                        >
                          <XCircle size={14} />
                          <span>Reject</span>
                        </button>
                        <button className="p-2 text-slate-500 hover:text-white transition-colors">
                          <MoreVertical size={18} />
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

      {/* Footer Info */}
      <div className="mt-8 flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-slate-500">
        <div className="flex items-center space-x-6">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            All Identity Services Operational
          </div>
          <div className="flex items-center">
            <AlertTriangle size={12} className="mr-2 text-yellow-500" />
            2 Pending Escalations
          </div>
        </div>
        <div className="flex items-center space-x-2 cursor-pointer hover:text-white transition-colors">
          <span>Verification Log Architecture</span>
          <ExternalLink size={12} />
        </div>
      </div>
    </div>
  );
}
