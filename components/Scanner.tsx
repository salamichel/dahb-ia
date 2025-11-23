import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, Terminal, CheckCircle, AlertCircle, Loader2, Play, BrainCircuit, Pencil, Trash2, Save, X, Check, ScanSearch } from 'lucide-react';
import { OracleComponent, DocType, ComponentStatus } from '../types';

interface ScannerProps {
  onScanComplete: (newComponents: OracleComponent[]) => void;
}

interface ScanLog {
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning' | 'ai';
}

interface ScannedItem {
  file: File;
  id: string;
  type: DocType;
  method: string;
  extractedName?: string;
  extractedSummary?: string;
  confidence?: string;
}

const Scanner: React.FC<ScannerProps> = ({ onScanComplete }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [logs, setLogs] = useState<ScanLog[]>([]);
  const [progress, setProgress] = useState(0);
  
  // Review Queue State
  const [reviewQueue, setReviewQueue] = useState<ScannedItem[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<{id: string, type: DocType}>({ id: '', type: DocType.SFD });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addLog = (message: string, type: ScanLog['type'] = 'info') => {
    setLogs(prev => [...prev, {
      timestamp: new Date().toLocaleTimeString(),
      message,
      type
    }]);
  };

  // Simulates reading file content and using NLP/Regex to find structure
  const analyzeContentWithAI = async (file: File, preliminaryId: string) => {
    // Simulate processing delay proportional to file size
    await new Promise(r => setTimeout(r, 600)); 
    
    const nameLower = file.name.toLowerCase();
    let detectedType = DocType.SFD; // Default
    let confidence = "Low";
    let keywordsFound: string[] = [];
    let extractedSummary = "";
    let extractedName = "";

    // Content Pattern Simulation based on filename hints (mocking real file reading)
    if (nameLower.includes('setup') || nameLower.includes('conf') || nameLower.includes('param')) {
      detectedType = DocType.SETUP;
      confidence = "High (98%)";
      keywordsFound = ["Configuration Table", "Value Set", "Profile Options"];
      extractedSummary = `Configuration workbook containing parameter definitions for ${preliminaryId}. Detected 3 main setup tables.`;
    } else if (nameLower.includes('tech') || nameLower.includes('std') || nameLower.includes('design') || nameLower.includes('pkg')) {
      detectedType = DocType.STD;
      confidence = "High (95%)";
      keywordsFound = ["Package Body", "Schema Definition", "API Endpoint"];
      extractedSummary = `Technical design document detailing PL/SQL packages and OICS integrations for ${preliminaryId}.`;
    } else if (nameLower.includes('spec') || nameLower.includes('func') || nameLower.includes('user') || nameLower.includes('req')) {
      detectedType = DocType.SFD;
      confidence = "Medium (85%)"; 
      keywordsFound = ["Business Rules", "Use Case Diagram", "User Story"];
      extractedSummary = `Functional specification covering business logic, validation rules, and user flows for ${preliminaryId}.`;
    } else {
      // Fallback for unclear files
      detectedType = DocType.SFD;
      confidence = "Low (40%)";
      extractedSummary = `AI analysis inconclusive on specific type. Defaulting to SFD based on general document structure.`;
    }

    // Heuristic Name Extraction
    if (preliminaryId.startsWith("AP")) extractedName = "Accounts Payable Automated Process";
    else if (preliminaryId.startsWith("GL")) extractedName = "General Ledger Journal Import";
    else if (preliminaryId.startsWith("PO")) extractedName = "Purchase Order Workflow";
    else extractedName = `Oracle Component ${preliminaryId}`;

    return { detectedType, confidence, keywordsFound, extractedSummary, extractedName };
  };

  const processFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsScanning(true);
    setLogs([]); 
    setProgress(0);
    
    addLog('Robot Scanner initialized.', 'info');
    addLog(`Ingesting ${files.length} files...`, 'info');

    const newItems: ScannedItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      addLog(`Reading file: ${file.name}`, 'info');
      
      // 1. Preliminary ID Extraction (Filename Regex)
      let id = "UNK001";
      const idMatch = file.name.match(/([A-Z]{2,}[0-9]{3})/i);
      if (idMatch) {
        id = idMatch[1].toUpperCase();
        addLog(`ID detected in filename: [${id}]`, 'success');
      } else {
        id = `NEW${Math.floor(Math.random() * 900) + 100}`;
        addLog(`No ID in filename. Assigned temp ID: [${id}]`, 'warning');
      }

      // 2. Deep Content Analysis (Simulation)
      addLog(`analyzing content structure & keywords...`, 'ai');
      const analysis = await analyzeContentWithAI(file, id);

      addLog(`Content Match: [${analysis.detectedType}] - Conf: ${analysis.confidence}`, 'ai');
      addLog(`> Keywords: ${analysis.keywordsFound.join(', ')}`, 'ai');
      addLog(`> Extracted Summary: "${analysis.extractedSummary.substring(0, 40)}..."`, 'success');

      newItems.push({
        file,
        id,
        type: analysis.detectedType,
        method: `AI Content Analysis (${analysis.confidence})`,
        extractedName: analysis.extractedName,
        extractedSummary: analysis.extractedSummary,
        confidence: analysis.confidence
      });

      setProgress(Math.round(((i + 1) / files.length) * 100));
    }

    addLog(`Scan complete. ${newItems.length} documents waiting for validation.`, 'warning');
    setReviewQueue(prev => [...prev, ...newItems]);
    setIsScanning(false);
  };

  const finalizeIndexing = async () => {
    if (reviewQueue.length === 0) return;

    setIsScanning(true);
    addLog(`Indexing ${reviewQueue.length} verified documents to Knowledge Base...`, 'info');
    
    const processedComponents: Record<string, OracleComponent> = {};

    for (const item of reviewQueue) {
       const { id, type: docType, file, extractedName, extractedSummary } = item;

      if (!processedComponents[id]) {
        processedComponents[id] = {
          id: id,
          name: extractedName || `Oracle Component ${id}`,
          summary: extractedSummary, // Store the AI summary
          documents: {
            [DocType.SFD]: { type: DocType.SFD, uploaded: false },
            [DocType.STD]: { type: DocType.STD, uploaded: false },
            [DocType.SETUP]: { type: DocType.SETUP, uploaded: false },
            [DocType.FN]: { type: DocType.FN, uploaded: false },
            [DocType.MOP]: { type: DocType.MOP, uploaded: false },
          },
          cufParams: [],
          oracleTables: [],
          oicsIntegrations: [],
          lastIndexed: new Date().toISOString()
        };
      } else {
        // If we already processed this ID in this loop, verify if we should update summary
        if (extractedSummary && !processedComponents[id].summary) {
             processedComponents[id].summary = extractedSummary;
        }
      }

      // Update Document Status
      processedComponents[id].documents[docType] = {
        type: docType,
        uploaded: true,
        lastModified: new Date(file.lastModified).toISOString(),
        filePath: `\\\\server\\docs\\${file.name}`
      };

      // Simulate specific data extraction based on doc type
      if (docType === DocType.SETUP) {
        processedComponents[id].cufParams.push({
          param: `${id}_AUTO_PROCESS`,
          value: 'Y',
          description: 'Extracted automatically from SETUP doc',
          sourceDocument: 'SETUP'
        });
      } else if (docType === DocType.STD) {
        processedComponents[id].oracleTables.push(`${id}_HEADERS_ALL`);
        processedComponents[id].oracleTables.push(`${id}_LINES_ALL`);
      }
    }

    await new Promise(r => setTimeout(r, 800)); 
    onScanComplete(Object.values(processedComponents));
    setReviewQueue([]); 
    addLog('Knowledge Base updated successfully.', 'success');
    setIsScanning(false);
  };

  const startEditing = (index: number) => {
    setEditingIndex(index);
    setEditForm({
      id: reviewQueue[index].id,
      type: reviewQueue[index].type
    });
  };

  const saveEdit = () => {
    if (editingIndex === null) return;
    
    setReviewQueue(prev => {
      const updated = [...prev];
      updated[editingIndex] = {
        ...updated[editingIndex],
        id: editForm.id,
        type: editForm.type,
        method: 'Manual Correction'
      };
      return updated;
    });
    
    addLog(`Manual correction: Item ${editingIndex + 1} updated to [${editForm.id}]`, 'warning');
    setEditingIndex(null);
  };

  const deleteItem = (index: number) => {
    setReviewQueue(prev => prev.filter((_, i) => i !== index));
    addLog(`Item removed from queue.`, 'warning');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  };

  return (
    <div className="animate-fade-in max-w-5xl mx-auto pb-12">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
           <BrainCircuit className="text-blue-600" />
           Intelligent Robot Scanner
        </h1>
        <p className="text-slate-500 mt-1">
          Upload any document. The AI will analyze content structure, keywords, and extract metadata automatically.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* Drop Zone */}
        <div className="lg:col-span-2">
          <div 
            className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-colors h-64 bg-white ${
              isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-blue-400'
            }`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
              {isScanning ? <Loader2 className="animate-spin" size={32} /> : <UploadCloud size={32} />}
            </div>
            <h3 className="text-lg font-semibold text-slate-700">
              {isScanning ? 'AI Content Analysis in Progress...' : 'Drag & Drop Any Files'}
            </h3>
            <p className="text-slate-500 text-sm mt-2 max-w-sm">
              Supports .docx, .pdf, .txt. <br/>
              <span className="text-blue-600 font-medium">Deep Content Inspection Active</span>
            </p>
            {!isScanning && (
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
              >
                Browse Files
              </button>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              multiple 
              onChange={(e) => processFiles(e.target.files)}
            />
          </div>

          {/* Progress Bar */}
          {isScanning && (
             <div className="mt-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-slate-700">Analyzing & Extracting Metadata</span>
                  <span className="text-blue-600 font-bold">{progress}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
             </div>
          )}
        </div>

        {/* Terminal / Logs */}
        <div className="lg:col-span-1 bg-slate-900 rounded-xl overflow-hidden flex flex-col h-64 lg:h-auto shadow-lg">
          <div className="bg-slate-800 px-4 py-3 flex items-center justify-between border-b border-slate-700">
            <span className="text-slate-200 text-xs font-mono font-bold flex items-center gap-2">
              <Terminal size={12} /> AI_PROCESSOR_LOG
            </span>
            <div className="flex space-x-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
            </div>
          </div>
          <div className="flex-1 p-4 overflow-y-auto font-mono text-xs space-y-2">
            {logs.length === 0 && (
              <span className="text-slate-500">System Ready. Waiting for document stream...</span>
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
                  {log.type === 'success' && '✓ '}
                  {log.type === 'ai' && '🤖 '}
                  {log.message}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Review Queue Table */}
      {reviewQueue.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
             <div>
                <h3 className="font-bold text-slate-800">Detected Metadata</h3>
                <p className="text-sm text-slate-500">Review AI-extracted types and summaries.</p>
             </div>
             <button 
               onClick={finalizeIndexing}
               disabled={isScanning || editingIndex !== null}
               className="flex items-center space-x-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
             >
               {isScanning ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle size={16} />}
               <span>Confirm & Index All</span>
             </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">File & AI Summary</th>
                  <th className="px-6 py-3 w-32">Comp ID</th>
                  <th className="px-6 py-3 w-32">Doc Type</th>
                  <th className="px-6 py-3 w-40">Confidence</th>
                  <th className="px-6 py-3 text-right w-24">Edit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reviewQueue.map((item, idx) => (
                  <tr key={idx} className={`hover:bg-slate-50 transition-colors ${editingIndex === idx ? 'bg-blue-50' : ''}`}>
                    <td className="px-6 py-4 text-slate-700">
                      <div className="flex items-center gap-2 font-medium mb-1">
                        <FileText size={16} className="text-slate-400" />
                        {item.file.name}
                      </div>
                      <div className="text-xs text-slate-500 italic pl-6 border-l-2 border-slate-200">
                         {item.extractedSummary || "No summary extracted."}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 align-top">
                      {editingIndex === idx ? (
                        <input 
                          type="text" 
                          value={editForm.id}
                          onChange={(e) => setEditForm({...editForm, id: e.target.value.toUpperCase()})}
                          className="w-full border border-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                        />
                      ) : (
                        <span className="font-mono bg-slate-100 px-2 py-1 rounded text-slate-700 block text-center">{item.id}</span>
                      )}
                    </td>

                    <td className="px-6 py-4 align-top">
                      {editingIndex === idx ? (
                        <select 
                          value={editForm.type}
                          onChange={(e) => setEditForm({...editForm, type: e.target.value as DocType})}
                          className="w-full border border-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {Object.values(DocType).map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      ) : (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium w-full justify-center ${
                          item.type === DocType.SFD ? 'bg-blue-100 text-blue-800' :
                          item.type === DocType.STD ? 'bg-purple-100 text-purple-800' :
                          item.type === DocType.SETUP ? 'bg-emerald-100 text-emerald-800' :
                          'bg-slate-100 text-slate-800'
                        }`}>
                          {item.type}
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 align-top">
                       <div className="flex items-center gap-1">
                          <ScanSearch size={14} className="text-blue-400" />
                          <span className="text-xs text-slate-600">{item.confidence}</span>
                       </div>
                    </td>

                    <td className="px-6 py-4 text-right space-x-2 align-top">
                      {editingIndex === idx ? (
                        <>
                          <button onClick={saveEdit} className="text-emerald-600 hover:text-emerald-700 p-1 bg-emerald-50 rounded"><Save size={16} /></button>
                          <button onClick={() => setEditingIndex(null)} className="text-slate-500 hover:text-slate-700 p-1 hover:bg-slate-100 rounded"><X size={16} /></button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startEditing(idx)} className="text-blue-600 hover:text-blue-700 p-1 hover:bg-blue-50 rounded transition-colors" title="Edit Details">
                            <Pencil size={16} />
                          </button>
                          <button onClick={() => deleteItem(idx)} className="text-red-400 hover:text-red-600 p-1 hover:bg-red-50 rounded transition-colors" title="Remove">
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
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