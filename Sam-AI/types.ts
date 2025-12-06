

export interface User {
  username: string;
  name: string;
  storeConnected?: boolean;
  storeUrl?: string;
}

export interface ProductInput {
  productName: string;
  brand: string;
  category: string;
  features: string;
  channel: string;
  tone: string;
  language: string;
  imageBase64?: string | null;
  imageMimeType?: string | null;
  // New Data Enrichment Fields
  customerReviews?: string;
  targetKeywords?: string;
}

export interface GeneratedContent {
  overview: string;
  title: string;
  bullets: string[];
  longDescription: string;
  seoTitle: string;
  seoMetaDescription: string;
  seoKeywords: string;
  socialCopy: string;
}

export enum ContentTab {
  OVERVIEW = 'Overview',
  TITLE = 'Title',
  BULLETS = 'Bullets',
  LONG_DESCRIPTION = 'Long Description',
  SEO = 'SEO',
  SOCIAL = 'Social Copy',
}

export const CATEGORIES = [
  'Electronics',
  'Fashion & Apparel',
  'Home & Garden',
  'Beauty & Personal Care',
  'Toys & Games',
  'Sports & Outdoors',
  'Automotive',
  'Books',
  'Health & Wellness',
  'Pet Supplies'
];

export const CHANNELS = [
  'Amazon',
  'Shopify',
  'Etsy',
  'Instagram Shop',
  'Google Shopping',
  'Walmart Marketplace',
  'Email Newsletter',
  'Landing Page'
];

export const TONES = [
  'Professional',
  'Persuasive',
  'Witty',
  'Luxury',
  'Friendly',
  'Technical',
  'Urgent',
  'Storytelling'
];

export const LANGUAGES = [
  'English (US)',
  'English (UK)',
  'Spanish',
  'French',
  'German',
  'Italian',
  'Portuguese',
  'Dutch',
  'Japanese',
  'Chinese (Simplified)'
];

// --- Bulk Upload Types ---

export type BulkStatus = 'idle' | 'pending' | 'success' | 'error';

export interface BulkItem {
  id: string;
  input: ProductInput;
  status: BulkStatus;
  result?: GeneratedContent;
  error?: string;
}

// --- Catalog/History Types ---

export interface HistoryItem {
  id: string;
  timestamp: number;
  input: ProductInput;
  result: GeneratedContent;
  publishedUrl?: string;
  publishedAt?: number;
}

// --- Policy Types ---

export interface PolicyFile {
  name: string;
  size: number;
  type: 'general' | 'platform' | 'blocked' | 'custom';
  contentPreview: string;
}