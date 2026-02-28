import type { 
  DashboardStats, 
  User, 
  FinancialData, 
  Transaction, 
  VerificationRequest 
} from '@commuteshare/shared';

export type { 
  DashboardStats, 
  User, 
  FinancialData, 
  Transaction, 
  VerificationRequest 
};

export interface SystemSettings {
  serviceFeePercentage: number;
  minWithdrawalAmount: number;
  maxSeatsPerRide: number;
  safetyRadiusKm: number;
  referralBonusCP: number;
  emergencyContact: string;
}

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:3001/api';

export async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${url}`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`API Error ${res.status}: ${errorText}`);
  }

  return res.json();
}

export async function postRequest<T>(url: string, body: any): Promise<T> {
  const res = await fetch(`${BASE_URL}${url}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`API Error ${res.status}: ${errorText}`);
  }

  return res.json();
}

export const api = {
  getStats: () => fetcher<DashboardStats>('/admin/stats'),
  getFinancials: () => fetcher<FinancialData>('/admin/financials'),
  getUsers: () => fetcher<User[]>('/admin/users'),
  getSettings: () => fetcher<SystemSettings>('/admin/settings'),
  updateSettings: (settings: SystemSettings) => postRequest('/admin/settings', settings),
  getPendingPayouts: () => fetcher<Transaction[]>('/admin/payouts/pending'),
  getPayoutHistory: () => fetcher<Transaction[]>('/admin/payouts/history'),
  payoutAction: (id: string, status: 'APPROVED' | 'REJECTED') => postRequest(`/admin/payouts/${id}/action`, { status }),
  getUserDetail: (id: string) => fetcher<User>(`/admin/users/${id}`),
  getUserRides: (id: string) => fetcher<any[]>(`/admin/users/${id}/rides`),
  getPendingVerifications: () => fetcher<any[]>('/admin/verifications/pending'),
  verificationAction: (id: string, status: 'APPROVED' | 'REJECTED') => postRequest(`/admin/verifications/${id}/action`, { status }),
  getActiveRides: () => fetcher<any[]>('/admin/active-rides'),
  getSafetyData: () => fetcher<any>('/admin/safety'),
  getAffinityStats: () => fetcher<any[]>('/admin/affinity-stats'),
};
