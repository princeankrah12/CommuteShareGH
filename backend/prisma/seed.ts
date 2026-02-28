import { PrismaClient, Role, RideStatus, VerificationStatus, IncidentType, IncidentStatus, TransactionType, TransactionStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- START SEEDING ---');

  // 1. Clean existing data
  console.log('Cleaning database...');
  await prisma.transaction.deleteMany();
  await prisma.wallet.deleteMany();
  await prisma.rideBooking.deleteMany();
  await prisma.rideStop.deleteMany();
  await prisma.safetyIncident.deleteMany();
  await prisma.ride.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.verificationRequest.deleteMany();
  await prisma.landmark.deleteMany();
  await prisma.user.deleteMany();

  // 2. Seed Landmarks
  console.log('Seeding landmarks...');
  const landmarks = [
    { id: 'l1', name: 'Accra Mall', latitude: 5.6201, longitude: -0.1737 },
    { id: 'l2', name: 'Adenta Barrier', latitude: 5.7072, longitude: -0.1601 },
    { id: 'l3', name: 'Ridge (CBD)', latitude: 5.5566, longitude: -0.2012 },
    { id: 'l4', name: 'Tetteh Quarshie Interchange', latitude: 5.6133, longitude: -0.1834 },
    { id: 'l5', name: 'Atomic Junction', latitude: 5.6667, longitude: -0.1833 },
    { id: 'l6', name: 'Circle (Obetsebi)', latitude: 5.5587, longitude: -0.2132 },
    { id: 'l7', name: 'Achimota Mall', latitude: 5.6367, longitude: -0.2317 },
    { id: 'l8', name: 'Spintex (Papaye)', latitude: 5.6212, longitude: -0.1245 },
    { id: 'l9', name: 'Kasoa Galleria', latitude: 5.5333, longitude: -0.4167 },
    { id: 'l10', name: 'Dansoman (Keep Fit)', latitude: 5.5500, longitude: -0.2667 },
  ];

  for (const l of landmarks) {
    await prisma.landmark.create({ data: l });
  }

  // 3. Seed Users and Wallets
  console.log('Seeding users and wallets...');
  const usersData = [
    {
      id: 'u1',
      fullName: 'Kojo Mensah',
      email: 'kojo@mtn.com.gh',
      phoneNumber: '0244123456',
      isVerified: true,
      role: Role.DRIVER,
      commutePoints: 450,
      trustScore: 4.9,
      balance: 1250.50
    },
    {
      id: 'u2',
      fullName: 'Ama Serwaa',
      email: 'ama.s@ug.edu.gh',
      phoneNumber: '0501112222',
      isVerified: true,
      role: Role.RIDER,
      commutePoints: 85,
      trustScore: 4.7,
      balance: 45.00
    },
    {
      id: 'u3',
      fullName: 'Kwame Boateng',
      email: 'k.boateng@pwc.com',
      phoneNumber: '0200009999',
      isVerified: false,
      role: Role.BOTH,
      commutePoints: 120,
      trustScore: 4.2,
      balance: 320.00
    },
    {
      id: 'admin-1',
      fullName: 'System Admin',
      email: 'admin@commuteshare.gh',
      phoneNumber: '0000000000',
      isVerified: true,
      role: Role.ADMIN,
      commutePoints: 0,
      trustScore: 5.0,
      balance: 0
    }
  ];

  for (const u of usersData) {
    const { balance, ...userData } = u;
    const user = await prisma.user.create({ data: userData });
    await prisma.wallet.create({
      data: {
        userId: user.id,
        balance: balance
      }
    });
  }

  // 4. Seed Vehicles
  console.log('Seeding vehicles...');
  await prisma.vehicle.create({
    data: {
      id: 'v1',
      ownerId: 'u1',
      make: 'Toyota',
      model: 'Camry',
      year: 2024,
      licensePlate: 'GW 4455-24',
      color: 'Silver',
      seatCapacity: 4,
      status: 'APPROVED'
    }
  });

  // 5. Seed Verification Requests
  console.log('Seeding verification requests...');
  await prisma.verificationRequest.create({
    data: {
      userId: 'u3',
      type: 'GHANA_CARD',
      idNumber: 'GHA-721000000-1',
      status: VerificationStatus.PENDING,
    }
  });

  // 6. Seed Rides
  console.log('Seeding rides...');
  await prisma.ride.create({
    data: {
      id: 'r1',
      driverId: 'u1',
      vehicleId: 'v1',
      departureTime: new Date(new Date().getTime() + 7200000), // 2 hours from now
      availableSeats: 3,
      fare: 45.00,
      status: RideStatus.SCHEDULED,
      stops: {
        create: [
          { landmarkId: 'l2', stopOrder: 0 }, // Adenta
          { landmarkId: 'l4', stopOrder: 1 }, // Tetteh Quarshie
          { landmarkId: 'l3', stopOrder: 2 }, // Ridge
        ]
      }
    }
  });

  // 7. Seed Transactions
  console.log('Seeding transactions...');
  const u1Wallet = await prisma.wallet.findUnique({ where: { userId: 'u1' } });
  const u2Wallet = await prisma.wallet.findUnique({ where: { userId: 'u2' } });

  const txs = [
    {
      amount: 500.00,
      reference: 'TX-REF-001',
      type: TransactionType.CASHOUT,
      status: TransactionStatus.PENDING,
      senderWalletId: u1Wallet?.id,
    },
    {
      amount: 45.00,
      reference: 'TX-REF-002',
      type: TransactionType.TRIP_PAYMENT,
      status: TransactionStatus.SUCCESS,
      senderWalletId: u2Wallet?.id,
      receiverWalletId: u1Wallet?.id,
      tripId: 'r1'
    },
    {
      amount: 200.00,
      reference: 'TX-REF-003',
      type: TransactionType.TOP_UP,
      status: TransactionStatus.SUCCESS,
      receiverWalletId: u1Wallet?.id,
    }
  ];

  for (const tx of txs) {
    await prisma.transaction.create({ data: tx });
  }

  // 8. Seed Safety Incidents
  console.log('Seeding safety incidents...');
  await prisma.safetyIncident.create({
    data: {
      type: IncidentType.SOS,
      status: IncidentStatus.ACTIVE,
      description: 'Mechanical failure on highway',
      reportedById: 'u2',
      location: 'N1 Highway near Tetteh Quarshie',
    }
  });

  console.log('--- SEEDING COMPLETED ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
