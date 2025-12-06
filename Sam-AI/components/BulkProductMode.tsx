
import React, { useState, useRef } from 'react';
import { Button } from './ui/Button';
import { IconUploadCloud, IconSamLogo, IconSparkles, IconTrash, IconCheck, IconAlert, IconEye, IconDownload, IconClose, IconFileText, IconCSV, IconFileJson } from './ui/Icons';
import { BulkItem, ProductInput, HistoryItem } from '../types';
import { generateProductContent } from '../services/openApiService';
import { ContentDetailModal } from './ContentDetailModal';

interface BulkProductModeProps {
  addToHistory: (item: HistoryItem) => void;
}

export const BulkProductMode: React.FC<BulkProductModeProps> = ({ addToHistory }) => {
  const [items, setItems] = useState<BulkItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedItem, setSelectedItem] = useState<BulkItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse CSV Helper
  const parseCSV = (text: string) => {
    const lines = text.split('\n').filter(l => l.trim());
    if (lines.length < 2) return;
    
    // Very basic CSV parser
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    const newItems: BulkItem[] = [];
    
    for (let i = 1; i < lines.length; i++) {
        // Handle quotes loosely - this is a simple splitter
        // For a real app, use a library like PapaParse
        const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        
        const productNameIdx = headers.findIndex(h => h.includes('product') || h.includes('name'));
        const brandIdx = headers.findIndex(h => h.includes('brand'));
        const catIdx = headers.findIndex(h => h.includes('category'));
        const featIdx = headers.findIndex(h => h.includes('features') || h.includes('desc'));

        if (productNameIdx === -1) continue;

        const input: ProductInput = {
            productName: values[productNameIdx] || 'Untitled Product',
            brand: brandIdx > -1 ? values[brandIdx] : '',
            category: catIdx > -1 ? values[catIdx] : '',
            features: featIdx > -1 ? values[featIdx] : '',
            channel: 'General',
            tone: 'Professional',
            language: 'English (US)'
        };

        newItems.push({
            id: `job-${Date.now()}-${i}`,
            input,
            status: 'idle'
        });
    }
    setItems(prev => [...prev, ...newItems]);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        const text = event.target?.result as string;
        if (file.name.endsWith('.csv')) {
            parseCSV(text);
        } else if (file.name.endsWith('.json')) {
            try {
                const json = JSON.parse(text);
                const arr = Array.isArray(json) ? json : [json];
                const newItems = arr.map((obj: any, idx: number) => ({
                    id: `job-${Date.now()}-${idx}`,
                    input: {
                        productName: obj.productName || obj.name || 'Untitled',
                        brand: obj.brand || '',
                        category: obj.category || '',
                        features: obj.features || '',
                        channel: obj.channel || 'General',
                        tone: obj.tone || 'Professional',
                        language: obj.language || 'English (US)'
                    },
                    status: 'idle'
                })) as BulkItem[];
                setItems(prev => [...prev, ...newItems]);
            } catch (err) {
                alert("Invalid JSON format");
            }
        }
    };
    reader.readAsText(file);
    if(fileInputRef.current) fileInputRef.current.value = '';
  };

  const loadDemoData = () => {
    const demoItems: BulkItem[] = [
        {
            id: 'demo-1',
            status: 'idle',
            input: {
                productName: 'ErgoComfort Office Chair',
                brand: 'WorkWell',
                category: 'Furniture',
                features: 'Lumbar support, breathable mesh, adjustable armrests',
                channel: 'Amazon',
                tone: 'Professional',
                language: 'English (US)'
            }
        },
        {
            id: 'demo-2',
            status: 'idle',
            input: {
                productName: 'Organic Green Tea Extract',
                brand: 'PureLife',
                category: 'Health & Wellness',
                features: '100% organic, antioxidant rich, vegan capsules',
                channel: 'Shopify',
                tone: 'Persuasive',
                language: 'English (US)'
            }
        },
        {
            id: 'demo-3',
            status: 'idle',
            input: {
                productName: 'Smart LED Bulb',
                brand: 'Lumina',
                category: 'Electronics',
                features: 'App control, 16 million colors, voice assistant compatible',
                channel: 'Instagram Shop',
                tone: 'Witty',
                language: 'English (US)'
            }
        }
    ];
    setItems(demoItems);
  };

  const downloadTemplate = (type: 'csv' | 'json') => {
      let content = '';
      let filename = '';
      let mimeType = '';

      if (type === 'csv') {
          content = `ProductName,Brand,Category,Features\n"Example Product Name","Brand Name","Category Name","Feature 1, Feature 2, Feature 3"`;
          filename = 'template.csv';
          mimeType = 'text/csv';
      } else {
          content = JSON.stringify([{
              productName: "Example Product Name",
              brand: "Brand Name",
              category: "Category Name",
              features: "Feature 1, Feature 2, Feature 3",
              channel: "Amazon",
              tone: "Professional",
              language: "English (US)"
          }], null, 2);
          filename = 'template.json';
          mimeType = 'application/json';
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
  };

  const processQueue = async () => {
    setIsProcessing(true);
    let processedCount = 0;

    const queue = [...items];
    const newItems = [...items];

    for (let i = 0; i < queue.length; i++) {
        if (queue[i].status === 'success') {
            processedCount++;
            continue;
        }

        newItems[i].status = 'pending';
        setItems([...newItems]);

        try {
            const result = await generateProductContent(queue[i].input);
            newItems[i].status = 'success';
            newItems[i].result = result;
            
            // Auto save to history
            addToHistory({
              id: queue[i].id,
              timestamp: Date.now(),
              input: queue[i].input,
              result: result
            });

        } catch (error: any) {
            newItems[i].status = 'error';
            newItems[i].error = error.message;
        }

        processedCount++;
        setProgress((processedCount / queue.length) * 100);
        setItems([...newItems]);
        
        await new Promise(r => setTimeout(r, 1000));
    }
    setIsProcessing(false);
  };

  const clearAll = () => {
    if(items.length === 0 || confirm("Are you sure you want to clear all items?")) {
        setItems([]);
        setProgress(0);
    }
  };

  const downloadItem = (item: BulkItem) => {
    if (!item.result) return;
    const blob = new Blob([JSON.stringify(item.result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${item.input.productName.replace(/\s+/g, '_')}_content.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const downloadAll = () => {
     const completed = items.filter(i => i.status === 'success' && i.result);
     if (completed.length === 0) return;
     
     const allData = completed.map(i => ({
         input: i.input,
         output: i.result
     }));
     
     const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
     const url = URL.createObjectURL(blob);
     const a = document.createElement('a');
     a.href = url;
     a.download = `bulk_export_${Date.now()}.json`;
     document.body.appendChild(a);
     a.click();
     document.body.removeChild(a);
  };

  return (
    <div className="animate-fadeIn space-y-8 relative">
        {/* Use Reusable Modal */}
        {selectedItem && selectedItem.result && (
            <ContentDetailModal 
               isOpen={!!selectedItem}
               onClose={() => setSelectedItem(null)}
               input={selectedItem.input}
               content={selectedItem.result}
            />
        )}

        {/* Upload Section */}
        {items.length === 0 ? (
             <div className="space-y-6">
                 <div className="flex justify-center gap-4">
                     <Button variant="secondary" size="sm" onClick={() => downloadTemplate('csv')} leftIcon={<IconCSV className="w-4 h-4"/>}>
                        Download CSV Template
                     </Button>
                     <Button variant="secondary" size="sm" onClick={() => downloadTemplate('json')} leftIcon={<IconFileJson className="w-4 h-4"/>}>
                        Download JSON Template
                     </Button>
                 </div>
                 
                 <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-white border-2 border-dashed border-slate-300 rounded-2xl p-12 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary-500 hover:bg-slate-50 transition-all duration-300 group shadow-sm hover:shadow-md"
                 >
                     <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                         <IconUploadCloud className="w-10 h-10 text-primary-600" />
                     </div>
                     <h3 className="text-xl font-bold text-slate-800 mb-2">Upload CSV or JSON</h3>
                     <p className="text-slate-500 max-w-sm mx-auto mb-6">
                        Drag and drop your file here. Supports bulk product details including name, brand, features, and category.
                     </p>
                     <Button variant="outline">Select File</Button>
                     <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileUpload} 
                        accept=".csv,.json" 
                        className="hidden" 
                     />
                 </div>

                 <div className="flex justify-center">
                    <button 
                        onClick={loadDemoData}
                        className="text-sm text-primary-600 hover:text-primary-700 font-medium hover:underline flex items-center gap-1"
                    >
                        <IconSamLogo className="w-4 h-4" /> No file? Load demo data to test
                    </button>
                 </div>
             </div>
        ) : (
            <>
                {/* Control Bar */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4 sticky top-24 z-10">
                     <div className="flex items-center gap-4 w-full sm:w-auto">
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-800">{items.length} Items Loaded</span>
                            <span className="text-xs text-slate-500">{items.filter(i => i.status === 'success').length} Completed</span>
                        </div>
                        {isProcessing && (
                            <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-primary-600 transition-all duration-500" style={{ width: `${progress}%` }}></div>
                            </div>
                        )}
                     </div>
                     <div className="flex gap-2 w-full sm:w-auto justify-end flex-wrap">
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileUpload} 
                            accept=".csv,.json" 
                            className="hidden" 
                        />
                        <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()}>Add More</Button>
                        <Button variant="outline" size="sm" onClick={clearAll} disabled={isProcessing}>
                            <IconTrash className="w-4 h-4 text-red-500 mr-2" /> Clear
                        </Button>
                        <Button 
                            onClick={processQueue} 
                            disabled={isProcessing || items.every(i => i.status === 'success')}
                            isLoading={isProcessing}
                            leftIcon={<IconSamLogo className="w-4 h-4" />}
                        >
                            {isProcessing ? 'Processing...' : 'Generate All'}
                        </Button>
                        {items.some(i => i.status === 'success') && (
                             <Button variant="secondary" size="sm" onClick={downloadAll}>
                                <IconDownload className="w-4 h-4 mr-2" /> Download All
                             </Button>
                        )}
                     </div>
                </div>

                {/* Grid View */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {items.map((item) => (
                        <div key={item.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col overflow-hidden group">
                            <div className="p-5 flex-1">
                                <div className="flex justify-between items-start mb-3">
                                    <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 rounded">
                                        {item.input.category || 'Product'}
                                    </span>
                                    {item.status === 'success' && <IconCheck className="w-5 h-5 text-green-500" />}
                                    {item.status === 'error' && <IconAlert className="w-5 h-5 text-red-500" />}
                                    {item.status === 'pending' && <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>}
                                </div>
                                <h3 className="font-bold text-slate-800 line-clamp-2 mb-1" title={item.input.productName}>
                                    {item.input.productName}
                                </h3>
                                <p className="text-xs text-slate-500 mb-4">{item.input.brand}</p>
                                
                                {item.result ? (
                                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                        <p className="text-xs text-slate-600 line-clamp-3 italic">
                                            "{item.result.title}"
                                        </p>
                                    </div>
                                ) : (
                                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 h-20 flex items-center justify-center text-xs text-slate-400">
                                        {item.status === 'error' ? 'Failed to generate' : 'Waiting to process...'}
                                    </div>
                                )}
                            </div>
                            
                            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center">
                                <span className="text-xs font-medium text-slate-500">
                                    {item.status === 'success' ? 'Generated' : item.status === 'pending' ? 'Generating...' : 'Pending'}
                                </span>
                                <div className="flex gap-2">
                                    {item.status === 'success' && (
                                      <>
                                        <button 
                                            onClick={() => setSelectedItem(item)}
                                            className="p-1.5 text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold px-3 uppercase tracking-wide border border-primary-200 shadow-sm"
                                            title="View Details"
                                        >
                                            <IconEye size={14} /> View
                                        </button>
                                        <button 
                                            onClick={() => downloadItem(item)}
                                            className="p-1.5 text-slate-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" 
                                            title="Download JSON"
                                        >
                                            <IconDownload size={16} />
                                        </button>
                                      </>
                                    )}
                                    <button 
                                        onClick={() => setItems(prev => prev.filter(i => i.id !== item.id))}
                                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <IconClose size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </>
        )}
    </div>
  );
};
