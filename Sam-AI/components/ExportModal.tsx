import React, { useState } from 'react';
import { Button } from './ui/Button';
import { IconClose, IconPDF, IconDOCX, IconCSV, IconCheck } from './ui/Icons';
import { ContentTab } from '../types';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTab: ContentTab;
}

type FileType = 'PDF' | 'DOCX' | 'CSV';

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, currentTab }) => {
  const [selectedType, setSelectedType] = useState<FileType>('DOCX');
  const [includeAll, setIncludeAll] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen) return null;

  const handleDownload = () => {
    setIsDownloading(true);
    // Simulate download delay
    setTimeout(() => {
      setIsDownloading(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden transform transition-all">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-slate-800">Export Content</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <IconClose />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          
          {/* File Type Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-700">File Format</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { type: 'PDF', icon: <IconPDF className="text-red-500 mb-2" /> },
                { type: 'DOCX', icon: <IconDOCX className="text-blue-500 mb-2" /> },
                { type: 'CSV', icon: <IconCSV className="text-green-500 mb-2" /> }
              ].map((item) => (
                <button
                  key={item.type}
                  onClick={() => setSelectedType(item.type as FileType)}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                    selectedType === item.type 
                      ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500' 
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {item.icon}
                  <span className={`text-xs font-medium ${selectedType === item.type ? 'text-primary-700' : 'text-slate-600'}`}>{item.type}</span>
                  {selectedType === item.type && (
                    <div className="absolute top-2 right-2">
                       <IconCheck className="w-3 h-3 text-primary-600" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Scope Selection */}
          <div className="space-y-3">
             <label className="text-sm font-medium text-slate-700">Include</label>
             <div className="flex flex-col space-y-2">
                <label className="flex items-center p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                  <input 
                    type="radio" 
                    name="scope" 
                    checked={includeAll} 
                    onChange={() => setIncludeAll(true)}
                    className="w-4 h-4 text-primary-600 border-slate-300 focus:ring-primary-500"
                  />
                  <span className="ml-3 text-sm text-slate-700">All Sections (Full Package)</span>
                </label>
                <label className="flex items-center p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                  <input 
                    type="radio" 
                    name="scope" 
                    checked={!includeAll} 
                    onChange={() => setIncludeAll(false)}
                    className="w-4 h-4 text-primary-600 border-slate-300 focus:ring-primary-500"
                  />
                  <span className="ml-3 text-sm text-slate-700">Current Tab Only ({currentTab})</span>
                </label>
             </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end space-x-3">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleDownload} isLoading={isDownloading}>Download File</Button>
        </div>
      </div>
    </div>
  );
};
