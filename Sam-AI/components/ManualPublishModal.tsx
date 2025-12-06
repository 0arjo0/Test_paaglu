
import React, { useState } from 'react';
import { GeneratedContent, ProductInput } from '../types';
import { Button } from './ui/Button';
import { IconClose, IconCopy, IconCheck, IconCode } from './ui/Icons';

interface ManualPublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: GeneratedContent;
  input: ProductInput;
}

export const ManualPublishModal: React.FC<ManualPublishModalProps> = ({ isOpen, onClose, content, input }) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const sections = [
    { label: "Product Title", value: content.title, id: "title" },
    { label: "HTML Description", value: content.longDescription, id: "html", monospace: true },
    { label: "SEO Title", value: content.seoTitle, id: "seoTitle" },
    { label: "SEO Description", value: content.seoMetaDescription, id: "seoDesc" },
    { label: "Tags / Keywords", value: content.seoKeywords, id: "tags" },
  ];

  const jsonPayload = JSON.stringify({
      title: content.title,
      body_html: content.longDescription,
      vendor: input.brand,
      product_type: input.category,
      tags: content.seoKeywords,
      metafields_global_title_tag: content.seoTitle,
      metafields_global_description_tag: content.seoMetaDescription
  }, null, 2);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-slideUp">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
            <div>
                <h3 className="text-lg font-bold text-slate-800">Manual Publish Data</h3>
                <p className="text-xs text-slate-500">Copy these fields into your e-commerce platform (Shopify, WooCommerce, etc.)</p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                <IconClose size={24} />
            </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Quick Copy Fields */}
            <div className="grid gap-6">
                {sections.map((section) => (
                    <div key={section.id} className="space-y-2">
                        <div className="flex justify-between items-end">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{section.label}</label>
                            <button 
                                onClick={() => handleCopy(section.value, section.id)}
                                className={`text-xs flex items-center gap-1 transition-colors ${copiedField === section.id ? 'text-green-600 font-bold' : 'text-primary-600 hover:text-primary-700'}`}
                            >
                                {copiedField === section.id ? <><IconCheck size={12}/> Copied</> : <><IconCopy size={12}/> Copy</>}
                            </button>
                        </div>
                        <div className="relative group">
                            <textarea 
                                readOnly
                                className={`w-full p-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all resize-none ${section.monospace ? 'font-mono text-xs' : ''}`}
                                rows={section.id === 'html' ? 6 : 2}
                                value={section.value}
                                onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                            />
                        </div>
                    </div>
                ))}
            </div>

            {/* JSON Payload for Devs */}
            <div className="border-t border-slate-200 pt-6">
                 <div className="flex justify-between items-center mb-3">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                        <IconCode size={14} /> Full JSON Payload
                    </label>
                    <button 
                        onClick={() => handleCopy(jsonPayload, 'json')}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${copiedField === 'json' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-slate-200 text-slate-600 hover:border-primary-300'}`}
                    >
                         {copiedField === 'json' ? <IconCheck size={14}/> : <IconCopy size={14}/>}
                         {copiedField === 'json' ? 'Copied JSON' : 'Copy JSON'}
                    </button>
                 </div>
                 <pre className="bg-slate-900 text-slate-300 p-4 rounded-xl text-xs overflow-x-auto font-mono leading-relaxed border border-slate-800">
                    {jsonPayload}
                 </pre>
            </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-white flex justify-end">
            <Button onClick={onClose}>Done</Button>
        </div>

      </div>
    </div>
  );
};
