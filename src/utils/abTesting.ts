/**
 * A/B Testing Framework for Amazon Button Optimization
 * Provides comprehensive testing capabilities for button variants, analytics tracking, and conversion optimization
 */

export interface ABTestVariant {
  id: string;
  name: string;
  description: string;
  weight: number; // Percentage of traffic (0-100)
  config: {
    buttonText?: string;
    buttonColor?: 'orange' | 'blue' | 'green' | 'red' | 'purple' | 'yellow';
    buttonSize?: 'sm' | 'md' | 'lg';
    buttonStyle?: 'solid' | 'outline' | 'ghost';
    iconPosition?: 'left' | 'right' | 'none';
    ctaText?: string;
    urgencyText?: string;
    showPrice?: boolean;
    showRating?: boolean;
  };
}

export interface ABTest {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  startDate: string;
  endDate?: string;
  targetMetric: 'click_rate' | 'conversion_rate' | 'revenue_per_visitor';
  variants: ABTestVariant[];
  trafficSplit: number; // Percentage of total traffic in test (0-100)
  goals: {
    primary: string;
    secondary?: string[];
  };
}

export interface ABTestResult {
  variantId: string;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  clickRate: number;
  conversionRate: number;
  revenuePerVisitor: number;
  confidenceLevel?: number;
  isStatisticallySignificant?: boolean;
}

// Pre-configured A/B tests for Amazon button optimization
export const AMAZON_BUTTON_TESTS: ABTest[] = [
  {
    id: 'amazon_button_color_test_1',
    name: 'Amazon Button Color Optimization',
    description: 'Test different button colors to maximize click-through rates',
    status: 'active',
    startDate: '2025-09-28',
    targetMetric: 'click_rate',
    trafficSplit: 50, // 50% of users see test variants
    goals: {
      primary: 'Increase Amazon button click-through rate by 15%',
      secondary: ['Improve mobile conversion', 'Enhance user engagement']
    },
    variants: [
      {
        id: 'control',
        name: 'Control (Original)',
        description: 'Original orange Amazon button',
        weight: 50,
        config: {
          buttonText: 'View on Amazon',
          buttonColor: 'orange',
          buttonSize: 'md',
          buttonStyle: 'solid',
          iconPosition: 'right',
          showPrice: true,
          showRating: false
        }
      },
      {
        id: 'variant_blue',
        name: 'Blue Variant',
        description: 'Professional blue button for trust',
        weight: 25,
        config: {
          buttonText: 'Buy on Amazon',
          buttonColor: 'blue',
          buttonSize: 'md',
          buttonStyle: 'solid',
          iconPosition: 'right',
          showPrice: true,
          showRating: false
        }
      },
      {
        id: 'variant_green',
        name: 'Green Variant',
        description: 'Green button suggesting safety/go',
        weight: 25,
        config: {
          buttonText: 'Get This Helmet',
          buttonColor: 'green',
          buttonSize: 'md',
          buttonStyle: 'solid',
          iconPosition: 'right',
          showPrice: true,
          showRating: false
        }
      }
    ]
  },
  {
    id: 'amazon_button_copy_test_1',
    name: 'Amazon Button Copy Optimization',
    description: 'Test different call-to-action text to improve conversions',
    status: 'draft',
    startDate: '2025-10-01',
    targetMetric: 'conversion_rate',
    trafficSplit: 40,
    goals: {
      primary: 'Increase conversion rate by 20%',
      secondary: ['Improve click quality', 'Reduce bounce rate on Amazon']
    },
    variants: [
      {
        id: 'control_copy',
        name: 'Control Copy',
        description: 'Standard "View on Amazon" text',
        weight: 34,
        config: {
          buttonText: 'View on Amazon',
          buttonColor: 'orange',
          buttonSize: 'md',
          buttonStyle: 'solid',
          iconPosition: 'right'
        }
      },
      {
        id: 'urgent_copy',
        name: 'Urgency Copy',
        description: 'Urgency-focused copy',
        weight: 33,
        config: {
          buttonText: 'Buy Now - Limited Stock',
          buttonColor: 'orange',
          buttonSize: 'md',
          buttonStyle: 'solid',
          iconPosition: 'right',
          urgencyText: '⚡ Fast Shipping'
        }
      },
      {
        id: 'value_copy',
        name: 'Value Copy',
        description: 'Value-focused messaging',
        weight: 33,
        config: {
          buttonText: 'Best Price on Amazon',
          buttonColor: 'orange',
          buttonSize: 'md',
          buttonStyle: 'solid',
          iconPosition: 'right',
          ctaText: '💰 Price Match Guarantee'
        }
      }
    ]
  },
  {
    id: 'amazon_button_size_test_1',
    name: 'Amazon Button Size & Style Test',
    description: 'Test button size and visual prominence for mobile optimization',
    status: 'draft',
    startDate: '2025-10-15',
    targetMetric: 'click_rate',
    trafficSplit: 30,
    goals: {
      primary: 'Optimize mobile click rates by 25%',
      secondary: ['Improve touch targeting', 'Enhance visual hierarchy']
    },
    variants: [
      {
        id: 'control_size',
        name: 'Standard Size',
        description: 'Current medium button size',
        weight: 50,
        config: {
          buttonText: 'View on Amazon',
          buttonColor: 'orange',
          buttonSize: 'md',
          buttonStyle: 'solid'
        }
      },
      {
        id: 'large_prominent',
        name: 'Large Prominent',
        description: 'Large button with enhanced visibility',
        weight: 50,
        config: {
          buttonText: 'Buy on Amazon',
          buttonColor: 'orange',
          buttonSize: 'lg',
          buttonStyle: 'solid',
          iconPosition: 'left'
        }
      }
    ]
  }
];

