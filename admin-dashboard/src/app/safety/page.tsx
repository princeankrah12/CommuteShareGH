'use client';

import { AlertCircle, ShieldAlert, Thermometer, UserCheck, PhoneCall, Bell, ClipboardCheck, Siren, Loader2, AlertTriangle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export default function SafetyPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['safety-data'],
    queryFn: api.getSafetyData,
    refetchInterval: 15000,
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
          <h2 className="text-xl font-bold">Failed to load safety data</h2>
          <p className="mt-2 text-sm">{(error as any).message}</p>
        </div>
      </div>
    );
  }

  const activeSOS = data?.activeSOS || [];
  const complianceReports = data?.recentReports || [];

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Safety & Compliance</h1>
          <p className="text-gray-500">Real-time incident response and vehicle standard enforcement.</p>
        </div>
      </div>

      {/* SOS EMERGENCY SECTION */}
      {activeSOS.length > 0 && (
        <div className="mb-10 bg-red-600 rounded-2xl p-1 shadow-[0_0_30px_rgba(220,38,38,0.3)] animate-pulse">
           <div className="bg-white rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between">
              <div className="flex items-center mb-4 md:mb-0">
                 <div className="bg-red-100 p-4 rounded-full text-red-600 mr-4">
                    <Siren size={32} />
                 </div>
                 <div>
                    <h2 className="text-xl font-black text-red-600 uppercase tracking-tighter italic">ACTIVE SOS ALERT</h2>
                    <p className="text-gray-900 font-bold">{activeSOS[0].reportedBy?.fullName} triggered an emergency at {activeSOS[0].location || 'Unknown Location'}</p>
                    <p className="text-xs text-gray-500 font-mono">Incident ID: {activeSOS[0].id.slice(0,8)} | {new Date(activeSOS[0].createdAt).toLocaleTimeString()}</p>
                 </div>
              </div>
              <div className="flex space-x-3 w-full md:w-auto">
                 <button className="flex-1 md:flex-none bg-red-600 text-white px-8 py-3 rounded-xl font-bold flex items-center justify-center hover:bg-red-700 transition-colors">
                    <PhoneCall size={18} className="mr-2" /> Dispatch Police
                 </button>
                 <button className="flex-1 md:flex-none bg-gray-900 text-white px-8 py-3 rounded-xl font-bold flex items-center justify-center hover:bg-black transition-colors">
                    <Bell size={18} className="mr-2" /> Call Driver
                 </button>
              </div>
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                 <h3 className="font-bold text-gray-900 flex items-center">
                    <Thermometer className="mr-2 text-blue-500" size={20} />
                    AC Mandate Compliance
                 </h3>
                 <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold">{Math.round(data?.acCompliance)}%</span>
              </div>
              <div className="space-y-4">
                 <div className="w-full bg-gray-100 h-2 rounded-full">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${data?.acCompliance}%` }}></div>
                 </div>
              </div>
           </div>
        </div>

        <div className="lg:col-span-2">
           <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b flex justify-between items-center bg-gray-50/50">
                 <h3 className="font-bold text-gray-900 flex items-center">
                    <ClipboardCheck className="mr-2 text-green-600" size={20} />
                    Compliance & Behavior Reports
                 </h3>
              </div>
              <div className="divide-y">
                 {complianceReports.map((report: any) => (
                   <div key={report.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between hover:bg-gray-50 transition-colors">
                      <div className="flex items-start space-x-4 mb-4 md:mb-0">
                         <div className="bg-gray-100 p-3 rounded-xl">
                            <UserCheck className="text-gray-600" size={24} />
                         </div>
                         <div>
                            <p className="font-bold text-gray-900">{report.subjectUser?.fullName || 'Multiple Users'}</p>
                            <p className="text-sm text-red-500 font-medium">{report.type.replace('_', ' ')}: {report.description}</p>
                            <p className="text-xs text-gray-400 mt-1">Reported by {report.reportedBy?.fullName} on {new Date(report.createdAt).toLocaleDateString()}</p>
                         </div>
                      </div>
                      <span className={`text-[10px] px-2 py-1 rounded-full font-black uppercase tracking-widest ${
                         report.status === 'RESOLVED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                         {report.status}
                      </span>
                   </div>
                 ))}
                 {complianceReports.length === 0 && (
                   <div className="p-10 text-center text-gray-500">No safety reports filed.</div>
                 )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
