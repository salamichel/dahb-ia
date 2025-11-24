import React from 'react';
import { Filter, X, Calendar, CheckCircle, AlertTriangle, XCircle, ChevronDown } from 'lucide-react';
import { OracleComponent, DocType } from '../types';

export interface FilterCriteria {
  searchQuery: string;
  module: string;
  status: 'all' | 'complete' | 'partial' | 'missing';
  dateRange: 'all' | '7days' | '30days' | '90days';
  hasCufParams: boolean | null;
  hasIntegrations: boolean | null;
}

interface FilterPanelProps {
  filters: FilterCriteria;
  onFilterChange: (filters: FilterCriteria) => void;
  components: OracleComponent[];
}

const FilterPanel: React.FC<FilterPanelProps> = ({ filters, onFilterChange, components }) => {

  // Extract unique modules from components
  const modules = Array.from(new Set(components.map(c => c.id.substring(0, 2)))).sort();

  const updateFilter = (key: keyof FilterCriteria, value: any) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFilterChange({
      searchQuery: '',
      module: 'all',
      status: 'all',
      dateRange: 'all',
      hasCufParams: null,
      hasIntegrations: null,
    });
  };

  const hasActiveFilters = filters.searchQuery !== '' ||
    filters.module !== 'all' ||
    filters.status !== 'all' ||
    filters.dateRange !== 'all' ||
    filters.hasCufParams !== null ||
    filters.hasIntegrations !== null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Filter className="text-blue-600" size={20} />
          <h3 className="text-lg font-semibold text-slate-800">Filtres Multi-Critères</h3>
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center space-x-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1 rounded-lg transition-colors"
          >
            <X size={16} />
            <span>Réinitialiser</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">

        {/* Search Query */}
        <div className="xl:col-span-2">
          <label className="block text-xs font-medium text-slate-600 mb-1">Recherche</label>
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => updateFilter('searchQuery', e.target.value)}
            placeholder="Nom ou ID du composant..."
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Module Filter */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Module</label>
          <div className="relative">
            <select
              value={filters.module}
              onChange={(e) => updateFilter('module', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white pr-8"
            >
              <option value="all">Tous les modules</option>
              {modules.map(mod => (
                <option key={mod} value={mod}>{mod}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
          </div>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Statut de Documentation</label>
          <div className="relative">
            <select
              value={filters.status}
              onChange={(e) => updateFilter('status', e.target.value as any)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white pr-8"
            >
              <option value="all">Tous les statuts</option>
              <option value="complete">✓ Complet</option>
              <option value="partial">⚠ Partiel</option>
              <option value="missing">✗ Incomplet</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
          </div>
        </div>

        {/* Date Range Filter */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            <Calendar size={12} className="inline mr-1" />
            Date d'indexation
          </label>
          <div className="relative">
            <select
              value={filters.dateRange}
              onChange={(e) => updateFilter('dateRange', e.target.value as any)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white pr-8"
            >
              <option value="all">Toutes les dates</option>
              <option value="7days">7 derniers jours</option>
              <option value="30days">30 derniers jours</option>
              <option value="90days">90 derniers jours</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
          </div>
        </div>

        {/* CUF Params Filter */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">CUF Params</label>
          <div className="flex space-x-2">
            <button
              onClick={() => updateFilter('hasCufParams', filters.hasCufParams === true ? null : true)}
              className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                filters.hasCufParams === true
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Oui
            </button>
            <button
              onClick={() => updateFilter('hasCufParams', filters.hasCufParams === false ? null : false)}
              className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                filters.hasCufParams === false
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Non
            </button>
          </div>
        </div>

        {/* Integrations Filter */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Intégrations OICS</label>
          <div className="flex space-x-2">
            <button
              onClick={() => updateFilter('hasIntegrations', filters.hasIntegrations === true ? null : true)}
              className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                filters.hasIntegrations === true
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Oui
            </button>
            <button
              onClick={() => updateFilter('hasIntegrations', filters.hasIntegrations === false ? null : false)}
              className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                filters.hasIntegrations === false
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Non
            </button>
          </div>
        </div>

      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="flex flex-wrap gap-2">
            {filters.searchQuery && (
              <FilterBadge
                label={`Recherche: "${filters.searchQuery}"`}
                onRemove={() => updateFilter('searchQuery', '')}
              />
            )}
            {filters.module !== 'all' && (
              <FilterBadge
                label={`Module: ${filters.module}`}
                onRemove={() => updateFilter('module', 'all')}
              />
            )}
            {filters.status !== 'all' && (
              <FilterBadge
                label={`Statut: ${filters.status}`}
                onRemove={() => updateFilter('status', 'all')}
              />
            )}
            {filters.dateRange !== 'all' && (
              <FilterBadge
                label={`Date: ${filters.dateRange === '7days' ? '7 jours' : filters.dateRange === '30days' ? '30 jours' : '90 jours'}`}
                onRemove={() => updateFilter('dateRange', 'all')}
              />
            )}
            {filters.hasCufParams !== null && (
              <FilterBadge
                label={`CUF: ${filters.hasCufParams ? 'Oui' : 'Non'}`}
                onRemove={() => updateFilter('hasCufParams', null)}
              />
            )}
            {filters.hasIntegrations !== null && (
              <FilterBadge
                label={`OICS: ${filters.hasIntegrations ? 'Oui' : 'Non'}`}
                onRemove={() => updateFilter('hasIntegrations', null)}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const FilterBadge = ({ label, onRemove }: { label: string; onRemove: () => void }) => (
  <div className="flex items-center space-x-1 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium border border-blue-100">
    <span>{label}</span>
    <button
      onClick={onRemove}
      className="hover:bg-blue-100 rounded-full p-0.5 transition-colors"
    >
      <X size={12} />
    </button>
  </div>
);

export default FilterPanel;
