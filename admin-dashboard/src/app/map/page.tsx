'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Radar, Activity, MapPin, Signal } from 'lucide-react';

// Dynamically import LiveMap with SSR disabled to prevent Leaflet window errors
const LiveMap = dynamic(() => import('@/components/LiveMap'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-slate-800 rounded-lg animate-pulse">
      <div className="flex flex-col items-center">
        <Activity className="text-[#FFD700] animate-spin mb-4" size={48} />
        <p className="text-slate-400 font-bold tracking-widest uppercase text-sm">Initializing Radar Systems...</p>
      </div>
    </div>
  )
});

export default function MapPage() {
  return (
    <div className="p-8 bg-slate-900 min-h-screen text-slate-200">
      {/* Header section */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <div className="flex items-center space-x-2 text-[#FFD700] mb-2">
            <Radar size={20} className="animate-pulse" />
            <span className="text-xs font-black uppercase tracking-[0.2em]">Geospatial Intelligence</span>
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight">Live Fleet Radar</h1>
          <p className="text-slate-400 mt-2 max-w-2xl">
            Real-time geospatial tracking of active CommuteShare pods across the Greater Accra area. 
            Monitor route efficiency and pod density in high-traffic hubs.
          </p>
        </div>

        <div className="hidden lg:flex items-center space-x-6">
          <div className="text-center">
            <p className="text-[10px] text-slate-500 font-bold uppercase">Active Pods</p>
            <p className="text-xl font-black text-white">3</p>
          </div>
          <div className="h-8 w-px bg-slate-800"></div>
          <div className="text-center">
            <p className="text-[10px] text-slate-500 font-bold uppercase">Signal Health</p>
            <div className="flex items-center text-green-500 font-bold">
              <Signal size={14} className="mr-1" />
              <span className="text-lg">98%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="h-[75vh] w-full mt-6 bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl relative overflow-hidden group">
        <LiveMap />
        
        {/* Overlay Controls Placeholder */}
        <div className="absolute bottom-6 right-6 z-[1000] flex flex-col space-y-2">
          <button className="bg-slate-900/80 backdrop-blur-md p-3 rounded-xl border border-slate-700 text-white hover:bg-[#FFD700] hover:text-slate-900 transition-all shadow-lg">
            <MapPin size={20} />
          </button>
        </div>
      </div>

      {/* Status Footer */}
      <div className="mt-6 flex items-center justify-between">
        <div className="flex space-x-4">
          <div className="flex items-center space-x-2 px-3 py-1.5 bg-slate-800/50 rounded-lg border border-slate-700">
            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Transit Normal</span>
          </div>
          <div className="flex items-center space-x-2 px-3 py-1.5 bg-slate-800/50 rounded-lg border border-slate-700">
            <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Heavy Traffic</span>
          </div>
        </div>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.1em]">
          Last Refresh: {new Date().toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}