// A/B test assignment and tracking
export class ABTestManager {
  private static instance: ABTestManager;
  private userAssignments: Map<string, Map<string, string>> = new Map();
  private testResults: Map<string, Map<string, ABTestResult>> = new Map();

  static getInstance(): ABTestManager {
    if (!ABTestManager.instance) {
      ABTestManager.instance = new ABTestManager();
    }
    return ABTestManager.instance;
  }

  // Assign user to test variant based on consistent hashing
  assignUserToVariant(testId: string, userId: string): string | null {
    const test = AMAZON_BUTTON_TESTS.find(t => t.id === testId);
    if (!test || test.status !== 'active') return null;

    // Check if user already assigned
    if (this.userAssignments.has(userId) && this.userAssignments.get(userId)!.has(testId)) {
      return this.userAssignments.get(userId)!.get(testId)!;
    }

    // Determine if user should be in test based on traffic split
    const hash = this.hashUserId(userId + testId);
    const trafficThreshold = test.trafficSplit / 100;

    if (hash > trafficThreshold) {
      return null; // User not in test
    }

    // Assign to variant based on weights
    const variantHash = this.hashUserId(userId + testId + 'variant');
    let cumulativeWeight = 0;

    for (const variant of test.variants) {
      cumulativeWeight += variant.weight / 100;
      if (variantHash <= cumulativeWeight) {
        // Store assignment
        if (!this.userAssignments.has(userId)) {
          this.userAssignments.set(userId, new Map());
        }
        this.userAssignments.get(userId)!.set(testId, variant.id);

        // Track impression
        this.trackImpression(testId, variant.id);

        return variant.id;
      }
    }

    return test.variants[0].id; // Fallback to first variant
  }

