

import React, { useRef, useState } from 'react';
import { IconSparkles, IconSamLogo } from './Icons';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  isLoading?: boolean;
}

export const Input: React.FC<InputProps> = ({ label, className = '', isLoading, ...props }) => {
  return (
    <div className="w-full">
      {label && <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">{label}</label>}
      <div className="relative">
        <input 
          className={`w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200 hover:border-slate-300 ${className}`}
          {...props}
        />
        {isLoading && (
            <div className="absolute inset-0 bg-white/90 backdrop-blur-[1px] z-10 rounded-lg border border-indigo-100 flex items-center px-4 cursor-wait">
                <div className="w-full space-y-2">
                   <div className="h-2 bg-slate-200 rounded-full w-3/4 animate-pulse"></div>
                </div>
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <svg className="animate-spin h-4 w-4 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export const TextArea: React.FC<TextAreaProps> = ({ label, className = '', ...props }) => {
  return (
    <div className="w-full">
      {label && <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">{label}</label>}
      <textarea 
        className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200 hover:border-slate-300 min-h-[120px] resize-y ${className}`}
        {...props}
      />
    </div>
  );
};

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: string[];
  placeholder?: string;
  isLoading?: boolean;
}

export const Select: React.FC<SelectProps> = ({ label, options, className = '', placeholder, value, isLoading, ...props }) => {
  return (
    <div className="w-full relative">
      {label && (
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 flex justify-between">
            {label}
        </label>
      )}
      <div className="relative">
        <select 
          className={`w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 appearance-none focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200 hover:border-slate-300 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-100 ${className} ${!value ? 'text-slate-400' : ''}`}
          value={value}
          {...props}
        >
          <option value="" disabled>{placeholder || "Select option"}</option>
          {options.map(opt => (
            <option key={opt} value={opt} className="text-slate-900">{opt}</option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
        </div>
        
        {/* Loading Mask Overlay */}
        {isLoading && (
            <div className="absolute inset-0 bg-white/90 backdrop-blur-[1px] z-10 rounded-lg border border-indigo-100 flex items-center px-4 cursor-wait">
                <div className="w-full space-y-2">
                   <div className="h-2 bg-slate-200 rounded-full w-1/2 animate-pulse"></div>
                </div>
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <svg className="animate-spin h-4 w-4 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

interface ImageUploadProps {
  label?: string;
  onImageSelected: (base64: string, mimeType: string) => void;
  onImageRemoved: () => void;
  currentImage: string | null;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ label, onImageSelected, onImageRemoved, currentImage }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      onImageSelected(base64String, file.type);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  return (
    <div className="w-full">
      {label && <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">{label}</label>}
      
      {!currentImage ? (
        <div 
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative group cursor-pointer
            border-2 border-dashed rounded-xl p-6
            flex flex-col items-center justify-center text-center
            transition-all duration-300 ease-in-out
            bg-slate-50 hover:bg-slate-100
            ${isDragging ? 'border-primary-500 bg-primary-50' : 'border-slate-300 hover:border-primary-400'}
          `}
        >
          <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
             <IconSamLogo className={`w-6 h-6 ${isDragging ? 'text-primary-600' : 'text-slate-400 group-hover:text-primary-500'}`} />
          </div>
          <p className="text-sm font-medium text-slate-700">Click or drag image</p>
          <p className="text-xs text-slate-400 mt-1">Supports JPG, PNG, WEBP</p>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden" 
          />
        </div>
      ) : (
        <div className="relative group rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-white p-2">
          <div className="relative w-full h-48 bg-slate-100 rounded-lg overflow-hidden">
            <img src={currentImage} alt="Product" className="w-full h-full object-contain" />
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); onImageRemoved(); }}
            className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm text-slate-600 p-1.5 rounded-full shadow-md hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
          <div className="mt-2 flex items-center justify-center gap-2 text-xs text-green-600 font-medium pb-1">
             <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
             Image Attached
          </div>
        </div>
      )}
    </div>
  );
};
