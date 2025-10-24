import React, { memo } from 'react';
import L from 'leaflet';

interface OptimizedMarkerProps {
  airport: {
    code: string;
    name: string;
    latitude: number;
    longitude: number;
  };
  centralityMode: boolean;
  centralityData?: Array<{
    code: string;
    degree: number;
    betweenness: number;
    closeness: number;
    overallRank: number;
  }>;
  onAirportClick?: (airportCode: string) => void;
  mapInstance: L.Map;
}

const OptimizedMarker = memo(({ 
  airport, 
  centralityMode, 
  centralityData, 
  onAirportClick, 
  mapInstance 
}: OptimizedMarkerProps) => {
  const markerRef = React.useRef<L.Marker | null>(null);

  React.useEffect(() => {
    if (!mapInstance) return;

    // Remove existing marker
    if (markerRef.current) {
      mapInstance.removeLayer(markerRef.current);
    }

    let marker: L.Marker;

    if (centralityMode && centralityData && centralityData.length > 0) {
      const airportCentrality = centralityData.find(c => c.code === airport.code);
      
      if (airportCentrality) {
        // Calculate size and color with requestAnimationFrame for smooth updates
        const baseSize = 15;
        const maxSize = 50;
        const sizeFactor = Math.min(airportCentrality.degree / 10, 1);
        const markerSize = baseSize + (maxSize - baseSize) * sizeFactor;
        
        const betweennessIntensity = Math.min(airportCentrality.betweenness * 10, 1);
        const red = Math.floor(255 * betweennessIntensity);
        const blue = Math.floor(255 * (1 - betweennessIntensity));
        const color = `rgb(${red}, 100, ${blue})`;
        
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
            transition: all 0.3s ease;
          ">${airport.code}</div>`,
          iconSize: [markerSize, markerSize],
          iconAnchor: [markerSize/2, markerSize/2]
        });
        
        marker = L.marker([airport.latitude, airport.longitude], { icon: customIcon })
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
        marker = L.marker([airport.latitude, airport.longitude])
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
      marker = L.marker([airport.latitude, airport.longitude])
        .bindPopup(`
          <div class="text-sm">
            <strong>${airport.name}</strong><br>
            Kode: ${airport.code}<br>
            Lat: ${airport.latitude.toFixed(4)}<br>
            Lng: ${airport.longitude.toFixed(4)}
          </div>
        `);
    }

    if (onAirportClick) {
      marker.on('click', () => onAirportClick(airport.code));
    }

    marker.addTo(mapInstance);
    markerRef.current = marker;

    return () => {
      if (markerRef.current) {
        mapInstance.removeLayer(markerRef.current);
      }
    };
  }, [airport, centralityMode, centralityData, onAirportClick, mapInstance]);

  return null;
});

OptimizedMarker.displayName = 'OptimizedMarker';

export default OptimizedMarker;