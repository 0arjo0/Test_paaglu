

import React, { useState, useMemo } from 'react';
import { HistoryItem } from '../types';
import { Button } from './ui/Button';
import { IconSearch, IconCalendar, IconTrash, IconEye, IconExternalLink, IconSamLogo, IconRefresh, IconClose, IconUploadCloud, IconCheck } from './ui/Icons';
import { ContentDetailModal } from './ContentDetailModal';
import { regenerateWithMarketDemand, saveHistoryItem, publishToPlatform } from '../services/openApiService';

interface ProductCatalogProps {
  history: HistoryItem[];
  onDelete: (id: string) => void;
  onRefresh: () => void;
  updateHistory: (id: string, updates: Partial<HistoryItem>) => Promise<void>;
}

export const ProductCatalog: React.FC<ProductCatalogProps> = ({ history, onDelete, onRefresh, updateHistory }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);
  const [regenerateItem, setRegenerateItem] = useState<HistoryItem | null>(null);
  const [marketDemand, setMarketDemand] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Bulk Selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBatchPublishing, setIsBatchPublishing] = useState(false);
  // Individual publish loading state
  const [publishingId, setPublishingId] = useState<string | null>(null);

  const filteredHistory = useMemo(() => {
    return history.filter(item => 
      item.input.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.input.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.input.category.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => b.timestamp - a.timestamp);
  }, [history, searchTerm]);

  // Derived state for pending items in the current view
  const pendingItems = useMemo(() => {
      return filteredHistory.filter(item => !item.publishedUrl);
  }, [filteredHistory]);

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
        newSet.delete(id);
    } else {
        newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleSelectAll = () => {
      if (selectedIds.size === pendingItems.length && pendingItems.length > 0) {
          setSelectedIds(new Set()); // Deselect all
      } else {
          setSelectedIds(new Set(pendingItems.map(i => i.id)));
      }
  };

  const handleIndividualPublish = async (item: HistoryItem) => {
      setPublishingId(item.id);
      try {
          const platform = item.input.channel && item.input.channel !== 'General' ? item.input.channel.toLowerCase() : 'shopify';
          const result = await publishToPlatform(platform, item.result, item.input.productName);

          if (result.success) {
              await updateHistory(item.id, { 
                  publishedUrl: result.publishedUrl, 
                  publishedAt: Date.now() 
              });
          }
      } catch (e) {
          console.error("Failed to publish", e);
          alert("Publish failed.");
      } finally {
          setPublishingId(null);
      }
  };

  const handleBatchPublish = async () => {
      if (selectedIds.size === 0) return;
      setIsBatchPublishing(true);
      
      const idsToPublish = Array.from(selectedIds);
      let successCount = 0;

      // Process in parallel
      await Promise.all(idsToPublish.map(async (id) => {
          const item = history.find(i => i.id === id);
          if (!item) return;

          try {
              // Default to 'shopify' for bulk actions or use item channel if mapped
              const platform = 'shopify'; 
              const result = await publishToPlatform(platform, item.result, item.input.productName);
              
              if (result.success) {
                  // Update parent state directly so UI reflects change immediately
                  await updateHistory(id, { 
                      publishedUrl: result.publishedUrl, 
                      publishedAt: Date.now() 
                  });
                  successCount++;
              }
          } catch (e) {
              console.error(`Failed to publish ${id}`, e);
          }
      }));

      setIsBatchPublishing(false);
      setSelectedIds(new Set()); // Clear selection
      if (successCount > 0) {
          // Optional: onRefresh is less critical now that we update state optimistically, 
          // but good for sync.
          onRefresh(); 
      }
  };

  const handleRegenerate = async () => {
    if(!regenerateItem || !marketDemand) return;
    setIsRegenerating(true);
    try {
        const newContent = await regenerateWithMarketDemand(regenerateItem.input, marketDemand);
        
        // Save as new history item
        await saveHistoryItem({
            id: `regen-${Date.now()}`,
            timestamp: Date.now(),
            input: { ...regenerateItem.input, features: regenerateItem.input.features + `\n(Optimized for: ${marketDemand})` },
            result: newContent
        });

        // Close and Refresh
        setRegenerateItem(null);
        setMarketDemand('');
        onRefresh(); // Trigger parent refresh
    } catch (e) {
        alert("Failed to regenerate content.");
    } finally {
        setIsRegenerating(false);
    }
  };

  return (
    <div className="animate-fadeIn space-y-6">
      
      {/* Regeneration Modal */}
      {regenerateItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative">
                  <button 
                    onClick={() => setRegenerateItem(null)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
                  >
                      <IconClose size={20} />
                  </button>
                  
                  <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
                          <IconRefresh size={20} />
                      </div>
                      <h3 className="text-lg font-bold text-slate-800">Market Demand Update</h3>
                  </div>

                  <p className="text-sm text-slate-500 mb-4">
                      Updating content for: <span className="font-semibold text-slate-700">{regenerateItem.input.productName}</span>
                  </p>
                  
                  <div className="space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">New Market Trend / Demand</label>
                          <textarea 
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-slate-800"
                              placeholder="e.g. 'Make it appeal to Gen-Z for Back to School season' or 'Focus on Black Friday Discounts'"
                              rows={3}
                              value={marketDemand}
                              onChange={(e) => setMarketDemand(e.target.value)}
                          />
                      </div>
                      <Button 
                        className="w-full" 
                        onClick={handleRegenerate} 
                        isLoading={isRegenerating}
                        disabled={!marketDemand.trim()}
                        // leftIcon={<IconSamLogo size={16}/>}
                      >
                          Regenerate Content
                      </Button>
                  </div>
              </div>
          </div>
      )}

      {/* Header with Search and Bulk Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
           <h2 className="text-xl font-bold text-slate-800">Product Catalog</h2>
           <p className="text-sm text-slate-500">History of all AI-generated content</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-center">
             {/* Bulk Action Controls */}
             {pendingItems.length > 0 && (
                 <div className="flex items-center gap-3 mr-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-100">
                    <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700 select-none">
                        <input 
                            type="checkbox" 
                            className="w-4 h-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500"
                            checked={selectedIds.size === pendingItems.length && pendingItems.length > 0}
                            onChange={handleSelectAll}
                        />
                        Select All Pending
                    </label>
                    
                    {selectedIds.size > 0 && (
                        <Button 
                            size="sm" 
                            isLoading={isBatchPublishing}
                            onClick={handleBatchPublish}
                            leftIcon={<IconUploadCloud size={14} />}
                            className="ml-2 animate-fadeIn"
                        >
                            Publish ({selectedIds.size})
                        </Button>
                    )}
                 </div>
             )}

             {/* Search */}
             <div className="relative w-full sm:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <IconSearch className="text-slate-400" />
                </div>
                <input
                    type="text"
                    placeholder="Search catalog..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>
      </div>

      {history.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
               <IconSamLogo className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-700 mb-1">No history yet</h3>
            <p className="text-slate-500 max-w-xs mx-auto">
               Generated content from Single or Bulk mode will automatically appear here.
            </p>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
           No products found matching "{searchTerm}"
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {filteredHistory.map((item) => {
             const isPending = !item.publishedUrl;
             const isSelected = selectedIds.has(item.id);
             const isThisPublishing = publishingId === item.id;

             return (
             <div 
                key={item.id} 
                className={`
                    bg-white rounded-xl border shadow-sm transition-all duration-200 flex flex-col overflow-hidden group relative
                    ${isSelected ? 'ring-2 ring-primary-500 border-primary-500 shadow-md' : 'border-slate-200 hover:shadow-md'}
                    ${!isPending ? 'bg-slate-50/30' : ''}
                `}
             >
                
                {/* Status Badges or Selection Checkbox */}
                <div className="absolute top-4 right-4 z-10 flex flex-col items-end gap-2">
                    {item.publishedUrl ? (
                         <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded-full border border-green-200 shadow-sm flex items-center gap-1">
                            <IconCheck size={10} strokeWidth={4} /> PUBLISHED
                        </span>
                    ) : (
                        // ONLY SHOW CHECKBOX IF NOT PUBLISHED
                        <div className="relative flex items-center bg-white rounded-md shadow-sm">
                            <input 
                                type="checkbox" 
                                className="peer h-6 w-6 cursor-pointer appearance-none rounded-md border border-slate-300 checked:bg-primary-600 checked:border-transparent transition-all"
                                checked={isSelected}
                                onChange={() => toggleSelection(item.id)}
                            />
                            <IconCheck className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                        </div>
                    )}
                </div>

                <div className="p-5 flex-1 space-y-3">
                   <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                          <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 rounded">
                             {item.input.category || 'Uncategorized'}
                          </span>
                      </div>
                   </div>

                   <div>
                      <h3 className="font-bold text-slate-800 line-clamp-1 group-hover:text-primary-600 transition-colors" title={item.input.productName}>
                        {item.input.productName}
                      </h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                          <IconCalendar size={10} />
                          {new Date(item.timestamp).toLocaleDateString()}
                          <span className="mx-1">•</span>
                          {item.input.brand}
                      </p>
                   </div>

                   <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-2">
                       <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span className={`w-2 h-2 rounded-full ${item.input.channel ? 'bg-orange-400' : 'bg-slate-300'}`}></span>
                          {item.input.channel || 'General'}
                       </div>
                       <p className="text-xs text-slate-600 line-clamp-2 font-medium italic">
                          "{item.result.title}"
                       </p>
                   </div>
                </div>

                <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center gap-2">
                   <div className="flex gap-1">
                       <button 
                          onClick={() => onDelete(item.id)}
                          className="text-slate-400 hover:text-red-500 transition-colors p-1.5 hover:bg-red-50 rounded-lg"
                          title="Delete"
                       >
                          <IconTrash size={16} />
                       </button>
                       {!item.publishedUrl && (
                         <>
                             <button 
                                onClick={() => setRegenerateItem(item)}
                                className="text-slate-400 hover:text-indigo-600 transition-colors p-1.5 hover:bg-indigo-50 rounded-lg"
                                title="Regenerate for Market Demand"
                             >
                                <IconRefresh size={16} />
                             </button>
                             <button 
                                onClick={() => handleIndividualPublish(item)}
                                className="text-slate-400 hover:text-green-600 transition-colors p-1.5 hover:bg-green-50 rounded-lg"
                                title="Publish Now"
                                disabled={isThisPublishing}
                             >
                                {isThisPublishing ? (
                                    <div className="animate-spin w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full"></div>
                                ) : (
                                    <IconUploadCloud size={16} />
                                )}
                             </button>
                         </>
                       )}
                   </div>
                   <Button 
                      size="sm" 
                      variant="outline" 
                      className="bg-white"
                      onClick={() => setSelectedItem(item)}
                      leftIcon={<IconExternalLink size={14} />}
                   >
                      View
                   </Button>
                </div>
             </div>
           )})}
        </div>
      )}

      {selectedItem && (
        <ContentDetailModal 
           isOpen={!!selectedItem}
           onClose={() => setSelectedItem(null)}
           input={selectedItem.input}
           content={selectedItem.result}
           publishedUrl={selectedItem.publishedUrl}
        />
      )}
    </div>
  );
};