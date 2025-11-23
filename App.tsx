
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Search, 
  Network, 
  FileText, 
  Menu, 
  X, 
  Bot, 
  Send, 
  UploadCloud, 
  Settings,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  ArrowUpRight,
  ScanLine
} from 'lucide-react';
import { MOCK_COMPONENTS, MOCK_DEPENDENCIES } from './constants';
import { OracleComponent, Dependency, ChatMessage, DocType } from './types';
import DashboardStats from './components/DashboardStats';
import DependencyGraph from './components/DependencyGraph';
import Scanner from './components/Scanner';
import ComponentDetail from './components/ComponentDetail';
import PatternManager from './components/PatternManager';
import { generateAIResponse } from './services/geminiService';
import { loadComponents, watchForUpdates } from './services/dataLoader';

// --- Navigation Enum ---
enum View {
  DASHBOARD = 'dashboard',
  COMPONENTS = 'components',
  DEPENDENCIES = 'dependencies',
  SEARCH = 'search',
  SCANNER = 'scanner',
  PATTERNS = 'patterns'
}

const App = () => {
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [components, setComponents] = useState<OracleComponent[]>(MOCK_COMPONENTS);
  const [dependencies] = useState<Dependency[]>(MOCK_DEPENDENCIES);

  // Load components from robot v2 on mount
  useEffect(() => {
    loadComponents().then(setComponents);

    // Watch for updates from robot (poll every 5 seconds)
    const cleanup = watchForUpdates(setComponents, 5000);
    return cleanup;
  }, []);
  
  // Selection State
  const [selectedComponent, setSelectedComponent] = useState<OracleComponent | null>(null);

  // AI Chat State
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'Hello! I am Dahb IA. Ask me anything about your Oracle documentation.', timestamp: Date.now() }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    
    const newUserMsg: ChatMessage = { role: 'user', text: chatInput, timestamp: Date.now() };
    setMessages(prev => [...prev, newUserMsg]);
    setChatInput('');
    setIsTyping(true);

    const responseText = await generateAIResponse(newUserMsg.text, components);
    
    setMessages(prev => [...prev, { role: 'model', text: responseText, timestamp: Date.now() }]);
    setIsTyping(false);
  };

  const handleScanComplete = (newScannedComponents: OracleComponent[]) => {
    setComponents(prev => {
      const updated = [...prev];
      newScannedComponents.forEach(newComp => {
        const index = updated.findIndex(c => c.id === newComp.id);
        if (index >= 0) {
          // Merge logic: Update existing component with new doc info
          updated[index] = {
            ...updated[index],
            summary: newComp.summary || updated[index].summary,
            documents: { ...updated[index].documents, ...newComp.documents },
            // Add unique params
            cufParams: [...updated[index].cufParams, ...newComp.cufParams.filter(p => !updated[index].cufParams.some(ep => ep.param === p.param))],
            oracleTables: [...Array.from(new Set([...updated[index].oracleTables, ...newComp.oracleTables]))],
            lastIndexed: new Date().toISOString()
          };
        } else {
          // Add new component
          updated.push(newComp);
        }
      });
      return updated;
    });
  };
  
  const handleNavClick = (view: View) => {
    setCurrentView(view);
    setSelectedComponent(null); // Clear selection when changing main tabs
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900 font-sans">
      
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-200 ease-in-out ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-900">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mr-3">
               <Bot className="text-white" size={20} />
            </div>
            <span className="text-xl font-bold tracking-tight">Dahb IA</span>
          </div>

          {/* Nav Links */}
          <nav className="flex-1 px-4 py-6 space-y-1">
            <NavItem 
              icon={<LayoutDashboard size={20} />} 
              label="Dashboard" 
              active={currentView === View.DASHBOARD && !selectedComponent} 
              onClick={() => handleNavClick(View.DASHBOARD)} 
            />
            <NavItem 
              icon={<FileText size={20} />} 
              label="Components" 
              active={currentView === View.COMPONENTS || (!!selectedComponent && currentView !== View.SEARCH && currentView !== View.DEPENDENCIES && currentView !== View.SCANNER)} 
              onClick={() => handleNavClick(View.COMPONENTS)} 
            />
            <NavItem 
              icon={<Network size={20} />} 
              label="Dependencies" 
              active={currentView === View.DEPENDENCIES} 
              onClick={() => handleNavClick(View.DEPENDENCIES)} 
            />
            <NavItem 
              icon={<Search size={20} />} 
              label="Advanced Search" 
              active={currentView === View.SEARCH} 
              onClick={() => handleNavClick(View.SEARCH)} 
            />
            <NavItem
              icon={<ScanLine size={20} />}
              label="Robot Scanner"
              active={currentView === View.SCANNER}
              onClick={() => handleNavClick(View.SCANNER)}
            />
            <NavItem
              icon={<Settings size={20} />}
              label="Patterns Config"
              active={currentView === View.PATTERNS}
              onClick={() => handleNavClick(View.PATTERNS)}
            />
          </nav>

          {/* Bottom Actions */}
          <div className="p-4 border-t border-slate-800">
            <button 
              onClick={() => handleNavClick(View.SCANNER)}
              className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors text-sm font-medium"
            >
              <UploadCloud size={16} />
              <span>Import DOCX/XML</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={() => setMobileMenuOpen(false)}></div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 lg:px-8">
          <button className="lg:hidden text-slate-500 hover:text-slate-700" onClick={() => setMobileMenuOpen(true)}>
            <Menu size={24} />
          </button>
          
          <div className="flex-1 max-w-2xl mx-auto hidden lg:block">
             <div className="relative">
               <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
               <input 
                 type="text" 
                 placeholder="Quick search for components (e.g. AP020)..." 
                 className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-full text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
               />
             </div>
          </div>

          <div className="flex items-center space-x-4">
             <button 
               onClick={() => setChatOpen(!chatOpen)}
               className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
             >
               <Bot size={24} className={chatOpen ? "text-blue-600" : ""} />
               <span className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full border border-white"></span>
             </button>
             <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm">
               JD
             </div>
          </div>
        </header>

        {/* Scrollable View Area */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-8">
          
          {selectedComponent ? (
            <ComponentDetail 
              component={selectedComponent} 
              onBack={() => setSelectedComponent(null)} 
            />
          ) : (
            <>
              {currentView === View.DASHBOARD && (
                <div className="animate-fade-in">
                  <div className="mb-8">
                    <h1 className="text-2xl font-bold text-slate-800">Dashboard Overview</h1>
                    <p className="text-slate-500 mt-1">Real-time insights into Oracle documentation coverage.</p>
                  </div>
                  <DashboardStats components={components} />
                  
                  <div className="mt-8 bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                     <h3 className="text-lg font-semibold text-slate-800 mb-4">Recent Updates</h3>
                     <div className="space-y-4">
                        {components.slice(0, 3).map(c => (
                          <div 
                            key={c.id} 
                            onClick={() => setSelectedComponent(c)}
                            className="flex items-start justify-between p-4 hover:bg-slate-50 rounded-lg transition-colors border border-slate-100 cursor-pointer group"
                          >
                            <div className="flex items-center space-x-4">
                              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm group-hover:bg-blue-100 transition-colors">
                                {c.id.substring(0, 2)}
                              </div>
                              <div>
                                <h4 className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors">{c.name} ({c.id})</h4>
                                <p className="text-xs text-slate-500">Last indexed: {new Date(c.lastIndexed).toLocaleDateString()}</p>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <Badge active={c.documents[DocType.SFD]?.uploaded} text="SFD" />
                              <Badge active={c.documents[DocType.STD]?.uploaded} text="STD" />
                              <Badge active={c.documents[DocType.SETUP]?.uploaded} text="SETUP" />
                            </div>
                          </div>
                        ))}
                     </div>
                  </div>
                </div>
              )}

              {currentView === View.COMPONENTS && (
                 <ComponentsView components={components} onSelect={setSelectedComponent} />
              )}

              {currentView === View.DEPENDENCIES && (
                <div className="animate-fade-in">
                  <div className="mb-6 flex justify-between items-center">
                    <div>
                      <h1 className="text-2xl font-bold text-slate-800">Dependency Graph</h1>
                      <p className="text-slate-500 mt-1">Visualizing ControlM job dependencies.</p>
                    </div>
                  </div>
                  <DependencyGraph components={components} dependencies={dependencies} />
                </div>
              )}
              
               {currentView === View.SEARCH && (
                 <AdvancedSearchView components={components} onSelect={setSelectedComponent} />
              )}

              {currentView === View.SCANNER && (
                <Scanner onScanComplete={handleScanComplete} />
              )}

              {currentView === View.PATTERNS && (
                <PatternManager />
              )}
            </>
          )}
        </div>
      </main>

      {/* AI Chat Drawer */}
      {chatOpen && (
        <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-white shadow-2xl z-50 flex flex-col border-l border-slate-200 transform transition-transform duration-300 ease-in-out">
          <div className="h-16 border-b border-slate-100 flex items-center justify-between px-6 bg-slate-50">
            <div className="flex items-center space-x-2">
              <Bot className="text-blue-600" size={20} />
              <h3 className="font-bold text-slate-800">Dahb AI Assistant</h3>
            </div>
            <button onClick={() => setChatOpen(false)} className="text-slate-400 hover:text-slate-600">
              <X size={20} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
             {messages.map((msg, idx) => (
               <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                 <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                   msg.role === 'user' 
                   ? 'bg-blue-600 text-white rounded-tr-none' 
                   : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
                 }`}>
                    {msg.text.split('\n').map((line, i) => (
                      <p key={i} className={i > 0 ? 'mt-2' : ''}>{line}</p>
                    ))}
                 </div>
               </div>
             ))}
             {isTyping && (
               <div className="flex justify-start">
                  <div className="bg-white rounded-2xl px-4 py-3 border border-slate-100 rounded-tl-none flex space-x-1">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></div>
                  </div>
               </div>
             )}
          </div>

          <div className="p-4 border-t border-slate-100 bg-white">
             <div className="flex items-center bg-slate-100 rounded-full px-4 py-2 focus-within:ring-2 focus-within:ring-blue-500 focus-within:bg-white transition-all">
               <input 
                 type="text"
                 value={chatInput}
                 onChange={(e) => setChatInput(e.target.value)}
                 onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                 placeholder="Ask about tables, params..." 
                 className="flex-1 bg-transparent border-none focus:ring-0 text-sm outline-none"
               />
               <button 
                 onClick={handleSendMessage}
                 disabled={!chatInput.trim() || isTyping}
                 className="ml-2 text-blue-600 hover:text-blue-700 disabled:opacity-50"
               >
                 <Send size={18} />
               </button>
             </div>
             <p className="text-xs text-center text-slate-400 mt-2">
               AI responses generated by Gemini Flash 2.5
             </p>
          </div>
        </div>
      )}

    </div>
  );
};

// --- Sub-Components ---

const NavItem = ({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 mb-1 ${
      active 
      ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
    }`}
  >
    {icon}
    <span className="font-medium text-sm">{label}</span>
  </button>
);

const Badge = ({ active, text }: { active: boolean, text: string }) => (
  <span className={`text-xs font-bold px-2 py-1 rounded ${
    active 
    ? 'bg-emerald-100 text-emerald-700' 
    : 'bg-slate-100 text-slate-400 line-through decoration-slate-400'
  }`}>
    {text}
  </span>
);

interface ComponentsViewProps {
    components: OracleComponent[];
    onSelect: (c: OracleComponent) => void;
}

const ComponentsView = ({ components, onSelect }: ComponentsViewProps) => {
  const [filter, setFilter] = useState('');

  const filtered = components.filter(c => 
    c.name.toLowerCase().includes(filter.toLowerCase()) || 
    c.id.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Component Library</h1>
          <p className="text-slate-500 mt-1">Manage and view Oracle ERP components.</p>
        </div>
        <input 
          type="text" 
          placeholder="Filter components..." 
          className="border border-slate-200 rounded-lg px-4 py-2 text-sm w-full sm:w-64 focus:outline-none focus:border-blue-500"
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filtered.map(comp => (
          <div 
            key={comp.id} 
            onClick={() => onSelect(comp)}
            className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-lg transition-all cursor-pointer group hover:-translate-y-1"
          >
             <div className="flex justify-between items-start mb-4">
               <div className="flex items-center space-x-3">
                 <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-700 font-bold group-hover:bg-blue-600 group-hover:text-white transition-colors">
                   {comp.id.substring(0, 2)}
                 </div>
                 <div>
                   <h3 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{comp.id}</h3>
                   <p className="text-xs text-slate-500 truncate max-w-[150px]">{comp.name}</p>
                 </div>
               </div>
               <ArrowUpRight size={16} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
             </div>
             
             {comp.summary && (
                <div className="mb-3 text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-100 italic line-clamp-2">
                    {comp.summary}
                </div>
             )}
             
             <div className="space-y-3">
                <div className="flex justify-between text-sm border-b border-slate-50 pb-2">
                   <span className="text-slate-500">CUF Params</span>
                   <span className="font-semibold text-slate-700">{comp.cufParams.length}</span>
                </div>
                <div className="flex justify-between text-sm border-b border-slate-50 pb-2">
                   <span className="text-slate-500">Tables</span>
                   <span className="font-semibold text-slate-700">{comp.oracleTables.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                   <span className="text-slate-500">Integrations</span>
                   <span className="font-semibold text-slate-700">{comp.oicsIntegrations.length}</span>
                </div>
             </div>

             <div className="mt-5 flex gap-2 pt-4 border-t border-slate-100">
                 <StatusDot active={comp.documents[DocType.SFD]?.uploaded} label="SFD" />
                 <StatusDot active={comp.documents[DocType.STD]?.uploaded} label="STD" />
                 <StatusDot active={comp.documents[DocType.SETUP]?.uploaded} label="SET" />
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const StatusDot = ({ active, label }: { active: boolean, label: string }) => (
  <div className={`flex items-center space-x-1 px-2 py-1 rounded text-[10px] font-bold border ${
    active 
    ? 'bg-emerald-50 border-emerald-100 text-emerald-600' 
    : 'bg-red-50 border-red-100 text-red-400'
  }`}>
    <div className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-red-400'}`}></div>
    <span>{label}</span>
  </div>
);

interface AdvancedSearchProps {
    components: OracleComponent[];
    onSelect: (c: OracleComponent) => void;
}

const AdvancedSearchView = ({ components, onSelect }: AdvancedSearchProps) => {
  const [results, setResults] = useState<OracleComponent[]>([]);
  const [formData, setFormData] = useState({
    param: '',
    table: '',
    oics: ''
  });

  useEffect(() => {
    const { param, table, oics } = formData;
    if (!param && !table && !oics) {
      setResults([]);
      return;
    }

    const res = components.filter(c => {
      const matchParam = param ? c.cufParams.some(p => p.param.toLowerCase().includes(param.toLowerCase())) : true;
      const matchTable = table ? c.oracleTables.some(t => t.toLowerCase().includes(table.toLowerCase())) : true;
      const matchOics = oics ? c.oicsIntegrations.some(i => i.toLowerCase().includes(oics.toLowerCase())) : true;
      return matchParam && matchTable && matchOics;
    });
    setResults(res);
  }, [formData, components]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({...formData, [e.target.name]: e.target.value});
  };

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-slate-800">Deep Search</h1>
        <p className="text-slate-500 mt-2">Find components by technical details extracted from documents.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">CUF Parameter</label>
              <div className="relative">
                <Settings className="absolute left-3 top-2.5 text-slate-400" size={16} />
                <input 
                  name="param" 
                  value={formData.param} 
                  onChange={handleInput}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  placeholder="e.g. AP_AUTO_VALIDATE" 
                />
              </div>
           </div>
           <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Oracle Table</label>
              <div className="relative">
                <Database className="absolute left-3 top-2.5 text-slate-400" size={16} />
                <input 
                  name="table" 
                  value={formData.table}
                  onChange={handleInput}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  placeholder="e.g. AP_INVOICES" 
                />
              </div>
           </div>
           <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">OICS Integration</label>
              <div className="relative">
                <Network className="absolute left-3 top-2.5 text-slate-400" size={16} />
                <input 
                  name="oics" 
                  value={formData.oics}
                  onChange={handleInput}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  placeholder="e.g. OICS_GL_IMPORT" 
                />
              </div>
           </div>
        </div>
      </div>

      <div className="space-y-4">
        {results.map(c => (
          <div key={c.id} className="bg-white border border-slate-200 rounded-lg p-4 hover:border-blue-400 transition-colors flex justify-between items-center">
             <div>
                <h4 className="font-bold text-slate-800 text-lg">{c.id} <span className="font-normal text-slate-500 text-sm ml-2">{c.name}</span></h4>
                <div className="flex gap-2 mt-2">
                   {c.cufParams.length > 0 && <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded">Has CUF Params</span>}
                   {c.oracleTables.length > 0 && <span className="text-xs bg-emerald-50 text-emerald-600 px-2 py-1 rounded">{c.oracleTables.length} Tables Found</span>}
                </div>
             </div>
             <button 
               onClick={() => onSelect(c)}
               className="text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg text-sm font-medium"
             >
               View Details
             </button>
          </div>
        ))}
        {results.length === 0 && (formData.param || formData.table || formData.oics) && (
          <div className="text-center py-12 text-slate-400">
             <Search size={48} className="mx-auto mb-4 opacity-50" />
             <p>No components found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Icons needed for Search View
import { Database } from 'lucide-react';

export default App;
