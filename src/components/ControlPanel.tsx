'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { airlines } from '@/data/flightData';

interface Airport {
  code: string;
  name: string;
  latitude: number;
  longitude: number;
}

interface Route {
  from: string;
  to: string;
  airline: string;
  distance: number;
}

interface RouteDetails {
  path: string[];
  totalDistance: number;
  airlines: string[];
  totalTime: number; // in minutes
}

interface ControlPanelProps {
  airports: Airport[];
  routes: Route[];
  onRouteSearch: (from: string, to: string) => RouteDetails | null;
  onRouteFound: (details: RouteDetails | null) => void;
}

export default function ControlPanel({ airports, routes, onRouteSearch, onRouteFound }: ControlPanelProps) {
  const [selectedFrom, setSelectedFrom] = useState<string>('');
  const [selectedTo, setSelectedTo] = useState<string>('');
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!selectedFrom || !selectedTo) return;
    
    setIsSearching(true);
    
    // Simulate search delay for better UX
    setTimeout(() => {
      const result = onRouteSearch(selectedFrom, selectedTo);
      onRouteFound(result);
      setIsSearching(false);
    }, 500);
  };

  return (
    <motion.div
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="w-full bg-white rounded-lg shadow-xl p-6 space-y-6"
    >
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Pencarian Rute</h2>
        <p className="text-gray-600 text-sm">Pilih bandara asal dan tujuan</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bandara Asal
          </label>
          <select
            value={selectedFrom}
            onChange={(e) => setSelectedFrom(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          >
            <option value="">Pilih bandara asal</option>
            {airports.map((airport) => (
              <option key={`from-${airport.code}`} value={airport.code}>
                {airport.code} - {airport.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bandara Tujuan
          </label>
          <select
            value={selectedTo}
            onChange={(e) => setSelectedTo(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          >
            <option value="">Pilih bandara tujuan</option>
            {airports.map((airport) => (
              <option key={`to-${airport.code}`} value={airport.code}>
                {airport.code} - {airport.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleSearch}
          disabled={!selectedFrom || !selectedTo || isSearching}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-all transform hover:scale-105 ${
            !selectedFrom || !selectedTo || isSearching
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isSearching ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Mencari...
            </div>
          ) : (
            'Cari Rute'
          )}
        </button>
      </div>

      <div className="text-xs text-gray-500 border-t pt-4">
        <p><strong>Total Bandara:</strong> {airports.length}</p>
        <p><strong>Total Rute:</strong> {routes.length}</p>
        <p><strong>Total Maskapai:</strong> {Object.keys(airlines).length}</p>
      </div>
    </motion.div>
  );
}