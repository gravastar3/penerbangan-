'use client';

import { motion } from 'framer-motion';

interface RouteSegment {
  from: string;
  to: string;
  distance: number;
  fromName: string;
  toName: string;
  airline: string;
}

interface AlternativeRoute {
  path: string[];
  totalDistance: number;
  airlines: string[];
  totalTime: number;
  segments?: RouteSegment[];
}

interface AlternativeRoutesProps {
  alternativeRoutes: AlternativeRoute[];
  airports: Array<{ code: string; name: string; }>;
  onRouteSelect?: (route: AlternativeRoute) => void;
}

const ROUTE_COLORS = [
  { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200', line: 'bg-red-500' },
  { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200', line: 'bg-amber-500' },
  { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200', line: 'bg-purple-500' }
];

// Safe distance formatting function
const formatDistance = (distance: any): string => {
  if (typeof distance === 'number' && isFinite(distance)) {
    return distance.toLocaleString();
  }
  return '0';
};

export default function AlternativeRoutes({ alternativeRoutes, airports, onRouteSelect }: AlternativeRoutesProps) {
  const getAirportName = (code: string) => {
    const airport = airports.find(a => a.code === code);
    return airport ? airport.name : code;
  };

  if (alternativeRoutes.length <= 1) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="bg-white rounded-xl shadow-lg p-6"
    >
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Rute Alternatif</h3>
      
      <div className="space-y-4">
        {alternativeRoutes.slice(1).map((route, index) => {
          const colorIndex = index;
          const colors = ROUTE_COLORS[colorIndex % ROUTE_COLORS.length];
          
          return (
            <div 
              key={index}
              className={`border-2 ${colors.border} rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer`}
              onClick={() => onRouteSelect?.(route)}
            >
              {/* Route Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className={`w-6 h-6 rounded-full ${colors.bg} ${colors.text} flex items-center justify-center text-sm font-bold`}>
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">Alternatif {index + 1}</h4>
                    <p className="text-sm text-gray-600">
                      {route.path.length} bandara • {route.segments?.length || route.path.length - 1} segmen
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-800">
                    {formatDistance(route.totalDistance)} km
                  </div>
                  <div className="text-sm text-gray-600">
                    {Math.floor(route.totalTime / 60)}j {Math.round(route.totalTime % 60)}m
                  </div>
                </div>
              </div>

              {/* Route Path Visualization */}
              <div className="mb-3">
                <div className="flex items-center space-x-2 overflow-x-auto">
                  {route.path.map((airportCode, pathIndex) => (
                    <div key={airportCode} className="flex items-center">
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
                        {airportCode}
                      </div>
                      {pathIndex < route.path.length - 1 && (
                        <div className={`w-8 h-0.5 ${colors.line} mx-1`}></div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Route Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Segments Table */}
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Detail Segmen</h5>
                  <div className="bg-gray-50 rounded p-2 max-h-32 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-1">Dari</th>
                          <th className="text-left py-1">Ke</th>
                          <th className="text-right py-1">Jarak</th>
                        </tr>
                      </thead>
                      <tbody>
                        {route.segments?.map((segment, segIndex) => (
                          <tr key={segIndex} className="border-b border-gray-100">
                            <td className="py-1">{segment.from}</td>
                            <td className="py-1">{segment.to}</td>
                            <td className="py-1 text-right">{formatDistance(segment.distance)} km</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Airlines */}
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Maskapai</h5>
                  <div className="flex flex-wrap gap-1">
                    {route.airlines.map((airline, airlineIndex) => (
                      <span
                        key={airlineIndex}
                        className={`px-2 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}
                      >
                        {airline}
                      </span>
                    ))}
                  </div>
                  
                  {/* Comparison with shortest route */}
                  {index > 0 && alternativeRoutes[0] && (
                    <div className="mt-3 p-2 bg-yellow-50 rounded border border-yellow-200">
                        <div className="text-xs text-yellow-800">
                          <div className="font-medium">Perbandingan dengan rute terpendek:</div>
                          <div>+{((route.totalDistance / alternativeRoutes[0].totalDistance - 1) * 100).toFixed(1)}% jarak</div>
                          <div>+{Math.round(route.totalTime - alternativeRoutes[0].totalTime)} menit waktu</div>
                        </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Legenda Rute Alternatif</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
          {alternativeRoutes.slice(1).map((route, index) => {
            const colors = ROUTE_COLORS[index % ROUTE_COLORS.length];
            return (
              <div key={index} className="flex items-center space-x-2">
                <div className={`w-4 h-0.5 ${colors.line}`}></div>
                <span>Alternatif {index + 1}: {formatDistance(route.totalDistance)} km</span>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}