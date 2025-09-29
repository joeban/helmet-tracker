/**
 * Amazon ASIN Discovery and Management System
 * Multiple strategies to find and verify real Amazon product links
 */

import { Helmet } from '@/types/helmet';

export interface ASINCandidate {
  asin: string;
  url: string;
  title: string;
  price?: string;
  confidence: number; // 0-1 confidence score
  source: 'manual' | 'api' | 'user_submitted' | 'automated';
  verified: boolean;
  lastChecked: string;
}

export interface ASINDiscoveryResult {
  helmet: Helmet;
  candidates: ASINCandidate[];
  bestMatch?: ASINCandidate;
  searchQueries: string[];
}

// ASIN validation regex
export const ASIN_REGEX = /^[A-Z0-9]{10}$/;

/**
 * Generate search queries for a helmet
 */
export function generateSearchQueries(helmet: Helmet): string[] {
  const queries = [
    // Exact brand + model
    `${helmet.brand} ${helmet.name} helmet`,
    `${helmet.brand} ${helmet.name} bike helmet`,
    `${helmet.brand} ${helmet.name} bicycle helmet`,

    // Variations with category
    `${helmet.brand} ${helmet.name} ${helmet.category.toLowerCase()} helmet`,

    // Brand + model only (less specific)
    `${helmet.brand} ${helmet.name}`,

    // Alternative formats
    `${helmet.brand} ${helmet.name.replace(/\s+/g, '')} helmet`, // No spaces
    `${helmet.name} ${helmet.brand} helmet`, // Reversed order
  ];

  // Remove duplicates and return
  return [...new Set(queries)];
}

/**
 * Validate ASIN format
 */
export function isValidASIN(asin: string): boolean {
  return ASIN_REGEX.test(asin);
}

/**
 * Extract ASIN from Amazon URL
 */
export function extractASINFromURL(url: string): string | null {
  const patterns = [
    /\/dp\/([A-Z0-9]{10})/,
    /\/gp\/product\/([A-Z0-9]{10})/,
    /\/product\/([A-Z0-9]{10})/,
    /asin=([A-Z0-9]{10})/i,
    /\/([A-Z0-9]{10})(?:\/|\?|$)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && isValidASIN(match[1])) {
      return match[1];
    }
  }

  return null;
}

/**
 * Build Amazon URL from ASIN
 */
export function buildAmazonURL(asin: string, affiliateTag?: string): string {
  const tag = affiliateTag || process.env.NEXT_PUBLIC_AMAZON_AFFILIATE_TAG || 'helmetscore-20';
  return `https://amazon.com/dp/${asin}?tag=${tag}`;
}

/**
 * Calculate match confidence based on title similarity
 */
export function calculateMatchConfidence(helmet: Helmet, productTitle: string): number {
  const helmetTitle = `${helmet.brand} ${helmet.name}`.toLowerCase();
  const searchTitle = productTitle.toLowerCase();

  let confidence = 0;

  // Brand match (required)
  if (!searchTitle.includes(helmet.brand.toLowerCase())) {
    return 0;
  }
  confidence += 0.3;

  // Model name match
  const nameWords = helmet.name.toLowerCase().split(/\s+/);
  const matchedWords = nameWords.filter(word =>
    word.length > 2 && searchTitle.includes(word)
  );
  confidence += (matchedWords.length / nameWords.length) * 0.4;

  // Helmet keyword
  if (searchTitle.includes('helmet')) {
    confidence += 0.2;
  }

  // Category match
  if (searchTitle.includes(helmet.category.toLowerCase())) {
    confidence += 0.1;
  }

  return Math.min(confidence, 1);
}

/**
 * ASIN Discovery Manager
 */
export class ASINDiscoveryManager {
  private static instance: ASINDiscoveryManager;
  private asinDatabase: Map<number, ASINCandidate[]> = new Map();

  static getInstance(): ASINDiscoveryManager {
    if (!ASINDiscoveryManager.instance) {
      ASINDiscoveryManager.instance = new ASINDiscoveryManager();
    }
    return ASINDiscoveryManager.instance;
  }

