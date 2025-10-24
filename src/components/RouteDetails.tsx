'use client';

import { motion } from 'framer-motion';

interface Airport {
  code: string;
  name: string;
  latitude: number;
  longitude: number;
}

interface RouteDetails {
  path: string[];
  totalDistance: number;
  airlines: string[];
  totalTime: number; // in minutes
  segments?: Array<{
    from: string;
    to: string;
    distance: number;
    fromName: string;
    toName: string;
    airline: string;
  }>;
}

interface RouteDetailsProps {
  routeDetails: RouteDetails | null;
  airports: Airport[];
}

// Safe distance formatting function
const formatDistance = (distance: any): string => {
  if (typeof distance === 'number' && isFinite(distance)) {
    return distance.toLocaleString();
  }
  return 'Belum Diketahui';
};

export default function RouteDetails({ routeDetails, airports }: RouteDetailsProps) {
  const getAirportName = (code: string) => {
    const airport = airports.find(a => a.code === code);
    return airport ? airport.name : code;
  };

  if (!routeDetails) {
    return null;
  }

  // Use segments from algorithm or calculate manually
  const segmentDistances = routeDetails.segments || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="bg-white rounded-xl shadow-lg p-6"
    >
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Detail Rute Penerbangan</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-700">Total Jarak</span>
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <div className="text-2xl font-bold text-blue-600 mt-1">
            {formatDistance(routeDetails.totalDistance)} km
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-green-700">Waktu Tempuh</span>
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-2xl font-bold text-green-600 mt-1">
            {Math.floor(routeDetails.totalTime / 60)}j {Math.round(routeDetails.totalTime % 60)}m
          </div>
        </div>
      </div>
      
      <div className="space-y-6">
        {/* Segment Distances Table */}
        <div>
          <h4 className="text-md font-medium text-gray-700 mb-3 flex items-center">
            <svg className="w-4 h-4 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Jarak Antar Bandara (Teori Graf - Bobot Sisi)
          </h4>
          <div className="bg-gray-50 rounded-lg p-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 font-medium text-gray-700">Segmen</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-700">Dari</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-700">Ke</th>
                  <th className="text-right py-2 px-3 font-medium text-gray-700">Jarak (km)</th>
                  <th className="text-center py-2 px-3 font-medium text-gray-700">Bobot</th>
                </tr>
              </thead>
              <tbody>
                {segmentDistances.map((segment, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-100 transition-colors">
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-800 text-xs font-bold rounded-full">
                        {index + 1}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-medium text-gray-800">{segment.from}</div>
                      <div className="text-xs text-gray-600">{segment.fromName}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-medium text-gray-800">{segment.to}</div>
                      <div className="text-xs text-gray-600">{segment.toName}</div>
                    </td>
                    <td className="py-3 px-3 text-right font-medium text-blue-600">
                      {segment.distance.toFixed(1)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        w({segment.from},{segment.to}) = {segment.distance.toFixed(0)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100 font-semibold">
                  <td colSpan={3} className="py-3 px-3 text-gray-700">Total</td>
                  <td className="py-3 px-3 text-right text-blue-600">
                    {segmentDistances.reduce((sum, seg) => sum + seg.distance, 0).toFixed(1)}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Σ = {segmentDistances.reduce((sum, seg) => sum + seg.distance, 0).toFixed(0)}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
        
        <div>
          <h4 className="text-md font-medium text-gray-700 mb-3 flex items-center">
            <svg className="w-4 h-4 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Rute Perjalanan
          </h4>
          <div className="bg-gray-50 rounded-lg p-4">
            {routeDetails.path.map((airportCode, index) => (
              <div key={airportCode} className="flex items-center space-x-3 py-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  index === 0 ? 'bg-green-500 text-white' :
                  index === routeDetails.path.length - 1 ? 'bg-red-500 text-white' :
                  'bg-blue-500 text-white'
                }`}>
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-800">{airportCode}</div>
                  <div className="text-sm text-gray-600">{getAirportName(airportCode)}</div>
                </div>
                {index < routeDetails.path.length - 1 && (
                  <div className="text-gray-400 flex flex-col items-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                    <span className="text-xs mt-1 text-blue-600 font-medium">
                      {segmentDistances[index]?.distance.toFixed(0)} km
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <h4 className="text-md font-medium text-gray-700 mb-3 flex items-center">
            <svg className="w-4 h-4 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            Maskapai Penerbangan
          </h4>
          <div className="flex flex-wrap gap-2">
            {routeDetails.airlines.map((airline, index) => (
              <span
                key={index}
                className="px-3 py-1.5 bg-blue-100 text-blue-800 text-sm rounded-full font-medium"
              >
                {airline}
              </span>
            ))}
          </div>
        </div>

        {/* Graph Theory Info */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
          <h4 className="text-md font-medium text-purple-800 mb-2 flex items-center">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Analisis Teori Graf
          </h4>
          <div className="text-sm text-purple-700 space-y-1">
            <p>• <strong>Jalur Terpendek:</strong> Path dengan bobot total minimum</p>
            <p>• <strong>Bobot Sisi:</strong> Jarak geografis antar bandara (km)</p>
            <p>• <strong>Total Bobot:</strong> Σ = {segmentDistances.reduce((sum, seg) => sum + seg.distance, 0).toFixed(0)} km</p>
            <p>• <strong>Jumlah Sisi:</strong> {segmentDistances.length} segmen</p>
            <p>• <strong>Jumlah Simpul:</strong> {routeDetails.path.length} bandara</p>
            <p>• <strong>Algoritma:</strong> Dijkstra dengan perhitungan Haversine</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}