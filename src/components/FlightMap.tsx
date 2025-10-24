'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
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

// Safe distance formatting function
const formatDistance = (distance: any): string => {
  if (typeof distance === 'number' && isFinite(distance)) {
    return distance === Infinity ? '∞' : distance.toLocaleString();
  }
  return 'Belum Diketahui';
};

export default function FlightMap({ 
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
}: FlightMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const polylinesRef = useRef<L.Polyline[]>([]);
  const selectedRouteRef = useRef<L.Polyline | null>(null);
  const alternativeRouteRefs = useRef<L.Polyline[]>([]);
  const distanceMarkersRef = useRef<L.Marker[]>([]);
  const animationMarkerRef = useRef<L.Marker | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !mapRef.current) return;

    // Fix for default markers in React
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });

    // Initialize map
    mapInstanceRef.current = L.map(mapRef.current).setView([-2.5, 118], 5);

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(mapInstanceRef.current);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }
    };
  }, [isClient]);

  useEffect(() => {
    if (!isClient || !mapInstanceRef.current) return;

    // Clear existing markers and polylines
    markersRef.current.forEach(marker => mapInstanceRef.current?.removeLayer(marker));
    polylinesRef.current.forEach(polyline => mapInstanceRef.current?.removeLayer(polyline));
    distanceMarkersRef.current.forEach(marker => mapInstanceRef.current?.removeLayer(marker));
    alternativeRouteRefs.current.forEach(polyline => mapInstanceRef.current?.removeLayer(polyline));
    if (selectedRouteRef.current) {
      mapInstanceRef.current.removeLayer(selectedRouteRef.current);
    }
    if (animationMarkerRef.current) {
      mapInstanceRef.current.removeLayer(animationMarkerRef.current);
    }

    // Reset arrays
    markersRef.current = [];
    polylinesRef.current = [];
    distanceMarkersRef.current = [];
    alternativeRouteRefs.current = [];
    selectedRouteRef.current = null;
    animationMarkerRef.current = null;

    // Add airport markers only if showAirports is true
    if (showAirports) {
      airports.forEach(airport => {
        let marker: L.Marker;
        
        if (centralityMode && centralityData.length > 0) {
          // Find centrality data for this airport
          const airportCentrality = centralityData.find(c => c.code === airport.code);
          
          if (airportCentrality) {
            // Calculate size based on degree centrality (normalize to reasonable range)
            const baseSize = 15;
            const maxSize = 50;
            const sizeFactor = Math.min(airportCentrality.degree / 10, 1); // Normalize degree
            const markerSize = baseSize + (maxSize - baseSize) * sizeFactor;
            
            // Calculate color based on betweenness centrality
            const betweennessIntensity = Math.min(airportCentrality.betweenness * 10, 1);
            const red = Math.floor(255 * betweennessIntensity);
            const blue = Math.floor(255 * (1 - betweennessIntensity));
            const color = `rgb(${red}, 100, ${blue})`;
            
            // Create custom icon for centrality visualization
            const customIcon = L.divIcon({
              className: 'centrality-marker',
              html: `<div style="
                background: ${color};
                width: ${markerSize}px;
                height: ${markerSize}px;
                border-radius: 50%;
                border: 3px solid white;
                box-shadow: 0 2px 8px rgba(0,0,0,0.4);
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
                font-size: ${Math.max(8, markerSize / 3)}px;
                text-shadow: 1px 1px 2px rgba(0,0,0,0.7);
              ">${airport.code}</div>`,
              iconSize: [markerSize, markerSize],
              iconAnchor: [markerSize/2, markerSize/2]
            });
            
            marker = L.marker([airport.latitude, airport.longitude], { icon: customIcon })
              .addTo(mapInstanceRef.current!)
              .bindPopup(`
                <div class="text-sm">
                  <strong>${airport.name}</strong><br>
                  Kode: ${airport.code}<br>
                  <strong>Centrality Metrics:</strong><br>
                  Degree: ${airportCentrality.degree}<br>
                  Betweenness: ${airportCentrality.betweenness.toFixed(3)}<br>
                  Closeness: ${airportCentrality.closeness.toFixed(3)}<br>
                  Overall Rank: ${airportCentrality.overallRank.toFixed(1)}<br>
                  Lat: ${airport.latitude.toFixed(4)}<br>
                  Lng: ${airport.longitude.toFixed(4)}
                </div>
              `);
          } else {
            // Fallback to default marker if no centrality data
            marker = L.marker([airport.latitude, airport.longitude])
              .addTo(mapInstanceRef.current!)
              .bindPopup(`
                <div class="text-sm">
                  <strong>${airport.name}</strong><br>
                  Kode: ${airport.code}<br>
                  Lat: ${airport.latitude.toFixed(4)}<br>
                  Lng: ${airport.longitude.toFixed(4)}
                </div>
              `);
          }
        } else {
          // Default marker when not in centrality mode
          marker = L.marker([airport.latitude, airport.longitude])
            .addTo(mapInstanceRef.current!)
            .bindPopup(`
              <div class="text-sm">
                <strong>${airport.name}</strong><br>
                Kode: ${airport.code}<br>
                Lat: ${airport.latitude.toFixed(4)}<br>
                Lng: ${airport.longitude.toFixed(4)}
              </div>
            `);
        }

        marker.on('click', () => onAirportClick?.(airport.code));
        markersRef.current.push(marker);
      });
    }

    // Add route polylines only if showRoutes is true
    if (showRoutes) {
      // Filter routes based on selected airlines
      const filteredRoutes = selectedAirlines.length > 0 
        ? routes.filter(route => selectedAirlines.includes(route.airline))
        : routes;

      filteredRoutes.forEach(route => {
        const fromAirport = airports.find(a => a.code === route.from);
        const toAirport = airports.find(a => a.code === route.to);

        if (fromAirport && toAirport) {
          // Determine color based on airline
          const airlineColors: { [key: string]: string } = {
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

          const color = airlineColors[route.airline] || '#3b82f6';

          const polyline = L.polyline(
            [
              [fromAirport.latitude, fromAirport.longitude],
              [toAirport.latitude, toAirport.longitude]
            ],
            {
              color: color,
              weight: selectedAirlines.length > 0 ? 3 : 2,
              opacity: selectedAirlines.length > 0 ? 0.8 : 0.6
            }
          ).addTo(mapInstanceRef.current!);

          polyline.bindPopup(`
            <div class="text-sm">
              <strong>${route.from} → ${route.to}</strong><br>
              <span style="color: ${color}">●</span> Maskapai: ${route.airline}<br>
              Jarak: ${formatDistance(route.distance)} km
            </div>
          `);

          polylinesRef.current.push(polyline);
        }
      });
    }

    // Highlight selected route with distance labels
    if (selectedRoute && selectedRoute.length > 1) {
      const routeCoordinates: [number, number][] = [];
      
      for (let i = 0; i < selectedRoute.length - 1; i++) {
        const fromAirport = airports.find(a => a.code === selectedRoute[i]);
        const toAirport = airports.find(a => a.code === selectedRoute[i + 1]);
        
        if (fromAirport && toAirport) {
          routeCoordinates.push([fromAirport.latitude, fromAirport.longitude]);
          if (i === selectedRoute.length - 2) {
            routeCoordinates.push([toAirport.latitude, toAirport.longitude]);
          }

          // Calculate distance for this segment
          const distance = calculateAirportDistance(fromAirport, toAirport);
          
          // Calculate midpoint for distance label
          const midLat = (fromAirport.latitude + toAirport.latitude) / 2;
          const midLng = (fromAirport.longitude + toAirport.longitude) / 2;

          // Create custom icon for distance label
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

          // Add distance marker at midpoint
          const distanceMarker = L.marker([midLat, midLng], { icon: distanceIcon })
            .addTo(mapInstanceRef.current!)
            .bindPopup(`
              <div class="text-sm">
                <strong>Segmen: ${fromAirport.code} → ${toAirport.code}</strong><br>
                Jarak: ${distance.toFixed(2)} km<br>
                <em>Bobot graf: w(${fromAirport.code},${toAirport.code}) = ${distance.toFixed(0)}</em>
              </div>
            `);

          distanceMarkersRef.current.push(distanceMarker);
        }
      }

      if (routeCoordinates.length > 1) {
        selectedRouteRef.current = L.polyline(routeCoordinates, {
          color: '#ef4444',
          weight: 4,
          opacity: 1
        }).addTo(mapInstanceRef.current!);

        // Fit map to show the selected route
        const bounds = L.latLngBounds(routeCoordinates);
        mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
      }
    }

    // Draw alternative routes
    if (alternativeRoutes.length > 0) {
      const colors = ['#f59e0b', '#8b5cf6', '#06b6d4']; // Different colors for alternatives
      
      alternativeRoutes.forEach((route, index) => {
        if (index === 0) return; // Skip the first one as it's the main route
        
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
          const altPolyline = L.polyline(altCoordinates, {
            color: colors[index - 1],
            weight: 3,
            opacity: 0.7,
            dashArray: '10, 10'
          }).addTo(mapInstanceRef.current!);

          altPolyline.bindPopup(`
            <div class="text-sm">
              <strong>Alternatif ${index}</strong><br>
              Jarak: ${formatDistance(route.totalDistance)} km<br>
              Waktu: ${Math.floor(route.totalTime / 60)}j ${Math.round(route.totalTime % 60)}m
            </div>
          `);

          alternativeRouteRefs.current.push(altPolyline);
        }
      });
    }

    // Add animation marker if animating
    if (isAnimating && selectedRoute && selectedRoute.length > 1) {
      const animationCoordinates: [number, number][] = [];
      
      for (let i = 0; i < selectedRoute.length - 1; i++) {
        const fromAirport = airports.find(a => a.code === selectedRoute[i]);
        const toAirport = airports.find(a => a.code === selectedRoute[i + 1]);
        
        if (fromAirport && toAirport) {
          animationCoordinates.push([fromAirport.latitude, fromAirport.longitude]);
          if (i === selectedRoute.length - 2) {
            animationCoordinates.push([toAirport.latitude, toAirport.longitude]);
          }
        }
      }

      if (animationCoordinates.length > 1) {
        // Create plane icon
        const planeIcon = L.divIcon({
          className: 'plane-icon',
          html: `<div style="
            font-size: 20px;
            transform: rotate(45deg);
            color: #ef4444;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
          ">✈️</div>`,
          iconSize: [30, 30],
          iconAnchor: [15, 15]
        });

        animationMarkerRef.current = L.marker(animationCoordinates[0], { icon: planeIcon })
          .addTo(mapInstanceRef.current!);

        // Animate the plane along the route
        let currentSegment = 0;
        let progress = 0;
        const speed = animationSpeed === 'slow' ? 0.005 : animationSpeed === 'fast' ? 0.02 : 0.01;

        const animatePlane = () => {
          if (!isAnimating || !animationMarkerRef.current) return;

          progress += speed;
          
          if (progress >= 1) {
            progress = 0;
            currentSegment++;
            
            if (currentSegment >= animationCoordinates.length - 1) {
              currentSegment = 0; // Loop back to start
            }
          }

          const start = animationCoordinates[currentSegment];
          const end = animationCoordinates[currentSegment + 1];
          
          const currentLat = start[0] + (end[0] - start[0]) * progress;
          const currentLng = start[1] + (end[1] - start[1]) * progress;
          
          animationMarkerRef.current.setLatLng([currentLat, currentLng]);
          
          // Calculate rotation angle
          const angle = Math.atan2(end[1] - start[1], end[0] - start[0]) * 180 / Math.PI;
          const iconElement = animationMarkerRef.current.getElement();
          if (iconElement) {
            const planeElement = iconElement.querySelector('div');
            if (planeElement) {
              planeElement.style.transform = `rotate(${angle + 45}deg)`;
            }
          }

          requestAnimationFrame(animatePlane);
        };

        animatePlane();
      }
    }


  }, [airports, routes, selectedRoute, alternativeRoutes, onAirportClick, isClient, showAirports, showRoutes, selectedAirlines, isAnimating, animationSpeed, centralityMode, centralityData]);

  return (
    <div 
      ref={mapRef} 
      className="w-full h-full min-h-[500px] rounded-lg shadow-lg"
      style={{ zIndex: 1 }}
    />
  );
}