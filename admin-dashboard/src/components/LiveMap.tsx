'use client';

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for Leaflet default marker icons in Next.js
const fixLeafletIcons = () => {
  // @ts-ignore - Internal Leaflet property
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
};

interface Pod {
  id: string;
  driverName: string;
  route: string;
  position: [number, number];
  passengerCount: string;
  status: string;
}

const mockPods: Pod[] = [
  {
    id: 'pod-1',
    driverName: 'Ekow Thompson',
    route: 'Adenta to Airport City',
    position: [5.6500, -0.1600],
    passengerCount: '3/4',
    status: 'In Transit',
  },
  {
    id: 'pod-2',
    driverName: 'Sena Agbenu',
    route: 'East Legon to Ridge',
    position: [5.6350, -0.1500],
    passengerCount: '2/4',
    status: 'In Transit',
  },
  {
    id: 'pod-3',
    driverName: 'Yaw Boateng',
    route: 'Tema to Osu',
    position: [5.6700, -0.0100],
    passengerCount: '4/4',
    status: 'Boarding',
  },
];

const LiveMap = () => {
  useEffect(() => {
    fixLeafletIcons();
  }, []);

  const accraPosition: [number, number] = [5.6037, -0.1870];

  return (
    <div className="h-full w-full rounded-lg overflow-hidden shadow-2xl border border-slate-800">
      <MapContainer
        center={accraPosition}
        zoom={12}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        
        {mockPods.map((pod) => (
          <Marker key={pod.id} position={pod.position}>
            <Popup className="custom-popup">
              <div className="p-1">
                <h3 className="font-bold text-slate-900 text-base">{pod.route}</h3>
                <div className="mt-2 space-y-1 text-sm text-slate-700">
                  <p><span className="font-semibold">Driver:</span> {pod.driverName}</p>
                  <p><span className="font-semibold">Passengers:</span> {pod.passengerCount}</p>
                  <p>
                    <span className="font-semibold">Status:</span> 
                    <span className="ml-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase">
                      {pod.status}
                    </span>
                  </p>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default LiveMap;
