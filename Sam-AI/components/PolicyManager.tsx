
import React, { useState, useEffect, useRef } from 'react';
import { PolicyFile } from '../types';
import { getPolicies, uploadPolicy, deletePolicy } from '../services/openApiService';
import { Button } from './ui/Button';
import { IconShield, IconUploadCloud, IconTrash, IconFileText, IconFileCode, IconRefresh, IconCheck, IconAlert } from './ui/Icons';

export const PolicyManager: React.FC = () => {
  const [policies, setPolicies] = useState<PolicyFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [policyToDelete, setPolicyToDelete] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const data = await getPolicies();
      setPolicies(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
        const content = event.target?.result as string;
        try {
            await uploadPolicy(file.name, content);
            await fetchAll();
            // Clear input
            if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (err) {
            console.error("Failed to upload policy", err);
        } finally {
            setUploading(false);
        }
    };
    reader.readAsText(file);
  };

  const requestDelete = (e: React.MouseEvent, filename: string) => {
    e.stopPropagation(); 
    setPolicyToDelete(filename);
  };

  const confirmDelete = async () => {
    if (!policyToDelete) return;
    try {
        await deletePolicy(policyToDelete);
        await fetchAll();
    } catch (err) {
        console.error("Delete failed:", err);
    } finally {
        setPolicyToDelete(null);
    }
  };

  return (
    <div className="animate-fadeIn max-w-5xl mx-auto space-y-8 relative">
      
      {/* Delete Confirmation Modal */}
      {policyToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-slideUp border border-slate-200">
                <div className="flex items-center gap-3 text-red-600 mb-4">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                        <IconTrash size={20} />
                    </div>
                    <h3 className="font-bold text-lg">Delete Policy?</h3>
                </div>
                
                <p className="text-slate-600 mb-6 text-sm leading-relaxed">
                    Are you sure you want to delete <span className="font-semibold text-slate-800">{policyToDelete}</span>? 
                    This will stop applying these rules to future content generations.
                </p>

                <div className="flex gap-3 justify-end">
                    <Button variant="ghost" onClick={() => setPolicyToDelete(null)}>Cancel</Button>
                    <button 
                        onClick={confirmDelete}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-md shadow-red-500/20"
                    >
                        Delete Permanently
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
            <h2 className="text-2xl font-bold flex items-center gap-3 mb-2">
                <IconShield className="w-8 h-8 text-green-400" />
                Compliance & Guidelines
            </h2>
            <p className="text-slate-300 max-w-2xl text-sm leading-relaxed">
                Upload your brand guidelines, legal disclaimers, or platform-specific rules here. 
                The AI agents (Content Generator & Compliance Auditor) will strictly follow these files 
                in real-time for all future generations.
            </p>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Upload Column */}
        <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-4">Add New Policy</h3>
                <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`
                        border-2 border-dashed border-slate-300 rounded-xl p-8 
                        flex flex-col items-center justify-center text-center cursor-pointer 
                        hover:border-primary-500 hover:bg-slate-50 transition-all duration-300 group
                        ${uploading ? 'opacity-50 pointer-events-none' : ''}
                    `}
                >
                    <div className="w-12 h-12 bg-primary-50 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <IconUploadCloud className="w-6 h-6 text-primary-600" />
                    </div>
                    <p className="text-sm font-medium text-slate-700">Click to Upload</p>
                    <p className="text-xs text-slate-400 mt-1">Supports .txt, .md, .json</p>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileUpload} 
                        accept=".txt,.md,.json" 
                        className="hidden" 
                    />
                </div>
                {uploading && <p className="text-xs text-center text-primary-600 font-bold mt-2">Uploading & Indexing...</p>}
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
                <h4 className="text-sm font-bold text-blue-800 mb-2">How it works</h4>
                <ul className="text-xs text-blue-700 space-y-2 list-disc pl-4">
                    <li><strong>.txt / .md files</strong> are treated as global rules applied to all content.</li>
                    <li><strong>.json files</strong> update platform-specific rules.</li>
                    <li><strong>blocked_terms.txt</strong> updates the prohibited keyword list.</li>
                </ul>
            </div>
        </div>

        {/* List Column */}
        <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="font-bold text-slate-800">Active Policies ({policies.length})</h3>
                    <Button variant="ghost" size="sm" onClick={fetchAll} leftIcon={<IconRefresh size={14}/>}>Refresh</Button>
                </div>
                
                {loading ? (
                    <div className="p-8 text-center text-slate-400">Loading policies...</div>
                ) : policies.length === 0 ? (
                    <div className="p-12 text-center text-slate-400">No policies found. Upload one to get started.</div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {policies.map((policy) => (
                            <div key={policy.name} className="p-5 hover:bg-slate-50 transition-colors flex items-start gap-4 group">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                                    policy.name.endsWith('.json') ? 'bg-yellow-100 text-yellow-600' : 
                                    policy.name === 'blocked_terms.txt' ? 'bg-red-100 text-red-600' :
                                    'bg-indigo-100 text-indigo-600'
                                }`}>
                                    {policy.name.endsWith('.json') ? <IconFileCode size={20}/> : <IconFileText size={20}/>}
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="text-sm font-bold text-slate-800 truncate">{policy.name}</h4>
                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500">
                                            {policy.type}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 font-mono bg-slate-100 p-2 rounded truncate max-w-lg opacity-80">
                                        {policy.contentPreview.substring(0, 80)}...
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={(e) => requestDelete(e, policy.name)}
                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                        title="Delete Policy"
                                    >
                                        <IconTrash size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};
    