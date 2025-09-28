/**
 * Utility to generate test A/B testing data for demonstration
 */

import { ABTestManager, AMAZON_BUTTON_TESTS } from './abTesting';

export function generateTestABData() {
  if (typeof window === 'undefined') return;

  const manager = ABTestManager.getInstance();

  // Generate test user IDs
  const testUsers = Array.from({ length: 100 }, (_, i) =>
    `test_user_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 9)}`
  );

  // Simulate test interactions for active tests
  AMAZON_BUTTON_TESTS.filter(test => test.status === 'active').forEach(test => {
    console.log(`🧪 Generating test data for: ${test.name}`);

    testUsers.forEach(userId => {
      // Assign user to variant (this also tracks impression)
      const variantId = manager.assignUserToVariant(test.id, userId);

      if (variantId) {
        // Add some additional impressions
        const additionalImpressions = Math.floor(Math.random() * 3);
        for (let i = 0; i < additionalImpressions; i++) {
          manager.trackImpression(test.id, variantId);
        }

        // Simulate clicks (30-50% click rate with some variance by variant)
        const variant = test.variants.find(v => v.id === variantId);
        let baseClickRate = 0.35; // 35% base click rate

        // Adjust click rate based on variant
        if (variantId === 'variant_blue') {
          baseClickRate = 0.42; // Blue performs better
        } else if (variantId === 'variant_green') {
          baseClickRate = 0.38; // Green performs moderately better
        }

        const shouldClick = Math.random() < baseClickRate;
        if (shouldClick) {
          manager.trackClick(test.id, variantId);

          // Simulate conversions (5-10% conversion rate)
          const shouldConvert = Math.random() < 0.08;
          if (shouldConvert) {
            const revenue = Math.floor(Math.random() * 50) + 25; // $25-75 commission
            manager.trackConversion(test.id, variantId, revenue);
          }
        }
      }
    });
  });

  console.log('✅ Test A/B testing data generated');
  console.log(`📊 Generated data for ${testUsers.length} test users across active tests`);

  // Load and display current results
  manager.loadResultsFromStorage();
  const activeTests = manager.getActiveTests();

  activeTests.forEach(test => {
    const results = manager.getTestResults(test.id);
    if (results) {
      console.log(`\n📈 Test Results for "${test.name}":`);
      results.forEach((result, variantId) => {
        console.log(`  ${variantId}: ${result.impressions} impressions, ${result.clicks} clicks (${result.clickRate.toFixed(2)}% CTR)`);
      });
    }
  });
}

// Function to clear test data
export function clearTestABData() {
  if (typeof window === 'undefined') return;

  // Clear A/B test data
  localStorage.removeItem('ab_test_data');

  console.log('🧹 Test A/B testing data cleared');
}

// Function to reset and regenerate fresh test data
export function resetTestABData() {
  clearTestABData();

  // Small delay to ensure localStorage is cleared
  setTimeout(() => {
    generateTestABData();
  }, 100);
}