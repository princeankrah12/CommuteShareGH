import 'dotenv/config';
import { io } from 'socket.io-client';
import prisma from '../src/services/prisma';
import { Role, RideStatus } from '@prisma/client';
import { RideService } from '../src/services/RideService';

/**
 * ACCRA FLEET SIMULATOR
 * 
 * Simulates a fleet of 20 drivers moving along major corridors in Accra.
 * Also simulates a Virtual Rider who books the rides, generating automated Payment and Booking Lifecycle data.
 */

const SERVER_URL = 'http://localhost:3001';
const NUM_DRIVERS = 20;

const HUBS = {
  MALLAM: { lat: 5.5721, lng: -0.2801 },
  TETTEH_QUARSHIE: { lat: 5.6111, lng: -0.1865 },
  RIDGE: { lat: 5.5601, lng: -0.1985 },
  MADINA: { lat: 5.6681, lng: -0.1651 },
  SPINTEX_SAKUMONO: { lat: 5.6251, lng: -0.0981 },
};

interface VirtualDriver {
  userId: string;
  rideId: string;
  socket: any;
  lat: number;
  lng: number;
  latStep: number;
  lngStep: number;
  label: string;
  end: { lat: number; lng: number };
  completed?: boolean;
}

const drivers: VirtualDriver[] = [];

async function provisionSimulatorData() {
  console.log('📦 Provisioning drivers, rides, and Virtual Rider in database...');

  const hubNames = Object.keys(HUBS);
  const hubLandmarks: any = {};

  for (const name of hubNames) {
    const hub = HUBS[name as keyof typeof HUBS];
    let landmark = await prisma.landmark.findUnique({ where: { name } });
    if (!landmark) {
      landmark = await prisma.landmark.create({
        data: { name, latitude: hub.lat, longitude: hub.lng }
      });
      console.log(`Created Landmark: ${name}`);
    }
    hubLandmarks[name] = landmark;
  }

  const generatedDrivers = [];

  for (let i = 0; i < NUM_DRIVERS; i++) {
    const driverEmail = `sim.driver${i}@commuteshare.gh`;
    let user = await prisma.user.findUnique({ where: { email: driverEmail } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          fullName: `Sim Driver ${i}`,
          email: driverEmail,
          phoneNumber: `0${201001000 + i}`,
          isVerified: true,
          role: Role.DRIVER,
          trustScore: 4.8,
        }
      });
    }

    let wallet = await prisma.wallet.findUnique({ where: { userId: user.id } });
    if (!wallet) {
      wallet = await prisma.wallet.create({ data: { userId: user.id, balance: 100 } });
    }

    const vehicles = await prisma.vehicle.findMany({ where: { ownerId: user.id } });
    let vehicle = vehicles[0];
    if (!vehicle) {
      vehicle = await prisma.vehicle.create({
        data: {
          ownerId: user.id,
          make: 'Toyota',
          model: 'Prius',
          year: 2018,
          color: 'White',
          licensePlate: `SIM ${1000 + i}-24`,
          seatCapacity: 4,
          status: 'APPROVED'
        }
      });
    }

    let startHubName = '';
    let endHubName = '';
    if (i < 7) {
      startHubName = 'MALLAM';
      endHubName = 'TETTEH_QUARSHIE';
    } else if (i < 14) {
      startHubName = 'RIDGE';
      endHubName = 'MADINA';
    } else {
      startHubName = 'TETTEH_QUARSHIE';
      endHubName = 'SPINTEX_SAKUMONO';
    }

    const start = HUBS[startHubName as keyof typeof HUBS];
    const end = HUBS[endHubName as keyof typeof HUBS];

    const departureTime = new Date();
    departureTime.setMinutes(departureTime.getMinutes() + 15);

    // Cancel old active/scheduled rides for this driver to avoid duplicate matching
    await prisma.ride.updateMany({
       where: { driverId: user.id, status: 'SCHEDULED' },
       data: { status: 'CANCELLED' }
    });

    const ride = await prisma.ride.create({
      data: {
        driverId: user.id,
        vehicleId: vehicle.id,
        departureTime,
        availableSeats: 4,
        fare: 25.0,
        status: RideStatus.SCHEDULED,
        stops: {
          create: [
            { landmarkId: hubLandmarks[startHubName].id, stopOrder: 0 },
            { landmarkId: hubLandmarks[endHubName].id, stopOrder: 1 }
          ]
        }
      }
    });

    generatedDrivers.push({
      userId: user.id,
      rideId: ride.id,
      start,
      end,
      label: `Sim Driver ${i}`
    });
  }

  // --- VIRTUAL RIDER PROVISIONING ---
  const riderEmail = `sim.rider1@commuteshare.gh`;
  let simRider = await prisma.user.findUnique({ where: { email: riderEmail } });
  if (!simRider) {
    simRider = await prisma.user.create({
      data: {
        fullName: `Sim Rider`,
        email: riderEmail,
        phoneNumber: `0240009999`,
        isVerified: true,
        role: Role.RIDER,
      }
    });
  }

  let riderWallet = await prisma.wallet.findUnique({ where: { userId: simRider.id } });
  if (!riderWallet) {
    riderWallet = await prisma.wallet.create({ data: { userId: simRider.id, balance: 5000 } });
  } else if (Number(riderWallet.balance) < 100) {
    riderWallet = await prisma.wallet.update({ where: { id: riderWallet.id }, data: { balance: 5000 } });
  }

  console.log('✅ Simulated DB drivers, rides, and Virtual Rider successfully provisioned!\n');
  return { dbDrivers: generatedDrivers, simRider };
}

