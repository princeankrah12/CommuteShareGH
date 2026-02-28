import React from 'react';
import { 
  LayoutDashboard, 
  Map, 
  ShieldCheck, 
  Wallet, 
  ShieldAlert, 
  Users,
  Settings 
} from 'lucide-react';
import Link from 'next/link';

const Sidebar = () => {
  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/' },
    { name: 'Live Map', icon: Map, href: '/map' },
    { name: 'KYC Approvals', icon: ShieldCheck, href: '/kyc' },
    { name: 'Finances', icon: Wallet, href: '/finance' },
    { name: 'Safety & SOS', icon: ShieldAlert, href: '/safety' },
    { name: 'Users & Fleet', icon: Users, href: '/users' },
  ];

  return (
    <div className="w-64 bg-[#0A192F] text-white h-screen fixed left-0 top-0 flex flex-col z-50">
      <div className="p-6">
        <h1 className="text-xl font-bold text-[#FFD700]">CommuteShare Admin</h1>
        <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest">Executive Portal</p>
      </div>
      
      <nav className="flex-1 px-4 py-4 space-y-1">
        {menuItems.map((item) => (
          <Link 
            key={item.name} 
            href={item.href}
            className="flex items-center space-x-3 p-3 rounded-xl hover:bg-white/5 transition-all text-slate-300 hover:text-[#FFD700] group"
          >
            <item.icon size={20} className="group-hover:scale-110 transition-transform" />
            <span className="font-medium">{item.name}</span>
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <Link 
          href="/settings"
          className="flex items-center space-x-3 p-3 rounded-xl hover:bg-white/5 transition-all text-slate-400 hover:text-white"
        >
          <Settings size={20} />
          <span className="font-medium">Settings</span>
        </Link>
      </div>
    </div>
  );
};

export default Sidebar;
