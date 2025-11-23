import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
  LineChart, Line, Area, AreaChart
} from 'recharts';
import { OracleComponent, DocType } from '../types';
import { FileText, Database, Code2, Layers } from 'lucide-react';

interface DashboardStatsProps {
  components: OracleComponent[];
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ components }) => {
  
  // Calculate Stats
  const totalComponents = components.length;
  const totalCUF = components.reduce((acc, c) => acc + c.cufParams.length, 0);
  const totalTables = components.reduce((acc, c) => acc + c.oracleTables.length, 0);
  const totalOICS = components.reduce((acc, c) => acc + c.oicsIntegrations.length, 0);

  // Data for Doc Status Chart
  const docStatusData = components.map(c => ({
    name: c.id,
    SFD: c.documents[DocType.SFD]?.uploaded ? 1 : 0,
    STD: c.documents[DocType.STD]?.uploaded ? 1 : 0,
    SETUP: c.documents[DocType.SETUP]?.uploaded ? 1 : 0,
  }));

  // Data for Pie Chart
  const completeCount = components.filter(c => 
    c.documents[DocType.SFD]?.uploaded && 
    c.documents[DocType.STD]?.uploaded && 
    c.documents[DocType.SETUP]?.uploaded
  ).length;
  
  const partialCount = totalComponents - completeCount;
  
  const pieData = [
    { name: 'Complete', value: completeCount },
    { name: 'Partial', value: partialCount },
  ];
  const COLORS = ['#10b981', '#f59e0b'];

  // Données de tendances (simulation basée sur les dates d'indexation)
  const timelineData = components
    .sort((a, b) => new Date(a.lastIndexed).getTime() - new Date(b.lastIndexed).getTime())
    .map((c, idx) => ({
      date: new Date(c.lastIndexed).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }),
      cumulative: idx + 1,
      component: c.id
    }));

  return (
    <div className="space-y-6">
      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Components" value={totalComponents} icon={<Layers size={20} />} color="bg-blue-500" />
        <StatCard title="Total CUF Params" value={totalCUF} icon={<Code2 size={20} />} color="bg-indigo-500" />
        <StatCard title="Oracle Tables" value={totalTables} icon={<Database size={20} />} color="bg-emerald-500" />
        <StatCard title="OICS Integrations" value={totalOICS} icon={<FileText size={20} />} color="bg-orange-500" />
      </div>

      {/* Timeline Chart - NEW */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Tendance d'indexation</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timelineData}>
              <defs>
                <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{fontSize: 11}} stroke="#94a3b8" />
              <YAxis tick={{fontSize: 11}} stroke="#94a3b8" />
              <Tooltip
                contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
              />
              <Area
                type="monotone"
                dataKey="cumulative"
                stroke="#3b82f6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorCumulative)"
                name="Composants indexés"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Documentation Coverage</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={docStatusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{fontSize: 12}} stroke="#94a3b8" />
                <YAxis hide />
                <Tooltip
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Legend />
                <Bar dataKey="SFD" stackId="a" fill="#3b82f6" name="SFD Doc" />
                <Bar dataKey="STD" stackId="a" fill="#6366f1" name="STD Doc" />
                <Bar dataKey="SETUP" stackId="a" fill="#10b981" name="Setup Doc" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Component Health</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color }: { title: string, value: number, icon: React.ReactNode, color: string }) => (
  <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
    <div>
      <p className="text-slate-500 text-sm font-medium">{title}</p>
      <h4 className="text-2xl font-bold text-slate-800 mt-1">{value}</h4>
    </div>
    <div className={`${color} text-white p-3 rounded-lg shadow-md opacity-90`}>
      {icon}
    </div>
  </div>
);

export default DashboardStats;
