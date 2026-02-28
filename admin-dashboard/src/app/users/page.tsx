'use client';

import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  MoreVertical, 
  ShieldCheck, 
  ShieldAlert, 
  Mail, 
  Phone, 
  Star,
  Loader2,
  AlertTriangle,
  X,
  MapPin,
  Calendar,
  CreditCard,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api, User } from '@/lib/api';

export default function UserDirectoryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<'ALL' | 'DRIVER' | 'RIDER'>('ALL');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const { data: users, isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: api.getUsers,
    refetchInterval: 60000,
  });

  const { data: userDetail, isLoading: isLoadingDetail } = useQuery({
    queryKey: ['user', selectedUserId],
    queryFn: () => api.getUserDetail(selectedUserId!),
    enabled: !!selectedUserId,
  });

  const { data: userRides } = useQuery({
    queryKey: ['user-rides', selectedUserId],
    queryFn: () => api.getUserRides(selectedUserId!),
    enabled: !!selectedUserId,
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
          <h2 className="text-xl font-bold">Failed to load user directory</h2>
          <p className="mt-2 text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  const filteredUsers = users?.filter(user => {
    const matchesSearch = 
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phoneNumber.includes(searchTerm);
    
    const matchesRole = 
      filterRole === 'ALL' || 
      user.role === filterRole || 
      (user.role === 'BOTH' && (filterRole === 'DRIVER' || filterRole === 'RIDER'));

    return matchesSearch && matchesRole;
  });

  return (
    <div className="p-8 bg-gray-50 min-h-screen relative overflow-x-hidden">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase">USER ARCHITECTURE</h1>
          <p className="text-gray-500 mt-1">Direct visibility into {users?.length} nodes of the professional commute grid.</p>
        </div>
        <div className="flex space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by name, email, or phone..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0A192F] outline-none w-64 shadow-sm transition-all"
            />
          </div>
          <select 
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value as any)}
            className="px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0A192F] outline-none shadow-sm font-black text-[10px] uppercase tracking-widest text-gray-600"
          >
            <option value="ALL">All Roles</option>
            <option value="DRIVER">Drivers</option>
            <option value="RIDER">Riders</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">User Profile</th>
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Trust Status</th>
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Operational Role</th>
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Capital</th>
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Onboarded</th>
                <th className="px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredUsers?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400 italic">No nodes found in current query.</td>
                </tr>
              ) : (
                filteredUsers?.map((user) => (
                  <tr 
                    key={user.id} 
                    className="hover:bg-gray-50/50 transition-colors cursor-pointer group"
                    onClick={() => setSelectedUserId(user.id)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 rounded-full bg-[#0A192F] flex items-center justify-center text-[#FFD700] font-black shadow-lg shadow-blue-900/10">
                          {user.fullName[0]}
                        </div>
                        <div>
                          <p className="text-sm font-black text-gray-900 group-hover:text-blue-600 transition-colors">{user.fullName}</p>
                          <p className="text-[10px] text-gray-400 font-medium uppercase tracking-tight">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                         <div className={`w-2 h-2 rounded-full ${user.isVerified ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse`}></div>
                         <span className="text-[10px] font-black text-gray-700 uppercase">{user.isVerified ? 'Verified' : 'Pending'}</span>
                         <div className="flex items-center text-xs font-black text-slate-400 ml-4">
                            <Star size={10} className="text-[#FFD700] mr-1 fill-[#FFD700]" />
                            {user.trustScore.toFixed(1)}
                         </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                       <span className="bg-slate-100 text-slate-700 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest border border-slate-200">
                          {user.role}
                       </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-black text-gray-900">
                      GHS {Number(user.walletBalance).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                       <ChevronRight size={18} className="text-gray-300 group-hover:text-blue-600 transition-colors inline" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* USER DETAIL SLIDER */}
      <div className={`fixed inset-y-0 right-0 w-[450px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out border-l ${selectedUserId ? 'translate-x-0' : 'translate-x-full'}`}>
        {isLoadingDetail ? (
           <div className="h-full flex items-center justify-center">
              <Loader2 className="animate-spin text-[#0A192F]" size={32} />
           </div>
        ) : userDetail && (
          <div className="h-full flex flex-col">
            <div className="p-6 border-b flex justify-between items-center bg-[#0A192F] text-white">
               <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-[#FFD700] font-black text-xl">
                    {userDetail.fullName[0]}
                  </div>
                  <div>
                    <h2 className="font-black text-lg uppercase tracking-tight">{userDetail.fullName}</h2>
                    <p className="text-[10px] text-blue-300 uppercase font-black tracking-widest">{userDetail.role} Node</p>
                  </div>
               </div>
               <button onClick={() => setSelectedUserId(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <X size={24} />
               </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-10">
               {/* KPI Summary */}
               <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Capital</p>
                     <p className="text-xl font-black text-gray-900">GHS {Number(userDetail.walletBalance).toLocaleString()}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Trust Score</p>
                     <p className="text-xl font-black text-blue-600">{userDetail.trustScore.toFixed(2)}</p>
                  </div>
               </div>

               {/* Activity Log */}
               <div>
                  <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-4 flex items-center">
                    <Calendar size={14} className="mr-2 text-blue-600" /> Recent Trajectories
                  </h3>
                  <div className="space-y-3">
                    {userRides?.map((ride: any) => (
                       <div key={ride.id} className="p-4 bg-white border rounded-xl hover:border-blue-200 transition-colors shadow-sm">
                          <div className="flex justify-between items-start mb-2">
                             <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase ${ride.driverId === userDetail.id ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                {ride.driverId === userDetail.id ? 'Driver' : 'Passenger'}
                             </span>
                             <span className="text-[8px] text-gray-400 font-bold">{new Date(ride.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-[10px] font-medium text-gray-700">
                             <MapPin size={10} className="text-red-500" />
                             <span className="truncate">{ride.stops[0]?.landmark?.name}</span>
                             <ChevronRight size={10} />
                             <span className="truncate">{ride.stops[ride.stops.length-1]?.landmark?.name}</span>
                          </div>
                       </div>
                    ))}
                    {userRides?.length === 0 && (
                       <p className="text-xs text-gray-400 italic text-center py-4">No recent activity recorded.</p>
                    )}
                  </div>
               </div>

               {/* Verification & Tech */}
               <div>
                  <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-4 flex items-center">
                    <ShieldCheck size={14} className="mr-2 text-green-600" /> Credentials & Hardware
                  </h3>
                  <div className="space-y-4">
                     <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">Identity Status</span>
                        <span className={`text-[10px] font-black uppercase ${userDetail.isVerified ? 'text-green-600' : 'text-yellow-600'}`}>
                           {userDetail.isVerified ? 'VERIFIED' : 'PENDING'}
                        </span>
                     </div>
                     {userDetail.vehicle && (
                        <div className="p-4 bg-slate-900 text-white rounded-2xl relative overflow-hidden">
                           <p className="text-[8px] font-black text-blue-400 uppercase tracking-[0.2em] mb-2">Registered Vehicle</p>
                           <p className="text-sm font-black">{userDetail.vehicle.make} {userDetail.vehicle.model}</p>
                           <p className="text-xs font-mono text-gray-400 mt-1">{userDetail.vehicle.plateNumber}</p>
                           <CreditCard size={60} className="absolute -bottom-4 -right-4 opacity-10 rotate-12" />
                        </div>
                     )}
                  </div>
               </div>
            </div>

            <div className="p-6 border-t bg-gray-50 flex space-x-3">
               <button className="flex-1 py-3 bg-red-50 text-red-600 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-red-100 transition-colors border border-red-100">
                  Suspend Node
               </button>
               <button className="flex-1 py-3 bg-[#0A192F] text-[#FFD700] text-xs font-black uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-colors">
                  Adjust Balance
               </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Overlay */}
      {selectedUserId && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-40"
          onClick={() => setSelectedUserId(null)}
        ></div>
      )}
    </div>
  );
}

