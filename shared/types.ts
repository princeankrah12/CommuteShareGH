// Core User Identity
export type Role = 'RIDER' | 'DRIVER' | 'BOTH' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  ghanaCardId?: string;
  isVerified: boolean;
  role: Role;
  walletBalance: number | string;
  commutePoints: number;
  trustScore: number;
  createdAt: string;
  _count?: {
    ridesDriven: number;
    bookings: number;
  };
  vehicle?: {
    make: string;
    model: string;
    plateNumber: string;
  };
}

// Financial Architecture
export type TransactionType = 'TOPUP' | 'RIDE_PAYMENT' | 'RIDE_PAYOUT' | 'WITHDRAWAL' | 'PENALTY';
export type TransactionStatus = 'PENDING' | 'SUCCESSFUL' | 'FAILED';

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  description?: string;
  createdAt: string;
  user?: {
    fullName: string;
    email: string;
  };
}

export interface FinancialData {
  totalSystemBalance: number;
  pendingPayoutAmount: number;
  recentTransactions: Transaction[];
  dailyVolume?: { day: string; volume: number }[];
}

// Safety & Operations
export type VerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface VerificationRequest {
  id: string;
  userId: string;
  user?: Partial<User>;
  type: 'GHANA_CARD' | 'CORPORATE_EMAIL';
  idNumber?: string;
  status: VerificationStatus;
  createdAt: string;
}

export interface Ride {
  id: string;
  driverId: string;
  driver: { fullName: string };
  vehicle: { make: string; model: string; plateNumber: string };
  departureTime: string;
  availableSeats: number;
  fare: number;
  status: string;
  stops: any[];
  bookings: any[];
}

export interface DashboardStats {
  totalUsers: number;
  pendingVerifications: number;
  ridesToday: number;
  totalRevenue: number;
}

// Payment Webhooks
export interface PaystackWebhookPayload {
  event: string;
  data: {
    id: number;
    domain: string;
    status: string;
    reference: string;
    amount: number;
    message: string | null;
    gateway_response: string;
    paid_at: string;
    created_at: string;
    channel: string;
    currency: string;
    ip_address: string;
    metadata: any;
    log: any;
    fees: number;
    fees_split: any;
    authorization: {
      authorization_code: string;
      bin: string;
      last4: string;
      exp_month: string;
      exp_year: string;
      channel: string;
      card_type: string;
      bank: string;
      country_code: string;
      brand: string;
      reusable: boolean;
      signature: string;
      account_name: string | null;
    };
    customer: {
      id: number;
      first_name: string | null;
      last_name: string | null;
      email: string;
      customer_code: string;
      phone: string | null;
      metadata: any;
      risk_action: string;
      international_format_phone: string | null;
    };
    plan: any;
    subaccount: any;
  };
}

export interface MomoWebhookPayload {
  financialTransactionId: string;
  externalId: string;
  amount: string;
  currency: string;
  payer: {
    partyIdType: string;
    partyId: string;
  };
  payerMessage: string;
  payeeNote: string;
  status: 'SUCCESSFUL' | 'FAILED' | 'PENDING';
}