  /**
   * Load ASIN database from localStorage
   */
  loadDatabase(): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem('helmet_asin_database');
      if (stored) {
        const data = JSON.parse(stored);
        this.asinDatabase = new Map(data.entries || []);
      }
    } catch (error) {
      console.warn('Failed to load ASIN database:', error);
    }
  }

  /**
   * Save ASIN database to localStorage
   */
  saveDatabase(): void {
    if (typeof window === 'undefined') return;

    try {
      const data = {
        entries: Array.from(this.asinDatabase.entries()),
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem('helmet_asin_database', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save ASIN database:', error);
    }
  }

  /**
   * Add ASIN candidate for a helmet
   */
  addASINCandidate(helmetId: number, candidate: ASINCandidate): void {
    if (!this.asinDatabase.has(helmetId)) {
      this.asinDatabase.set(helmetId, []);
    }

    const candidates = this.asinDatabase.get(helmetId)!;

    // Check if ASIN already exists
    const existingIndex = candidates.findIndex(c => c.asin === candidate.asin);
    if (existingIndex >= 0) {
      // Update existing candidate
      candidates[existingIndex] = { ...candidates[existingIndex], ...candidate };
    } else {
      // Add new candidate
      candidates.push(candidate);
    }

    // Sort by confidence
    candidates.sort((a, b) => b.confidence - a.confidence);

    this.saveDatabase();
  }

  /**
   * Get ASIN candidates for a helmet
   */
  getASINs(helmetId: number): ASINCandidate[] {
    return this.asinDatabase.get(helmetId) || [];
  }

  /**
   * Get best ASIN for a helmet
   */
  getBestASIN(helmetId: number): ASINCandidate | null {
    const candidates = this.getASINs(helmetId);
    const verified = candidates.filter(c => c.verified);

    if (verified.length > 0) {
      return verified[0]; // Highest confidence verified ASIN
    }

    const highConfidence = candidates.filter(c => c.confidence >= 0.8);
    return highConfidence.length > 0 ? highConfidence[0] : null;
  }

  /**
   * Mark ASIN as verified
   */
  verifyASIN(helmetId: number, asin: string, verified: boolean = true): void {
    const candidates = this.asinDatabase.get(helmetId);
    if (!candidates) return;

    const candidate = candidates.find(c => c.asin === asin);
    if (candidate) {
      candidate.verified = verified;
      candidate.lastChecked = new Date().toISOString();
      this.saveDatabase();
    }
  }

  /**
   * Submit user-found ASIN
   */
  submitUserASIN(helmetId: number, asin: string, amazonUrl: string, productTitle: string): boolean {
    if (!isValidASIN(asin)) {
      return false;
    }

    const candidate: ASINCandidate = {
      asin,
      url: amazonUrl,
      title: productTitle,
      confidence: 0.9, // High confidence for user submissions
      source: 'user_submitted',
      verified: false, // Needs verification
      lastChecked: new Date().toISOString()
    };

    this.addASINCandidate(helmetId, candidate);
    return true;
  }

  /**
   * Get statistics about ASIN coverage
   */
  getStatistics(): {
    totalHelmets: number;
    helmetsWithASINs: number;
    verifiedASINs: number;
    coveragePercentage: number;
  } {
    const totalHelmets = 281; // Update this based on actual count
    const helmetsWithASINs = this.asinDatabase.size;
    const verifiedASINs = Array.from(this.asinDatabase.values())
      .flat()
      .filter(c => c.verified).length;

    return {
      totalHelmets,
      helmetsWithASINs,
      verifiedASINs,
      coveragePercentage: (helmetsWithASINs / totalHelmets) * 100
    };
  }

  /**
   * Export database for backup
   */
  exportDatabase(): string {
    return JSON.stringify({
      entries: Array.from(this.asinDatabase.entries()),
      exported: new Date().toISOString(),
      version: '1.0'
    }, null, 2);
  }

  /**
   * Import database from backup
   */
  importDatabase(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      if (data.entries && Array.isArray(data.entries)) {
        this.asinDatabase = new Map(data.entries);
        this.saveDatabase();
        return true;
      }
    } catch (error) {
      console.error('Failed to import database:', error);
    }
    return false;
  }
}

/**
 * Utility functions for ASIN discovery
 */

// Generate Amazon search URL with better parameters
export function generateAmazonSearchURL(helmet: Helmet, affiliateTag?: string): string {
  const tag = affiliateTag || process.env.NEXT_PUBLIC_AMAZON_AFFILIATE_TAG || 'helmetscore-20';
  const query = encodeURIComponent(`${helmet.brand} ${helmet.name} helmet`);

  return `https://amazon.com/s?k=${query}&tag=${tag}&ref=nb_sb_noss`;
}

// Check if we have a direct ASIN for a helmet
export function getHelmetASIN(helmet: Helmet): string | null {
  const manager = ASINDiscoveryManager.getInstance();
  manager.loadDatabase();

  const bestASIN = manager.getBestASIN(helmet.id);
  return bestASIN ? bestASIN.asin : null;
}

// Get the best Amazon URL for a helmet (ASIN if available, search otherwise)
export function getBestAmazonURL(helmet: Helmet): string {
  const asin = getHelmetASIN(helmet);

  if (asin) {
    return buildAmazonURL(asin);
  }

  // Fallback to existing logic
  if (helmet.amazon_url) {
    return helmet.amazon_url;
  }

  return generateAmazonSearchURL(helmet);
}