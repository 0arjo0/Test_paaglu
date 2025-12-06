

import React, { useState, useEffect } from 'react';
import { generateProductContent, detectImageCategory } from '../services/openApiService';
import { ProductInput, GeneratedContent, CATEGORIES, CHANNELS, TONES, LANGUAGES, HistoryItem, User } from '../types';
import { Button } from './ui/Button';
import { Input, Select, TextArea, ImageUpload } from './ui/Input';
import { IconSamLogo, IconTitle, IconChevronDown } from './ui/Icons';
import { ProductContentPreview } from './ProductContentPreview';
import { ValidationModal } from './ValidationModal';
import { GenerationLoader } from './GenerationLoader';

interface SingleProductModeProps {
  user: User;
  addToHistory: (item: HistoryItem) => void;
  updateHistory?: (id: string, updates: Partial<HistoryItem>) => void;
}

export const SingleProductMode: React.FC<SingleProductModeProps> = ({ user, addToHistory, updateHistory }) => {
  const [input, setInput] = useState<ProductInput>({
    productName: '',
    brand: '',
    category: '',
    features: '',
    channel: '',
    tone: '',
    language: 'English (US)',
    imageBase64: null,
    imageMimeType: null,
    customerReviews: '',
    targetKeywords: ''
  });

  const [content, setContent] = useState<GeneratedContent | null>(null);
  const [currentHistoryId, setCurrentHistoryId] = useState<string | null>(null);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Validation & Detection State
  const [validationError, setValidationError] = useState<string | null>(null);
  const [detectingVision, setDetectingVision] = useState(false);
  const [categoryOptions, setCategoryOptions] = useState<string[]>(CATEGORIES);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // --- AUTOSAVE & RESTORE LOGIC ---
  
  // Restore draft on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem('sam_ai_draft_v1');
    if (savedDraft) {
        try {
            const parsed = JSON.parse(savedDraft);
            if (parsed.input) setInput(parsed.input);
            if (parsed.content) setContent(parsed.content);
            if (parsed.historyId) setCurrentHistoryId(parsed.historyId);
            if (parsed.publishedUrl) setPublishedUrl(parsed.publishedUrl);
            
            // Restore categories if custom ones were added
            if (parsed.input?.category && !CATEGORIES.includes(parsed.input.category)) {
                setCategoryOptions(prev => [...prev, parsed.input.category]);
            }
        } catch (e) {
            console.error("Failed to restore draft", e);
        }
    }
  }, []);

  // Enforce Demo User Constraints
  useEffect(() => {
    if (user.username === 'demo') {
      setInput(prev => ({ ...prev, channel: 'Shopify' }));
    }
  }, [user.username]);

  // Save draft on change
  useEffect(() => {
    const draft = {
        input,
        content,
        historyId: currentHistoryId,
        publishedUrl
    };
    localStorage.setItem('sam_ai_draft_v1', JSON.stringify(draft));
  }, [input, content, currentHistoryId, publishedUrl]);


  const handleInputChange = (field: keyof ProductInput, value: string) => {
    setInput(prev => ({ ...prev, [field]: value }));
  };

  const handleImageSelected = async (base64: string, mimeType: string) => {
    setInput(prev => ({ ...prev, imageBase64: base64, imageMimeType: mimeType }));
    
    // Auto-detect details from image
    setDetectingVision(true);
    try {
        const result = await detectImageCategory(base64, mimeType);
        
        if (result && result.category) {
            // Case-insensitive check to see if it already exists in options
            const existingOption = categoryOptions.find(c => c.toLowerCase() === result.category.toLowerCase());
            const finalCategory = existingOption || result.category;

            if (!existingOption) {
                // Add new category to list
                setCategoryOptions(prev => [...prev, result.category]);
            }
            
            // Update input with detected Category, Product Name AND Brand
            setInput(prev => ({ 
                ...prev, 
                category: finalCategory,
                productName: result.productName || prev.productName,
                brand: result.brand || prev.brand // Auto-update brand from vision
            }));
        }
    } catch (e) {
        console.error("Failed to detect details from image", e);
    } finally {
        setDetectingVision(false);
    }
  };

  const handleImageRemoved = () => {
    setInput(prev => ({ ...prev, imageBase64: null, imageMimeType: null }));
  };

  const handleGenerate = async () => {
    // Client-side validation removed as requested
    setError(null);
    setValidationError(null);
    setLoading(true);
    setPublishedUrl(null); // Reset published state for new content
    
    try {
      const result = await generateProductContent(input);
      setContent(result);
      
      const newId = `single-${Date.now()}`;
      setCurrentHistoryId(newId);

      // Auto-save to history
      addToHistory({
        id: newId,
        timestamp: Date.now(),
        input: { ...input }, // Clone to avoid ref issues
        result: result
      });

    } catch (err: any) {
      // Improved error detection that doesn't rely on strict prefixes
      if (err.message && err.message.includes("VALIDATION_ERROR")) {
          const reason = err.message.includes("VALIDATION_ERROR: ") 
            ? err.message.split("VALIDATION_ERROR: ")[1] 
            : err.message;
          setValidationError(reason);
      } else {
          setError(err.message || "Failed to generate content. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePublishSuccess = (url: string) => {
      setPublishedUrl(url);
      if (currentHistoryId && updateHistory) {
          updateHistory(currentHistoryId, { publishedUrl: url, publishedAt: Date.now() });
      }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fadeIn">
        
        {/* Validation Modal Popup */}
        <ValidationModal 
            isOpen={!!validationError}
            onClose={() => setValidationError(null)}
            reason={validationError || ""}
        />

        {/* Left Panel - Inputs */}
        <div className="lg:col-span-4 space-y-6">
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-6 relative overflow-hidden">
            {/* Decorative background accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-50 rounded-full blur-3xl -z-10 opacity-60 pointer-events-none"></div>

            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <span className="w-1 h-6 bg-primary-600 rounded-full"></span>
            Input Details
            </h2>
            
            <div className="space-y-5">
            <ImageUpload 
                label="Product Image (Optional)"
                currentImage={input.imageBase64}
                onImageSelected={handleImageSelected}
                onImageRemoved={handleImageRemoved}
            />

            <Input 
                label="Product Name" 
                placeholder="e.g. Wireless Noise Cancelling Headphones"
                value={input.productName}
                onChange={(e) => handleInputChange('productName', e.target.value)}
                isLoading={detectingVision}
            />
            <Input 
                label="Brand Name" 
                placeholder="e.g. SoundWave"
                value={input.brand}
                onChange={(e) => handleInputChange('brand', e.target.value)}
                isLoading={detectingVision}
            />
            
            <div className="grid grid-cols-2 gap-4">
                <Select 
                label="Category" 
                options={categoryOptions}
                placeholder="Category"
                value={input.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                isLoading={detectingVision}
                />
                <Select 
                label="Language" 
                options={LANGUAGES} 
                placeholder="Language"
                value={input.language}
                onChange={(e) => handleInputChange('language', e.target.value)}
                />
            </div>

            <TextArea 
                label="Key Features & Specs" 
                placeholder="- 40hr Battery Life&#10;- Active Noise Cancellation&#10;- Memory Foam Earcups"
                value={input.features}
                onChange={(e) => handleInputChange('features', e.target.value)}
            />

            <div className="grid grid-cols-2 gap-4">
                <Select 
                label="Channel" 
                options={CHANNELS} 
                placeholder="Target Channel"
                value={input.channel}
                onChange={(e) => handleInputChange('channel', e.target.value)}
                disabled={user.username === 'demo'}
                />
                <Select 
                label="Tone" 
                options={TONES} 
                placeholder="Tone of Voice"
                value={input.tone}
                onChange={(e) => handleInputChange('tone', e.target.value)}
                />
            </div>

            {/* Advanced Data Enrichment */}
            <div className="border-t border-slate-100 pt-4">
                <button 
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center justify-between w-full text-xs font-bold text-slate-500 uppercase tracking-wider hover:text-primary-600 transition-colors"
                >
                    <span>Advanced Data Enrichment</span>
                    <IconChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                </button>
                
                {showAdvanced && (
                    <div className="mt-4 space-y-4 animate-fadeIn">
                        <TextArea 
                            label="Customer Reviews / Feedback" 
                            placeholder="Paste raw reviews here. The AI will analyze sentiment and extract key pros/cons to include in the description."
                            className="min-h-[80px]"
                            value={input.customerReviews}
                            onChange={(e) => handleInputChange('customerReviews', e.target.value)}
                        />
                         <Input 
                            label="Mandatory SEO Keywords" 
                            placeholder="e.g. best budget headphones, 2024 tech"
                            value={input.targetKeywords}
                            onChange={(e) => handleInputChange('targetKeywords', e.target.value)}
                        />
                    </div>
                )}
            </div>

            </div>

            {error && (
            <div className="mt-6 p-4 bg-red-50 text-red-700 text-sm rounded-xl border border-red-100 flex items-start gap-3">
                <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                <span>{error}</span>
            </div>
            )}

            <div className="mt-8 pt-6 border-t border-slate-100">
            <Button 
                className="w-full h-12 text-lg shadow-primary-500/25" 
                size="lg" 
                onClick={handleGenerate} 
                isLoading={loading}
                // leftIcon={<IconSparkles size={20} />}
            >
                Generate Product Description
            </Button>
            <p className="text-center text-xs text-slate-400 mt-3">Powered by SAM-AI Engine</p>
            </div>
        </div>
        </div>

        {/* Right Panel - Output */}
        <div className="lg:col-span-8 space-y-6">
          <div className="h-[900px]">
            {loading ? (
                <GenerationLoader />
            ) : !content ? (
                // Improved Empty State
                <div className="h-full bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col items-center justify-center text-center p-8">
                  <div className="relative mb-6 group">
                      <div className="absolute inset-0 bg-primary-200 rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                      <div className="relative w-24 h-24 bg-white rounded-2xl shadow-lg border border-slate-100 flex items-center justify-center rotate-3 transition-transform group-hover:rotate-6 duration-300">
                              <IconSamLogo className="w-10 h-10 text-primary-500" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-10 h-10 bg-white rounded-lg shadow-md border border-slate-100 flex items-center justify-center -rotate-6">
                          <IconTitle className="w-5 h-5 text-indigo-500" />
                      </div>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Unlock AI-Powered Content</h3>
                  <p className="max-w-md mx-auto text-slate-500 leading-relaxed mb-8">
                      Upload a product image or enter details to generate optimized titles, descriptions, and SEO tags instantly.
                  </p>
                  <Button 
                      variant="outline" 
                      onClick={() => document.querySelector('input')?.focus()}
                      className="border-dashed"
                  >
                      Start by typing details
                  </Button>
                </div>
            ) : (
                <ProductContentPreview 
                   content={content} 
                   input={input} 
                   onRegenerate={handleGenerate}
                   isLoading={loading}
                   onPublish={handlePublishSuccess}
                   initialPublishedUrl={publishedUrl || undefined}
                />
            )}
          </div>
        </div>
    </div>
  );
};