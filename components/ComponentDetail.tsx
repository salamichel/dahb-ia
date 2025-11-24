import React, { useState, useMemo } from 'react';
import { Component, ComponentAspects, OracleERPAspect, BIPublisherAspect, ETLAspect } from '../types';
import {
  ArrowLeft,
  FileText,
  Database,
  Code2,
  Network,
  Calendar,
  CheckCircle,
  XCircle,
  FileCheck,
  BarChart3,
  GitBranch,
  Cloud,
  ShoppingCart,
  Building,
  Workflow,
  Server
} from 'lucide-react';

interface ComponentDetailProps {
  component: Component;
  onBack: () => void;
}

// Tab component for Oracle ERP aspect
const OracleERPTab: React.FC<{ data: OracleERPAspect }> = ({ data }) => {
  return (
    <div className="space-y-6">
      {data.module && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <span className="text-sm font-semibold text-blue-700">Module: </span>
          <span className="text-blue-900">{data.module}</span>
        </div>
      )}

      {/* Oracle Tables */}
      {data.oracleTables && data.oracleTables.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Database className="text-emerald-500" size={20} />
            Oracle Tables ({data.oracleTables.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.oracleTables.map((table, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm text-slate-700 bg-emerald-50/50 p-2 rounded border border-emerald-100/50">
                <Database size={14} className="text-emerald-400" />
                <span className="font-mono">{table}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CUF Parameters */}
      {data.cufParams && data.cufParams.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Code2 className="text-indigo-500" size={20} />
            CUF Parameters ({data.cufParams.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-medium">
                <tr>
                  <th className="px-4 py-2 rounded-l-lg">Parameter</th>
                  <th className="px-4 py-2">Value</th>
                  <th className="px-4 py-2 rounded-r-lg">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.cufParams.map((param, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-blue-600 font-medium">{param.param}</td>
                    <td className="px-4 py-3 font-mono text-slate-800">{param.value}</td>
                    <td className="px-4 py-3 text-slate-600">{param.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* OICS Integrations */}
      {data.oicsIntegrations && data.oicsIntegrations.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Network className="text-orange-500" size={20} />
            OICS Integrations ({data.oicsIntegrations.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {data.oicsIntegrations.map((int, idx) => (
              <span key={idx} className="bg-orange-50 text-orange-700 border border-orange-100 px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1">
                <Network size={12} /> {int}
              </span>
            ))}
          </div>
        </div>
      )}

      {data.notes && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <p className="text-sm text-slate-700 whitespace-pre-wrap">{data.notes}</p>
        </div>
      )}
    </div>
  );
};

// Tab component for BI Publisher aspect
const BIPublisherTab: React.FC<{ data: BIPublisherAspect }> = ({ data }) => {
  return (
    <div className="space-y-6">
      {/* Reports */}
      {data.reports && data.reports.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <BarChart3 className="text-purple-500" size={20} />
            Reports ({data.reports.length})
          </h3>
          <div className="space-y-3">
            {data.reports.map((report, idx) => (
              <div key={idx} className="bg-purple-50/50 border border-purple-100 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="bg-purple-100 p-2 rounded">
                    <FileText className="text-purple-600" size={18} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-800">{report.name}</h4>
                    {report.type && (
                      <span className="inline-block mt-1 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                        {report.type}
                      </span>
                    )}
                    {report.description && (
                      <p className="text-sm text-slate-600 mt-2">{report.description}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Data Models */}
      {data.dataModels && data.dataModels.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Database className="text-purple-500" size={20} />
            Data Models ({data.dataModels.length})
          </h3>
          <div className="space-y-3">
            {data.dataModels.map((model, idx) => (
              <div key={idx} className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <h4 className="font-semibold text-slate-800 mb-2">{model.name}</h4>
                {model.query && (
                  <pre className="bg-slate-900 text-slate-100 p-3 rounded text-xs overflow-x-auto mb-2">
                    {model.query}
                  </pre>
                )}
                {model.description && (
                  <p className="text-sm text-slate-600">{model.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Parameters */}
      {data.parameters && data.parameters.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Code2 className="text-purple-500" size={20} />
            Parameters ({data.parameters.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.parameters.map((param, idx) => (
              <div key={idx} className="bg-purple-50/30 border border-purple-100 rounded p-3">
                <div className="font-mono text-sm text-purple-700 font-semibold">{param.name}</div>
                <div className="text-xs text-slate-500 mt-1">Type: {param.type}</div>
                {param.defaultValue && (
                  <div className="text-xs text-slate-600 mt-1">Default: {param.defaultValue}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {data.notes && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <p className="text-sm text-slate-700 whitespace-pre-wrap">{data.notes}</p>
        </div>
      )}
    </div>
  );
};

// Tab component for ETL aspect
const ETLTab: React.FC<{ data: ETLAspect }> = ({ data }) => {
  return (
    <div className="space-y-6">
      {data.tool && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <span className="text-sm font-semibold text-green-700">ETL Tool: </span>
          <span className="text-green-900 font-medium">{data.tool}</span>
        </div>
      )}

      {/* Mappings */}
      {data.mappings && data.mappings.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <GitBranch className="text-green-500" size={20} />
            Mappings ({data.mappings.length})
          </h3>
          <div className="space-y-3">
            {data.mappings.map((mapping, idx) => (
              <div key={idx} className="bg-green-50/50 border border-green-100 rounded-lg p-4">
                <h4 className="font-semibold text-slate-800 mb-2">{mapping.name}</h4>
                <div className="flex items-center gap-2 text-sm mb-2">
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded font-mono text-xs">
                    {mapping.source}
                  </span>
                  <span className="text-slate-400">→</span>
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded font-mono text-xs">
                    {mapping.target}
                  </span>
                </div>
                {mapping.description && (
                  <p className="text-sm text-slate-600">{mapping.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transformations */}
      {data.transformations && data.transformations.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Workflow className="text-green-500" size={20} />
            Transformations ({data.transformations.length})
          </h3>
          <div className="space-y-3">
            {data.transformations.map((transform, idx) => (
              <div key={idx} className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-slate-800">{transform.name}</h4>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                    {transform.type}
                  </span>
                </div>
                {transform.description && (
                  <p className="text-sm text-slate-600">{transform.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Schedules */}
      {data.schedules && data.schedules.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Calendar className="text-green-500" size={20} />
            Schedules ({data.schedules.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.schedules.map((schedule, idx) => (
              <div key={idx} className="bg-green-50/30 border border-green-100 rounded p-3">
                <div className="font-semibold text-slate-800 text-sm">{schedule.name}</div>
                <div className="text-xs text-green-700 font-mono mt-1">{schedule.frequency}</div>
                {schedule.description && (
                  <div className="text-xs text-slate-600 mt-2">{schedule.description}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {data.notes && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <p className="text-sm text-slate-700 whitespace-pre-wrap">{data.notes}</p>
        </div>
      )}
    </div>
  );
};

// Generic tab for other aspects
const GenericAspectTab: React.FC<{ data: any; aspectName: string }> = ({ data, aspectName }) => {
  return (
    <div className="space-y-6">
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-3">{aspectName}</h3>
        {data.notes ? (
          <p className="text-sm text-slate-700 whitespace-pre-wrap">{data.notes}</p>
        ) : (
          <p className="text-sm text-slate-500 italic">
            Data detected for this aspect. Details will be displayed as the system learns more about this domain.
          </p>
        )}

        {/* Display any structured data found */}
        <div className="mt-4">
          <pre className="bg-slate-900 text-slate-100 p-4 rounded text-xs overflow-x-auto">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};

const ComponentDetail: React.FC<ComponentDetailProps> = ({ component, onBack }) => {

  // Detect which aspects are present
  const detectedAspects = useMemo(() => {
    const aspects = [];

    if (component.aspects) {
      if (component.aspects['Oracle ERP Cloud']?.detected) {
        aspects.push({
          name: 'Oracle ERP Cloud',
          icon: <Database size={18} />,
          color: 'blue',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-700'
        });
      }
      if (component.aspects['BI Publisher']?.detected) {
        aspects.push({
          name: 'BI Publisher',
          icon: <BarChart3 size={18} />,
          color: 'purple',
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200',
          textColor: 'text-purple-700'
        });
      }
      if (component.aspects['ETL / Informatica / ODI']?.detected) {
        aspects.push({
          name: 'ETL / Informatica / ODI',
          icon: <GitBranch size={18} />,
          color: 'green',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-700'
        });
      }
      if (component.aspects['SaaS / JDV']?.detected) {
        aspects.push({
          name: 'SaaS / JDV',
          icon: <Cloud size={18} />,
          color: 'sky',
          bgColor: 'bg-sky-50',
          borderColor: 'border-sky-200',
          textColor: 'text-sky-700'
        });
      }
      if (component.aspects['Tradeshift']?.detected) {
        aspects.push({
          name: 'Tradeshift',
          icon: <ShoppingCart size={18} />,
          color: 'amber',
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200',
          textColor: 'text-amber-700'
        });
      }
      if (component.aspects['C2FO']?.detected) {
        aspects.push({
          name: 'C2FO',
          icon: <Building size={18} />,
          color: 'teal',
          bgColor: 'bg-teal-50',
          borderColor: 'border-teal-200',
          textColor: 'text-teal-700'
        });
      }
      if (component.aspects['IBM Cotre / Cognos']?.detected) {
        aspects.push({
          name: 'IBM Cotre / Cognos',
          icon: <Server size={18} />,
          color: 'indigo',
          bgColor: 'bg-indigo-50',
          borderColor: 'border-indigo-200',
          textColor: 'text-indigo-700'
        });
      }
      if (component.aspects['RBM-NRM']?.detected) {
        aspects.push({
          name: 'RBM-NRM',
          icon: <Network size={18} />,
          color: 'rose',
          bgColor: 'bg-rose-50',
          borderColor: 'border-rose-200',
          textColor: 'text-rose-700'
        });
      }
      if (component.aspects['Delphes-OeBS']?.detected) {
        aspects.push({
          name: 'Delphes-OeBS',
          icon: <Database size={18} />,
          color: 'cyan',
          bgColor: 'bg-cyan-50',
          borderColor: 'border-cyan-200',
          textColor: 'text-cyan-700'
        });
      }
    }

    // Fallback to legacy data if no aspects detected
    if (aspects.length === 0 && (component.cufParams?.length > 0 || component.oracleTables?.length > 0)) {
      aspects.push({
        name: 'Oracle ERP Cloud (Legacy)',
        icon: <Database size={18} />,
        color: 'blue',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        textColor: 'text-blue-700'
      });
    }

    return aspects;
  }, [component.aspects, component.cufParams, component.oracleTables]);

  const [activeTab, setActiveTab] = useState(detectedAspects[0]?.name || '');

  const getDocIcon = (uploaded: boolean) => {
    return uploaded ? <CheckCircle className="text-emerald-500" size={20} /> : <XCircle className="text-red-400" size={20} />;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Render the active tab content
  const renderTabContent = () => {
    if (activeTab === 'Oracle ERP Cloud (Legacy)') {
      // Legacy data rendering
      const legacyData: OracleERPAspect = {
        detected: true,
        cufParams: component.cufParams || [],
        oracleTables: component.oracleTables || [],
        oicsIntegrations: component.oicsIntegrations || []
      };
      return <OracleERPTab data={legacyData} />;
    }

    if (!component.aspects) return null;

    const aspectData = component.aspects[activeTab as keyof ComponentAspects];
    if (!aspectData) return null;

    switch (activeTab) {
      case 'Oracle ERP Cloud':
        return <OracleERPTab data={aspectData as OracleERPAspect} />;
      case 'BI Publisher':
        return <BIPublisherTab data={aspectData as BIPublisherAspect} />;
      case 'ETL / Informatica / ODI':
        return <ETLTab data={aspectData as ETLAspect} />;
      default:
        return <GenericAspectTab data={aspectData} aspectName={activeTab} />;
    }
  };

  return (
    <div className="animate-fade-in max-w-7xl mx-auto pb-10">
      <button
        onClick={onBack}
        className="flex items-center text-slate-500 hover:text-slate-800 mb-6 transition-colors group"
      >
        <ArrowLeft size={20} className="mr-2 group-hover:-translate-x-1 transition-transform" />
        Back to List
      </button>

      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Database size={120} />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-2">
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-lg font-bold px-4 py-1.5 rounded-lg shadow-sm">
              {component.id}
            </span>
            <span className="text-sm text-slate-400 uppercase tracking-wider font-semibold">
              Multi-Domain Component
            </span>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-4">{component.name}</h1>
          <p className="text-slate-600 text-lg max-w-3xl leading-relaxed">
            {component.summary || "No summary available for this component."}
          </p>

          <div className="flex items-center gap-6 mt-6 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <Calendar size={16} />
              Last Indexed: <span className="font-medium text-slate-700">{formatDate(component.lastIndexed)}</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText size={16} />
              Aspects: <span className="font-medium text-slate-700">{detectedAspects.length}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* Left Sidebar: Documentation Status */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <FileText className="text-blue-500" size={20} />
              Documentation
            </h3>
            <div className="space-y-3">
              {Object.entries(component.documents).map(([type, doc]) => {
                if (!doc) return null;
                return (
                  <div key={type} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${doc.uploaded ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-400'}`}>
                        <FileCheck size={16} />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-700 text-sm">{type}</p>
                        <p className="text-xs text-slate-400">
                          {doc.uploaded ? formatDate(doc.lastModified) : 'Missing'}
                        </p>
                      </div>
                    </div>
                    {getDocIcon(doc.uploaded)}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Content: Tabs */}
        <div className="lg:col-span-3">
          {detectedAspects.length > 0 ? (
            <>
              {/* Tab Navigation */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-2 mb-6">
                <div className="flex flex-wrap gap-2">
                  {detectedAspects.map((aspect) => (
                    <button
                      key={aspect.name}
                      onClick={() => setActiveTab(aspect.name)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
                        activeTab === aspect.name
                          ? `${aspect.bgColor} ${aspect.borderColor} ${aspect.textColor} border-2 shadow-sm`
                          : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-2 border-transparent'
                      }`}
                    >
                      {aspect.icon}
                      <span>{aspect.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Content */}
              <div className="min-h-[400px]">
                {renderTabContent()}
              </div>
            </>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
              <div className="text-slate-300 mb-4">
                <Database size={64} className="mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-slate-700 mb-2">No Technical Aspects Detected</h3>
              <p className="text-slate-500">
                This component has not been analyzed yet or no technical details were extracted from the documentation.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ComponentDetail;
