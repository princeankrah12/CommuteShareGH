export const DUMMY_USERS = [
  {
    id: 'u1',
    fullName: 'Kojo Mensah',
    email: 'kojo@mtn.com.gh',
    phoneNumber: '+233 24 412 3456',
    isVerified: true,
    role: 'DRIVER',
    walletBalance: '1250.50',
    commutePoints: 450,
    trustScore: 4.9,
    createdAt: new Date().toISOString(),
    _count: { ridesDriven: 124, bookings: 12 }
  },
  {
    id: 'u2',
    fullName: 'Ama Serwaa',
    email: 'ama.s@ug.edu.gh',
    phoneNumber: '+233 50 111 2222',
    isVerified: true,
    role: 'RIDER',
    walletBalance: '45.00',
    commutePoints: 85,
    trustScore: 4.7,
    createdAt: new Date().toISOString(),
    _count: { ridesDriven: 0, bookings: 89 }
  },
  {
    id: 'u3',
    fullName: 'Kwame Boateng',
    email: 'k.boateng@pwc.com',
    phoneNumber: '+233 20 000 9999',
    isVerified: false,
    role: 'BOTH',
    walletBalance: '320.00',
    commutePoints: 120,
    trustScore: 4.2,
    createdAt: new Date().toISOString(),
    _count: { ridesDriven: 5, bookings: 42 }
  }
];

export const DUMMY_VERIFICATIONS = [
  {
    id: 'v1',
    userId: 'u3',
    user: {
      fullName: 'Kwame Boateng',
      email: 'k.boateng@pwc.com',
      phoneNumber: '+233 20 000 9999'
    },
    type: 'GHANA_CARD',
    idNumber: 'GHA-721000000-1',
    status: 'PENDING',
    createdAt: new Date().toISOString()
  }
];

export const DUMMY_TRANSACTIONS = [
  {
    id: 't1',
    userId: 'u1',
    user: { fullName: 'Kojo Mensah', email: 'kojo@mtn.com.gh' },
    amount: 500,
    type: 'WITHDRAWAL',
    status: 'PENDING',
    createdAt: new Date().toISOString()
  },
  {
    id: 't2',
    userId: 'u2',
    user: { fullName: 'Ama Serwaa', email: 'ama.s@ug.edu.gh' },
    amount: 45,
    type: 'RIDE_PAYMENT',
    status: 'SUCCESSFUL',
    createdAt: new Date().toISOString()
  },
  {
    id: 't3',
    userId: 'u1',
    user: { fullName: 'Kojo Mensah', email: 'kojo@mtn.com.gh' },
    amount: 200,
    type: 'TOPUP',
    status: 'SUCCESSFUL',
    createdAt: new Date().toISOString()
  }
];

export const DUMMY_RIDES = [
  {
    id: 'r1',
    driver: { fullName: 'Kojo Mensah' },
    vehicle: { make: 'Toyota', model: 'Camry', licensePlate: 'GW 4455-24' },
    status: 'ACTIVE',
    stops: [
      { stopOrder: 0, landmark: { name: 'Adenta Barrier', latitude: 5.7072, longitude: -0.1601 } },
      { stopOrder: 1, landmark: { name: 'Ridge', latitude: 5.5566, longitude: -0.2012 } }
    ],
    bookings: [{}, {}, {}],
    availableSeats: 1
  },
  {
    id: 'r2',
    driver: { fullName: 'Ama Serwaa' },
    vehicle: { make: 'Honda', model: 'Civic', licensePlate: 'GR 9988-23' },
    status: 'ACTIVE',
    stops: [
      { stopOrder: 0, landmark: { name: 'Tema', latitude: 5.6667, longitude: 0.0000 } },
      { stopOrder: 1, landmark: { name: 'Airport City', latitude: 5.6048, longitude: -0.1708 } }
    ],
    bookings: [{}, {}],
    availableSeats: 2
  }
];

export const DUMMY_SAFETY_INCIDENTS = [
  {
    id: 's1',
    type: 'SOS',
    status: 'ACTIVE',
    description: 'Mechanical failure on highway',
    reportedBy: { fullName: 'Ama Serwaa' },
    location: 'N1 Highway near Tetteh Quarshie',
    createdAt: new Date().toISOString()
  },
  {
    id: 's2',
    type: 'BEHAVIOR',
    status: 'INVESTIGATING',
    description: 'Driver exceeded speed limit',
    reportedBy: { fullName: 'Kwame Boateng' },
    subjectUser: { fullName: 'Kojo Mensah' },
    createdAt: new Date().toISOString()
  }
];
