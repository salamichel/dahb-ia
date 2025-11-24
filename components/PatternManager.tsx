import React, { useState, useEffect } from 'react';
import { Settings, Plus, ChevronUp, ChevronDown, Edit2, Trash2, TestTube, Save, X, Check, AlertCircle } from 'lucide-react';
import {
  fetchPatterns,
  createPattern,
  updatePattern,
  deletePattern,
  changePriority,
  testFilename,
  Pattern,
  PatternsConfig,
  TestResult
} from '../services/patternService';

const PatternManager: React.FC = () => {
  const [config, setConfig] = useState<PatternsConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Test state
  const [testFilename, setTestFilename] = useState('');
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [testing, setTesting] = useState(false);

  // Edit/Add state
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<Partial<Pattern>>({});

  // Load patterns on mount
  useEffect(() => {
    loadPatterns();
  }, []);

  const loadPatterns = async () => {
    try {
      setLoading(true);
      const data = await fetchPatterns();
      setConfig(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load patterns');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePattern = async (index: number) => {
    if (!config) return;

    try {
      const pattern = config.patterns[index];
      const updated = await updatePattern(index, { enabled: !pattern.enabled });
      setConfig(updated);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleChangePriority = async (index: number, direction: 'up' | 'down') => {
    try {
      const updated = await changePriority(index, direction);
      setConfig(updated);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleTestFilename = async () => {
    if (!testFilename.trim()) return;

    try {
      setTesting(true);
      const result = await testFilename(testFilename);
      setTestResult(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setTesting(false);
    }
  };

  const handleDeletePattern = async (index: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce pattern ?')) return;

    try {
      const updated = await deletePattern(index);
      setConfig(updated);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSavePattern = async () => {
    try {
      if (editingIndex !== null) {
        // Update existing
        const updated = await updatePattern(editingIndex, formData);
        setConfig(updated);
        setEditingIndex(null);
      } else {
        // Create new
        const updated = await createPattern(formData as Pattern);
        setConfig(updated);
        setShowAddForm(false);
      }
      setFormData({});
    } catch (err: any) {
      setError(err.message);
    }
  };

  const startEdit = (index: number) => {
    if (!config) return;
    setFormData(config.patterns[index]);
    setEditingIndex(index);
    setShowAddForm(false);
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setShowAddForm(false);
    setFormData({});
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">Chargement des patterns...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center gap-2 text-red-700">
          <AlertCircle className="w-5 h-5" />
          <span>Erreur: {error}</span>
        </div>
        <button
          onClick={loadPatterns}
          className="mt-2 px-4 py-2 bg-red-100 hover:bg-red-200 rounded text-sm"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
          <Settings className="w-8 h-8" />
          Gestion des Patterns
        </h1>
        <p className="text-slate-600 mt-2">
          Configurez les conventions de nommage pour l'indexation automatique
        </p>
      </div>

      {/* Actions */}
      <div className="mb-6 flex gap-3">
        <button
          onClick={() => {
            setShowAddForm(true);
            setEditingIndex(null);
            setFormData({ enabled: true });
          }}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nouveau Pattern
        </button>
        <button
          onClick={loadPatterns}
          className="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg"
        >
          Actualiser
        </button>
      </div>

      {/* Tester Section */}
      <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
        <h2 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <TestTube className="w-5 h-5" />
          Testeur de Patterns
        </h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={testFilename}
            onChange={(e) => setTestFilename(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleTestFilename()}
            placeholder="EVO.FINA.001_SET_0549_Interface_Bancaire.docx"
            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleTestFilename}
            disabled={testing || !testFilename.trim()}
            className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg disabled:opacity-50 flex items-center gap-2"
          >
            <TestTube className="w-4 h-4" />
            Tester
          </button>
        </div>

        {/* Test Result */}
        {testResult && (
          <div className={`mt-4 p-4 rounded-lg border-2 ${testResult.matched ? 'bg-green-50 border-green-300' : 'bg-amber-50 border-amber-300'}`}>
            <div className="font-semibold text-lg mb-2">
              {testResult.matched ? (
                <span className="text-green-700 flex items-center gap-2">
                  <Check className="w-5 h-5" />
                  Match: {testResult.pattern}
                </span>
              ) : (
                <span className="text-amber-700 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Aucun pattern correspondant
                </span>
              )}
            </div>
            {testResult.matched && (
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><strong>ID:</strong> {testResult.componentId || 'N/A'}</div>
                <div><strong>Type:</strong> {testResult.docType || '(auto-detect)'}</div>
                <div className="col-span-2"><strong>Nom:</strong> {testResult.componentName || '(à extraire du contenu)'}</div>
                {testResult.linkedTo && (
                  <div className="col-span-2 text-blue-700">
                    <strong>🔗 Lié à:</strong> {testResult.linkedTo.mainComponentId}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Form */}
      {(showAddForm || editingIndex !== null) && (
        <div className="mb-6 p-6 bg-white rounded-lg border-2 border-blue-300 shadow-lg">
          <h2 className="font-semibold text-lg mb-4">
            {editingIndex !== null ? 'Modifier le Pattern' : 'Nouveau Pattern'}
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nom du Pattern</label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                placeholder="EVO.FINA - Standard PTI Finance"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Regex</label>
              <input
                type="text"
                value={formData.regex || ''}
                onChange={(e) => setFormData({ ...formData, regex: e.target.value })}
                className="w-full px-3 py-2 border rounded font-mono text-sm"
                placeholder="^(?:EVO\.)?(?:FINA\.)?..."
              />
            </div>
            <div className="flex gap-4">
              <button
                onClick={handleSavePattern}
                disabled={!formData.name || !formData.regex}
                className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded disabled:opacity-50 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Sauvegarder
              </button>
              <button
                onClick={cancelEdit}
                className="px-6 py-2 bg-slate-300 hover:bg-slate-400 rounded flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Patterns List */}
      <div className="space-y-4">
        {config?.patterns.map((pattern, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg border-2 transition ${
              pattern.enabled
                ? 'bg-white border-slate-200 hover:border-blue-300'
                : 'bg-slate-50 border-slate-200 opacity-60'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <button
                    onClick={() => handleTogglePattern(index)}
                    className={`w-12 h-6 rounded-full transition ${
                      pattern.enabled ? 'bg-green-500' : 'bg-slate-300'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white transition transform ${
                        pattern.enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <h3 className="font-semibold text-lg">{pattern.name}</h3>
                </div>
                <div className="ml-15 space-y-1 text-sm text-slate-600">
                  <div className="font-mono bg-slate-100 p-2 rounded">
                    <strong>Regex:</strong> {pattern.regex}
                  </div>
                  {pattern.examples && pattern.examples.length > 0 && (
                    <div>
                      <strong>Exemples:</strong>
                      <ul className="mt-1 space-y-1">
                        {pattern.examples.map((ex, i) => (
                          <li key={i} className="text-blue-600">• {ex}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-2 ml-4">
                <div className="flex gap-1">
                  <button
                    onClick={() => handleChangePriority(index, 'up')}
                    disabled={index === 0}
                    className="p-1 hover:bg-slate-200 rounded disabled:opacity-30"
                    title="Monter"
                  >
                    <ChevronUp className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleChangePriority(index, 'down')}
                    disabled={index === (config?.patterns.length || 0) - 1}
                    className="p-1 hover:bg-slate-200 rounded disabled:opacity-30"
                    title="Descendre"
                  >
                    <ChevronDown className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => startEdit(index)}
                    className="p-1 hover:bg-blue-100 rounded"
                    title="Modifier"
                  >
                    <Edit2 className="w-5 h-5 text-blue-600" />
                  </button>
                  <button
                    onClick={() => handleDeletePattern(index)}
                    className="p-1 hover:bg-red-100 rounded"
                    title="Supprimer"
                  >
                    <Trash2 className="w-5 h-5 text-red-600" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PatternManager;
