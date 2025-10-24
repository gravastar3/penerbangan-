'use client';

import { motion } from 'framer-motion';

interface MapControlsProps {
  showAirports: boolean;
  showRoutes: boolean;
  selectedAirlines: string[];
  airlines: string[];
  centralityMode: boolean;
  onToggleAirports: () => void;
  onToggleRoutes: () => void;
  onToggleCentralityMode: () => void;
  onToggleAirline: (airline: string) => void;
  onShowAllAirlines: () => void;
  onHideAllAirlines: () => void;
}

export default function MapControls({ 
  showAirports, 
  showRoutes, 
  selectedAirlines,
  airlines,
  centralityMode,
  onToggleAirports, 
  onToggleRoutes,
  onToggleCentralityMode,
  onToggleAirline,
  onShowAllAirlines,
  onHideAllAirlines
}: MapControlsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-lg shadow-lg p-4"
    >
      <h3 className="text-sm font-semibold text-gray-800 mb-3">Kontrol Peta</h3>
      
      {/* Basic Controls */}
      <div className="space-y-2 mb-4">
        <button
          onClick={onToggleAirports}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            showAirports 
              ? 'bg-blue-600 text-white hover:bg-blue-700' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            <span>Marker Bandara</span>
          </div>
          <span className={`w-2 h-2 rounded-full ${showAirports ? 'bg-white' : 'bg-gray-500'}`}></span>
        </button>

        <button
          onClick={onToggleRoutes}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            showRoutes 
              ? 'bg-blue-600 text-white hover:bg-blue-700' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>Semua Garis Rute</span>
          </div>
          <span className={`w-2 h-2 rounded-full ${showRoutes ? 'bg-white' : 'bg-gray-500'}`}></span>
        </button>

        <button
          onClick={onToggleCentralityMode}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            centralityMode 
              ? 'bg-purple-600 text-white hover:bg-purple-700' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span>Mode Centrality</span>
          </div>
          <span className={`w-2 h-2 rounded-full ${centralityMode ? 'bg-white' : 'bg-gray-500'}`}></span>
        </button>
      </div>

      {/* Airline Controls */}
      <div className="border-t pt-3">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-semibold text-gray-700">Filter Maskapai:</h4>
          <div className="flex space-x-1">
            <button
              onClick={onShowAllAirlines}
              className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
            >
              Semua
            </button>
            <button
              onClick={onHideAllAirlines}
              className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
            >
              None
            </button>
          </div>
        </div>
        
        <div className="max-h-48 overflow-y-auto space-y-1">
          {airlines.map((airline) => (
            <button
              key={airline}
              onClick={() => onToggleAirline(airline)}
              className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-xs transition-all ${
                selectedAirlines.includes(airline)
                  ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span className="truncate text-left">{airline}</span>
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                selectedAirlines.includes(airline) ? 'bg-blue-600' : 'bg-gray-400'
              }`}></span>
            </button>
          ))}
        </div>
      </div>

      <div className="text-xs text-gray-500 border-t pt-2 mt-3">
        <p>Klik untuk menampilkan/menyembunyikan elemen peta</p>
      </div>
    </motion.div>
  );
}