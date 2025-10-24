'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AnimationControlsProps {
  isAnimating: boolean;
  animationSpeed: 'slow' | 'normal' | 'fast';
  onStart: () => void;
  onStop: () => void;
  onSpeedChange: (speed: 'slow' | 'normal' | 'fast') => void;
  hasRoute: boolean;
}

export default function AnimationControls({
  isAnimating,
  animationSpeed,
  onStart,
  onStop,
  onSpeedChange,
  hasRoute
}: AnimationControlsProps) {
  const speedOptions = [
    { value: 'slow', label: 'Lambat', duration: '20 detik' },
    { value: 'normal', label: 'Normal', duration: '10 detik' },
    { value: 'fast', label: 'Cepat', duration: '5 detik' }
  ] as const;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="bg-white rounded-xl shadow-lg p-6"
    >
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Animasi Perjalanan</h3>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Kontrol Animasi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Animation Controls */}
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={onStart} 
              disabled={isAnimating || !hasRoute}
              size="sm"
            >
              {isAnimating ? 'Animasi Berjalan...' : 'Mulai Animasi'}
            </Button>
            <Button 
              onClick={onStop} 
              disabled={!isAnimating}
              variant="outline"
              size="sm"
            >
              Hentikan
            </Button>
          </div>

          {/* Speed Control */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Kecepatan Animasi</h4>
            <div className="grid grid-cols-3 gap-2">
              {speedOptions.map((option) => (
                <Button
                  key={option.value}
                  onClick={() => onSpeedChange(option.value)}
                  variant={animationSpeed === option.value ? 'default' : 'outline'}
                  size="sm"
                  className="text-xs"
                  disabled={isAnimating}
                >
                  <div className="text-center">
                    <div>{option.label}</div>
                    <div className="text-xs opacity-75">{option.duration}</div>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          {/* Status */}
          <div className={`p-3 rounded-lg ${hasRoute ? 'bg-blue-50' : 'bg-gray-50'}`}>
            <div className="text-sm">
              <div className="font-medium mb-1">Status:</div>
              <div className={hasRoute ? 'text-blue-700' : 'text-gray-600'}>
                {hasRoute ? (
                  isAnimating ? 
                    '✈️ Animasi sedang berjalan. Pesawat bergerak mengikuti rute terpendek.' :
                    '🛫 Siap untuk animasi. Klik "Mulai Animasi" untuk memulai.'
                ) : (
                  '❌ Pilih rute terlebih dahulu untuk mengaktifkan animasi.'
                )}
              </div>
            </div>
          </div>

          {/* Animation Info */}
          <div className="bg-gradient-to-r from-sky-50 to-blue-50 rounded-lg p-4 border border-sky-200">
            <h4 className="text-sm font-medium text-sky-800 mb-2">Informasi Animasi</h4>
            <div className="text-xs text-sky-700 space-y-1">
              <p>• Pesawat akan bergerak mengikuti rute terpendek yang telah dihitung</p>
              <p>• Animasi berulang terus menerus sampai dihentikan</p>
              <p>• Ikon pesawat akan berotasi sesuai arah perjalanan</p>
              <p>• Kecepatan dapat disesuaikan untuk kebutuhan presentasi</p>
              <p>• Animasi menggunakan koordinat geografis yang akurat</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Features */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Fitur Animasi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">1</div>
                <div>
                  <div className="text-sm font-medium text-gray-800">Rute Akurat</div>
                  <div className="text-xs text-gray-600">Mengikuti path hasil algoritma Dijkstra</div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">2</div>
                <div>
                  <div className="text-sm font-medium text-gray-800">Rotasi Dinamis</div>
                  <div className="text-xs text-gray-600">Pesawat berotasi sesuai arah gerakan</div>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">3</div>
                <div>
                  <div className="text-sm font-medium text-gray-800">Looping</div>
                  <div className="text-xs text-gray-600">Animasi berulang otomatis</div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">4</div>
                <div>
                  <div className="text-sm font-medium text-gray-800">Interaktif</div>
                  <div className="text-xs text-gray-600">Kontrol kecepatan real-time</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}