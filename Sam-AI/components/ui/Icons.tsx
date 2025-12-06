import React from 'react';
import { 
  Copy, 
  RefreshCw, 
  Download, 
  Check, 
  Sparkles, 
  FileText, 
  List, 
  AlignLeft, 
  Search, 
  Share2,
  ChevronDown,
  X,
  FileJson,
  FileType,
  File,
  UploadCloud,
  Trash2,
  AlertCircle,
  Eye,
  Sheet,
  BookOpen,
  Calendar,
  ExternalLink,
  Clock,
  ShieldCheck,
  FileCode,
  Code
} from 'lucide-react';

export const IconCopy = (props: any) => <Copy size={16} {...props} />;
export const IconRefresh = (props: any) => <RefreshCw size={16} {...props} />;
export const IconDownload = (props: any) => <Download size={16} {...props} />;
export const IconCheck = (props: any) => <Check size={16} {...props} />;
export const IconSparkles = (props: any) => <Sparkles size={18} {...props} />;
export const IconOverview = (props: any) => <FileText size={16} {...props} />;
export const IconTitle = (props: any) => <FileType size={16} {...props} />;
export const IconBullets = (props: any) => <List size={16} {...props} />;
export const IconDescription = (props: any) => <AlignLeft size={16} {...props} />;
export const IconSEO = (props: any) => <Search size={16} {...props} />;
export const IconSocial = (props: any) => <Share2 size={16} {...props} />;
export const IconChevronDown = (props: any) => <ChevronDown size={16} {...props} />;
export const IconClose = (props: any) => <X size={20} {...props} />;
export const IconPDF = (props: any) => <File size={24} {...props} />;
export const IconDOCX = (props: any) => <FileText size={24} {...props} />;
export const IconCSV = (props: any) => <Sheet size={24} {...props} />;
export const IconUploadCloud = (props: any) => <UploadCloud size={32} {...props} />;
export const IconTrash = (props: any) => <Trash2 size={16} {...props} />;
export const IconAlert = (props: any) => <AlertCircle size={16} {...props} />;
export const IconEye = (props: any) => <Eye size={16} {...props} />;
export const IconFileText = (props: any) => <FileText size={16} {...props} />;
export const IconFileJson = (props: any) => <FileJson size={24} {...props} />;
export const IconHistory = (props: any) => <BookOpen size={16} {...props} />;
export const IconCalendar = (props: any) => <Calendar size={14} {...props} />;
export const IconExternalLink = (props: any) => <ExternalLink size={14} {...props} />;
export const IconSearch = (props: any) => <Search size={16} {...props} />;
export const IconClock = (props: any) => <Clock size={14} {...props} />;
export const IconShield = (props: any) => <ShieldCheck size={16} {...props} />;
export const IconFileCode = (props: any) => <FileCode size={24} {...props} />;
export const IconCode = (props: any) => <Code size={16} {...props} />;

// Brand Logo for SAM-AI
export const IconSamLogo = (props: any) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    {...props}
  >
    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
  </svg>
);