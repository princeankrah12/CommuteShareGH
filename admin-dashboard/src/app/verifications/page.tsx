'use client';

import React from 'react';
import { ShieldCheck, CheckCircle, XCircle, Clock, Search, ExternalLink, Loader2, AlertTriangle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { processVerificationAction } from '@/app/actions';

export default function VerificationsPage() {
  const queryClient = useQueryClient();

  const { data: verifications = [], isLoading, error } = useQuery({
    queryKey: ['pending-verifications'],
    queryFn: api.getPendingVerifications,
    refetchInterval: 60000,
  });

  const handleAction = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    // 1. Optimistic Update (Immediate UI response)
    const result = await processVerificationAction(id, status as any);
    
    if (result.success) {
      // 2. Refetch to sync with server
      queryClient.invalidateQueries({ queryKey: ['pending-verifications'] });
    } else {
      alert('Action failed');
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Verification Hub</h1>
          <p className="text-gray-500">Review and approve Ghana Card and Corporate credentials.</p>
        </div>
        <div className="flex space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by name or ID..." 
              className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#0A192F] outline-none"
            />
          </div>
          <button className="bg-[#0A192F] text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition-colors">
            Bulk Approve
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="bg-yellow-100 p-3 rounded-lg text-yellow-600">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Pending</p>
            <p className="text-xl font-bold">{verifications.length}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="bg-blue-100 p-3 rounded-lg text-blue-600">
            <ShieldCheck size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Ghana Cards</p>
            <p className="text-xl font-bold">{verifications.filter(v => v.type === 'GHANA_CARD').length}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="bg-green-100 p-3 rounded-lg text-green-600">
            <CheckCircle size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Approved Today</p>
            <p className="text-xl font-bold">0</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="bg-red-100 p-3 rounded-lg text-red-600">
            <XCircle size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Rejected Today</p>
            <p className="text-xl font-bold">0</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">User Details</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Verification Type</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ID / Email</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Submitted</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {verifications.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                  No pending verifications found.
                </td>
              </tr>
            ) : (
              verifications.map((v) => (
                <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-[#0A192F] font-bold">
                        {v.user?.fullName?.[0] || 'U'}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{v.user?.fullName}</div>
                        <div className="text-sm text-gray-500">{v.user?.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      v.type === 'GHANA_CARD' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {v.type?.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">
                    {v.idNumber || v.user?.email?.split('@')[1]}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(v.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded-lg transition-colors inline-flex items-center">
                      Review <ExternalLink size={14} className="ml-1" />
                    </button>
                    <button 
                      onClick={() => handleAction(v.id, 'APPROVED')}
                      className="text-green-600 hover:text-green-900 p-2 hover:bg-green-50 rounded-lg transition-colors"
                    >
                      <CheckCircle size={20} />
                    </button>
                    <button 
                      onClick={() => handleAction(v.id, 'REJECTED')}
                      className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <XCircle size={20} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
