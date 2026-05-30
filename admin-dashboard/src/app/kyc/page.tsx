'use client';

import React from 'react';
import { 
  CheckCircle, 
  XCircle, 
  FileText, 
  ShieldCheck, 
  Search,
  MoreVertical,
  AlertTriangle,
  BadgeCheck,
  Loader2
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, VerificationRequest } from '@/lib/api';

export default function KYCPage() {
  const queryClient = useQueryClient();

  const { data: verifications, isLoading, error } = useQuery({
    queryKey: ['pending-verifications'],
    queryFn: api.getPendingVerifications,
    refetchInterval: 30000,
  });

  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'APPROVED' | 'REJECTED' }) => 
      api.verificationAction(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-verifications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });

  const handleProcess = (id: string, status: 'APPROVED' | 'REJECTED') => {
    mutation.mutate({ id, status });
  };

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
          <h2 className="text-xl font-bold">Failed to load verifications</h2>
          <p className="mt-2 text-sm">{(error as any).message}</p>
        </div>
      </div>
    );
  }

  const verificationsList = (verifications || []) as VerificationRequest[];

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
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-right mr-4">
            <p className="text-[10px] text-slate-500 font-bold uppercase">Pending Review</p>
            <p className="text-2xl font-black text-[#FFD700]">{verificationsList.length}</p>
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
                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Identity & Type</th>
                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Date Submitted</th>
                <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {verificationsList.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center">
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
                verificationsList.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-700/30 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 rounded-full bg-[#0A192F] flex items-center justify-center text-[#FFD700] font-bold border border-slate-700">
                          {v.user.fullName[0]}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{v.user.fullName}</p>
                          <p className="text-[10px] text-slate-400">{v.user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="space-y-1">
                        <div className="flex items-center text-xs text-slate-300 font-mono">
                          <FileText size={14} className="mr-2 text-slate-500" />
                          {v.idNumber}
                        </div>
                        <div className="flex items-center text-xs text-slate-400">
                          <BadgeCheck size={14} className="mr-2 text-blue-400" />
                          {v.type.replace('_', ' ')}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-xs text-slate-400 font-medium">
                      {new Date(v.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => handleProcess(v.id, 'APPROVED')}
                          disabled={mutation.isPending}
                          className="flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-green-500/30 text-green-500 hover:bg-green-500 hover:text-white transition-all text-xs font-bold disabled:opacity-50"
                        >
                          <CheckCircle size={14} />
                          <span>Approve</span>
                        </button>
                        <button 
                          onClick={() => handleProcess(v.id, 'REJECTED')}
                          disabled={mutation.isPending}
                          className="flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white transition-all text-xs font-bold disabled:opacity-50"
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
    </div>
  );
}
