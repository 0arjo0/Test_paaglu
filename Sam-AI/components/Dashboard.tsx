

import React, { useState, useEffect } from 'react';
import { IconSparkles, IconUploadCloud, IconFileText, IconHistory, IconAlert, IconShield, IconClose, IconSamLogo } from './ui/Icons';
import { SingleProductMode } from './SingleProductMode';
import { BulkProductMode } from './BulkProductMode';
import { ProductCatalog } from './ProductCatalog';
import { PolicyManager } from './PolicyManager';
import { HistoryItem, User } from '../types';
import { checkServerHealth, getHistory, saveHistoryItem, deleteHistoryItem, isMockMode, updateHistoryItem } from '../services/openApiService';

interface DashboardProps {
    user: User;
    onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [mode, setMode] = useState<'single' | 'bulk' | 'catalog' | 'policy'>('single');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isBackendOnline, setIsBackendOnline] = useState<boolean>(false);
  const [isMock, setIsMock] = useState<boolean>(false);

  useEffect(() => {
    const checkStatus = async () => {
        const isOnline = await checkServerHealth();
        setIsBackendOnline(isOnline);
        setIsMock(isMockMode());
    };
    checkStatus();
    
    const fetchHistory = async () => {
        try {
            const data = await getHistory();
            setHistory(data);
        } catch (e) {
            console.error("Failed to load history", e);
        }
    };
    fetchHistory();

    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const addToHistory = async (item: HistoryItem) => {
    setHistory(prev => [item, ...prev]);
    await saveHistoryItem(item);
  };

  const updateHistory = async (id: string, updates: Partial<HistoryItem>) => {
    setHistory(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
    await updateHistoryItem(id, updates);
  };

  const removeFromHistory = async (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
    await deleteHistoryItem(id);
  };

  const refreshHistory = async () => {
      const data = await getHistory();
      setHistory(data);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFD] text-slate-900 pb-12 font-sans selection:bg-primary-100 selection:text-primary-700">
      
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary-500/20 ring-4 ring-white">
                <IconSamLogo size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                SAM-AI
              </h1>
              <div className="flex items-center gap-2">
                <p className="text-xs text-slate-500 font-medium">Where Business Meets Intelligence</p>
                <span className="text-slate-300">•</span>
                <div className="flex items-center gap-1">
                    <span className={`block w-2 h-2 rounded-full ${isBackendOnline ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-yellow-500'}`}></span>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                        {isBackendOnline ? 'Active Subscription' : 'Server Offline'}
                    </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Main Tab Switcher */}
          <div className="hidden md:flex bg-slate-100 p-1 rounded-xl border border-slate-200">
             <button onClick={() => setMode('single')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${mode === 'single' ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}>
                <IconFileText size={16} /> Single Product
             </button>
             <button onClick={() => setMode('bulk')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${mode === 'bulk' ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}>
                <IconUploadCloud size={16} /> Bulk Upload
             </button>
             <button onClick={() => setMode('catalog')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${mode === 'catalog' ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}>
                <IconHistory size={16} /> Catalog
             </button>
             <button onClick={() => setMode('policy')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${mode === 'policy' ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}>
                <IconShield size={16} /> Policies
             </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-800">{user.name}</p>
                <button onClick={onLogout} className="text-xs text-slate-400 hover:text-red-500 transition-colors">Sign Out</button>
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary-500 to-indigo-500 border-2 border-white shadow-md flex items-center justify-center text-white font-bold">
                {user.name.charAt(0)}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
         {/* Simulation Banner */}
         {isMock && (
            <div className="mb-8 p-3 bg-yellow-50 border border-yellow-200 rounded-xl flex items-center gap-3 text-yellow-800 shadow-sm">
                <IconAlert className="w-5 h-5 shrink-0" />
                <div className="flex-1 flex justify-between items-center">
                    <div>
                        <h3 className="text-sm font-bold">Simulation Mode Active</h3>
                        <p className="text-xs mt-0.5 text-yellow-700">Backend offline. Using browser storage to simulate full features.</p>
                    </div>
                </div>
            </div>
         )}
      
         {mode === 'single' && <SingleProductMode user={user} addToHistory={addToHistory} updateHistory={updateHistory} />}
         {mode === 'bulk' && <BulkProductMode addToHistory={addToHistory} />}
         {mode === 'catalog' && <ProductCatalog history={history} onDelete={removeFromHistory} onRefresh={refreshHistory} updateHistory={updateHistory} />}
         {mode === 'policy' && <PolicyManager />}
      </main>
    </div>
  );
};