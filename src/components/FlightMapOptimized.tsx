'use client';

import React, { useEffect, useRef, useState, useMemo, memo, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { motion } from 'framer-motion';
import { useThrottle, useAnimationFrame } from '@/hooks/useAnimation';
import { calculateAirportDistance } from '@/lib/haversine';

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

interface FlightMapProps {
  airports: Airport[];
  routes: Route[];
  selectedRoute?: string[];
  alternativeRoutes?: Array<{
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
  }>;
  onAirportClick?: (airportCode: string) => void;
  showAirports?: boolean;
  showRoutes?: boolean;
  selectedAirlines?: string[];
  isAnimating?: boolean;
  animationSpeed?: 'slow' | 'normal' | 'fast';
  centralityMode?: boolean;
  centralityData?: Array<{
    code: string;
    degree: number;
    betweenness: number;
    closeness: number;
    overallRank: number;
  }>;
}

// Format distance function
const formatDistance = (distance: any): string => {
  if (typeof distance === 'number' && isFinite(distance)) {
    return distance === Infinity ? '∞' : distance.toLocaleString('id-ID');
  }
  return 'Belum Diketahui';
};

// Airline colors
const airlineColors = {
  'Garuda Indonesia': '#00A652',
  'Lion Air': '#F37021',
  'Indonesia Airasia': '#FF0000',
  'Wings Abadi Airlines': '#2E3192',
  'Trigana Air Service': '#005BAA',
  'Sriwijaya Air': '#0066B3',
  'Batik Air': '#8B0000',
  'NAM Air': '#FF6B35',
  'Citilink Indonesia': '#00AEEF'
};

// Centrality helper functions with improved scaling
const getRadius = (value: number, min: number, max: number): number => {
  return 6 + ((value - min) / (max - min)) * 24;
};

const getColor = (value: number, min: number, max: number): string => {
  const ratio = (value - min) / (max - min);
  return `hsl(${240 - ratio * 240}, 100%, 50%)`; // biru → merah
};

// Animation function for single plane with rotation and smooth movement
const animatePlane = (
  fromLatLng: L.LatLng, 
  toLatLng: L.LatLng, 
  map: L.Map,
  animationLayer: L.LayerGroup,
  originCode: string,
  destinationCode: string,
  speed: number = 0.005
): void => {
  // Clear any existing plane markers
  animationLayer.clearLayers();
  
  // Calculate bearing for rotation
  const getBearing = (start: L.LatLng, end: L.LatLng): number => {
    const startLat = start.lat * Math.PI / 180;
    const startLng = start.lng * Math.PI / 180;
    const endLat = end.lat * Math.PI / 180;
    const endLng = end.lng * Math.PI / 180;
    
    const dLng = endLng - startLng;
    const y = Math.sin(dLng) * Math.cos(endLat);
    const x = Math.cos(startLat) * Math.sin(endLat) - Math.sin(startLat) * Math.cos(endLat) * Math.cos(dLng);
    
    const bearing = Math.atan2(y, x) * 180 / Math.PI;
    return (bearing + 360) % 360;
  };
  
  const bearing = getBearing(fromLatLng, toLatLng);
  
  // Create plane icon with rotation
  const planeIcon = L.divIcon({
    className: 'plane-icon',
    html: `<div style="
      font-size: 24px;
      transform: rotate(${bearing}deg);
      transform-origin: center;
      text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
      transition: transform 0.1s ease-out;
    ">✈️</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
  
  const marker = L.marker(fromLatLng, { icon: planeIcon });
  
  // Add tooltip with route information
  marker.bindTooltip(`${originCode} → ${destinationCode}`, {
    permanent: true,
    direction: 'top',
    offset: [0, -20],
    className: 'plane-tooltip'
  });
  
  animationLayer.addLayer(marker);
  
  let progress = 0;
  let animationId: number;
  
  // Easing function for smooth animation
  const easeInOutQuad = (t: number): number => {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  };
  
  const animate = () => {
    progress += speed;
    
    if (progress >= 1) {
      // Animation complete - remove the plane
      animationLayer.removeLayer(marker);
      return;
    }
    
    // Apply easing for smooth movement
    const easedProgress = easeInOutQuad(progress);
    
    // Interpolate position
    const lat = fromLatLng.lat + (toLatLng.lat - fromLatLng.lat) * easedProgress;
    const lng = fromLatLng.lng + (toLatLng.lng - fromLatLng.lng) * easedProgress;
    
    marker.setLatLng([lat, lng]);
    
    animationId = requestAnimationFrame(animate);
  };
  
  animate();
  
  // Return cleanup function
  return () => {
    if (animationId) {
      cancelAnimationFrame(animationId);
    }
    animationLayer.removeLayer(marker);
  };
};

const FlightMap = memo(({ 
  airports, 
  routes, 
  selectedRoute, 
  alternativeRoutes = [], 
  onAirportClick, 
  showAirports = true, 
  showRoutes = true, 
  selectedAirlines = [],
  isAnimating = false,
  animationSpeed = 'normal',
  centralityMode = false,
  centralityData = []
}: FlightMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const centralityLayerRef = useRef<L.LayerGroup | null>(null);
  const animationLayerRef = useRef<L.LayerGroup | null>(null);
  const legendRef = useRef<L.Control | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const lastFrameTimeRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  const fpsRef = useRef<number>(0);

  // Memoized filtered routes
  const filteredRoutes = useMemo(() => {
    if (selectedAirlines.length === 0) return routes;
    return routes.filter(route => selectedAirlines.includes(route.airline));
  }, [routes, selectedAirlines]);

  // Memoized route coordinates for selected route
  const selectedRouteCoordinates = useMemo(() => {
    if (!selectedRoute || selectedRoute.length < 2) return [];
    
    const coordinates: [number, number][] = [];
    for (let i = 0; i < selectedRoute.length - 1; i++) {
      const fromAirport = airports.find(a => a.code === selectedRoute[i]);
      const toAirport = airports.find(a => a.code === selectedRoute[i + 1]);
      
      if (fromAirport && toAirport) {
        coordinates.push([fromAirport.latitude, fromAirport.longitude]);
        if (i === selectedRoute.length - 2) {
          coordinates.push([toAirport.latitude, toAirport.longitude]);
        }
      }
    }
    return coordinates;
  }, [selectedRoute, airports]);

  // FPS monitoring function
  const monitorFPS = useCallback(() => {
    const now = performance.now();
    frameCountRef.current++;
    
    if (now - lastFrameTimeRef.current >= 1000) {
      fpsRef.current = frameCountRef.current;
      frameCountRef.current = 0;
      lastFrameTimeRef.current = now;
      
      // Log FPS if it drops below 50
      if (fpsRef.current < 50 && centralityMode) {
        console.warn(`FPS dropped to ${fpsRef.current} in centrality mode`);
      }
    }
  }, [centralityMode]);

  // Throttled map update function
  const updateMapLayers = useThrottle(() => {
    if (!mapInstanceRef.current || !isClient) return;

    // Monitor FPS
    monitorFPS();

    // Show loading state for complex operations
    if (centralityMode && centralityData.length > 50) {
      setIsLoading(true);
      // Use setTimeout to allow UI to update before heavy processing
      setTimeout(() => {
        setIsLoading(false);
      }, 100);
    }

    // Clear existing layers except base tile layer and layer groups
    mapInstanceRef.current.eachLayer((layer) => {
      if (!(layer instanceof L.TileLayer) && 
          layer !== centralityLayerRef.current && 
          layer !== animationLayerRef.current) {
        mapInstanceRef.current?.removeLayer(layer);
      }
    });

    // Clear centrality layer if not in centrality mode
    if (!centralityMode && centralityLayerRef.current) {
      centralityLayerRef.current.clearLayers();
    }

    // Add optimized markers (only if not in centrality mode)
    if (showAirports && !centralityMode) {
      airports.forEach(airport => {
        const marker = L.marker([airport.latitude, airport.longitude])
          .bindPopup(`
            <div class="text-sm">
              <strong>${airport.name}</strong><br>
              Kode: ${airport.code}<br>
              Lat: ${airport.latitude.toFixed(4)}<br>
              Lng: ${airport.longitude.toFixed(4)}
            </div>
          `);

        if (onAirportClick) {
          marker.on('click', () => onAirportClick(airport.code));
        }
        
        marker.addTo(mapInstanceRef.current!);
      });
    }

    // Add centrality markers if in centrality mode
    if (centralityMode && centralityData.length > 0 && centralityLayerRef.current) {
      centralityLayerRef.current.clearLayers();
      
      // Calculate min and max centrality values for normalization
      const centralityValues = centralityData.map(data => data.betweenness);
      const minCentrality = Math.min(...centralityValues);
      const maxCentrality = Math.max(...centralityValues);
      
      // Add legend if not exists
      if (!legendRef.current && mapInstanceRef.current) {
        const legend = L.control({ position: 'bottomright' });
        legend.onAdd = () => {
          const div = L.DomUtil.create('div', 'info legend');
          div.innerHTML = `
            <div style="
              background: rgba(255, 255, 255, 0.95);
              padding: 12px;
              border-radius: 8px;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              font-size: 13px;
              backdrop-filter: blur(10px);
              border: 1px solid rgba(255,255,255,0.2);
            ">
              <h4 style="
                margin: 0 0 10px 0; 
                font-size: 14px; 
                font-weight: 600; 
                color: #1f2937;
                text-align: center;
              ">Tingkat Centrality</h4>
              <div style="display: flex; align-items: center; margin: 6px 0;">
                <div style="
                  background: hsl(240, 100%, 50%); 
                  width: 12px; 
                  height: 12px; 
                  border-radius: 50%; 
                  display: inline-block; 
                  margin-right: 8px;
                  border: 1px solid rgba(0,0,0,0.1);
                "></div>
                <span style="color: #4b5563;">Rendah</span>
                <span style="margin-left: auto; color: #6b7280; font-size: 11px;">${minCentrality.toFixed(3)}</span>
              </div>
              <div style="
                height: 4px; 
                background: linear-gradient(to right, hsl(240, 100%, 50%), hsl(0, 100%, 50%)); 
                border-radius: 2px; 
                margin: 8px 0;
              "></div>
              <div style="display: flex; align-items: center; margin: 6px 0;">
                <div style="
                  background: hsl(0, 100%, 50%); 
                  width: 12px; 
                  height: 12px; 
                  border-radius: 50%; 
                  display: inline-block; 
                  margin-right: 8px;
                  border: 1px solid rgba(0,0,0,0.1);
                "></div>
                <span style="color: #4b5563;">Tinggi</span>
                <span style="margin-left: auto; color: #6b7280; font-size: 11px;">${maxCentrality.toFixed(3)}</span>
              </div>
              <div style="
                margin-top: 8px; 
                padding-top: 8px; 
                border-top: 1px solid rgba(0,0,0,0.1); 
                font-size: 11px; 
                color: #6b7280; 
                text-align: center;
              ">
                Semakin besar dan merah, semakin penting
              </div>
            </div>
          `;
          return div;
        };
        legend.addTo(mapInstanceRef.current);
        legendRef.current = legend;
      }
      
      centralityData.forEach(airportData => {
        const airport = airports.find(a => a.code === airportData.code);
        if (!airport) return;

        // Use betweenness centrality for visualization
        const centralityValue = airportData.betweenness;
        const radius = getRadius(centralityValue, minCentrality, maxCentrality);
        const color = getColor(centralityValue, minCentrality, maxCentrality);
        
        // Calculate centrality percentage for display
        const centralityPercentage = ((centralityValue - minCentrality) / (maxCentrality - minCentrality)) * 100;

        // Use L.circleMarker for better performance and smoother rendering
        const marker = L.circleMarker([airport.latitude, airport.longitude], {
          radius,
          color: 'rgba(255, 255, 255, 0.8)',
          fillColor: color,
          fillOpacity: 0.8,
          weight: 1.5,
          className: 'centrality-circle-marker',
          bubblingMouseEvents: true
        }).bindTooltip(`
          <div style="
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 12px;
            min-width: 140px;
          ">
            <strong style="color: #1f2937; font-size: 13px;">${airport.name}</strong><br>
            <span style="color: #6b7280;">Kode: ${airport.code}</span><br>
            <div style="
              margin-top: 6px; 
              padding: 4px 8px; 
              background: ${color}; 
              color: white; 
              border-radius: 4px; 
              font-weight: 500; 
              text-align: center;
              font-size: 11px;
            ">
              Tingkat Centrality: ${centralityPercentage.toFixed(1)}%
            </div>
          </div>
        `, {
          permanent: false,
          direction: 'top',
          offset: [0, -radius - 5],
          className: 'centrality-tooltip',
          opacity: 0.9
        });

        // Add hover effect with smooth transitions
        marker.on('mouseover', function() {
          this.setStyle({
            weight: 2.5,
            fillOpacity: 0.95,
            color: 'rgba(255, 255, 255, 0.95)'
          });
          this.bringToFront();
        });
        
        marker.on('mouseout', function() {
          this.setStyle({
            weight: 1.5,
            fillOpacity: 0.8,
            color: 'rgba(255, 255, 255, 0.8)'
          });
        });

        if (onAirportClick) {
          marker.on('click', () => onAirportClick(airport.code));
        }
        
        centralityLayerRef.current.addLayer(marker);
      });
    } else {
      // Remove legend when not in centrality mode
      if (legendRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeControl(legendRef.current);
        legendRef.current = null;
      }
    }

    // Function to start plane animation
    const startPlaneAnimation = () => {
      if (!animationLayerRef.current || !selectedRoute || selectedRoute.length < 2) return;
      
      // Clear existing animations
      animationLayerRef.current.clearLayers();
      
      // Calculate speed based on animationSpeed
      const speed = animationSpeed === 'slow' ? 0.002 : animationSpeed === 'fast' ? 0.01 : 0.005;
      
      // Animate the complete route with one plane
      let currentSegment = 0;
      
      const animateNextSegment = () => {
        if (currentSegment >= selectedRoute.length - 1) {
          // All segments complete
          return;
        }
        
        const fromAirport = airports.find(a => a.code === selectedRoute[currentSegment]);
        const toAirport = airports.find(a => a.code === selectedRoute[currentSegment + 1]);
        
        if (fromAirport && toAirport) {
          const fromLatLng = L.latLng(fromAirport.latitude, fromAirport.longitude);
          const toLatLng = L.latLng(toAirport.latitude, toAirport.longitude);
          
          if (animationLayerRef.current && mapInstanceRef.current) {
            animatePlane(
              fromLatLng, 
              toLatLng, 
              mapInstanceRef.current, 
              animationLayerRef.current,
              fromAirport.code,
              toAirport.code,
              speed
            );
          }
          
          // Move to next segment after delay
          currentSegment++;
          setTimeout(animateNextSegment, 3000); // 3 seconds per segment
        }
      };
      
      // Start animation
      animateNextSegment();
    };

    // Start animation if enabled
    if (isAnimating && selectedRouteCoordinates.length > 1) {
      startPlaneAnimation();
    }

    // Add optimized polylines
    if (showRoutes) {
      const colors = airlineColors;
      
      filteredRoutes.forEach(route => {
        const fromAirport = airports.find(a => a.code === route.from);
        const toAirport = airports.find(a => a.code === route.to);

        if (fromAirport && toAirport) {
          const color = colors[route.airline] || '#3b82f6';
          const isSelected = selectedAirlines.length > 0;

          const polyline = L.polyline(
            [
              [fromAirport.latitude, fromAirport.longitude],
              [toAirport.latitude, toAirport.longitude]
            ],
            {
              color: color,
              weight: isSelected ? 3 : 2,
              opacity: isSelected ? 0.8 : 0.6
            }
          ).bindPopup(`
            <div class="text-sm">
              <strong>${route.from} → ${route.to}</strong><br>
              <span style="color: ${color}">●</span> Maskapai: ${route.airline}<br>
              Jarak: ${formatDistance(route.distance)} km
            </div>
          `);

          polyline.addTo(mapInstanceRef.current!);
        }
      });
    }

    // Add selected route with distance labels
    if (selectedRouteCoordinates.length > 1) {
      const selectedPolyline = L.polyline(selectedRouteCoordinates, {
        color: '#ef4444',
        weight: 4,
        opacity: 1
      }).addTo(mapInstanceRef.current!);

      // Add distance labels
      for (let i = 0; i < selectedRoute.length - 1; i++) {
        const fromAirport = airports.find(a => a.code === selectedRoute[i]);
        const toAirport = airports.find(a => a.code === selectedRoute[i + 1]);
        
        if (fromAirport && toAirport) {
          const distance = calculateAirportDistance(fromAirport, toAirport);
          const midLat = (fromAirport.latitude + toAirport.latitude) / 2;
          const midLng = (fromAirport.longitude + toAirport.longitude) / 2;

          const distanceIcon = L.divIcon({
            className: 'distance-label',
            html: `<div style="
              background: rgba(239, 68, 68, 0.9);
              color: white;
              padding: 4px 8px;
              border-radius: 12px;
              font-size: 12px;
              font-weight: bold;
              border: 2px solid white;
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
              white-space: nowrap;
            ">${distance.toFixed(0)} km</div>`,
            iconSize: [60, 20],
            iconAnchor: [30, 10]
          });

          L.marker([midLat, midLng], { icon: distanceIcon })
            .bindPopup(`
              <div class="text-sm">
                <strong>Segmen: ${fromAirport.code} → ${toAirport.code}</strong><br>
                Jarak: ${distance.toFixed(2)} km<br>
                <em>Bobot graf: w(${fromAirport.code},${toAirport.code}) = ${distance.toFixed(0)}</em>
              </div>
            `)
            .addTo(mapInstanceRef.current!);
        }
      }

      // Fit map to selected route
      const bounds = L.latLngBounds(selectedRouteCoordinates);
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
    }

    // Add alternative routes
    if (alternativeRoutes.length > 0) {
      const colors = ['#f59e0b', '#8b5cf6', '#06b6d4'];
      
      alternativeRoutes.forEach((route, index) => {
        if (index === 0) return;
        
        const altCoordinates: [number, number][] = [];
        
        for (let i = 0; i < route.path.length - 1; i++) {
          const fromAirport = airports.find(a => a.code === route.path[i]);
          const toAirport = airports.find(a => a.code === route.path[i + 1]);
          
          if (fromAirport && toAirport) {
            altCoordinates.push([fromAirport.latitude, fromAirport.longitude]);
            if (i === route.path.length - 2) {
              altCoordinates.push([toAirport.latitude, toAirport.longitude]);
            }
          }
        }

        if (altCoordinates.length > 1) {
          L.polyline(altCoordinates, {
            color: colors[index - 1],
            weight: 3,
            opacity: 0.7,
            dashArray: '10, 10'
          }).bindPopup(`
            <div class="text-sm">
              <strong>Alternatif ${index}</strong><br>
              Jarak: ${formatDistance(route.totalDistance)} km<br>
              Waktu: ${Math.floor(route.totalTime / 60)}j ${Math.round(route.totalTime % 60)}m
            </div>
          `).addTo(mapInstanceRef.current!);
        }
      });
    }
  }, 100); // Throttle to 100ms

  // Initialize map only once
  useEffect(() => {
    if (!isClient || !mapRef.current || isInitialized) return;

    // Fix for default markers in React
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });

    mapInstanceRef.current = L.map(mapRef.current).setView([-2.5, 118], 5);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(mapInstanceRef.current);

    // Initialize layer groups
    centralityLayerRef.current = L.layerGroup().addTo(mapInstanceRef.current);
    animationLayerRef.current = L.layerGroup().addTo(mapInstanceRef.current);

    setIsInitialized(true);
  }, [isClient, isInitialized]);

  // Update map layers when dependencies change
  useEffect(() => {
    if (isInitialized) {
      updateMapLayers();
    }
  }, [
    isInitialized,
    showAirports,
    showRoutes,
    selectedAirlines,
    centralityMode,
    centralityData,
    selectedRoute,
    alternativeRoutes,
    filteredRoutes,
    selectedRouteCoordinates,
    updateMapLayers
  ]);

  // Animation frame for smooth updates
  useAnimationFrame((deltaTime) => {
    if (isAnimating && selectedRouteCoordinates.length > 1) {
      // Handle animation logic here if needed
    }
  });

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Cleanup animation layer when animation is disabled or component unmounts
  useEffect(() => {
    return () => {
      if (animationLayerRef.current) {
        animationLayerRef.current.clearLayers();
      }
    };
  }, [isAnimating]);

  // Cleanup function for component unmount
  useEffect(() => {
    return () => {
      if (centralityLayerRef.current) {
        centralityLayerRef.current.clearLayers();
      }
      if (animationLayerRef.current) {
        animationLayerRef.current.clearLayers();
      }
      if (legendRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeControl(legendRef.current);
        legendRef.current = null;
      }
    };
  }, []);

  return (
    <div className="relative">
      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute top-4 right-4 z-[1000] bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm text-gray-700">Memuat peta...</span>
          </div>
        </div>
      )}
      
      <div 
        ref={mapRef} 
        className="w-full h-full rounded-lg"
        style={{ minHeight: '600px' }}
      />
    </div>
  );
});

FlightMap.displayName = 'FlightMap';

export default FlightMap;