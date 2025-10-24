'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import ControlPanel from '@/components/ControlPanel';
import MapControls from '@/components/MapControls';
import RouteDetails from '@/components/RouteDetails';
import GraphAnalysisPanel from '@/components/GraphAnalysisPanel';
import AlternativeRoutes from '@/components/AlternativeRoutes';

import NetworkAnalysis from '@/components/NetworkAnalysis';
import { CentralityAnalyzer } from '@/lib/centrality';
import AnimationControls from '@/components/AnimationControls';
import { RouteFinder } from '@/lib/dijkstra';
import { airports, routes, airlines } from '@/data/flightData';
import { centralityManager } from '@/lib/centralityManager';
import CentralityLoadingIndicator from '@/components/CentralityLoadingIndicator';

// TypeScript interfaces
interface Airline {
  name: string;
  speed: number;
}

type AirlinesRecord = Record<string, Airline>;

// Default speed constant
const DEFAULT_SPEED = 800;

// Dynamic import for FlightMap to avoid SSR issues
const FlightMap = dynamic(() => import('@/components/FlightMapOptimized'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[600px] bg-gray-200 rounded-lg flex items-center justify-center">
      <div className="text-gray-600">Loading map...</div>
    </div>
  )
});

export default function Home() {
  const [selectedRoute, setSelectedRoute] = useState<string[]>([]);
  const [alternativeRoutes, setAlternativeRoutes] = useState<Array<{
    path: string[];
    totalDistance: number;
    airlines: string[];
    totalTime: number;
    segments?: Array<{
      from: string;
      to: string;
      distance: number;
      fromName: string;
      toName: string;
      airline: string;
    }>;
  }>>([]);
  const [showAirports, setShowAirports] = useState(true);
  const [showRoutes, setShowRoutes] = useState(true);
  const [selectedAirlines, setSelectedAirlines] = useState<string[]>([]);
  const [routeDetails, setRouteDetails] = useState<{
    path: string[];
    totalDistance: number;
    airlines: string[];
    totalTime: number;
    segments?: Array<{
      from: string;
      to: string;
      distance: number;
      fromName: string;
      toName: string;
      airline: string;
    }>;
  } | null>(null);
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState<'slow' | 'normal' | 'fast'>('normal');
  const [isAnimating, setIsAnimating] = useState(false);

  const [activeTab, setActiveTab] = useState<'routes' | 'analysis' | 'centrality' | 'animation'>('routes');
  const [selectedFromAirport, setSelectedFromAirport] = useState<string>('');
  const [selectedToAirport, setSelectedToAirport] = useState<string>('');
  const [selectedAirportForCentrality, setSelectedAirportForCentrality] = useState<string>('');
  const [centralityMode, setCentralityMode] = useState(false);
  const [centralityData, setCentralityData] = useState<any>(null);
  const [isCalculatingCentrality, setIsCalculatingCentrality] = useState(false);
  const [mapCentralityData, setMapCentralityData] = useState<any[]>([]);
  
  // Create airline speeds mapping with defensive code
  const airlineSpeeds: Record<string, number> = {};
  
  // Add logging for debugging
  console.log('airlines loaded:', !!airlines, airlines && Object.keys(airlines).length);
  
  // Defensive code to handle undefined airlines
  if (!airlines || Object.keys(airlines).length === 0) {
    console.warn('airlines data empty or undefined');
  } else {
    Object.entries(airlines).forEach(([key, airline]) => {
      airlineSpeeds[airline.name] = airline.speed ?? DEFAULT_SPEED;
    });
  }
  
  const routeFinder = new RouteFinder(routes, airlineSpeeds, airports);

  // Preload centrality data on component mount
  useEffect(() => {
    const preloadCentrality = async () => {
      try {
        await centralityManager.preload(routes, airports);
      } catch (error) {
        console.error('Failed to preload centrality data:', error);
      }
    };
    
    preloadCentrality();
  }, [routes, airports]);

  // Get all unique airline names
  const allAirlines = Array.from(new Set(routes.map(route => route.airline)));

  const handleRouteSearch = (from: string, to: string) => {
    setSelectedFromAirport(from);
    setSelectedToAirport(to);
    
    const result = routeFinder.findShortestPath(from, to);
    if (result) {
      setSelectedRoute(result.path);
      
      // Find alternative routes
      const alternatives = routeFinder.findKShortestPaths(from, to, 3);
      setAlternativeRoutes(alternatives);
      
      return result;
    }
    setSelectedRoute([]);
    setAlternativeRoutes([]);
    return null;
  };

  const handleAirportClick = (airportCode: string) => {
    // You can add functionality here when an airport is clicked
    console.log('Airport clicked:', airportCode);
  };

  const handleToggleAirports = () => {
    setShowAirports(!showAirports);
  };

  const handleToggleRoutes = () => {
    setShowRoutes(!showRoutes);
  };

  const handleToggleAirline = (airline: string) => {
    setSelectedAirlines(prev => {
      if (prev.includes(airline)) {
        return prev.filter(a => a !== airline);
      } else {
        return [...prev, airline];
      }
    });
  };

  const handleShowAllAirlines = () => {
    setSelectedAirlines(allAirlines);
  };

  const handleHideAllAirlines = () => {
    setSelectedAirlines([]);
  };

  const handleRouteFound = (details: {
    path: string[];
    totalDistance: number;
    airlines: string[];
    totalTime: number;
    segments?: Array<{
      from: string;
      to: string;
      distance: number;
      fromName: string;
      toName: string;
      airline: string;
    }>;
  } | null) => {
    setRouteDetails(details);
  };

  // Get graph analysis
  const graphAnalysis = routeFinder.getGraphAnalysis();
  const isConnected = routeFinder.isConnected();
  const airlinePerformance = routeFinder.getAirlinePerformance();

  // Handle airport selection for centrality analysis
  const handleAirportSelectForCentrality = (airportCode: string) => {
    setSelectedAirportForCentrality(airportCode);
  };
  
  // Toggle centrality mode on map
  const toggleCentralityMode = async () => {
    const newMode = !centralityMode;
    
    if (newMode && !centralityData) {
      // Calculate centrality data if not already calculated
      setIsCalculatingCentrality(true);
      try {
        const result = await centralityManager.calculateCentrality(routes, airports);
        setCentralityData(result);
        
        // Prepare centrality data for map visualization
        const mapData = result.airports.map(airport => ({
          code: airport.code,
          degree: airport.metrics.degree,
          betweenness: airport.metrics.betweenness,
          closeness: airport.metrics.closeness,
          overallRank: airport.rank.overall
        }));
        setMapCentralityData(mapData);
      } catch (error) {
        console.error('Failed to calculate centrality:', error);
        // Fallback to synchronous calculation
        const fallbackAnalyzer = new CentralityAnalyzer(routes, airports);
        const fallbackResult = fallbackAnalyzer.calculateNetworkCentrality();
        setCentralityData(fallbackResult);
        
        const mapData = fallbackResult.airports.map(airport => ({
          code: airport.code,
          degree: airport.metrics.degree,
          betweenness: airport.metrics.betweenness,
          closeness: airport.metrics.closeness,
          overallRank: airport.rank.overall
        }));
        setMapCentralityData(mapData);
      } finally {
        setIsCalculatingCentrality(false);
      }
    }
    
    setCentralityMode(newMode);
  };

  // Animation control functions
  const startAnimation = () => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 5000); // Stop after 5 seconds
  };

  const stopAnimation = () => {
    setIsAnimating(false);
  };



  // Handle alternative route selection
  const handleAlternativeRouteSelect = (route: {
    path: string[];
    totalDistance: number;
    airlines: string[];
    totalTime: number;
    segments?: Array<{
      from: string;
      to: string;
      distance: number;
      fromName: string;
      toName: string;
      airline: string;
    }>;
  }) => {
    setSelectedRoute(route.path);
    setRouteDetails(route);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Loading Indicator */}
      <CentralityLoadingIndicator isVisible={isCalculatingCentrality} />
      
      {/* Header */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="bg-white shadow-lg border-b border-gray-200"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Visualisasi Rute Penerbangan Indonesia
              </h1>
              <p className="mt-2 text-gray-600">
                Jelajahi rute penerbangan antar bandara di Indonesia dengan interaktif
              </p>
            </div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg"
            >
              <span className="text-sm font-medium">
                {airports.length} Bandara • {routes.length} Rute • {Object.keys(airlines || {}).length} Maskapai
              </span>
            </motion.div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Map Section */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-3"
          >
            <div className="bg-white rounded-xl shadow-xl p-6 h-full">
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Peta Rute Penerbangan</h2>
                <p className="text-sm text-gray-600">
                  Klik pada marker bandara untuk melihat detail. Gunakan kontrol di panel kanan untuk menampilkan/menyembunyikan elemen peta dan filter maskapai.
                </p>
              </div>
              <div className="h-[600px] rounded-lg overflow-hidden border border-gray-200">
                <FlightMap
                  airports={airports}
                  routes={routes}
                  selectedRoute={selectedRoute}
                  alternativeRoutes={alternativeRoutes}
                  onAirportClick={handleAirportClick}
                  showAirports={showAirports}
                  showRoutes={showRoutes}
                  selectedAirlines={selectedAirlines}
                  isAnimating={isAnimating}
                  animationSpeed={animationSpeed}
                  centralityMode={centralityMode}
                  centralityData={mapCentralityData}
                />
              </div>
            </div>
          </motion.div>

          {/* Control Panel Section */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="lg:col-span-1 space-y-6"
          >
            {/* Map Controls */}
            <MapControls
              showAirports={showAirports}
              showRoutes={showRoutes}
              selectedAirlines={selectedAirlines}
              airlines={allAirlines}
              centralityMode={centralityMode}
              onToggleAirports={handleToggleAirports}
              onToggleRoutes={handleToggleRoutes}
              onToggleCentralityMode={toggleCentralityMode}
              onToggleAirline={handleToggleAirline}
              onShowAllAirlines={handleShowAllAirlines}
              onHideAllAirlines={handleHideAllAirlines}
            />
            
            {/* Route Finder Control Panel */}
            <ControlPanel
              airports={airports}
              routes={routes}
              onRouteSearch={handleRouteSearch}
              onRouteFound={handleRouteFound}
            />
          </motion.div>
        </div>

        {/* Route Details Section */}
        {routeDetails && activeTab === 'routes' && (
          <RouteDetails
            routeDetails={routeDetails}
            airports={airports}
          />
        )}

        {/* Alternative Routes Section */}
        {alternativeRoutes.length > 1 && activeTab === 'routes' && (
          <AlternativeRoutes
            alternativeRoutes={alternativeRoutes}
            airports={airports}
            onRouteSelect={handleAlternativeRouteSelect}
          />
        )}

        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-8"
        >
          <div className="bg-white rounded-xl shadow-lg p-2">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveTab('routes')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'routes'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                🛣️ Rute & Alternatif
              </button>
              <button
                onClick={() => setActiveTab('centrality')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'centrality'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                🎯 Centrality
              </button>
              <button
                onClick={() => setActiveTab('analysis')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'analysis'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                📊 Analisis Graf
              </button>

              <button
                onClick={() => setActiveTab('animation')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'animation'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                ✈️ Animasi
              </button>
            </div>
          </div>
        </motion.div>

        {/* Tab Content */}
        {activeTab === 'centrality' && centralityData && (
          <NetworkAnalysis
            airports={centralityData.airports}
            networkStats={centralityData.networkStats}
            onAirportSelect={handleAirportSelectForCentrality}
            selectedAirport={selectedAirportForCentrality}
          />
        )}

        {activeTab === 'analysis' && (
          <GraphAnalysisPanel
            graphAnalysis={graphAnalysis}
            isConnected={isConnected}
            airlinePerformance={airlinePerformance}
            airports={airports}
          />
        )}



        {activeTab === 'animation' && (
          <AnimationControls
            isAnimating={isAnimating}
            animationSpeed={animationSpeed}
            onStart={startAnimation}
            onStop={stopAnimation}
            onSpeedChange={setAnimationSpeed}
            hasRoute={selectedRoute.length > 0}
          />
        )}

        {/* Legend */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-8 bg-white rounded-xl shadow-lg p-6"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Legenda & Informasi</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
              <span className="text-sm text-gray-700">Marker Bandara</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-0.5 bg-blue-500"></div>
              <span className="text-sm text-gray-700">Rute Tersedia</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-0.5 bg-red-500"></div>
              <span className="text-sm text-gray-700">Rute Terpilih</span>
            </div>
          </div>
          
          <div>
            <h4 className="text-md font-medium text-gray-700 mb-3">Maskapai & Kecepatan:</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {Object.entries(airlines || {}).map(([key, airline]) => (
                <div key={key} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{airline.name}:</span>
                  <span className="font-medium text-blue-600">{airline.speed} km/jam</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <h4 className="text-sm font-medium text-blue-800 mb-2">💡 Fitur Baru:</h4>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Kontrol di kanan peta untuk toggle marker & garis</li>
              <li>• Filter maskapai untuk melihat rute per maskapai</li>
              <li>• Warna berbeda untuk setiap maskapai</li>
              <li>• Tombol "Semua"/"None" untuk quick filter</li>
              <li>• Detail rute muncul di bawah peta setelah pencarian</li>
              <li>• Perhitungan jarak antar bandara dengan rumus Haversine</li>
              <li>• Visualisasi bobot graf pada peta dan tabel detail</li>
            </ul>
          </div>
          
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-800 mb-2">🎨 Warna Maskapai:</h4>
            <div className="grid grid-cols-1 gap-1 text-xs">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-0.5 bg-[#00A652]"></span>
                <span>Garuda Indonesia</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-0.5 bg-[#F37021]"></span>
                <span>Lion Air</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-0.5 bg-[#FF0000]"></span>
                <span>Indonesia AirAsia</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-0.5 bg-[#2E3192]"></span>
                <span>Wings Abadi Airlines</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-0.5 bg-[#005BAA]"></span>
                <span>Trigana Air Service</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-0.5 bg-[#0066B3]"></span>
                <span>Sriwijaya Air</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-0.5 bg-[#8B0000]"></span>
                <span>Batik Air</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-0.5 bg-[#FF6B35]"></span>
                <span>NAM Air</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-0.5 bg-[#00AEEF]"></span>
                <span>Citilink Indonesia</span>
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        className="bg-white border-t border-gray-200 mt-16"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-gray-600">
            <p className="text-sm">
              Dibuat dengan LeafletJS, OpenStreetMap, dan Next.js • 
              <span className="ml-2">© {new Date().getFullYear()}</span>
            </p>
          </div>
        </div>
      </motion.footer>
    </div>
  );
}