import { io } from 'socket.io-client';

/**
 * ACCRA FLEET SIMULATOR
 * 
 * Simulates a fleet of 20 drivers moving along major corridors in Accra:
 * 1. N1 Highway (Mallam -> Tetteh Quarshie)
 * 2. Independence Ave (Ridge -> Madina)
 * 3. Spintex Road (Tetteh Quarshie -> Sakumono)
 */

const SERVER_URL = 'http://localhost:3001';
const NUM_DRIVERS = 20;

// Coordinates for key hubs
const HUBS = {
  MALLAM: { lat: 5.5721, lng: -0.2801 },
  TETTEH_QUARSHIE: { lat: 5.6111, lng: -0.1865 },
  RIDGE: { lat: 5.5601, lng: -0.1985 },
  MADINA: { lat: 5.6681, lng: -0.1651 },
  SPINTEX_SAKUMONO: { lat: 5.6251, lng: -0.0981 },
};

interface VirtualDriver {
  id: string;
  socket: any;
  lat: number;
  lng: number;
  latStep: number;
  lngStep: number;
}

const drivers: VirtualDriver[] = [];

function createDriver(index: number): VirtualDriver {
  const driverId = `driver_${index + 1}`;
  const socket = io(SERVER_URL);

  // Assign routes based on index
  let start, end;
  if (index < 7) {
    start = HUBS.MALLAM;
    end = HUBS.TETTEH_QUARSHIE;
  } else if (index < 14) {
    start = HUBS.RIDGE;
    end = HUBS.MADINA;
  } else {
    start = HUBS.TETTEH_QUARSHIE;
    end = HUBS.SPINTEX_SAKUMONO;
  }

  // Calculate a "slow" movement step
  const steps = 100 + Math.random() * 50;
  const latStep = (end.lat - start.lat) / steps;
  const lngStep = (end.lng - start.lng) / steps;

  const lat = start.lat + (Math.random() - 0.5) * 0.01;
  const lng = start.lng + (Math.random() - 0.5) * 0.01;

  socket.on('connect', () => {
    console.log(`[Driver ${driverId}] Connected to Fleet Command`);
  });

  return { id: driverId, socket, lat, lng, latStep, lngStep };
}

async function startSimulation() {
  console.log('Starting Accra Fleet Simulator...');
  console.log(`Server: ${SERVER_URL}`);
  console.log(`Drivers: ${NUM_DRIVERS}`);

  // 1. Initialize Drivers
  for (let i = 0; i < NUM_DRIVERS; i++) {
    drivers.push(createDriver(i));
  }

  // 2. Setup a "Rider Probe" socket to check matches
  const riderSocket = io(SERVER_URL);
  const riderLat = 5.5900; // Near Airport City
  const riderLng = -0.1800;

  riderSocket.on('nearby_drivers_found', (data) => {
    console.log('\n--- MATCHMAKER PROBE ---');
    console.log(`Rider Position: [${riderLat}, ${riderLng}]`);
    console.log(`Found ${data.count} drivers within 5km:`);
    data.drivers.forEach((d: any, i: number) => {
      console.log(`  ${i + 1}. ID: ${d.driverId} | Distance: ${d.distanceKm.toFixed(2)} km`);
    });
    console.log('---------------------------\n');
  });

  // 3. Movement Loop
  setInterval(() => {
    drivers.forEach(driver => {
      driver.lat += driver.latStep;
      driver.lng += driver.lngStep;

      driver.socket.emit('update_location', {
        driverId: driver.id,
        rideId: `sim_ride_${driver.id}`,
        latitude: driver.lat,
        longitude: driver.lng
      });
    });
  }, 3000);

  // 4. Trigger Rider Probe every 10 seconds
  setInterval(() => {
    riderSocket.emit('request_ride', {
      riderLat,
      riderLng,
      userId: 'test_rider_1'
    });
  }, 10000);
}

startSimulation().catch(err => {
  console.error('Simulation crashed:', err);
});