function createDriver(data: any): VirtualDriver {
  const socket = io(SERVER_URL);

  const steps = 100 + Math.random() * 50;
  const latStep = (data.end.lat - data.start.lat) / steps;
  const lngStep = (data.end.lng - data.start.lng) / steps;

  const lat = data.start.lat + (Math.random() - 0.5) * 0.01;
  const lng = data.start.lng + (Math.random() - 0.5) * 0.01;

  socket.on('connect', () => {
    console.log(`[${data.label}] Connected to Fleet Command for Ride ${data.rideId.slice(0, 8)}...`);
  });

  return { 
    userId: data.userId, 
    rideId: data.rideId, 
    socket, 
    lat, 
    lng, 
    latStep, 
    lngStep, 
    label: data.label,
    end: data.end,
    completed: false
  };
}

async function startSimulation() {
  console.log('🚀 Starting Accra Fleet Simulator...');
  console.log(`Server: ${SERVER_URL}`);
  
  // 1. Provision all DB references
  const { dbDrivers, simRider } = await provisionSimulatorData();

  // 2. Initialize drivers sockets
  for (const data of dbDrivers) {
    drivers.push(createDriver(data));
  }

  // 3. Movement Loop (emits location updates)
  setInterval(() => {
    drivers.forEach(driver => {
      if (driver.completed) return;

      driver.lat += driver.latStep;
      driver.lng += driver.lngStep;

      driver.socket.emit('update_location', {
        driverId: driver.userId,
        rideId: driver.rideId,
        latitude: driver.lat,
        longitude: driver.lng
      });

      // Check distance to destination
      const dist = Math.sqrt(Math.pow(driver.lat - driver.end.lat, 2) + Math.pow(driver.lng - driver.end.lng, 2));
      if (dist < 0.001) { // roughly 100 meters
        driver.completed = true;
        driver.socket.emit('ride_ended', driver.rideId);
        console.log(`\n🏁 [Sim Driver] ${driver.label} reached destination! Ride ${driver.rideId.slice(0, 8)} ended.`);
        
        // Update DB
        prisma.ride.update({
          where: { id: driver.rideId },
          data: { status: 'COMPLETED' }
        }).then(() => {
          return prisma.rideBooking.updateMany({
            where: { rideId: driver.rideId },
            data: { status: 'COMPLETED' }
          });
        }).catch(err => console.error(err));
      }
    });
  }, 3000);

  // 4. Automated Booking Loop
  let rideIndexToBook = 0;
  setInterval(async () => {
    if (rideIndexToBook >= dbDrivers.length) {
       return; // Done booking all drivers' rides
    }

    const targetDriver = dbDrivers[rideIndexToBook];
    rideIndexToBook++;

    try {
      const ride = await prisma.ride.findUnique({
        where: { id: targetDriver.rideId },
        include: { stops: { orderBy: { stopOrder: 'asc' } } }
      });

      if (ride && ride.availableSeats > 0 && ride.status === 'SCHEDULED') {
        const booking = await RideService.bookRide({
          rideId: ride.id,
          riderId: simRider.id,
          pickupLandmarkId: ride.stops[0].landmarkId,
          dropoffLandmarkId: ride.stops[1].landmarkId,
        });

        const totalFare = Number(ride.fare) + 1.0;
        console.log(`\n💳 [Sim Rider] Successfully BOOKED Ride ${ride.id.slice(0, 8)} with Driver ${targetDriver.userId.slice(0, 8)}!`);
        console.log(`   └─ GHS ${totalFare.toFixed(2)} deducted. Booking ID: ${booking.id.slice(0, 8)}\n`);
      }
    } catch (e: any) {
      console.log(`[Sim Rider Booking Error] ${e.message}`);
    }
  }, 10000); // Try booking every 10 seconds

  // 5. Automated Emergency SOS & Chat Loop (Phase 4)
  setInterval(async () => {
    const activeDrivers = drivers.filter(d => !d.completed);
    if (activeDrivers.length === 0) return;
    
    // Pick random driver for Chat
    const chatDriver = activeDrivers[Math.floor(Math.random() * activeDrivers.length)];
    chatDriver.socket.emit('send_message', {
      rideId: chatDriver.rideId,
      senderName: chatDriver.label,
      message: "Hello riders! I'm about 3 minutes away.",
      timestamp: new Date().toISOString()
    });
    console.log(`💬 [Sim Driver] ${chatDriver.label} sent a Chat Message!`);
  }, 20000); // 20s

  setInterval(async () => {
    const activeDrivers = drivers.filter(d => !d.completed);
    if (activeDrivers.length === 0) return;

    // Pick random driver for SOS
    const sosDriver = activeDrivers[Math.floor(Math.random() * activeDrivers.length)];
    
    // Create actual DB incident for consistency
    await prisma.safetyIncident.create({
      data: {
        type: 'SOS',
        status: 'ACTIVE',
        description: `Simulated SOS Trigger at [${sosDriver.lat.toFixed(4)}, ${sosDriver.lng.toFixed(4)}]`,
        reportedById: sosDriver.userId,
        rideId: sosDriver.rideId,
        location: `${sosDriver.lat.toFixed(4)}, ${sosDriver.lng.toFixed(4)}`
      }
    });

    sosDriver.socket.emit('trigger_sos', {
      rideId: sosDriver.rideId,
      userId: sosDriver.userId,
      userName: sosDriver.label,
      location: `${sosDriver.lat.toFixed(4)}, ${sosDriver.lng.toFixed(4)}`
    });

    console.log(`\n🚨 [Sim Driver] ${sosDriver.label} triggered an EMERGENCY SOS! Admin UI should flash red.\n`);
  }, 45000); // 45s
}

startSimulation().catch(err => {
  console.error('Simulation crashed:', err);
});
