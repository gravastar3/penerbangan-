'use client';

import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface GraphAnalysisPanelProps {
  graphAnalysis: {
    nodeCount: number;
    edgeCount: number;
    degrees: Record<string, number>;
    isolatedNodes: string[];
    averageDegree: number;
  };
  isConnected: boolean;
  airlinePerformance: Record<string, {
    routes: number;
    totalDistance: number;
    averageDistance: number;
  }>;
  airports: Array<{ code: string; name: string; }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7300'];

// Safe distance formatting function
const formatDistance = (distance: any): string => {
  if (typeof distance === 'number' && isFinite(distance)) {
    return distance.toLocaleString();
  }
  return '0';
};

export default function GraphAnalysisPanel({ 
  graphAnalysis, 
  isConnected, 
  airlinePerformance, 
  airports 
}: GraphAnalysisPanelProps) {
  // Prepare data for degree distribution chart
  const degreeData = Object.entries(graphAnalysis.degrees).map(([code, degree]) => {
    const airport = airports.find(a => a.code === code);
    return {
      name: airport?.name || code,
      code,
      degree,
      fullName: `${code} - ${airport?.name || 'Unknown'}`
    };
  }).sort((a, b) => b.degree - a.degree).slice(0, 10); // Top 10 airports

  // Prepare data for airline performance chart
  const airlineData = Object.entries(airlinePerformance).map(([name, stats]) => ({
    name,
    routes: stats.routes,
    totalDistance: Math.round(stats.totalDistance),
    averageDistance: Math.round(stats.averageDistance)
  }));

  // Prepare data for connectivity pie chart
  const connectivityData = [
    { name: 'Connected Nodes', value: graphAnalysis.nodeCount - graphAnalysis.isolatedNodes.length },
    { name: 'Isolated Nodes', value: graphAnalysis.isolatedNodes.length }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="bg-white rounded-xl shadow-lg p-6 space-y-6"
    >
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Analisis Graf Jaringan Penerbangan</h3>
      
      {/* Graph Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-sm font-medium text-blue-700">Total Simpul</div>
          <div className="text-2xl font-bold text-blue-600">{graphAnalysis.nodeCount}</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <div className="text-sm font-medium text-green-700">Total Sisi</div>
          <div className="text-2xl font-bold text-green-600">{graphAnalysis.edgeCount}</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="text-sm font-medium text-purple-700">Derajat Rata-rata</div>
          <div className="text-2xl font-bold text-purple-600">{graphAnalysis.averageDegree.toFixed(1)}</div>
        </div>
        <div className={`${isConnected ? 'bg-emerald-50' : 'bg-red-50'} rounded-lg p-4`}>
          <div className="text-sm font-medium text-gray-700">Konektivitas</div>
          <div className={`text-lg font-bold ${isConnected ? 'text-emerald-600' : 'text-red-600'}`}>
            {isConnected ? 'Connected' : 'Not Connected'}
          </div>
        </div>
      </div>

      {/* Degree Distribution */}
      <div>
        <h4 className="text-md font-medium text-gray-700 mb-3">Distribusi Derajat (Top 10 Bandara)</h4>
        <div className="bg-gray-50 rounded-lg p-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={degreeData}>
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
                formatter={(value, name) => [value, 'Derajat']}
                labelFormatter={(label) => {
                  const item = degreeData.find(d => d.code === label);
                  return item ? item.fullName : label;
                }}
              />
              <Bar dataKey="degree" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Connectivity Chart */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-md font-medium text-gray-700 mb-3">Konektivitas Jaringan</h4>
          <div className="bg-gray-50 rounded-lg p-4 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={connectivityData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {connectivityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#ef4444'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div>
          <h4 className="text-md font-medium text-gray-700 mb-3">Node Terisolasi</h4>
          <div className="bg-gray-50 rounded-lg p-4 h-48 overflow-y-auto">
            {graphAnalysis.isolatedNodes.length > 0 ? (
              <div className="space-y-2">
                {graphAnalysis.isolatedNodes.map(code => {
                  const airport = airports.find(a => a.code === code);
                  return (
                    <div key={code} className="flex items-center justify-between p-2 bg-red-50 rounded">
                      <div>
                        <div className="font-medium text-red-800">{code}</div>
                        <div className="text-xs text-red-600">{airport?.name || 'Unknown'}</div>
                      </div>
                      <div className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                        Derajat: 0
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-green-600">
                <div className="text-center">
                  <div className="text-2xl mb-2">✓</div>
                  <div className="text-sm">Tidak ada node terisolasi</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Airline Performance */}
      <div>
        <h4 className="text-md font-medium text-gray-700 mb-3">Performa Maskapai</h4>
        <div className="bg-gray-50 rounded-lg p-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-3 font-medium text-gray-700">Maskapai</th>
                <th className="text-center py-2 px-3 font-medium text-gray-700">Jumlah Rute</th>
                <th className="text-right py-2 px-3 font-medium text-gray-700">Total Jarak (km)</th>
                <th className="text-right py-2 px-3 font-medium text-gray-700">Rata-rata Jarak (km)</th>
              </tr>
            </thead>
            <tbody>
              {airlineData.map((airline, index) => (
                <tr key={airline.name} className="border-b border-gray-100 hover:bg-gray-100 transition-colors">
                  <td className="py-3 px-3">
                    <div className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-2" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      ></div>
                      {airline.name}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center">{airline.routes}</td>
                  <td className="py-3 px-3 text-right">{formatDistance(airline.totalDistance)}</td>
                  <td className="py-3 px-3 text-right">{formatDistance(airline.averageDistance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Graph Theory Summary */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4 border border-indigo-200">
        <h4 className="text-md font-medium text-indigo-800 mb-2">Analisis Teori Graf</h4>
        <div className="text-sm text-indigo-700 space-y-1">
          <p>• <strong>Tipe Graf:</strong> Graf tidak berarah (undirected graph)</p>
          <p>• <strong>Bobot Sisi:</strong> Jarak geografis antar bandara</p>
          <p>• <strong>Kepadatan:</strong> {(graphAnalysis.edgeCount / (graphAnalysis.nodeCount * (graphAnalysis.nodeCount - 1) / 2) * 100).toFixed(1)}%</p>
          <p>• <strong>Status Konektivitas:</strong> {isConnected ? 'Graf terhubung penuh' : 'Graf tidak terhubung'}</p>
          <p>• <strong>Node Penting:</strong> Bandara dengan derajat tertinggi menjadi hub utama</p>
        </div>
      </div>
    </motion.div>
  );
}