  // Simple hash function for consistent user assignment
  private hashUserId(input: string): number {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash) / 2147483647; // Normalize to 0-1
  }

  // Get variant configuration for user
  getVariantConfig(testId: string, userId: string): ABTestVariant['config'] | null {
    const variantId = this.assignUserToVariant(testId, userId);
    if (!variantId) return null;

    const test = AMAZON_BUTTON_TESTS.find(t => t.id === testId);
    const variant = test?.variants.find(v => v.id === variantId);

    return variant?.config || null;
  }

  // Track impression (button shown)
  trackImpression(testId: string, variantId: string): void {
    if (!this.testResults.has(testId)) {
      this.testResults.set(testId, new Map());
    }

    const testData = this.testResults.get(testId)!;
    if (!testData.has(variantId)) {
      testData.set(variantId, {
        variantId,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        revenue: 0,
        clickRate: 0,
        conversionRate: 0,
        revenuePerVisitor: 0
      });
    }

    const result = testData.get(variantId)!;
    result.impressions++;
    this.updateCalculatedMetrics(result);

    // Store in localStorage for persistence
    this.saveResultsToStorage();
  }

  // Track click (button clicked)
  trackClick(testId: string, variantId: string): void {
    if (!this.testResults.has(testId)) return;

    const testData = this.testResults.get(testId)!;
    if (!testData.has(variantId)) return;

    const result = testData.get(variantId)!;
    result.clicks++;
    this.updateCalculatedMetrics(result);

    this.saveResultsToStorage();
  }

  // Track conversion (purchase/revenue)
  trackConversion(testId: string, variantId: string, revenue = 0): void {
    if (!this.testResults.has(testId)) return;

    const testData = this.testResults.get(testId)!;
    if (!testData.has(variantId)) return;

    const result = testData.get(variantId)!;
    result.conversions++;
    result.revenue += revenue;
    this.updateCalculatedMetrics(result);

    this.saveResultsToStorage();
  }

  // Update calculated metrics
  private updateCalculatedMetrics(result: ABTestResult): void {
    result.clickRate = result.impressions > 0 ? (result.clicks / result.impressions) * 100 : 0;
    result.conversionRate = result.clicks > 0 ? (result.conversions / result.clicks) * 100 : 0;
    result.revenuePerVisitor = result.impressions > 0 ? result.revenue / result.impressions : 0;
  }

  // Get test results
  getTestResults(testId: string): Map<string, ABTestResult> | null {
    return this.testResults.get(testId) || null;
  }

  // Get all active tests
  getActiveTests(): ABTest[] {
    return AMAZON_BUTTON_TESTS.filter(test => test.status === 'active');
  }

  // Calculate statistical significance (basic implementation)
  calculateStatisticalSignificance(testId: string): Map<string, boolean> {
    const results = this.getTestResults(testId);
    const significance = new Map<string, boolean>();

    if (!results || results.size < 2) return significance;

    const resultsArray = Array.from(results.values());
    const control = resultsArray[0]; // Assume first variant is control

    resultsArray.forEach(variant => {
      if (variant.variantId === control.variantId) {
        significance.set(variant.variantId, false);
        return;
      }

      // Simple z-test for proportions (basic implementation)
      const n1 = control.impressions;
      const n2 = variant.impressions;
      const p1 = control.clicks / n1;
      const p2 = variant.clicks / n2;

      if (n1 < 30 || n2 < 30) {
        significance.set(variant.variantId, false);
        return;
      }

      const pooledP = (control.clicks + variant.clicks) / (n1 + n2);
      const se = Math.sqrt(pooledP * (1 - pooledP) * (1/n1 + 1/n2));
      const zScore = Math.abs(p2 - p1) / se;

      // 95% confidence level (z-score > 1.96)
      significance.set(variant.variantId, zScore > 1.96);
    });

    return significance;
  }

  // Save results to localStorage
  private saveResultsToStorage(): void {
    if (typeof window === 'undefined') return;

    const data = {
      userAssignments: Array.from(this.userAssignments.entries()).map(([userId, tests]) => [
        userId,
        Array.from(tests.entries())
      ]),
      testResults: Array.from(this.testResults.entries()).map(([testId, variants]) => [
        testId,
        Array.from(variants.entries())
      ])
    };

    localStorage.setItem('ab_test_data', JSON.stringify(data));
  }

  // Load results from localStorage
  loadResultsFromStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem('ab_test_data');
      if (!stored) return;

      const data = JSON.parse(stored);

      // Restore user assignments
      this.userAssignments = new Map(
        data.userAssignments.map(([userId, tests]: [string, [string, string][]]) => [
          userId,
          new Map(tests)
        ])
      );

      // Restore test results
      this.testResults = new Map(
        data.testResults.map(([testId, variants]: [string, [string, ABTestResult][]]) => [
          testId,
          new Map(variants)
        ])
      );
    } catch (error) {
      console.warn('Failed to load A/B test data from storage:', error);
    }
  }
}

// Utility functions for components
export function getUserId(): string {
  if (typeof window === 'undefined') return 'server-side';

  // Get or create persistent user ID
  let userId = localStorage.getItem('ab_test_user_id');
  if (!userId) {
    userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('ab_test_user_id', userId);
  }
  return userId;
}

export function getButtonConfig(testId: string): ABTestVariant['config'] | null {
  const manager = ABTestManager.getInstance();
  manager.loadResultsFromStorage();
  return manager.getVariantConfig(testId, getUserId());
}

export function trackButtonImpression(testId: string): void {
  const manager = ABTestManager.getInstance();
  const userId = getUserId();
  const variantId = manager.assignUserToVariant(testId, userId);

  if (variantId) {
    manager.trackImpression(testId, variantId);
  }
}

export function trackButtonClick(testId: string): void {
  const manager = ABTestManager.getInstance();
  const userId = getUserId();
  const variantId = manager.assignUserToVariant(testId, userId);

  if (variantId) {
    manager.trackClick(testId, variantId);
  }
}