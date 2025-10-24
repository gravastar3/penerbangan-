import React, { memo } from 'react';
import L from 'leaflet';

interface OptimizedPolylineProps {
  route: {
    from: string;
    to: string;
    airline: string;
    distance: number;
  };
  fromAirport: {
    latitude: number;
    longitude: number;
  };
  toAirport: {
    latitude: number;
    longitude: number;
  };
  selectedAirlines: string[];
  mapInstance: L.Map;
}

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

const formatDistance = (distance: any): string => {
  if (typeof distance === 'number' && isFinite(distance)) {
    return distance === Infinity ? '∞' : distance.toLocaleString();
  }
  return 'Belum Diketahui';
};

const OptimizedPolyline = memo(({ 
  route, 
  fromAirport, 
  toAirport, 
  selectedAirlines, 
  mapInstance 
}: OptimizedPolylineProps) => {
  const polylineRef = React.useRef<L.Polyline | null>(null);

  React.useEffect(() => {
    if (!mapInstance) return;

    // Remove existing polyline
    if (polylineRef.current) {
      mapInstance.removeLayer(polylineRef.current);
    }

    const color = airlineColors[route.airline] || '#3b82f6';
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

    polyline.addTo(mapInstance);
    polylineRef.current = polyline;

    return () => {
      if (polylineRef.current) {
        mapInstance.removeLayer(polylineRef.current);
      }
    };
  }, [route, fromAirport, toAirport, selectedAirlines, mapInstance]);

  return null;
});

OptimizedPolyline.displayName = 'OptimizedPolyline';

export default OptimizedPolyline;