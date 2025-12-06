
import React from 'react';
import { Button } from './ui/Button';
import { IconAlert, IconClose } from './ui/Icons';

interface ValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason: string;
}

export const ValidationModal: React.FC<ValidationModalProps> = ({ isOpen, onClose, reason }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-slideUp border border-red-100">
        
        <div className="bg-red-50 px-6 py-4 flex items-center justify-between border-b border-red-100">
             <div className="flex items-center gap-2 text-red-700">
                 <IconAlert className="w-5 h-5" />
                 <h3 className="font-bold">Input Validation Failed</h3>
             </div>
             <button onClick={onClose} className="text-red-400 hover:text-red-700 transition-colors">
                 <IconClose size={20} />
             </button>
        </div>

        <div className="p-8 text-center">
             <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                 <IconAlert className="w-8 h-8" />
             </div>
             
             <h4 className="text-lg font-bold text-slate-800 mb-2">We couldn't process your request</h4>
             <p className="text-slate-600 leading-relaxed mb-6">
                Our AI Guardrails detected an issue with your input:
             </p>
             
             <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-medium text-slate-800 mb-8 whitespace-pre-wrap">
                "{reason}"
             </div>

             <Button onClick={onClose} className="w-full justify-center">
                 Review & Try Again
             </Button>
        </div>
      </div>
    </div>
  );
};
