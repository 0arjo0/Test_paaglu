
import React, { useState, useEffect } from 'react';
import { GeneratedContent, ProductInput, ContentTab } from '../types';
import { Button } from './ui/Button';
import { ExportModal } from './ExportModal';
import { ManualPublishModal } from './ManualPublishModal';
import { publishToPlatform } from '../services/openApiService';
import { 
  IconCopy, 
  IconCheck, 
  IconDownload, 
  IconRefresh, 
  IconSparkles, 
  IconSamLogo,
  IconOverview, 
  IconTitle, 
  IconBullets, 
  IconDescription, 
  IconSEO, 
  IconSocial,
  IconUploadCloud,
  IconExternalLink,
  IconFileCode
} from './ui/Icons';

interface ProductContentPreviewProps {
  content: GeneratedContent;
  input: ProductInput;
  onRegenerate?: () => void;
  isLoading?: boolean;
  onPublish?: (url: string) => void;
  initialPublishedUrl?: string;
}

const TABS = [
  { id: ContentTab.OVERVIEW, icon: <IconOverview />, label: 'Overview' },
  { id: ContentTab.TITLE, icon: <IconTitle />, label: 'Title' },
  { id: ContentTab.BULLETS, icon: <IconBullets />, label: 'Bullets' },
  { id: ContentTab.LONG_DESCRIPTION, icon: <IconDescription />, label: 'Description' },
  { id: ContentTab.SEO, icon: <IconSEO />, label: 'SEO' },
  { id: ContentTab.SOCIAL, icon: <IconSocial />, label: 'Social' },
];

