import { ScrapedASINResult } from './amazonScraper';
import { ASINDiscoveryManager } from './amazonASINDiscovery';
import { Helmet } from '@/types/helmet';

export interface ScrapingStats {
  totalProcessed: number;
  successfulScrapes: number;
  helmetsWithASINs: number;
  averageConfidence: number;
  newASINsAdded: number;
  duplicatesSkipped: number;
  lowConfidenceSkipped: number;
}

export class ScraperIntegration {
  private asinManager: ASINDiscoveryManager;

  constructor() {
    this.asinManager = ASINDiscoveryManager.getInstance();
  }

  /**
   * Import scraped ASIN results into the existing ASIN management system
   */
  importScrapedResults(
    results: ScrapedASINResult[],
    options: {
      minConfidence?: number;
      skipDuplicates?: boolean;
      autoVerifyHighConfidence?: boolean;
      highConfidenceThreshold?: number;
    } = {}
  ): ScrapingStats {
    const {
      minConfidence = 30,
      skipDuplicates = true,
      autoVerifyHighConfidence = true,
      highConfidenceThreshold = 80
    } = options;

    const stats: ScrapingStats = {
      totalProcessed: results.length,
      successfulScrapes: 0,
      helmetsWithASINs: 0,
      averageConfidence: 0,
      newASINsAdded: 0,
      duplicatesSkipped: 0,
      lowConfidenceSkipped: 0
    };

    let totalConfidence = 0;
    let confidenceCount = 0;

    results.forEach(result => {
      if (!result.success) return;

      stats.successfulScrapes++;

      if (result.asins.length === 0) return;

      stats.helmetsWithASINs++;
      totalConfidence += result.confidence;
      confidenceCount++;

      // Skip low confidence results
      if (result.confidence < minConfidence) {
        stats.lowConfidenceSkipped++;
        return;
      }

      // Process each ASIN found
      result.asins.forEach((asin, index) => {
        const existingASINs = this.asinManager.getASINs(result.helmet.id);

        // Check for duplicates
        if (skipDuplicates && existingASINs.some(existing => existing.asin === asin)) {
          stats.duplicatesSkipped++;
          return;
        }

        // Create ASIN candidate with scraped data
        const candidate = {
          asin,
          title: result.titles[index] || `${result.helmet.brand} ${result.helmet.name}`,
          price: result.prices[index] || '',
          confidence: result.confidence / 100, // Convert percentage to decimal
          url: result.productUrls[index] || `https://amazon.com/dp/${asin}`,
          imageUrl: result.imageUrls[index] || '',
          source: 'automated' as const,
          timestamp: result.scrapedAt.getTime(),
          verified: false,
          lastChecked: new Date().toISOString()
        };

        // Add the ASIN candidate
        try {
          this.asinManager.addASINCandidate(result.helmet.id, candidate);
          stats.newASINsAdded++;

          // Auto-verify high confidence ASINs
          if (autoVerifyHighConfidence && result.confidence >= highConfidenceThreshold) {
            this.asinManager.verifyASIN(result.helmet.id, asin, true);
          }
        } catch (error) {
          console.warn(`Failed to add ASIN candidate ${asin} for helmet ${result.helmet.id}:`, error);
        }
      });
    });

    stats.averageConfidence = confidenceCount > 0 ? totalConfidence / confidenceCount : 0;

    return stats;
  }

  /**
   * Get helmets that still need ASIN discovery
   */
  getHelmetsNeedingASINs(helmets: Helmet[]): Helmet[] {
    return helmets.filter(helmet => {
      const asins = this.asinManager.getASINs(helmet.id);
      return asins.length === 0;
    });
  }

  /**
   * Get helmets with unverified ASINs
   */
  getHelmetsWithUnverifiedASINs(helmets: Helmet[]): Helmet[] {
    return helmets.filter(helmet => {
      const asins = this.asinManager.getASINs(helmet.id);
      return asins.some(asin => !asin.verified);
    });
  }

  /**
   * Generate scraping plan with priority scoring
   */
  generateScrapingPlan(helmets: Helmet[], maxHelmets: number = 50): {
    helmet: Helmet;
    priority: number;
    reason: string;
  }[] {
    const plan = helmets.map(helmet => {
      const asins = this.asinManager.getASINs(helmet.id);
      let priority = 0;
      const reasons: string[] = [];

      // High priority: No ASINs at all
      if (asins.length === 0) {
        priority += 100;
        reasons.push('No ASINs found');
      }

      // Medium priority: Unverified ASINs
      if (asins.some(asin => !asin.verified)) {
        priority += 50;
        reasons.push('Has unverified ASINs');
      }

      // Boost priority for popular brands
      const popularBrands = ['Giro', 'Smith', 'Bell', 'POC', 'Specialized'];
      if (popularBrands.includes(helmet.brand)) {
        priority += 20;
        reasons.push('Popular brand');
      }

      // Boost priority for higher priced helmets (more revenue potential)
      if (helmet.min_price > 200) {
        priority += 15;
        reasons.push('Premium price point');
      }

      // Boost priority for MIPS helmets (popular feature)
      if (helmet.name.toLowerCase().includes('mips')) {
        priority += 10;
        reasons.push('MIPS technology');
      }

      return {
        helmet,
        priority,
        reason: reasons.join(', ')
      };
    });

    return plan
      .sort((a, b) => b.priority - a.priority)
      .slice(0, maxHelmets);
  }

  /**
   * Export ASIN database with scraping metadata
   */
  exportEnhancedDatabase(): string {
    const allASINs = this.asinManager.exportDatabase();
    const parsed = JSON.parse(allASINs);

    // Add metadata about scraping coverage
    const metadata = {
      exportedAt: new Date().toISOString(),
      totalHelmets: Object.keys(parsed).length,
      helmetsWithASINs: Object.values(parsed).filter((asins) => Array.isArray(asins) && asins.length > 0).length,
      totalASINs: Object.values(parsed).reduce((sum: number, asins) => sum + (Array.isArray(asins) ? asins.length : 0), 0),
      verifiedASINs: Object.values(parsed).reduce((sum: number, asins) => {
        return sum + (Array.isArray(asins) ? asins.filter((asin) => asin && asin.verified).length : 0);
      }, 0),
      scraperGenerated: Object.values(parsed).reduce((sum: number, asins) => {
        return sum + (Array.isArray(asins) ? asins.filter((asin) => asin && asin.source === 'automated').length : 0);
      }, 0)
    };

    return JSON.stringify({ metadata, asins: parsed }, null, 2);
  }

  /**
   * Get scraping statistics for dashboard
   */
  getScrapingStats(helmets: Helmet[]) {
    const totalHelmets = helmets.length;
    let helmetsWithASINs = 0;
    let totalASINs = 0;
    let verifiedASINs = 0;
    let scraperASINs = 0;
    let highConfidenceASINs = 0;

    helmets.forEach(helmet => {
      const asins = this.asinManager.getASINs(helmet.id);

      if (asins.length > 0) {
        helmetsWithASINs++;
        totalASINs += asins.length;

        asins.forEach(asin => {
          if (asin.verified) verifiedASINs++;
          if (asin.source === 'automated') scraperASINs++;
          if (asin.confidence && asin.confidence > 0.8) highConfidenceASINs++;
        });
      }
    });

    return {
      totalHelmets,
      helmetsWithASINs,
      coveragePercentage: (helmetsWithASINs / totalHelmets) * 100,
      totalASINs,
      verifiedASINs,
      scraperASINs,
      highConfidenceASINs,
      needingScraping: totalHelmets - helmetsWithASINs
    };
  }
}