import React from 'react';
import { OracleComponent, DocType, CufParam } from '../types';
import { 
  ArrowLeft, 
  FileText, 
  Database, 
  Code2, 
  Network, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  FileCheck,
  ExternalLink
} from 'lucide-react';

interface ComponentDetailProps {
  component: OracleComponent;
  onBack: () => void;
}

const ComponentDetail: React.FC<ComponentDetailProps> = ({ component, onBack }) => {
  
  const getDocIcon = (uploaded: boolean) => {
    return uploaded ? <CheckCircle className="text-emerald-500" size={20} /> : <XCircle className="text-red-400" size={20} />;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="animate-fade-in max-w-6xl mx-auto pb-10">
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
                <span className="bg-blue-600 text-white text-lg font-bold px-3 py-1 rounded-lg shadow-sm">
                    {component.id}
                </span>
                <span className="text-sm text-slate-400 uppercase tracking-wider font-semibold">Oracle Component</span>
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
                    <Code2 size={16} />
                    Params: <span className="font-medium text-slate-700">{component.cufParams.length}</span>
                </div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Documentation Status */}
        <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <FileText className="text-blue-500" size={20} />
                    Documentation
                </h3>
                <div className="space-y-4">
                    {Object.values(DocType).map(type => {
                        const doc = component.documents[type];
                        if (!doc) return null;
                        return (
                            <div key={type} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${doc.uploaded ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-400'}`}>
                                        <FileCheck size={18} />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-700">{type}</p>
                                        <p className="text-xs text-slate-400">
                                            {doc.uploaded ? `Updated: ${formatDate(doc.lastModified)}` : 'Missing'}
                                        </p>
                                    </div>
                                </div>
                                {getDocIcon(doc.uploaded)}
                            </div>
                        );
                    })}
                </div>
            </div>

             <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Network className="text-orange-500" size={20} />
                    Integrations (OICS)
                </h3>
                {component.oicsIntegrations.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {component.oicsIntegrations.map((int, idx) => (
                            <span key={idx} className="bg-orange-50 text-orange-700 border border-orange-100 px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1">
                                <Network size={12} /> {int}
                            </span>
                        ))}
                    </div>
                ) : (
                    <p className="text-slate-400 text-sm italic">No integrations detected.</p>
                )}
            </div>
        </div>

        {/* Right Column: Technical Details */}
        <div className="lg:col-span-2 space-y-6">
            
            {/* Oracle Tables */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Database className="text-emerald-500" size={20} />
                    Oracle Tables
                </h3>
                {component.oracleTables.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {component.oracleTables.map((table, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm text-slate-700 bg-emerald-50/50 p-2 rounded border border-emerald-100/50">
                                <Database size={14} className="text-emerald-400" />
                                <span className="font-mono">{table}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-slate-400 text-sm italic">No tables linked.</p>
                )}
            </div>

            {/* CUF Parameters */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Code2 className="text-indigo-500" size={20} />
                    CUF Parameters
                </h3>
                
                {component.cufParams.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 font-medium">
                                <tr>
                                    <th className="px-4 py-2 rounded-l-lg">Parameter</th>
                                    <th className="px-4 py-2">Value</th>
                                    <th className="px-4 py-2">Description</th>
                                    <th className="px-4 py-2 rounded-r-lg">Source</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {component.cufParams.map((param, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-3 font-mono text-blue-600 font-medium">{param.param}</td>
                                        <td className="px-4 py-3 font-mono text-slate-800">{param.value}</td>
                                        <td className="px-4 py-3 text-slate-600">{param.description}</td>
                                        <td className="px-4 py-3">
                                            <span className="bg-slate-100 text-slate-500 text-xs px-2 py-1 rounded border border-slate-200">
                                                {param.sourceDocument}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-8 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                        <p className="text-slate-400 italic">No configuration parameters extracted.</p>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default ComponentDetail;