export const ProductContentPreview: React.FC<ProductContentPreviewProps> = ({ 
  content, 
  input, 
  onRegenerate, 
  isLoading,
  onPublish,
  initialPublishedUrl
}) => {
  const [activeTab, setActiveTab] = useState<ContentTab>(ContentTab.OVERVIEW);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Publishing State
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(initialPublishedUrl || null);

  // Sync prop changes strictly
  useEffect(() => {
    setPublishedUrl(initialPublishedUrl || null);
  }, [initialPublishedUrl]);

  // Safe accessors to prevent crashes if AI returns incomplete data
  const safeContent = {
    overview: content?.overview || "Overview not available.",
    title: content?.title || "Untitled Product",
    bullets: Array.isArray(content?.bullets) ? content.bullets : [],
    longDescription: content?.longDescription || "<p>No description generated.</p>",
    seoTitle: content?.seoTitle || "",
    seoMetaDescription: content?.seoMetaDescription || "",
    seoKeywords: content?.seoKeywords || "",
    socialCopy: content?.socialCopy || ""
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePublish = async () => {
      if (publishedUrl) return; // Prevent publish again
      setIsPublishing(true);
      try {
          const result = await publishToPlatform('shopify', content, input.productName);
          setPublishedUrl(result.publishedUrl);
          if (onPublish) onPublish(result.publishedUrl);
      } catch (e) {
          alert("Failed to publish to store. Check connection.");
      } finally {
          setIsPublishing(false);
      }
  };

  const getCurrentText = (): string => {
    if (!content) return '';
    switch (activeTab) {
        case ContentTab.TITLE: return safeContent.title;
        case ContentTab.BULLETS: return safeContent.bullets.join('\n');
        case ContentTab.LONG_DESCRIPTION: return safeContent.longDescription;
        case ContentTab.SEO: return `${safeContent.seoTitle}\n\n${safeContent.seoMetaDescription}\n\n${safeContent.seoKeywords}`;
        case ContentTab.SOCIAL: return safeContent.socialCopy;
        case ContentTab.OVERVIEW: return safeContent.overview;
        default: return '';
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case ContentTab.OVERVIEW:
        return (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-xl border border-indigo-100">
              <h3 className="text-sm font-bold text-indigo-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                <IconSamLogo className="w-4 h-4 text-indigo-600" /> 
                AI Strategy Note
              </h3>
              <p className="text-slate-700 leading-relaxed font-medium">{safeContent.overview}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Target Channel</span>
                <div className="flex items-center gap-2 mt-2">
                   <div className="w-2 h-2 rounded-full bg-orange-400"></div>
                   <p className="font-semibold text-slate-800">{input.channel || 'General Marketplace'}</p>
                </div>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tone of Voice</span>
                <div className="flex items-center gap-2 mt-2">
                   <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                   <p className="font-semibold text-slate-800">{input.tone || 'Balanced'}</p>
                </div>
              </div>
            </div>
          </div>
        );
      case ContentTab.TITLE:
        return (
          <div className="animate-fadeIn space-y-6">
            <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Optimized Title</h3>
                <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm text-xl font-medium text-slate-900 leading-snug">
                {safeContent.title}
                </div>
            </div>
            <div className="flex gap-4">
               <div className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-semibold border border-green-100">
                 {safeContent.title.length} Characters
               </div>
               <div className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold border border-blue-100">
                 High Visibility Score
               </div>
            </div>
          </div>
        );
      case ContentTab.BULLETS:
        return (
          <div className="space-y-6 animate-fadeIn">
             <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Feature Bullets</h3>
                <span className="text-xs text-slate-400">{safeContent.bullets.length} points generated</span>
             </div>
            <ul className="space-y-3">
              {safeContent.bullets.length > 0 ? (
                  safeContent.bullets.map((bullet, i) => (
                    <li key={i} className="flex gap-4 text-slate-700 bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-primary-200 transition-colors">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs font-bold mt-0.5">
                        {i + 1}
                      </span>
                      <span className="leading-relaxed">{bullet}</span>
                    </li>
                  ))
              ) : (
                  <li className="text-slate-400 italic p-4 text-center">No bullet points generated.</li>
              )}
            </ul>
          </div>
        );
      case ContentTab.LONG_DESCRIPTION:
        return (
          <div className="animate-fadeIn space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                <div 
                className="prose prose-slate prose-sm max-w-none text-slate-600 leading-relaxed p-6"
                dangerouslySetInnerHTML={{ __html: safeContent.longDescription }}
                />
            </div>
            
            <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">HTML Source</h3>
                <pre className="bg-slate-900 text-slate-300 p-4 rounded-xl text-xs overflow-x-auto font-mono leading-relaxed border border-slate-800">
                    {safeContent.longDescription}
                </pre>
            </div>
          </div>
        );
      case ContentTab.SEO:
        return (
          <div className="space-y-6 animate-fadeIn">
             <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-sm font-bold text-blue-600 mb-1 hover:underline cursor-pointer truncate">{safeContent.seoTitle}</h3>
                <div className="text-xs text-green-700 mb-2 truncate">www.yourstore.com/products/{input.productName.toLowerCase().replace(/\s+/g, '-')}</div>
                <p className="text-sm text-slate-600 line-clamp-2">{safeContent.seoMetaDescription}</p>
             </div>

             <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                         <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">SEO Title Tag</label>
                         <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-sm">{safeContent.seoTitle}</div>
                    </div>
                    <div className="space-y-2">
                         <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Meta Description</label>
                         <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-sm">{safeContent.seoMetaDescription}</div>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Target Keywords</label>
                    <div className="flex flex-wrap gap-2">
                        {safeContent.seoKeywords.split(',').map((k, i) => (
                            <span key={i} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium border border-indigo-100">
                                {k.trim()}
                            </span>
                        ))}
                    </div>
                </div>
             </div>
          </div>
        );
      case ContentTab.SOCIAL:
        return (
          <div className="animate-fadeIn flex justify-center py-4">
            <div className="w-full max-w-sm bg-white border border-slate-200 rounded-xl overflow-hidden shadow-lg">
                 <div className="p-4 border-b border-slate-100 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-pink-600 p-0.5">
                        <div className="w-full h-full bg-white rounded-full p-0.5">
                            <img src="https://picsum.photos/100/100" className="w-full h-full rounded-full object-cover" alt="Profile" />
                        </div>
                    </div>
                    <div className="flex-1">
                        <div className="font-semibold text-sm text-slate-900">SAM-AI</div>
                        <div className="text-xs text-slate-500">Sponsored</div>
                    </div>
                    <div className="text-slate-400">•••</div>
                 </div>
                 
                 {input.imageBase64 && (
                     <div className="w-full h-64 bg-slate-100 relative">
                         <img src={input.imageBase64} alt="Post" className="w-full h-full object-contain" />
                     </div>
                 )}
                 
                 <div className="p-4 space-y-3">
                     <div className="flex gap-4 text-slate-800">
                         <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
                         <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                         <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
                     </div>
                     <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                         {safeContent.socialCopy}
                     </p>
                 </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
      <ExportModal isOpen={isExportOpen} onClose={() => setIsExportOpen(false)} currentTab={activeTab} />
      
      <ManualPublishModal 
        isOpen={isManualModalOpen} 
        onClose={() => setIsManualModalOpen(false)} 
        content={content} 
        input={input} 
      />

      {/* Toolbar */}
      <div className="border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/50 backdrop-blur-sm sticky top-0 z-20">
        <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-800">Generated Content</h2>
            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full border border-green-200 uppercase tracking-wide">
                Ready
            </span>
        </div>
        <div className="flex gap-2">
            
            {/* Integration - Publish Button with Tracked State */}
            {publishedUrl ? (
                <a href={publishedUrl} target="_blank" rel="noreferrer">
                    <Button variant="outline" size="sm" className="text-green-600 border-green-200 bg-green-50" leftIcon={<IconExternalLink size={16}/>}>
                        Live in Store
                    </Button>
                </a>
            ) : (
                <>
                    <Button 
                        variant="primary" 
                        size="sm" 
                        onClick={handlePublish}
                        isLoading={isPublishing}
                        className="bg-black text-white hover:bg-slate-800"
                        leftIcon={<IconUploadCloud size={16}/>}
                    >
                        Publish to Shopify
                    </Button>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setIsManualModalOpen(true)}
                        title="View Raw Data for Manual Entry"
                        leftIcon={<IconFileCode size={16}/>}
                    >
                        Manual Copy
                    </Button>
                </>
            )}

            <div className="w-px h-8 bg-slate-200 mx-1"></div>

            <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => setIsExportOpen(true)}
                leftIcon={<IconDownload />}
            >
                Export
            </Button>
            {onRegenerate && (
              <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={onRegenerate}
                  disabled={isLoading || !!publishedUrl} 
                  leftIcon={<IconRefresh />}
              >
                  Regenerate
              </Button>
            )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="px-6 border-b border-slate-200 bg-slate-50/50">
        <div className="flex space-x-1 overflow-x-auto pb-0.5 pt-2 scrollbar-hide">
            {TABS.map((tab) => (
            <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                relative group flex items-center py-2.5 px-4 font-medium text-sm transition-all duration-200 rounded-t-lg
                ${activeTab === tab.id 
                    ? 'bg-white text-primary-600 shadow-sm border-t border-l border-r border-slate-200 translate-y-[1px]' 
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                }
                `}
            >
                <span className={`mr-2 ${activeTab === tab.id ? 'text-primary-600' : 'text-slate-400 group-hover:text-slate-500'}`}>
                {tab.icon}
                </span>
                {tab.label}
            </button>
            ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-8 bg-[#F8FAFD] custom-scrollbar relative">
         <div className="max-w-4xl mx-auto">
             {renderContent()}
         </div>
      </div>
      
      {/* Footer Actions */}
      <div className="p-4 border-t border-slate-200 bg-white flex justify-between items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
          <div className="text-xs text-slate-400 hidden sm:block">
          AI content can be inaccurate. Review before publishing.
          </div>
          <Button 
          variant="primary" 
          onClick={() => handleCopy(getCurrentText())}
          leftIcon={copied ? <IconCheck className="w-4 h-4"/> : <IconCopy className="w-4 h-4" />}
          className={`${copied ? '!bg-green-600 !from-green-600 !to-green-500' : ''}`}
          >
              {copied ? 'Copied to Clipboard!' : 'Copy Content'}
          </Button>
      </div>
    </div>
  );
};
