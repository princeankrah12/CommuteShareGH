'use client';

import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Save, 
  ShieldCheck, 
  Wallet, 
  MapPin, 
  Users, 
  Bell, 
  Loader2, 
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, SystemSettings } from '@/lib/api';

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<SystemSettings | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { data: settings, isLoading, error } = useQuery({
    queryKey: ['settings'],
    queryFn: api.getSettings,
  });

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const mutation = useMutation({
    mutationFn: api.updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setSuccessMessage('Settings updated successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    if (!formData) return;

    setFormData({
      ...formData,
      [name]: type === 'number' ? Number(value) : value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData) {
      mutation.mutate(formData);
    }
  };

  if (isLoading || !formData) {
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
          <h2 className="text-xl font-bold">Failed to load system settings</h2>
          <p className="mt-2 text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase">SYSTEM ARCHITECTURE SETTINGS</h1>
          <p className="text-gray-500 mt-1 italic">Configure the economic and safety parameters for CommuteShare GH.</p>
        </div>
        {successMessage && (
          <div className="bg-green-100 text-green-700 px-4 py-2 rounded-xl flex items-center font-bold animate-bounce shadow-sm border border-green-200">
            <CheckCircle2 size={18} className="mr-2" />
            {successMessage}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl">
        {/* Economic Configuration */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
          <h3 className="text-lg font-black text-gray-900 flex items-center mb-2 uppercase tracking-wide">
            <Wallet className="mr-3 text-purple-600" size={20} />
            Economic Configuration
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Platform Service Fee (%)</label>
              <div className="relative">
                <input 
                  type="number" 
                  name="serviceFeePercentage"
                  value={formData.serviceFeePercentage}
                  onChange={handleChange}
                  className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0A192F] outline-none font-bold"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</span>
              </div>
              <p className="text-[10px] text-gray-400 mt-2">Percentage deducted from each ride payment.</p>
            </div>

            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Min. Withdrawal Amount (GHS)</label>
              <div className="relative">
                <input 
                  type="number" 
                  name="minWithdrawalAmount"
                  value={formData.minWithdrawalAmount}
                  onChange={handleChange}
                  className="w-full pl-4 pr-16 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0A192F] outline-none font-bold"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold uppercase">GHS</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Referral Bonus (Commute Points)</label>
              <div className="relative">
                <input 
                  type="number" 
                  name="referralBonusCP"
                  value={formData.referralBonusCP}
                  onChange={handleChange}
                  className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0A192F] outline-none font-bold"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold uppercase">CP</span>
              </div>
            </div>
          </div>
        </div>

        {/* Operational Safety */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
          <h3 className="text-lg font-black text-gray-900 flex items-center mb-2 uppercase tracking-wide">
            <ShieldCheck className="mr-3 text-green-600" size={20} />
            Safety & Capacity
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Max Seats Per Ride</label>
              <input 
                type="number" 
                name="maxSeatsPerRide"
                value={formData.maxSeatsPerRide}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0A192F] outline-none font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Safety Radius (Kilometers)</label>
              <div className="relative">
                <input 
                  type="number" 
                  name="safetyRadiusKm"
                  value={formData.safetyRadiusKm}
                  onChange={handleChange}
                  className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0A192F] outline-none font-bold"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold uppercase text-[10px]">KM</span>
              </div>
              <p className="text-[10px] text-gray-400 mt-2">Area for incident matching and proximity alerts.</p>
            </div>

            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">System Emergency Contact</label>
              <input 
                type="text" 
                name="emergencyContact"
                value={formData.emergencyContact}
                onChange={handleChange}
                placeholder="+233 XX XXX XXXX"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0A192F] outline-none font-bold"
              />
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 flex justify-end items-center space-x-4 pt-4 border-t border-gray-100">
          <button 
            type="button"
            className="flex items-center space-x-2 px-6 py-3 text-gray-500 font-bold hover:text-gray-900 transition-colors"
          >
            <RefreshCw size={18} />
            <span>Reset Changes</span>
          </button>
          <button 
            type="submit"
            disabled={mutation.isPending}
            className="flex items-center space-x-2 bg-[#0A192F] text-[#FFD700] px-10 py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-blue-500/10 hover:bg-[#1a2e4b] transition-all disabled:opacity-50"
          >
            {mutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            <span>Save Architecture</span>
          </button>
        </div>
      </form>
    </div>
  );
}
