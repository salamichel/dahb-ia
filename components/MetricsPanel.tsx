import React from 'react';
import { OracleComponent, DocType } from '../types';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Calendar,
  BarChart3,
  Target
} from 'lucide-react';

interface MetricsPanelProps {
  components: OracleComponent[];
}

const MetricsPanel: React.FC<MetricsPanelProps> = ({ components }) => {

  // Calcul des métriques avancées
  const totalComponents = components.length;

  // Taux de complétion par type de document
  const sfdCount = components.filter(c => c.documents[DocType.SFD]?.uploaded).length;
  const stdCount = components.filter(c => c.documents[DocType.STD]?.uploaded).length;
  const setupCount = components.filter(c => c.documents[DocType.SETUP]?.uploaded).length;

  const sfdRate = totalComponents > 0 ? (sfdCount / totalComponents) * 100 : 0;
  const stdRate = totalComponents > 0 ? (stdCount / totalComponents) * 100 : 0;
  const setupRate = totalComponents > 0 ? (setupCount / totalComponents) * 100 : 0;

  // Statut global de complétion
  const completeComponents = components.filter(c =>
    c.documents[DocType.SFD]?.uploaded &&
    c.documents[DocType.STD]?.uploaded &&
    c.documents[DocType.SETUP]?.uploaded
  ).length;

  const partialComponents = components.filter(c => {
    const docs = [c.documents[DocType.SFD]?.uploaded, c.documents[DocType.STD]?.uploaded, c.documents[DocType.SETUP]?.uploaded];
    const uploadedCount = docs.filter(Boolean).length;
    return uploadedCount > 0 && uploadedCount < 3;
  }).length;

  const missingComponents = totalComponents - completeComponents - partialComponents;

  const completionRate = totalComponents > 0 ? (completeComponents / totalComponents) * 100 : 0;

  // Distribution par module
  const moduleDistribution = components.reduce((acc, c) => {
    const prefix = c.id.substring(0, 2);
    acc[prefix] = (acc[prefix] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Composants récemment indexés (derniers 7 jours)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentComponents = components.filter(c =>
    new Date(c.lastIndexed) >= sevenDaysAgo
  ).length;

  // Tendance (simulation - dans un vrai cas, comparer avec les données précédentes)
  const trend = recentComponents > 0 ? 'up' : 'stable';

  // Moyenne de paramètres CUF par composant
  const avgCufParams = totalComponents > 0
    ? (components.reduce((acc, c) => acc + c.cufParams.length, 0) / totalComponents).toFixed(1)
    : '0';

  // Moyenne de tables Oracle par composant
  const avgTables = totalComponents > 0
    ? (components.reduce((acc, c) => acc + c.oracleTables.length, 0) / totalComponents).toFixed(1)
    : '0';

  return (
    <div className="space-y-6">

      {/* KPI Cards - Taux de complétion global */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-800 flex items-center">
            <Target className="mr-2 text-blue-600" size={24} />
            Taux de Complétion Global
          </h3>
          <div className="flex items-center space-x-1 text-sm">
            {trend === 'up' && <TrendingUp className="text-green-600" size={20} />}
            {trend === 'down' && <TrendingDown className="text-red-600" size={20} />}
            {trend === 'stable' && <Minus className="text-slate-400" size={20} />}
            <span className={`font-medium ${trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-slate-600'}`}>
              {trend === 'up' ? '+' : ''}{recentComponents} récents
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatusCard
            icon={<CheckCircle className="text-green-600" size={20} />}
            label="Complets"
            count={completeComponents}
            percentage={completionRate}
            color="green"
          />
          <StatusCard
            icon={<AlertTriangle className="text-yellow-600" size={20} />}
            label="Partiels"
            count={partialComponents}
            percentage={(partialComponents / totalComponents) * 100}
            color="yellow"
          />
          <StatusCard
            icon={<XCircle className="text-red-600" size={20} />}
            label="Incomplets"
            count={missingComponents}
            percentage={(missingComponents / totalComponents) * 100}
            color="red"
          />
        </div>
      </div>

      {/* Taux de complétion par type de document */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DocumentTypeCard
          docType="SFD"
          count={sfdCount}
          total={totalComponents}
          rate={sfdRate}
          color="bg-blue-500"
        />
        <DocumentTypeCard
          docType="STD"
          count={stdCount}
          total={totalComponents}
          rate={stdRate}
          color="bg-indigo-500"
        />
        <DocumentTypeCard
          docType="SETUP"
          count={setupCount}
          total={totalComponents}
          rate={setupRate}
          color="bg-emerald-500"
        />
      </div>

      {/* Distribution par module & Métriques moyennes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Distribution par module */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
            <BarChart3 className="mr-2 text-slate-600" size={20} />
            Distribution par Module
          </h3>
          <div className="space-y-3">
            {Object.entries(moduleDistribution)
              .sort(([, a], [, b]) => b - a)
              .map(([module, count]) => {
                const percentage = (count / totalComponents) * 100;
                return (
                  <div key={module} className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center font-bold text-slate-700">
                      {module}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-slate-700">{getModuleName(module)}</span>
                        <span className="text-sm font-bold text-slate-800">{count} ({percentage.toFixed(0)}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Métriques moyennes */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
            <Calendar className="mr-2 text-slate-600" size={20} />
            Métriques Moyennes
          </h3>
          <div className="space-y-4">
            <AverageMetricCard
              label="CUF Params / Composant"
              value={avgCufParams}
              icon="⚙️"
              description="Nombre moyen de paramètres de configuration"
            />
            <AverageMetricCard
              label="Tables Oracle / Composant"
              value={avgTables}
              icon="🗄️"
              description="Nombre moyen de tables utilisées"
            />
            <div className="border-t border-slate-100 pt-4">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">📅</div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">Composants récents</p>
                    <p className="text-xs text-slate-500">Indexés ces 7 derniers jours</p>
                  </div>
                </div>
                <div className="text-2xl font-bold text-blue-600">{recentComponents}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Composants auxiliaires

const StatusCard = ({ icon, label, count, percentage, color }: {
  icon: React.ReactNode;
  label: string;
  count: number;
  percentage: number;
  color: 'green' | 'yellow' | 'red';
}) => {
  const bgColors = {
    green: 'bg-green-50 border-green-100',
    yellow: 'bg-yellow-50 border-yellow-100',
    red: 'bg-red-50 border-red-100'
  };

  return (
    <div className={`${bgColors[color]} rounded-lg p-4 border`}>
      <div className="flex items-center justify-between mb-2">
        {icon}
        <span className="text-2xl font-bold text-slate-800">{count}</span>
      </div>
      <p className="text-sm font-medium text-slate-700 mb-1">{label}</p>
      <div className="w-full bg-white rounded-full h-1.5">
        <div
          className={`h-1.5 rounded-full ${color === 'green' ? 'bg-green-500' : color === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'}`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      <p className="text-xs text-slate-500 mt-1">{percentage.toFixed(1)}%</p>
    </div>
  );
};

const DocumentTypeCard = ({ docType, count, total, rate, color }: {
  docType: string;
  count: number;
  total: number;
  rate: number;
  color: string;
}) => (
  <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
    <div className="flex items-center justify-between mb-3">
      <div className={`${color} text-white px-3 py-1 rounded-lg text-sm font-bold`}>
        {docType}
      </div>
      <span className="text-2xl font-bold text-slate-800">{count}/{total}</span>
    </div>
    <div className="w-full bg-slate-100 rounded-full h-3 mb-2">
      <div
        className={`${color} h-3 rounded-full transition-all duration-500`}
        style={{ width: `${rate}%` }}
      ></div>
    </div>
    <p className="text-sm text-slate-600 font-medium">{rate.toFixed(1)}% de couverture</p>
  </div>
);

const AverageMetricCard = ({ label, value, icon, description }: {
  label: string;
  value: string;
  icon: string;
  description: string;
}) => (
  <div className="flex items-center space-x-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
    <div className="text-3xl">{icon}</div>
    <div className="flex-1">
      <p className="text-sm font-medium text-slate-700">{label}</p>
      <p className="text-xs text-slate-500">{description}</p>
    </div>
    <div className="text-2xl font-bold text-indigo-600">{value}</div>
  </div>
);

const getModuleName = (prefix: string): string => {
  const names: Record<string, string> = {
    'AP': 'Accounts Payable',
    'GL': 'General Ledger',
    'PO': 'Purchase Orders',
    'AR': 'Accounts Receivable',
    'IN': 'Inventory',
    'FA': 'Fixed Assets',
    'CM': 'Cash Management',
    'PA': 'Projects',
  };
  return names[prefix] || prefix;
};

export default MetricsPanel;
