'use client';

import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CentralityMetrics {
  degree: number;
  betweenness: number;
  closeness: number;
}

interface AirportCentrality {
  code: string;
  name: string;
  metrics: CentralityMetrics;
  rank: {
    degree: number;
    betweenness: number;
    closeness: number;
    overall: number;
  };
}

interface NetworkStats {
  totalNodes: number;
  totalEdges: number;
  averageDegree: number;
  density: number;
  diameter?: number;
  averagePathLength?: number;
}

interface NetworkAnalysisProps {
  airports: AirportCentrality[];
  networkStats: NetworkStats;
  onAirportSelect?: (airportCode: string) => void;
  selectedAirport?: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7300'];

export default function NetworkAnalysis({ 
  airports, 
  networkStats, 
  onAirportSelect,
  selectedAirport 
}: NetworkAnalysisProps) {
  // Get top 10 airports by each centrality metric for charts
  const topByDegree = [...airports]
    .sort((a, b) => b.metrics.degree - a.metrics.degree)
    .slice(0, 10);

  const topByBetweenness = [...airports]
    .sort((a, b) => b.metrics.betweenness - a.metrics.betweenness)
    .slice(0, 10);

  const topByCloseness = [...airports]
    .sort((a, b) => b.metrics.closeness - a.metrics.closeness)
    .slice(0, 10);

  const topOverall = [...airports]
    .sort((a, b) => a.rank.overall - b.rank.overall)
    .slice(0, 10);

  // Prepare data for scatter plot (degree vs betweenness)
  const scatterData = airports.map(airport => ({
    x: airport.metrics.degree,
    y: airport.metrics.betweenness * 100, // Scale for better visualization
    z: airport.metrics.closeness * 100, // Size based on closeness
    name: airport.code,
    fullName: `${airport.code} - ${airport.name}`,
    isSelected: airport.code === selectedAirport
  }));

  // Safe formatting functions
  const formatNumber = (num: number, decimals: number = 3): string => {
    if (typeof num !== 'number' || !isFinite(num)) return '0';
    return num.toFixed(decimals);
  };

  const formatCentrality = (value: number): string => {
    if (typeof value !== 'number' || !isFinite(value)) return '0.000';
    return value.toFixed(3);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="bg-white rounded-xl shadow-lg p-6 space-y-6"
    >
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Analisis Jaringan Penerbangan - Centrality</h3>
      
      {/* Network Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-sm font-medium text-blue-700">Total Simpul</div>
          <div className="text-2xl font-bold text-blue-600">{networkStats.totalNodes}</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <div className="text-sm font-medium text-green-700">Total Sisi</div>
          <div className="text-2xl font-bold text-green-600">{networkStats.totalEdges}</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="text-sm font-medium text-purple-700">Derajat Rata-rata</div>
          <div className="text-2xl font-bold text-purple-600">{formatNumber(networkStats.averageDegree, 1)}</div>
        </div>
        <div className="bg-amber-50 rounded-lg p-4">
          <div className="text-sm font-medium text-amber-700">Kepadatan Jaringan</div>
          <div className="text-2xl font-bold text-amber-600">{formatNumber(networkStats.density * 100, 1)}%</div>
        </div>
      </div>

      {/* Top Hubs Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Top 5 Bandara Hub (Overall Rank)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {topOverall.slice(0, 5).map((airport, index) => (
              <div key={airport.code} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    index === 0 ? 'bg-yellow-400 text-white' :
                    index === 1 ? 'bg-gray-400 text-white' :
                    index === 2 ? 'bg-amber-600 text-white' :
                    'bg-blue-500 text-white'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="text-xs text-gray-600">Rank #{formatNumber(airport.rank.overall, 1)}</div>
                </div>
                <div className="text-sm font-bold text-gray-800 mb-1">{airport.code}</div>
                <div className="text-xs text-gray-600 mb-2">{airport.name}</div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>Degree:</span>
                    <span className="font-medium">{airport.metrics.degree}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Betweenness:</span>
                    <span className="font-medium">{formatCentrality(airport.metrics.betweenness)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Closeness:</span>
                    <span className="font-medium">{formatCentrality(airport.metrics.closeness)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Centrality Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Degree Centrality Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Degree Centrality (Top 10)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topByDegree}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="code" 
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    fontSize={12}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [value, 'Degree']}
                    labelFormatter={(label) => {
                      const item = topByDegree.find(d => d.code === label);
                      return item ? `${item.name} (${label})` : label;
                    }}
                  />
                  <Bar dataKey="metrics.degree" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Betweenness Centrality Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Betweenness Centrality (Top 10)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topByBetweenness}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="code" 
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    fontSize={12}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [formatCentrality(Number(value)), 'Betweenness']}
                    labelFormatter={(label) => {
                      const item = topByBetweenness.find(d => d.code === label);
                      return item ? `${item.name} (${label})` : label;
                    }}
                  />
                  <Bar dataKey="metrics.betweenness" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Closeness Centrality and Scatter Plot */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Closeness Centrality Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Closeness Centrality (Top 10)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topByCloseness}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="code" 
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    fontSize={12}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [formatCentrality(Number(value)), 'Closeness']}
                    labelFormatter={(label) => {
                      const item = topByCloseness.find(d => d.code === label);
                      return item ? `${item.name} (${label})` : label;
                    }}
                  />
                  <Bar dataKey="metrics.closeness" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Degree vs Betweenness Scatter Plot */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Degree vs Betweenness</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart data={scatterData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    type="number" 
                    dataKey="x" 
                    name="Degree"
                    domain={['dataMin', 'dataMax']}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="y" 
                    name="Betweenness (x100)"
                  />
                  <Tooltip 
                    formatter={(value, name) => {
                      if (name === 'x') return [value, 'Degree'];
                      if (name === 'y') return [formatCentrality(Number(value) / 100), 'Betweenness'];
                      return [value, name];
                    }}
                    labelFormatter={(label, payload) => {
                      if (payload && payload[0]) {
                        const data = payload[0].payload;
                        return data.fullName;
                      }
                      return label;
                    }}
                  />
                  <Scatter dataKey="y" fill="#8884d8">
                    {scatterData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.isSelected ? '#ef4444' : '#8884d8'}
                        stroke={entry.isSelected ? '#dc2626' : '#7c3aed'}
                        strokeWidth={entry.isSelected ? 2 : 1}
                      />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Centrality Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tabel Centrality Lengkap</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 rounded-lg p-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 font-medium text-gray-700">Rank</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-700">Kode</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-700">Nama Bandara</th>
                  <th className="text-center py-2 px-3 font-medium text-gray-700">Degree</th>
                  <th className="text-center py-2 px-3 font-medium text-gray-700">Betweenness</th>
                  <th className="text-center py-2 px-3 font-medium text-gray-700">Closeness</th>
                  <th className="text-center py-2 px-3 font-medium text-gray-700">Overall Rank</th>
                </tr>
              </thead>
              <tbody>
                {topOverall.map((airport, index) => (
                  <tr 
                    key={airport.code} 
                    className={`border-b border-gray-100 hover:bg-gray-100 transition-colors cursor-pointer ${
                      airport.code === selectedAirport ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => onAirportSelect?.(airport.code)}
                  >
                    <td className="py-3 px-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        index === 0 ? 'bg-yellow-400 text-white' :
                        index === 1 ? 'bg-gray-400 text-white' :
                        index === 2 ? 'bg-amber-600 text-white' :
                        'bg-blue-500 text-white'
                      }`}>
                        {index + 1}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-mono font-medium text-gray-800">{airport.code}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="text-gray-800">{airport.name}</div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="font-medium text-blue-600">{airport.metrics.degree}</div>
                      <div className="text-xs text-gray-500">Rank #{airport.rank.degree}</div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="font-medium text-green-600">{formatCentrality(airport.metrics.betweenness)}</div>
                      <div className="text-xs text-gray-500">Rank #{airport.rank.betweenness}</div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="font-medium text-amber-600">{formatCentrality(airport.metrics.closeness)}</div>
                      <div className="text-xs text-gray-500">Rank #{airport.rank.closeness}</div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="font-bold text-purple-600">{formatNumber(airport.rank.overall, 1)}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Network Theory Explanation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Penjelasan Metrik Centrality</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-2">Degree Centrality</h4>
              <p className="text-blue-700">
                Mengukur jumlah koneksi langsung yang dimiliki sebuah bandara. 
                Bandara dengan degree tinggi merupakan hub utama dengan banyak rute langsung.
              </p>
              <div className="mt-2 text-xs text-blue-600">
                <strong>Formula:</strong> CD(v) = deg(v) / (n-1)
              </div>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4">
              <h4 className="font-semibold text-green-800 mb-2">Betweenness Centrality</h4>
              <p className="text-green-700">
                Mengukur seberapa sering sebuah bandara menjadi perantara dalam rute terpendek antara bandara lain. 
                Nilai tinggi menunjukkan peran penting sebagai penghubung.
              </p>
              <div className="mt-2 text-xs text-green-600">
                <strong>Formula:</strong> CB(v) = Σ(σst(v) / σst)
              </div>
            </div>
            
            <div className="bg-amber-50 rounded-lg p-4">
              <h4 className="font-semibold text-amber-800 mb-2">Closeness Centrality</h4>
              <p className="text-amber-700">
                Mengukur seberapa dekat sebuah bandara dengan semua bandara lain. 
                Nilai tinggi menunjukkan aksesibilitas yang baik ke seluruh jaringan.
              </p>
              <div className="mt-2 text-xs text-amber-600">
                <strong>Formula:</strong> CC(v) = (n-1) / Σ d(v,u)
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}