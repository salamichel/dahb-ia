import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, FileText, Terminal, CheckCircle, AlertCircle, Loader2, BrainCircuit, XCircle, Clock, Database } from 'lucide-react';
import { Component } from '../types';
import { uploadFilesToRobot, checkRobotAPI, UploadProgress, getRobotMetadata } from '../services/robotService';

interface ScannerProps {
  onScanComplete: (newComponents: Component[]) => void;
}

interface ScanLog {
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning' | 'ai';
}

interface UploadItem {
  file: File;
  status: 'pending' | 'uploading' | 'processing' | 'success' | 'error';
  progress: number;
  error?: string;
}

const Scanner: React.FC<ScannerProps> = ({ onScanComplete }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [logs, setLogs] = useState<ScanLog[]>([]);
  const [uploadItems, setUploadItems] = useState<UploadItem[]>([]);
  const [robotOnline, setRobotOnline] = useState<boolean | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Vérifier si l'API du robot est disponible au montage
  useEffect(() => {
    checkRobotConnection();
  }, []);

  const checkRobotConnection = async () => {
    addLog('Vérification de la connexion au Robot V2...', 'info');
    const online = await checkRobotAPI();
    setRobotOnline(online);

    if (online) {
      addLog('✅ Robot V2 connecté (API Upload sur port 3002)', 'success');
    } else {
      addLog('❌ Robot V2 hors ligne - Lancez ./robot/start-all.sh', 'error');
    }
  };

  const addLog = (message: string, type: ScanLog['type'] = 'info') => {
    setLogs(prev => [...prev, {
      timestamp: new Date().toLocaleTimeString(),
      message,
      type
    }]);
  };

  const processFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    if (!robotOnline) {
      addLog('❌ Robot V2 n\'est pas disponible. Impossible d\'uploader.', 'error');
      return;
    }

    // Filtrer les fichiers temporaires
    const validFiles = Array.from(files).filter(file => {
      if (file.name.startsWith('~$')) {
        addLog(`⏭️  Fichier temporaire ignoré: ${file.name}`, 'warning');
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) {
      addLog('❌ Aucun fichier valide (tous les fichiers sont temporaires)', 'error');
      return;
    }

    setIsUploading(true);
    setLogs([]);

    addLog('🚀 Robot Scanner V2 - Démarrage...', 'info');
    addLog(`📦 ${validFiles.length} fichier(s) sélectionné(s)`, 'info');

    // Initialiser les items d'upload
    const items: UploadItem[] = validFiles.map(file => ({
      file,
      status: 'pending',
      progress: 0
    }));
    setUploadItems(items);

    // Upload vers l'API du robot
    addLog('📤 Upload vers le Robot V2...', 'info');

    const result = await uploadFilesToRobot(validFiles, (progress: UploadProgress) => {
      // Mettre à jour la progression
      setUploadItems(prev => prev.map(item => {
        if (item.file.name === progress.fileName) {
          return {
            ...item,
            progress: progress.progress,
            status: progress.status === 'uploading' ? 'uploading' : progress.status
          };
        }
        return item;
      }));
    });

    if (!result.success) {
      addLog(`❌ Erreur upload: ${result.error}`, 'error');
      setUploadItems(prev => prev.map(item => ({ ...item, status: 'error', error: result.error })));
      setIsUploading(false);
      return;
    }

    addLog(`✅ Upload terminé - ${result.files?.length || 0} fichier(s) reçus`, 'success');

    // Marquer les fichiers comme "processing" (en attente d'analyse par le robot)
    setUploadItems(prev => prev.map(item => ({ ...item, status: 'processing', progress: 100 })));
    addLog('🤖 Le Robot V2 analyse le contenu avec Gemini...', 'ai');
    addLog('⏳ Extraction des métadonnées en cours...', 'ai');

    // Démarrer le polling pour attendre que le robot traite les fichiers
    setIsProcessing(true);
    startPollingForResults();
  };

  /**
   * Poll metadata.json pour détecter les nouveaux composants indexés
   */
  const startPollingForResults = () => {
    let attempts = 0;
    const maxAttempts = 30; // 30 secondes max (poll toutes les 1s)

    pollingIntervalRef.current = setInterval(async () => {
      attempts++;

      try {
        const metadata = await getRobotMetadata();

        if (metadata.components && metadata.components.length > 0) {
          // Succès! Des composants ont été indexés
          addLog(`✅ Indexation terminée!`, 'success');
          addLog(`📊 ${metadata.components.length} composant(s) dans la base`, 'success');

          // Mettre à jour l'interface
          setUploadItems(prev => prev.map(item => ({ ...item, status: 'success' })));
          setIsUploading(false);
          setIsProcessing(false);

          // Notifier le parent
          onScanComplete(metadata.components);

          // Arrêter le polling
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
          }

          return;
        }

        if (attempts >= maxAttempts) {
          addLog('⏱️  Timeout - Le robot prend du temps. Consultez les logs du robot.', 'warning');
          setIsUploading(false);
          setIsProcessing(false);

          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
          }
        }

      } catch (error) {
        console.error('Polling error:', error);
      }

    }, 1000); // Poll toutes les secondes
  };

  // Cleanup au démontage
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  };

  const getStatusIcon = (status: UploadItem['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="text-slate-400" size={20} />;
      case 'uploading':
        return <Loader2 className="text-blue-500 animate-spin" size={20} />;
      case 'processing':
        return <BrainCircuit className="text-purple-500 animate-pulse" size={20} />;
      case 'success':
        return <CheckCircle className="text-emerald-500" size={20} />;
      case 'error':
        return <XCircle className="text-red-500" size={20} />;
    }
  };

  const getStatusLabel = (status: UploadItem['status']) => {
    switch (status) {
      case 'pending':
        return 'En attente';
      case 'uploading':
        return 'Upload...';
      case 'processing':
        return 'Analyse Gemini...';
      case 'success':
        return 'Terminé';
      case 'error':
        return 'Erreur';
    }
  };

  return (
    <div className="animate-fade-in max-w-5xl mx-auto pb-12">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <BrainCircuit className="text-blue-600" />
          Robot Scanner V2
        </h1>
        <p className="text-slate-500 mt-1">
          Upload de documents vers le Robot V2 pour indexation intelligente multi-domaine.
        </p>

        {/* Status de connexion */}
        {robotOnline === null && (
          <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
            <Loader2 size={14} className="animate-spin" />
            <span>Vérification de la connexion au Robot V2...</span>
          </div>
        )}
        {robotOnline === false && (
          <div className="mt-3 flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            <AlertCircle size={16} />
            <span>
              Robot V2 hors ligne. Lancez <code className="bg-red-100 px-2 py-0.5 rounded font-mono">./robot/start-all.sh</code>
            </span>
          </div>
        )}
        {robotOnline === true && (
          <div className="mt-3 flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700">
            <CheckCircle size={16} />
            <span>Robot V2 en ligne - Prêt à recevoir les documents</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

        {/* Drop Zone */}
        <div className="lg:col-span-2">
          <div
            className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-colors h-64 bg-white ${
              isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-blue-400'
            } ${!robotOnline ? 'opacity-50 cursor-not-allowed' : ''}`}
            onDragOver={(e) => { e.preventDefault(); if (robotOnline) setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
              isUploading ? 'bg-blue-100 text-blue-600' : 'bg-blue-100 text-blue-600'
            }`}>
              {isUploading ? <Loader2 className="animate-spin" size={32} /> : <UploadCloud size={32} />}
            </div>
            <h3 className="text-lg font-semibold text-slate-700">
              {isUploading ? 'Upload & Analyse IA en cours...' : 'Glissez vos documents ici'}
            </h3>
            <p className="text-slate-500 text-sm mt-2 max-w-sm">
              Formats supportés: <span className="font-medium">.docx, .pdf, .txt</span>
              <br/>
              <span className="text-purple-600 font-medium">🤖 Analyse Gemini 1.5 Flash</span>
              <br/>
              <span className="text-xs text-slate-400">Les fichiers temporaires (~$...) sont automatiquement ignorés</span>
            </p>
            {!isUploading && robotOnline && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
              >
                Parcourir les fichiers
              </button>
            )}
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              multiple
              accept=".docx,.pdf,.txt"
              onChange={(e) => processFiles(e.target.files)}
              disabled={!robotOnline}
            />
          </div>
        </div>

        {/* Terminal / Logs */}
        <div className="lg:col-span-1 bg-slate-900 rounded-xl overflow-hidden flex flex-col h-64 lg:h-auto shadow-lg">
          <div className="bg-slate-800 px-4 py-3 flex items-center justify-between border-b border-slate-700">
            <span className="text-slate-200 text-xs font-mono font-bold flex items-center gap-2">
              <Terminal size={12} /> ROBOT_V2_LOG
            </span>
            <div className="flex space-x-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
              <div className={`w-2.5 h-2.5 rounded-full ${robotOnline ? 'bg-green-500' : 'bg-slate-600'}`}></div>
            </div>
          </div>
          <div className="flex-1 p-4 overflow-y-auto font-mono text-xs space-y-2">
            {logs.length === 0 && (
              <span className="text-slate-500">
                {robotOnline
                  ? 'Robot V2 prêt. En attente de documents...'
                  : 'Robot V2 déconnecté. Démarrez le robot pour continuer.'}
              </span>
            )}
            {logs.map((log, idx) => (
              <div key={idx} className="flex gap-2">
                <span className="text-slate-500 shrink-0">[{log.timestamp}]</span>
                <span className={`${
                  log.type === 'error' ? 'text-red-400' :
                  log.type === 'success' ? 'text-emerald-400' :
                  log.type === 'warning' ? 'text-yellow-400' :
                  log.type === 'ai' ? 'text-purple-400' :
                  'text-blue-300'
                }`}>
                  {log.message}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Upload Progress Table */}
      {uploadItems.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-800">Fichiers en traitement</h3>
              <p className="text-sm text-slate-500">
                {isProcessing
                  ? 'Le robot analyse le contenu avec Gemini...'
                  : 'Traitement terminé'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isProcessing && <Loader2 className="animate-spin text-purple-500" size={20} />}
              <Database className="text-blue-500" size={20} />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">Fichier</th>
                  <th className="px-6 py-3 w-32">Taille</th>
                  <th className="px-6 py-3 w-48">Statut</th>
                  <th className="px-6 py-3 w-32">Progression</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {uploadItems.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-slate-700">
                      <div className="flex items-center gap-2 font-medium">
                        <FileText size={16} className="text-slate-400" />
                        {item.file.name}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {(item.file.size / 1024).toFixed(1)} KB
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(item.status)}
                        <span className={`text-sm font-medium ${
                          item.status === 'success' ? 'text-emerald-600' :
                          item.status === 'error' ? 'text-red-600' :
                          item.status === 'processing' ? 'text-purple-600' :
                          'text-slate-600'
                        }`}>
                          {getStatusLabel(item.status)}
                        </span>
                      </div>
                      {item.error && (
                        <p className="text-xs text-red-500 mt-1">{item.error}</p>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            item.status === 'success' ? 'bg-emerald-500' :
                            item.status === 'error' ? 'bg-red-500' :
                            item.status === 'processing' ? 'bg-purple-500' :
                            'bg-blue-500'
                          }`}
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-500 mt-1 block">
                        {item.progress}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Scanner;
