import { PrismaClient, Role, RideStatus, VerificationStatus, IncidentType, IncidentStatus, TransactionType, TransactionStatus, Prisma } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import 'dotenv/config';

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🚀 STARTING COMPREHENSIVE RANDOMIZED SEEDING...');

  // 1. CLEAN SLATE
  console.log('🧹 Cleaning existing database nodes...');
  const tablenames = ['SafetyIncident', 'Transaction', 'RideBooking', 'RideStop', 'Ride', 'Vehicle', 'VerificationRequest', 'Wallet', 'Landmark', 'User', 'AffinityGroup'];
  for (const tablename of tablenames) {
    try {
      await (prisma as any)[tablename.charAt(0).toLowerCase() + tablename.slice(1)].deleteMany();
    } catch (e) {
      // Handle potential dependency order or missing tables
    }
  }

  // 2. SEED LANDMARKS (Accra Hubs)
  console.log('📍 Seeding Landmarks...');
  const landmarks = [
    { name: 'Accra Mall', lat: 5.6201, lng: -0.1737 },
    { name: 'Adenta Barrier', lat: 5.7072, lng: -0.1601 },
    { name: 'Ridge (CBD)', lat: 5.5566, lng: -0.2012 },
    { name: 'Tetteh Quarshie', lat: 5.6133, lng: -0.1834 },
    { name: 'Atomic Junction', lat: 5.6667, lng: -0.1833 },
    { name: 'Achimota Mall', lat: 5.6367, lng: -0.2317 },
    { name: 'Spintex Papaye', lat: 5.6212, lng: -0.1245 },
    { name: 'Kasoa Galleria', lat: 5.5333, lng: -0.4167 },
  ];

  const landmarkRecords = await Promise.all(
    landmarks.map(l => prisma.landmark.create({
      data: { name: l.name, latitude: l.lat, longitude: l.lng }
    }))
  );

  // 3. GENERATE PENDING KYC (10 Users)
  console.log('🆔 Generating 10 Pending KYC Profiles...');
  const names = ['Kofi', 'Ama', 'Kwame', 'Esi', 'Yaw', 'Abena', 'Kojo', 'Akosua', 'Nana', 'Efua'];
  const surnames = ['Mensah', 'Serwaa', 'Boateng', 'Osei', 'Antwi', 'Appiah', 'Danquah', 'Agyemang'];

  for (let i = 0; i < 10; i++) {
    const fullName = `${names[i % names.length]} ${surnames[Math.floor(Math.random() * surnames.length)]}`;
    const user = await prisma.user.create({
      data: {
        fullName,
        email: `${fullName.toLowerCase().replace(' ', '.')}@accra-corp.gh`,
        phoneNumber: `024${Math.floor(1000000 + Math.random() * 8999999)}`,
        isVerified: false,
        role: Role.BOTH,
        trustScore: 3.0 + (Math.random() * 1.5),
      }
    });

    await prisma.wallet.create({ data: { userId: user.id, balance: 0 } });

    await prisma.verificationRequest.create({
      data: {
        userId: user.id,
        type: 'GHANA_CARD',
        idNumber: `GHA-${Math.floor(100000000 + Math.random() * 899999999)}-${Math.floor(Math.random() * 9)}`,
        status: VerificationStatus.PENDING,
      }
    });
  }

  // 4. GENERATE PENDING PAYOUTS (10 Users)
  console.log('💰 Generating 10 Pending Disbursement Requests...');
  for (let i = 0; i < 10; i++) {
    const amount = 100 + (Math.floor(Math.random() * 9) * 50);
    const user = await prisma.user.create({
      data: {
        fullName: `Driver ${i + 1}`,
        email: `payout.driver${i + 1}@commuteshare.gh`,
        phoneNumber: `050${Math.floor(1000000 + Math.random() * 8999999)}`,
        isVerified: true,
        role: Role.DRIVER,
        trustScore: 4.5 + (Math.random() * 0.5),
      }
    });

    const wallet = await prisma.wallet.create({ data: { userId: user.id, balance: amount } });

    await prisma.transaction.create({
      data: {
        senderWalletId: wallet.id,
        amount: new Prisma.Decimal(amount),
        reference: `PAYOUT-${user.id.slice(0, 4)}-${Date.now()}-${i}`,
        type: TransactionType.CASHOUT,
        status: TransactionStatus.PENDING,
      }
    });
  }

  // 5. GENERATE ACTIVE RIDES (5 Rides)
  console.log('🚗 Generating 5 Active Rides for Fleet Radar...');
  for (let i = 0; i < 5; i++) {
    const driver = await prisma.user.create({
      data: {
        fullName: `Active Driver ${i + 1}`,
        email: `active.driver${i + 1}@commuteshare.gh`,
        phoneNumber: `020${Math.floor(1000000 + Math.random() * 8999999)}`,
        isVerified: true,
        role: Role.DRIVER,
      }
    });

    await prisma.wallet.create({ data: { userId: driver.id, balance: 100 } });

    const vehicle = await prisma.vehicle.create({
      data: {
        owner: { connect: { id: driver.id } },
        make: i % 2 === 0 ? 'Toyota' : 'Honda',
        model: i % 2 === 0 ? 'Corolla' : 'Civic',
        year: 2020 + Math.floor(Math.random() * 5),
        color: i % 2 === 0 ? 'Silver' : 'Black',
        licensePlate: `GW ${Math.floor(1000 + Math.random() * 8999)}-${20 + i}`,
        seatCapacity: 4,
        status: 'APPROVED'
      }
    });

    await prisma.ride.create({
      data: {
        driverId: driver.id,
        vehicleId: vehicle.id,
        departureTime: new Date(),
        availableSeats: 3,
        fare: 35.0,
        status: RideStatus.ACTIVE,
        stops: {
          create: [
            { landmarkId: landmarkRecords[i % landmarkRecords.length].id, stopOrder: 0 },
            { landmarkId: landmarkRecords[(i + 1) % landmarkRecords.length].id, stopOrder: 1 },
          ]
        }
      }
    });
  }

  // 6. GENERATE SAFETY ALERTS
  console.log('⚠️ Generating SOS Alert...');
  const sosReporter = await prisma.user.findFirst({ where: { role: Role.DRIVER } });
  if (sosReporter) {
    await prisma.safetyIncident.create({
      data: {
        type: IncidentType.SOS,
        status: IncidentStatus.ACTIVE,
        description: 'Driver reported suspicious behavior near Accra Mall',
        reportedById: sosReporter.id,
        location: 'Accra Mall Parking B',
      }
    });
  }

  console.log('✅ SEEDING COMPLETE. Database is now in a ROBUST state for E2E testing.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
