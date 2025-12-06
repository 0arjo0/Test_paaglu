

import React from 'react';
import { ProductInput, GeneratedContent } from '../types';
import { ProductContentPreview } from './ProductContentPreview';
import { IconClose } from './ui/Icons';

interface ContentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  input: ProductInput;
  content: GeneratedContent;
  publishedUrl?: string;
}

export const ContentDetailModal: React.FC<ContentDetailModalProps> = ({ 
  isOpen, 
  onClose, 
  input, 
  content,
  publishedUrl
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col relative overflow-hidden animate-slideUp">
         {/* Modal Header */}
         <div className="flex justify-between items-center px-6 py-4 bg-white border-b border-slate-200 z-30">
            <div className="flex flex-col">
                <h3 className="text-lg font-bold text-slate-800">{input.productName}</h3>
                <p className="text-xs text-slate-500 flex items-center gap-1.5">
                   <span className="font-medium text-slate-700">{input.brand}</span>
                   <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                   <span>{input.category}</span>
                   {publishedUrl && (
                        <>
                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                            <span className="text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded-full border border-green-100">PUBLISHED</span>
                        </>
                   )}
                </p>
            </div>
            <button 
               onClick={onClose}
               className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500 hover:text-slate-800"
            >
               <IconClose size={24} />
            </button>
         </div>
         
         {/* Content Preview */}
         <div className="flex-1 overflow-hidden relative">
             <ProductContentPreview 
                content={content} 
                input={input} 
                initialPublishedUrl={publishedUrl}
             />
         </div>
      </div>
    </div>
  );
};